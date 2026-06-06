import { describe, it, expect } from "vitest";
import { ruleBasedClassify } from "./classify";
import { dedupeRawItems } from "./dedupe";
import { isActive, deriveValidUntil } from "./validity";
import type { RawItem } from "./types";

function raw(overrides: Partial<RawItem> = {}): RawItem {
  return {
    externalId: "e1",
    name: "Beispiel-Event",
    description: "Ein Event für Familien.",
    ...overrides,
  };
}

describe("validity", () => {
  const now = new Date("2026-06-06T12:00:00Z");

  it("behandelt evergreen (null) immer als aktiv", () => {
    expect(isActive(null, now)).toBe(true);
    expect(isActive(undefined, now)).toBe(true);
  });

  it("blendet abgelaufene Events aus", () => {
    expect(isActive(new Date("2026-06-05T00:00:00Z"), now)).toBe(false);
    expect(isActive(new Date("2026-06-07T00:00:00Z"), now)).toBe(true);
  });

  it("leitet validUntil aus endsAt ab", () => {
    const v = deriveValidUntil("2026-07-01T10:00:00Z", "2026-07-01T18:00:00Z");
    expect(v?.toISOString()).toBe("2026-07-01T18:00:00.000Z");
  });

  it("nutzt Tagesende des Starttags, wenn kein endsAt vorhanden ist", () => {
    const v = deriveValidUntil("2026-07-01T10:00:00Z", undefined);
    expect(v).not.toBeNull();
    expect(v!.getHours()).toBe(23);
  });

  it("liefert null ohne Datumsangaben (evergreen)", () => {
    expect(deriveValidUntil(undefined, undefined)).toBeNull();
  });
});

describe("dedupeRawItems", () => {
  it("kollabiert gleiche externalId (letzter gewinnt)", () => {
    const out = dedupeRawItems([
      raw({ externalId: "a", name: "alt" }),
      raw({ externalId: "b" }),
      raw({ externalId: "a", name: "neu" }),
    ]);
    expect(out).toHaveLength(2);
    expect(out.find((r) => r.externalId === "a")!.name).toBe("neu");
  });

  it("reicht optionalen Ausflugsbezug (difficulty/lengthKm) durch", () => {
    const c = ruleBasedClassify(
      raw({ name: "Wanderung Klamm", description: "Schöne Tour", difficulty: "moderate", lengthKm: 3 })
    );
    expect(c.difficulty).toBe("moderate");
    expect(c.lengthKm).toBe(3);
  });
});

describe("ruleBasedClassify", () => {
  it("erkennt einen kostenlosen, hundefreundlichen Outdoor-Spielplatz", () => {
    const c = ruleBasedClassify(
      raw({
        name: "Kostenloses Sommerfest mit Spielplatz",
        description: "Hundefreundlich, Imbiss vor Ort, für Kleinkinder.",
        estimatedCost: 0,
      })
    );
    expect(c.category).toBe("Spielplätze");
    expect(c.tags).toEqual(expect.arrayContaining(["playground", "free", "dog_friendly", "outdoor", "food_available"]));
    expect(c.dogFriendly).toBe(true);
    expect(c.foodAvailable).toBe(true);
    expect(c.estimatedCost).toBe(0);
  });

  it("erkennt Indoor-/Regensicherheit bei Museen", () => {
    const c = ruleBasedClassify(raw({ name: "Museum Kinderreich", description: "Mitmach-Ausstellung." }));
    expect(c.category).toBe("Museen kinderfreundlich");
    expect(c.indoor).toBe(true);
    expect(c.rainSafe).toBe(true);
    expect(c.tags).toContain("culture");
  });

  it("erkennt Wasser bei Badeseen", () => {
    const c = ruleBasedClassify(raw({ name: "Badesee Feringa", description: "Baden im Sommer." }));
    expect(c.category).toBe("Badeseen");
    expect(c.tags).toContain("water");
    expect(c.outdoor).toBe(true);
  });

  it("markiert unbekannte Kosten als grobe Schätzung (low_budget), nicht kostenlos", () => {
    const c = ruleBasedClassify(raw({ name: "Flohmarkt", description: "Stöbern." }));
    expect(c.tags).not.toContain("free");
    expect(c.estimatedCost).toBeGreaterThan(0);
  });

  it("übernimmt das vorgegebene Tag-Vokabular und bleibt schema-konform", () => {
    const c = ruleBasedClassify(raw({ name: "Indoor-Kletterhalle Action", description: "Toben für Kinder ab 3." }));
    expect(c.category).toBe("Indoor-Spielplätze");
    expect(c.tags).toEqual(expect.arrayContaining(["playground", "action", "indoor", "rain_safe"]));
    expect(c.provenance).toMatch(/regelbasiert/);
  });
});
