/**
 * Typen für die Ingestion.
 *
 * Eine Quelle liefert rohe, normalisierte Kandidaten (`RawItem`) – egal ob
 * zeitbegrenztes Event oder dauerhafte Attraktion. Die Anreicherung (KI oder
 * regelbasiert) erzeugt daraus ein `ClassifiedItem` mit den für Scoring und
 * Persistenz nötigen Feldern. Ob ein Item als Event oder Attraktion gespeichert
 * wird, entscheidet die Pipeline (run.ts) anhand der Quellen-Familie, nicht das
 * Item selbst.
 */

/** Ein roher, normalisierter Kandidat aus einer Quelle. */
export interface RawItem {
  /** Stabile ID innerhalb der Quelle (für idempotente Upserts). */
  externalId: string;
  name: string;
  description: string;
  /** Freitext-Kategorie/Hinweis der Quelle, optional. */
  categoryHint?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  /** Nur bei Events relevant (ISO-8601); bei Attraktionen leer. */
  startsAt?: string;
  endsAt?: string;
  sourceUrl?: string;
  /** Vorab bekannte Kosten in EUR, falls die Quelle sie liefert. */
  estimatedCost?: number;
  /** Optionaler Ausflugs-/Wanderbezug (v. a. Attraktions-Quellen). */
  difficulty?: string;
  lengthKm?: number;
}

/** Eine Quelle liefert rohe Items (Events oder Attraktionen). */
export interface Source {
  /** Eindeutiger Name, landet in sourceName. */
  readonly name: string;
  fetch(): Promise<RawItem[]>;
}

/** Ergebnis der Anreicherung – deckt die für Scoring/Persistenz nötigen Felder ab. */
export interface ClassifiedItem {
  externalId: string;
  name: string;
  description: string;
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
  tags: string[];
  address?: string;
  latitude?: number;
  longitude?: number;
  startsAt?: string;
  endsAt?: string;
  sourceUrl?: string;
  difficulty?: string;
  lengthKm?: number;
  /** Herkunfts-/Unsicherheitshinweis, landet in source. */
  provenance: string;
}
