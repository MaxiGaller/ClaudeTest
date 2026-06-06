import { describe, it, expect } from "vitest";
import { feedId, parseFeedId, toScoringInput, type FeedItemRow } from "./feed";

function row(overrides: Partial<FeedItemRow> = {}): FeedItemRow {
  return {
    id: "abc",
    name: "Beispiel",
    category: "Spielplätze",
    estimatedCost: 0,
    estimatedDurationMinutes: 120,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: true,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: false,
    latitude: 48.1,
    longitude: 11.5,
    ...overrides,
  };
}

describe("feedId / parseFeedId", () => {
  it("baut zusammengesetzte IDs je Typ", () => {
    expect(feedId("attraction", "x1")).toBe("attraction:x1");
    expect(feedId("event", "e9")).toBe("event:e9");
  });

  it("zerlegt zusammengesetzte IDs wieder korrekt", () => {
    expect(parseFeedId("attraction:x1")).toEqual({ type: "attraction", id: "x1" });
    expect(parseFeedId("event:e9")).toEqual({ type: "event", id: "e9" });
  });

  it("ist verlustfrei (round-trip), auch wenn die ID einen Doppelpunkt enthält", () => {
    const composite = feedId("event", "way/12:34");
    expect(parseFeedId(composite)).toEqual({ type: "event", id: "way/12:34" });
  });
});

describe("toScoringInput", () => {
  it("bildet eine Attraktion mit korrekter Feed-ID auf die Scoring-Eingabe ab", () => {
    const out = toScoringInput("attraction", row({ id: "a1" }), ["dog_friendly", "outdoor"], 20);
    expect(out.id).toBe("attraction:a1");
    expect(out.tags).toEqual(["dog_friendly", "outdoor"]);
    expect(out.travelMinutes).toBe(20);
    expect(out.dogFriendly).toBe(true);
    expect(out.openNow).toBeNull();
  });

  it("bildet ein Event ab und übernimmt unbekannte Fahrzeit als null", () => {
    const out = toScoringInput("event", row({ id: "e1" }), [], null);
    expect(out.id).toBe("event:e1");
    expect(out.travelMinutes).toBeNull();
    expect(out.category).toBe("Spielplätze");
  });
});
