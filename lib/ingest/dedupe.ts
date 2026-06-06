/**
 * Dedupe roher Items anhand der externalId (letzter Eintrag gewinnt).
 * Reine Funktion – getestet.
 */
import type { RawItem } from "./types";

export function dedupeRawItems(raws: RawItem[]): RawItem[] {
  const byId = new Map<string, RawItem>();
  for (const r of raws) {
    if (r.externalId) byId.set(r.externalId, r);
  }
  return [...byId.values()];
}
