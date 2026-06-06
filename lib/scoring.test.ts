import { describe, it, expect } from "vitest";
import {
  scoreActivity,
  rankActivities,
  buildExplanation,
  type ScoringActivityInput,
  type ScoringRequest,
} from "./scoring";

/** Basis-Aktivität, in Tests gezielt überschrieben. */
function activity(overrides: Partial<ScoringActivityInput> = {}): ScoringActivityInput {
  return {
    id: "a1",
    name: "Test-Aktivität",
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
    tags: [],
    travelMinutes: 20,
    openNow: null,
    ...overrides,
  };
}

/** Basis-Anfrage, in Tests gezielt überschrieben. */
function request(overrides: Partial<ScoringRequest> = {}): ScoringRequest {
  return {
    childAgesMonths: [36],
    dogMustJoin: false,
    strollerRequired: false,
    maxBudget: null,
    preferFree: false,
    maxTravelMinutes: 45,
    timeBudgetMinutes: 240,
    energyLevel: "normal",
    weatherCondition: null,
    ...overrides,
  };
}

describe("scoreActivity – harte Ausschlusskriterien", () => {
  it("schließt aus, wenn der Hund mit soll, aber die Aktivität nicht hundetauglich ist", () => {
    const r = scoreActivity(activity({ dogFriendly: false }), request({ dogMustJoin: true }));
    expect(r.eligible).toBe(false);
    expect(r.warnings).toContain("nicht hundetauglich, obwohl der Hund mit soll");
  });

  it("schließt aus, wenn Kinderwagen nötig, aber nicht kinderwagentauglich", () => {
    const r = scoreActivity(
      activity({ strollerFriendly: false }),
      request({ strollerRequired: true })
    );
    expect(r.eligible).toBe(false);
  });

  it('schließt "nie wieder" markierte Aktivitäten aus', () => {
    const r = scoreActivity(
      activity(),
      request({ feedbackByActivityId: { a1: ["never_again"] } })
    );
    expect(r.eligible).toBe(false);
    expect(r.score).toBe(0);
  });

  it("schließt deutlich zu weit entfernte Aktivitäten aus", () => {
    const r = scoreActivity(activity({ travelMinutes: 200 }), request({ maxTravelMinutes: 45 }));
    expect(r.eligible).toBe(false);
  });
});

describe("scoreActivity – positive Faktoren", () => {
  it("vergibt Punkte für passendes Alter, Fahrzeit und Hundetauglichkeit", () => {
    const r = scoreActivity(
      activity({ dogFriendly: true, travelMinutes: 20 }),
      request({ dogMustJoin: true, childAgesMonths: [24, 48] })
    );
    expect(r.eligible).toBe(true);
    expect(r.reasons).toContain("hundefreundlich");
    expect(r.reasons).toContain("für das Alter der Kinder geeignet");
    expect(r.reasons).toContain("innerhalb der gewünschten Fahrzeit (~20 Min)");
    expect(r.score).toBeGreaterThan(70);
  });

  it("belohnt kostenlose Aktivitäten bei preferFree", () => {
    const free = scoreActivity(activity({ estimatedCost: 0 }), request({ preferFree: true }));
    const paid = scoreActivity(activity({ estimatedCost: 30 }), request({ preferFree: true }));
    expect(free.score).toBeGreaterThan(paid.score);
    expect(free.reasons).toContain("kostenlos");
  });

  it("clamped den Score auf maximal 100", () => {
    const r = scoreActivity(
      activity({ openNow: true, tags: ["action"], indoor: true, rainSafe: true }),
      request({
        dogMustJoin: true,
        strollerRequired: true,
        preferFree: true,
        maxBudget: 20,
        energyLevel: "action",
        weatherCondition: "rain",
        childAgesMonths: [36],
      })
    );
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe("scoreActivity – Budget", () => {
  it("warnt bei Überschreitung des Budgets", () => {
    const r = scoreActivity(activity({ estimatedCost: 60 }), request({ maxBudget: 20 }));
    expect(r.warnings).toContain("über dem Budget (~60 €)");
  });

  it("vergibt Punkte, wenn im Budget", () => {
    const r = scoreActivity(activity({ estimatedCost: 15 }), request({ maxBudget: 20 }));
    expect(r.reasons).toContain("im Budget (~15 €)");
  });
});

describe("scoreActivity – Wetter", () => {
  it("belohnt regensichere Ziele bei Regen", () => {
    const r = scoreActivity(
      activity({ indoor: true, outdoor: false, rainSafe: true }),
      request({ weatherCondition: "rain" })
    );
    expect(r.reasons).toContain("auch bei Regen geeignet");
  });

  it("warnt bei Outdoor-Zielen ohne Regenschutz bei Regen", () => {
    const r = scoreActivity(
      activity({ indoor: false, outdoor: true, rainSafe: false }),
      request({ weatherCondition: "rain" })
    );
    expect(r.warnings).toContain("bei Regen eher ungeeignet");
  });

  it("belohnt Wasser-Ziele bei Hitze", () => {
    const r = scoreActivity(
      activity({ outdoor: true, tags: ["water"] }),
      request({ weatherCondition: "hot" })
    );
    expect(r.reasons).toContain("Abkühlung bei Hitze möglich");
  });
});

describe("scoreActivity – Tagesform", () => {
  it("belohnt Action-Ziele an Action-Tagen", () => {
    const r = scoreActivity(activity({ tags: ["action"] }), request({ energyLevel: "action" }));
    expect(r.reasons).toContain("viel Action für aktive Tage");
  });

  it("warnt bei ruhigen Zielen an Action-Tagen", () => {
    const r = scoreActivity(activity({ tags: ["quiet"] }), request({ energyLevel: "action" }));
    expect(r.warnings).toContain("eher ruhig für einen Action-Tag");
  });
});

describe("rankActivities", () => {
  it("sortiert nach Score und filtert nicht-eignungsfähige heraus", () => {
    const acts = [
      activity({ id: "good", travelMinutes: 10 }),
      activity({ id: "dogfail", dogFriendly: false }),
      activity({ id: "far", travelMinutes: 30 }),
    ];
    const ranked = rankActivities(acts, request({ dogMustJoin: true }));
    expect(ranked.find((r) => r.activityId === "dogfail")).toBeUndefined();
    expect(ranked[0].score).toBeGreaterThanOrEqual(ranked[1].score);
  });

  it("respektiert das Limit", () => {
    const acts = [activity({ id: "1" }), activity({ id: "2" }), activity({ id: "3" })];
    expect(rankActivities(acts, request(), { limit: 2 })).toHaveLength(2);
  });
});

describe("buildExplanation", () => {
  it("erzeugt einen lesbaren Begründungssatz mit Gründen und Warnungen", () => {
    const r = scoreActivity(
      activity({ dogFriendly: true, estimatedCost: 0, travelMinutes: 35, outdoor: true, rainSafe: false }),
      request({ dogMustJoin: true, preferFree: true, weatherCondition: "rain" })
    );
    const text = buildExplanation(r);
    expect(text).toContain("hundefreundlich");
    expect(text).toMatch(/Beachtet aber/);
  });
});
