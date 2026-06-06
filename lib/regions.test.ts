import { describe, it, expect } from "vitest";
import { activeRegions, getRegion, DEFAULT_REGION, REGIONS } from "./regions";

describe("regions registry", () => {
  it("hat München als aktive Standardregion", () => {
    expect(DEFAULT_REGION).toBe("muenchen");
    expect(REGIONS.muenchen.active).toBe(true);
  });

  it("liefert nur aktive Regionen für den Job", () => {
    const active = activeRegions();
    expect(active.length).toBeGreaterThan(0);
    expect(active.every((r) => r.active)).toBe(true);
    expect(active.map((r) => r.slug)).toContain("muenchen");
  });

  it("trennt Event- und Attraktions-Quellen je Region", () => {
    const r = getRegion("muenchen");
    expect(r.eventSources).toContain("fixture");
    expect(r.attractionSources).toContain("attraction-fixture");
    // Quellen-Familien überschneiden sich nicht.
    expect(r.eventSources.some((s) => r.attractionSources.includes(s))).toBe(false);
  });

  it("wirft bei unbekannter Region", () => {
    expect(() => getRegion("atlantis")).toThrow(/Unbekannte Region/);
  });
});
