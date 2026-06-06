/**
 * Affiliate-Link-Gerüst für Ticketshops.
 *
 * Konfigurierbar statt fest verdrahtet: eine Registry gängiger Ticket-Netzwerke
 * (GetYourGuide, Tiqets, Eventim, Regiondo). Erkennt anhand der Host-Domain einer
 * rohen Ticket-URL das passende Netzwerk und hängt den Tracking-Parameter mit der
 * Partner-ID an. Die Partner-IDs kommen aus Umgebungsvariablen (zunächst leer /
 * Platzhalter) – nichts wird hartkodiert.
 *
 * Ohne passende Partner-ID wird die rohe URL unverändert zurückgegeben
 * (`isAffiliate: false`) – der Link funktioniert weiter, bringt nur keine Provision.
 *
 * HINWEIS: Die genauen Tracking-Parameter je Programm sind ein sinnvoller
 * Startpunkt und sollten gegen die jeweiligen Partnerbedingungen verifiziert werden.
 */

export interface AffiliateNetwork {
  /** Interner Schlüssel. */
  id: string;
  /** Anzeigename (für UI/Logs). */
  label: string;
  /** Trifft auf die Host-Domain der Ticket-URL zu. */
  hostPattern: RegExp;
  /** Name der Umgebungsvariable mit der Partner-/Affiliate-ID. */
  partnerEnv: string;
  /** Query-Parameter, an den die Partner-ID angehängt wird (bitte verifizieren). */
  param: string;
}

export const AFFILIATE_NETWORKS: AffiliateNetwork[] = [
  {
    id: "getyourguide",
    label: "GetYourGuide",
    hostPattern: /(^|\.)getyourguide\.[a-z.]+$/i,
    partnerEnv: "AFFILIATE_GETYOURGUIDE_ID",
    param: "partner_id",
  },
  {
    id: "tiqets",
    label: "Tiqets",
    hostPattern: /(^|\.)tiqets\.com$/i,
    partnerEnv: "AFFILIATE_TIQETS_ID",
    param: "partner",
  },
  {
    id: "eventim",
    label: "Eventim",
    hostPattern: /(^|\.)eventim\.[a-z.]+$/i,
    partnerEnv: "AFFILIATE_EVENTIM_ID",
    param: "affiliate",
  },
  {
    id: "regiondo",
    label: "Regiondo",
    hostPattern: /(^|\.)regiondo\.[a-z.]+$/i,
    partnerEnv: "AFFILIATE_REGIONDO_ID",
    param: "partner_id",
  },
];

export interface AffiliateLink {
  /** Finale URL (mit Tracking, falls verfügbar – sonst die rohe URL). */
  url: string;
  /** Erkanntes Netzwerk oder null, wenn die Domain unbekannt ist. */
  network: AffiliateNetwork | null;
  /** true, wenn ein Tracking-Parameter mit konfigurierter Partner-ID gesetzt wurde. */
  isAffiliate: boolean;
}

/** Partner-IDs aus der Umgebung lesen (überschreibbar für Tests). */
export function partnerIdsFromEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const ids: Record<string, string> = {};
  for (const net of AFFILIATE_NETWORKS) {
    const v = env[net.partnerEnv];
    if (v && v.trim() !== "") ids[net.id] = v.trim();
  }
  return ids;
}

/**
 * Baut aus einer rohen Ticket-URL einen (ggf.) Affiliate-getaggten Link.
 *
 * @param rawUrl    Ticketshop-URL des Eintrags (oder null/undefined).
 * @param partnerIds Mapping networkId -> Partner-ID. Default: aus Umgebung.
 * @returns AffiliateLink oder null, wenn keine brauchbare URL vorliegt.
 */
export function buildAffiliateLink(
  rawUrl: string | null | undefined,
  partnerIds: Record<string, string> = partnerIdsFromEnv()
): AffiliateLink | null {
  if (!rawUrl || rawUrl.trim() === "") return null;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null; // keine gültige absolute URL
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const network = AFFILIATE_NETWORKS.find((n) => n.hostPattern.test(url.hostname)) ?? null;
  if (!network) {
    return { url: url.toString(), network: null, isAffiliate: false };
  }

  const partnerId = partnerIds[network.id];
  if (!partnerId) {
    // Netzwerk erkannt, aber keine Partner-ID konfiguriert: roher Link, keine Provision.
    return { url: url.toString(), network, isAffiliate: false };
  }

  url.searchParams.set(network.param, partnerId);
  return { url: url.toString(), network, isAffiliate: true };
}
