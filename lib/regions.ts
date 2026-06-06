/**
 * Region-Registry – config-getrieben statt eigener DB-Tabelle.
 *
 * Die Architektur ist region-agnostisch: jede Region definiert ihr Zentrum
 * (für Fahrzeit-/Distanz-Defaults) und welche Quellen-Adapter der Tagesjob
 * für Events bzw. dauerhafte Attraktionen nutzt. Aktuell ist nur München
 * aktiv; weitere Städte werden hier einfach als zusätzlicher Eintrag ergänzt.
 *
 * `slug` landet als `region`-Feld an Attraction/Event und verknüpft Inhalte
 * mit ihrer Region.
 */

export interface RegionConfig {
  /** Stabiler Slug, landet in Attraction.region / Event.region. */
  slug: string;
  name: string;
  /** Geografisches Zentrum, z. B. für Distanz-Defaults. */
  center: { lat: number; lon: number };
  /** Nur aktive Regionen werden vom Tagesjob ingestiert. */
  active: boolean;
  /** Quellen-Adapter-Namen (siehe lib/ingest/run.ts) für zeitbegrenzte Events. */
  eventSources: string[];
  /** Quellen-Adapter-Namen für dauerhafte Ausflugsziele. */
  attractionSources: string[];
}

export const REGIONS: Record<string, RegionConfig> = {
  muenchen: {
    slug: "muenchen",
    name: "München & Südbayern",
    center: { lat: 48.1374, lon: 11.5755 }, // Marienplatz
    active: true,
    eventSources: ["fixture", "muenchen-open-data"],
    attractionSources: ["attraction-fixture", "overpass-hiking"],
  },
  // Beispiel für später (inaktiv): weitere Regionen einfach ergänzen.
  // berlin: { slug: "berlin", name: "Berlin", center: {...}, active: false, ... },
};

export const DEFAULT_REGION = "muenchen";

/** Liefert die Konfiguration einer Region oder wirft, wenn unbekannt. */
export function getRegion(slug: string): RegionConfig {
  const region = REGIONS[slug];
  if (!region) {
    throw new Error(`Unbekannte Region: ${slug}`);
  }
  return region;
}

/** Alle aktiven Regionen, über die der Tagesjob iteriert. */
export function activeRegions(): RegionConfig[] {
  return Object.values(REGIONS).filter((r) => r.active);
}
