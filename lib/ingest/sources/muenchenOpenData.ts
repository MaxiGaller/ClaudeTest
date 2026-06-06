/**
 * Realer Feed-Adapter (Gerüst) für offene Veranstaltungsdaten der Region.
 *
 * HINWEIS: Die Feed-URL und das genaue JSON-Format müssen noch verifiziert
 * werden – die Region bietet wechselnde Endpunkte. URL über EVENT_FEED_URL
 * konfigurierbar. Das Mapping unten ist defensiv und überspringt Einträge
 * ohne brauchbare Felder, statt schlechte Daten zu erzeugen.
 */
import type { Source, RawItem } from "../types";

interface RawFeedItem {
  id?: string | number;
  title?: string;
  name?: string;
  description?: string;
  summary?: string;
  category?: string;
  location?: string;
  address?: string;
  lat?: number;
  lon?: number;
  start?: string;
  startDate?: string;
  end?: string;
  endDate?: string;
  url?: string;
  link?: string;
  price?: number;
}

function toRawEvent(item: RawFeedItem): RawItem | null {
  const name = item.title ?? item.name;
  const externalId = item.id != null ? String(item.id) : undefined;
  if (!name || !externalId) return null;
  return {
    externalId,
    name,
    description: item.description ?? item.summary ?? name,
    categoryHint: item.category,
    address: item.address ?? item.location,
    latitude: item.lat,
    longitude: item.lon,
    startsAt: item.start ?? item.startDate,
    endsAt: item.end ?? item.endDate,
    sourceUrl: item.url ?? item.link,
    estimatedCost: typeof item.price === "number" ? Math.round(item.price) : undefined,
  };
}

export function muenchenOpenDataSource(url = process.env.EVENT_FEED_URL): Source {
  return {
    name: "muenchen-open-data",
    async fetch(): Promise<RawItem[]> {
      if (!url) {
        throw new Error(
          "EVENT_FEED_URL ist nicht gesetzt – Feed-Quelle benötigt eine (zu verifizierende) URL."
        );
      }
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) {
        throw new Error(`Feed-Abruf fehlgeschlagen: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      const items: RawFeedItem[] = Array.isArray(data)
        ? data
        : Array.isArray((data as { events?: unknown }).events)
          ? (data as { events: RawFeedItem[] }).events
          : [];
      return items.map(toRawEvent).filter((e): e is RawItem => e !== null);
    },
  };
}
