/**
 * Scoring-Logik für Familien-Empfehlungen.
 *
 * Bewusst frei von Datenbank- und Framework-Abhängigkeiten, damit die Logik
 * isoliert getestet und wiederverwendet werden kann. Eingaben sind einfache
 * Objekte; Ausgabe ist ein nachvollziehbares Ergebnis mit Score, Gründen
 * (reasons) und Warnungen (warnings).
 */

export type EnergyLevel = "quiet" | "normal" | "action";
export type WeatherCondition = "rain" | "sun" | "cold" | "hot" | null;
export type FeedbackType =
  | "fits"
  | "not_fitting"
  | "more_like_this"
  | "never_again";

/** Was die Familie heute sucht. */
export interface ScoringRequest {
  /** Alter der Kinder in Monaten. Leeres Array = keine Altersbewertung. */
  childAgesMonths: number[];
  dogMustJoin: boolean;
  strollerRequired: boolean;
  /** Maximales Gesamtbudget in EUR. null = "egal". */
  maxBudget: number | null;
  preferFree: boolean;
  maxTravelMinutes: number;
  timeBudgetMinutes: number;
  energyLevel: EnergyLevel;
  weatherCondition: WeatherCondition;
  /** Bisheriges Feedback der Familie je Aktivität. */
  feedbackByActivityId?: Record<string, FeedbackType[]>;
  /** Kategorien, die der Familie bisher gefallen haben. */
  likedCategories?: string[];
}

/** Eine zu bewertende Aktivität (nur die für das Scoring nötigen Felder). */
export interface ScoringActivityInput {
  id: string;
  name: string;
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
  /** Geschätzte Fahrzeit in Minuten; null = unbekannt. */
  travelMinutes: number | null;
  /** Aktuell geöffnet? null = Öffnungszeiten nicht gepflegt. */
  openNow?: boolean | null;
}

export interface ScoringResult {
  activityId: string;
  score: number; // 0-100
  reasons: string[];
  warnings: string[];
  /** false, wenn ein hartes Ausschlusskriterium greift. */
  eligible: boolean;
}

// Punktgewichte zentral, damit das Verhalten leicht nachvollziehbar bleibt.
const WEIGHTS = {
  base: 50,
  ageAllFit: 15,
  ageSomeFit: 7,
  ageNoneFit: -20,
  dogOk: 12,
  dogFail: -45,
  strollerOk: 8,
  strollerFail: -45,
  free: 10,
  inBudget: 8,
  overBudget: -25,
  notFreeButPreferred: -6,
  travelInRange: 12,
  travelOver: -20,
  travelWayOver: -45,
  timeFits: 6,
  timeTooLong: -10,
  weatherGood: 12,
  weatherBad: -25,
  sunOutdoor: 8,
  hotWater: 10,
  hotIndoor: 5,
  hotOutdoor: -8,
  coldIndoor: 8,
  coldOutdoor: -8,
  energyMatch: 10,
  energyMismatch: -8,
  openNow: 5,
  closedNow: -15,
  feedbackPositive: 12,
  feedbackNegative: -12,
  feedbackNeverAgain: -100,
  likedCategory: 6,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Bewertet eine einzelne Aktivität für eine konkrete Anfrage.
 */
export function scoreActivity(
  activity: ScoringActivityInput,
  request: ScoringRequest
): ScoringResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = WEIGHTS.base;
  let eligible = true;

  // --- Alter der Kinder ---
  if (request.childAgesMonths.length > 0) {
    const fitting = request.childAgesMonths.filter(
      (m) => m >= activity.minChildAgeMonths && m <= activity.maxChildAgeMonths
    ).length;
    if (fitting === request.childAgesMonths.length) {
      score += WEIGHTS.ageAllFit;
      reasons.push("für das Alter der Kinder geeignet");
    } else if (fitting > 0) {
      score += WEIGHTS.ageSomeFit;
      reasons.push("für einen Teil der Kinder geeignet");
    } else {
      score += WEIGHTS.ageNoneFit;
      warnings.push("altersmäßig eher nicht passend");
    }
  }

  // --- Hund ---
  if (request.dogMustJoin) {
    if (activity.dogFriendly) {
      score += WEIGHTS.dogOk;
      reasons.push("hundefreundlich");
    } else {
      score += WEIGHTS.dogFail;
      eligible = false;
      warnings.push("nicht hundetauglich, obwohl der Hund mit soll");
    }
  }

  // --- Kinderwagen ---
  if (request.strollerRequired) {
    if (activity.strollerFriendly) {
      score += WEIGHTS.strollerOk;
      reasons.push("kinderwagentauglich");
    } else {
      score += WEIGHTS.strollerFail;
      eligible = false;
      warnings.push("nicht kinderwagentauglich, obwohl ein Kinderwagen nötig ist");
    }
  }

  // --- Budget ---
  if (request.preferFree) {
    if (activity.estimatedCost === 0) {
      score += WEIGHTS.free;
      reasons.push("kostenlos");
    } else {
      score += WEIGHTS.notFreeButPreferred;
    }
  }
  if (request.maxBudget !== null) {
    if (activity.estimatedCost <= request.maxBudget) {
      score += WEIGHTS.inBudget;
      if (!request.preferFree || activity.estimatedCost > 0) {
        reasons.push(
          activity.estimatedCost === 0
            ? "kostenlos"
            : `im Budget (~${activity.estimatedCost} €)`
        );
      }
    } else {
      score += WEIGHTS.overBudget;
      warnings.push(`über dem Budget (~${activity.estimatedCost} €)`);
    }
  }

  // --- Fahrzeit ---
  if (activity.travelMinutes === null) {
    warnings.push("Fahrzeit unbekannt");
  } else if (activity.travelMinutes <= request.maxTravelMinutes) {
    score += WEIGHTS.travelInRange;
    reasons.push(`innerhalb der gewünschten Fahrzeit (~${activity.travelMinutes} Min)`);
  } else if (activity.travelMinutes > request.maxTravelMinutes * 1.5) {
    score += WEIGHTS.travelWayOver;
    eligible = false;
    warnings.push(`deutlich zu weit entfernt (~${activity.travelMinutes} Min)`);
  } else {
    score += WEIGHTS.travelOver;
    warnings.push(`etwas weiter entfernt als gewünscht (~${activity.travelMinutes} Min)`);
  }

  // --- Zeitbudget ---
  if (activity.estimatedDurationMinutes <= request.timeBudgetMinutes) {
    score += WEIGHTS.timeFits;
    reasons.push("passt ins Zeitbudget");
  } else {
    score += WEIGHTS.timeTooLong;
    warnings.push("braucht eher mehr Zeit als geplant");
  }

  // --- Wetter ---
  const hasWater = activity.tags.includes("water");
  switch (request.weatherCondition) {
    case "rain":
      if (activity.rainSafe || activity.indoor) {
        score += WEIGHTS.weatherGood;
        reasons.push("auch bei Regen geeignet");
      } else if (activity.outdoor) {
        score += WEIGHTS.weatherBad;
        warnings.push("bei Regen eher ungeeignet");
      }
      break;
    case "sun":
      if (activity.outdoor) {
        score += WEIGHTS.sunOutdoor;
        reasons.push("schön bei Sonnenwetter");
      }
      break;
    case "hot":
      if (activity.outdoor && hasWater) {
        score += WEIGHTS.hotWater;
        reasons.push("Abkühlung bei Hitze möglich");
      } else if (activity.indoor) {
        score += WEIGHTS.hotIndoor;
        reasons.push("kühles Indoor-Ziel bei Hitze");
      } else if (activity.outdoor) {
        score += WEIGHTS.hotOutdoor;
        warnings.push("bei Hitze draußen anstrengend");
      }
      break;
    case "cold":
      if (activity.indoor) {
        score += WEIGHTS.coldIndoor;
        reasons.push("warmes Indoor-Ziel bei Kälte");
      } else if (activity.outdoor) {
        score += WEIGHTS.coldOutdoor;
        warnings.push("bei Kälte draußen ggf. unangenehm");
      }
      break;
    default:
      break;
  }

  // --- Tagesform ---
  const isAction =
    activity.tags.includes("action") || activity.tags.includes("high_entertainment");
  const isQuiet =
    activity.tags.includes("quiet") || activity.tags.includes("nap_compatible");
  if (request.energyLevel === "action") {
    if (isAction) {
      score += WEIGHTS.energyMatch;
      reasons.push("viel Action für aktive Tage");
    } else if (isQuiet) {
      score += WEIGHTS.energyMismatch;
      warnings.push("eher ruhig für einen Action-Tag");
    }
  } else if (request.energyLevel === "quiet") {
    if (isQuiet) {
      score += WEIGHTS.energyMatch;
      reasons.push("schön ruhig");
    } else if (isAction) {
      score += WEIGHTS.energyMismatch;
      warnings.push("eher trubelig für einen ruhigen Tag");
    }
  }

  // --- Öffnungszeiten ---
  if (activity.openNow === true) {
    score += WEIGHTS.openNow;
    reasons.push("aktuell geöffnet");
  } else if (activity.openNow === false) {
    score += WEIGHTS.closedNow;
    warnings.push("aktuell vermutlich geschlossen");
  }

  // --- Bisheriges Feedback ---
  const feedback = request.feedbackByActivityId?.[activity.id] ?? [];
  if (feedback.includes("never_again")) {
    score += WEIGHTS.feedbackNeverAgain;
    eligible = false;
    warnings.push('von euch als „nie wieder" markiert');
  } else {
    if (feedback.includes("fits") || feedback.includes("more_like_this")) {
      score += WEIGHTS.feedbackPositive;
      reasons.push("hat euch früher gefallen");
    }
    if (feedback.includes("not_fitting")) {
      score += WEIGHTS.feedbackNegative;
      warnings.push("früher als nicht passend bewertet");
    }
  }

  // --- Ähnliche (kategoriebasierte) Vorlieben ---
  if (
    request.likedCategories?.includes(activity.category) &&
    !reasons.includes("hat euch früher gefallen")
  ) {
    score += WEIGHTS.likedCategory;
    reasons.push("ähnliche Aktivitäten haben euch gefallen");
  }

  return {
    activityId: activity.id,
    score: clamp(Math.round(score), 0, 100),
    reasons,
    warnings,
    eligible,
  };
}

/**
 * Baut aus Gründen und Warnungen einen kurzen, lesbaren Begründungstext.
 * Beispiel: "Passt gut, weil es hundefreundlich, günstig und nur 35 Min
 * entfernt ist. Bei Regen wäre es allerdings eher ungeeignet."
 */
export function buildExplanation(result: ScoringResult): string {
  const parts: string[] = [];
  if (result.reasons.length > 0) {
    const lead = result.score >= 75 ? "Passt gut" : result.score >= 55 ? "Passt" : "Könnte passen";
    parts.push(`${lead}, weil es ${joinGerman(result.reasons)} ist.`);
  } else {
    parts.push("Eine mögliche Idee für heute.");
  }
  if (result.warnings.length > 0) {
    parts.push(`Beachtet aber: ${joinGerman(result.warnings)}.`);
  }
  return parts.join(" ");
}

/** Verbindet eine Liste deutsch: "a, b und c". */
function joinGerman(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}

/**
 * Bewertet eine Liste von Aktivitäten, sortiert nach Score absteigend.
 * Nicht eignungsfähige (eligible=false) Aktivitäten werden standardmäßig
 * herausgefiltert.
 */
export function rankActivities(
  activities: ScoringActivityInput[],
  request: ScoringRequest,
  options: { includeIneligible?: boolean; limit?: number } = {}
): ScoringResult[] {
  const results = activities
    .map((a) => scoreActivity(a, request))
    .filter((r) => options.includeIneligible || r.eligible)
    .sort((a, b) => b.score - a.score);
  return options.limit ? results.slice(0, options.limit) : results;
}
