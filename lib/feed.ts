/**
 * Vereinter Feed: bildet die beiden Inhaltstabellen (Attraction, Event) auf die
 * gemeinsame Scoring-Eingabe ab. So bleibt das Scoring (scoring.ts) komplett
 * unabhängig davon, ob ein Vorschlag ein dauerhaftes Ziel oder ein Event ist.
 *
 * Die zusammengesetzte ID (`"attraction:<id>"` / `"event:<id>"`) macht Items aus
 * beiden Tabellen im Scoring/Feedback eindeutig unterscheidbar.
 */
import type { ScoringActivityInput } from "./scoring";

export type FeedItemType = "attraction" | "event";

/** Gemeinsame Felder, die beide Tabellen für das Scoring liefern. */
export interface FeedItemRow {
  id: string;
  name: string;
  category: string;
  estimatedCost: number;
  estimatedDurationMinutes: number;
  minChildAgeMonths: number;
  maxChildAgeMonths: number;
  dogFriendly: boolean;
  strollerFriendly: boolean;
  rainSafe: boolean;
  indoor: boolean;
  outdoor: boolean;
  foodAvailable: boolean;
  latitude: number | null;
  longitude: number | null;
}

/** Zusammengesetzte Feed-ID erzeugen. */
export function feedId(type: FeedItemType, id: string): string {
  return `${type}:${id}`;
}

/** Zusammengesetzte Feed-ID wieder zerlegen. */
export function parseFeedId(composite: string): { type: FeedItemType; id: string } {
  const idx = composite.indexOf(":");
  const type = composite.slice(0, idx) as FeedItemType;
  const id = composite.slice(idx + 1);
  return { type, id };
}

/**
 * Bildet eine Tabellenzeile + ihre Tags + geschätzte Fahrzeit auf die
 * Scoring-Eingabe ab. Die ID wird zur zusammengesetzten Feed-ID.
 */
export function toScoringInput(
  type: FeedItemType,
  row: FeedItemRow,
  tags: string[],
  travelMinutes: number | null
): ScoringActivityInput {
  return {
    id: feedId(type, row.id),
    name: row.name,
    category: row.category,
    estimatedCost: row.estimatedCost,
    estimatedDurationMinutes: row.estimatedDurationMinutes,
    minChildAgeMonths: row.minChildAgeMonths,
    maxChildAgeMonths: row.maxChildAgeMonths,
    dogFriendly: row.dogFriendly,
    strollerFriendly: row.strollerFriendly,
    rainSafe: row.rainSafe,
    indoor: row.indoor,
    outdoor: row.outdoor,
    foodAvailable: row.foodAvailable,
    tags,
    travelMinutes,
    openNow: null, // Öffnungszeiten im MVP nicht strukturiert gepflegt
  };
}
