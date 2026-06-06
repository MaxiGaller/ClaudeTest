/**
 * Fixture-Quelle für dauerhafte Attraktionen (Ausflugsziele, Wanderungen).
 * Offline-Standardquelle für lokale Läufe und CI ohne Netzwerk.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Source, RawItem } from "../types";

const here = dirname(fileURLToPath(import.meta.url));

export function attractionFixtureSource(
  file = join(here, "fixtures", "attractions-sample.json")
): Source {
  return {
    name: "attraction-fixture",
    async fetch(): Promise<RawItem[]> {
      const raw = await readFile(file, "utf8");
      return JSON.parse(raw) as RawItem[];
    },
  };
}
