/**
 * Realer Quell-Adapter (Gerüst) für dauerhafte Ausflugsziele aus OpenStreetMap
 * via Overpass API – z. B. Wander-/Spazierwege, Aussichtspunkte, Naturattraktionen.
 *
 * HINWEIS: Die Overpass-Query und das Tag-Mapping sind ein Startpunkt und sollten
 * pro Region geprüft/verfeinert werden (OSM-Daten sind heterogen). Endpoint über
 * OVERPASS_API_URL konfigurierbar. Das Mapping ist defensiv und überspringt
 * Einträge ohne brauchbare Felder, statt schlechte Daten zu erzeugen.
 *
 * Die Query wird um eine Bounding-Box rund um das Regions-Zentrum gebaut.
 */
import type { Source, RawItem } from "../types";
import { getRegion } from "../../regions";

const DEFAULT_ENDPOINT = "https://overpass-api.de/api/interpreter";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements?: OverpassElement[];
}

/** Grobe Bounding-Box (Grad) um ein Zentrum – ~deltaKm in jede Richtung. */
function bbox(lat: number, lon: number, deltaKm: number): [number, number, number, number] {
  const dLat = deltaKm / 111; // ~111 km pro Breitengrad
  const dLon = deltaKm / (111 * Math.cos((lat * Math.PI) / 180));
  return [lat - dLat, lon - dLon, lat + dLat, lon + dLon]; // south, west, north, east
}

/** Baut eine Overpass-QL-Query für familientaugliche Natur-/Ausflugsziele. */
function buildQuery(center: { lat: number; lon: number }, radiusKm: number): string {
  const [s, w, n, e] = bbox(center.lat, center.lon, radiusKm);
  const box = `(${s},${w},${n},${e})`;
  // tourism=attraction / viewpoint, leisure=nature_reserve/park, natural=peak.
  return `[out:json][timeout:25];
(
  node["tourism"="attraction"]${box};
  node["tourism"="viewpoint"]${box};
  way["leisure"="nature_reserve"]${box};
  way["leisure"="park"]["name"]${box};
  node["natural"="peak"]["name"]${box};
);
out center 60;`;
}

function toRawItem(el: OverpassElement): RawItem | null {
  const tags = el.tags ?? {};
  const name = tags.name;
  if (!name) return null;
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const categoryHint =
    tags.tourism ?? tags.leisure ?? tags.natural ?? "Ausflugsziel";
  const descriptionBits = [tags.description, categoryHint, tags["addr:city"]]
    .filter(Boolean)
    .join(" – ");

  return {
    externalId: `${el.type}/${el.id}`,
    name,
    description: descriptionBits || `${name} (OpenStreetMap)`,
    categoryHint,
    address: [tags["addr:street"], tags["addr:housenumber"], tags["addr:city"]]
      .filter(Boolean)
      .join(" "),
    latitude: lat,
    longitude: lon,
    sourceUrl: tags.website ?? tags["contact:website"],
  };
}

/**
 * Erstellt eine Overpass-Quelle für eine Region. Macht nur dann einen
 * Netzwerk-Call, wenn OVERPASS_API_URL gesetzt ist – sonst wirft fetch() einen
 * klaren Fehler, sodass der Job auf die Fixture-Quelle zurückfallen kann.
 */
export function overpassHikingSource(
  regionSlug: string,
  endpoint = process.env.OVERPASS_API_URL,
  radiusKm = 40
): Source {
  return {
    name: "overpass-hiking",
    async fetch(): Promise<RawItem[]> {
      if (!endpoint) {
        throw new Error(
          "OVERPASS_API_URL ist nicht gesetzt – Overpass-Quelle benötigt einen (zu verifizierenden) Endpoint."
        );
      }
      const region = getRegion(regionSlug);
      const query = buildQuery(region.center, radiusKm);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        throw new Error(`Overpass-Abruf fehlgeschlagen: ${res.status} ${res.statusText}`);
      }
      const data = (await res.json()) as OverpassResponse;
      const elements = Array.isArray(data.elements) ? data.elements : [];
      return elements.map(toRawItem).filter((r): r is RawItem => r !== null);
    },
  };
}

export { DEFAULT_ENDPOINT };
