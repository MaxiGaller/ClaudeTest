/**
 * Gültigkeitsregeln für (zeitgebundene) Aktivitäten.
 * Reine Funktionen, damit sie getestet und überall wiederverwendet werden können.
 */

/** Aktiv, wenn kein Ablauf gesetzt ist (evergreen) oder der Ablauf in der Zukunft liegt. */
export function isActive(validUntil: Date | null | undefined, now: Date): boolean {
  if (validUntil == null) return true;
  return validUntil.getTime() >= now.getTime();
}

/**
 * Leitet validUntil aus einem Event-Zeitfenster ab.
 * - endsAt vorhanden -> endsAt
 * - sonst startsAt vorhanden -> Tagesende des Starttags
 * - sonst null (wird wie evergreen behandelt)
 */
export function deriveValidUntil(
  startsAt: string | undefined,
  endsAt: string | undefined
): Date | null {
  if (endsAt) {
    const d = new Date(endsAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (startsAt) {
    const d = new Date(startsAt);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      return d;
    }
  }
  return null;
}
