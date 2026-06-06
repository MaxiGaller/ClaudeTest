/**
 * Einfache Geo-Helfer für die MVP-Umkreisschätzung.
 * Später kann das durch echte Routing-APIs oder PostGIS ersetzt werden.
 */

const EARTH_RADIUS_KM = 6371;

/** Luftlinie zwischen zwei Koordinaten in Kilometern (Haversine). */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Grobe Fahrzeitschätzung in Minuten aus der Luftlinie.
 * Faktor 1.3 als Umweg-Korrektur, Durchschnittstempo nach Verkehrsmittel.
 * Bewusst simpel — nur eine Heuristik für das MVP.
 */
export function estimateTravelMinutes(
  km: number,
  mode: "car" | "transit" | "bike" = "car"
): number {
  const detourFactor = 1.3;
  const avgSpeedKmh = mode === "car" ? 50 : mode === "transit" ? 25 : 15;
  const effectiveKm = km * detourFactor;
  return Math.round((effectiveKm / avgSpeedKmh) * 60);
}

/** Bequeme Kombination: Fahrzeit zwischen zwei Koordinaten. */
export function travelMinutesBetween(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
  mode: "car" | "transit" | "bike" = "car"
): number {
  return estimateTravelMinutes(haversineKm(fromLat, fromLon, toLat, toLon), mode);
}
