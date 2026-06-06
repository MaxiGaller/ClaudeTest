import { describe, it, expect } from "vitest";
import { buildAffiliateLink, partnerIdsFromEnv } from "./affiliate";

describe("buildAffiliateLink", () => {
  const ids = { getyourguide: "PARTNER123", tiqets: "TQ-9" };

  it("hängt den Tracking-Parameter an, wenn Netzwerk erkannt + Partner-ID konfiguriert ist", () => {
    const link = buildAffiliateLink("https://www.getyourguide.de/muenchen-l34/zoo-t1", ids);
    expect(link).not.toBeNull();
    expect(link!.isAffiliate).toBe(true);
    expect(link!.network?.id).toBe("getyourguide");
    expect(link!.url).toContain("partner_id=PARTNER123");
  });

  it("erkennt das Netzwerk, lässt die URL aber roh ohne konfigurierte Partner-ID", () => {
    const link = buildAffiliateLink("https://www.eventim.de/event/zirkus-123", ids);
    expect(link!.network?.id).toBe("eventim");
    expect(link!.isAffiliate).toBe(false);
    expect(link!.url).not.toContain("affiliate=");
  });

  it("gibt unbekannte Domains unverändert zurück (kein Netzwerk, kein Affiliate)", () => {
    const link = buildAffiliateLink("https://www.hellabrunn.de/tickets", ids);
    expect(link!.network).toBeNull();
    expect(link!.isAffiliate).toBe(false);
    expect(link!.url).toBe("https://www.hellabrunn.de/tickets");
  });

  it("bewahrt bestehende Query-Parameter und überschreibt nur den Tracking-Parameter", () => {
    const link = buildAffiliateLink("https://www.tiqets.com/de/x?ref=abc&partner=alt", ids);
    expect(link!.url).toContain("ref=abc");
    expect(link!.url).toContain("partner=TQ-9");
    expect(link!.url).not.toContain("partner=alt");
  });

  it("liefert null bei fehlender oder ungültiger URL", () => {
    expect(buildAffiliateLink(null, ids)).toBeNull();
    expect(buildAffiliateLink("", ids)).toBeNull();
    expect(buildAffiliateLink("nicht-mal-eine-url", ids)).toBeNull();
    expect(buildAffiliateLink("ftp://example.com/x", ids)).toBeNull();
  });
});

describe("partnerIdsFromEnv", () => {
  it("liest nur gesetzte, nicht-leere IDs aus der Umgebung", () => {
    const env = { AFFILIATE_GETYOURGUIDE_ID: "G1", AFFILIATE_TIQETS_ID: "  ", AFFILIATE_EVENTIM_ID: "" } as NodeJS.ProcessEnv;
    const ids = partnerIdsFromEnv(env);
    expect(ids).toEqual({ getyourguide: "G1" });
  });
});
