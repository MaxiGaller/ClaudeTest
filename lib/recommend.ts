/**
 * Verbindet Datenbank, Geo-Schätzung und Scoring zu einem Empfehlungslauf.
 * Hier liegt die DB-Anbindung – die reine Logik bleibt in scoring.ts / geo.ts.
 */
import { prisma } from "./prisma";
import { travelMinutesBetween } from "./geo";
import {
  buildExplanation,
  rankActivities,
  type EnergyLevel,
  type FeedbackType,
  type ScoringActivityInput,
  type ScoringRequest,
  type ScoringResult,
  type WeatherCondition,
} from "./scoring";

export interface RecommendInput {
  familyProfileId: string;
  timeBudgetMinutes: number;
  maxBudget: number | null;
  maxTravelMinutes: number;
  dogMustJoin: boolean;
  strollerRequired: boolean;
  energyLevel: EnergyLevel;
  weatherCondition: WeatherCondition;
  preferFree?: boolean;
  limit?: number;
}

export interface RecommendationItem extends ScoringResult {
  activity: {
    id: string;
    name: string;
    category: string;
    estimatedCost: number;
    estimatedDurationMinutes: number;
    travelMinutes: number | null;
  };
  explanation: string;
}

/** Alter in Monaten aus Geburtsdatum. */
function ageInMonths(birthDate: Date | null, now: Date): number | null {
  if (!birthDate) return null;
  const months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  return Math.max(0, months);
}

export interface RecommendationOutput {
  runId: string;
  items: RecommendationItem[];
}

/**
 * Führt einen Empfehlungslauf aus, persistiert ihn und gibt die Top-Treffer
 * inklusive Begründung zurück.
 */
export async function runRecommendation(
  input: RecommendInput
): Promise<RecommendationOutput> {
  const now = new Date();

  const family = await prisma.familyProfile.findUnique({
    where: { id: input.familyProfileId },
    include: { persons: true, reviews: true },
  });
  if (!family) throw new Error("Familienprofil nicht gefunden");

  const childAgesMonths = family.persons
    .filter((p) => p.type === "child")
    .map((p) => ageInMonths(p.birthDate, now))
    .filter((m): m is number => m !== null);

  // Feedback-Historie der Familie aufbereiten.
  const feedbackByActivityId: Record<string, FeedbackType[]> = {};
  const likedCategorySet = new Set<string>();
  const activityIdToCategory = new Map<string, string>();

  const activities = await prisma.activity.findMany({ include: { tags: true } });
  for (const a of activities) activityIdToCategory.set(a.id, a.category);

  for (const review of family.reviews) {
    const arr = feedbackByActivityId[review.activityId] ?? [];
    arr.push(review.feedbackType as FeedbackType);
    feedbackByActivityId[review.activityId] = arr;
    if (review.feedbackType === "fits" || review.feedbackType === "more_like_this") {
      const cat = activityIdToCategory.get(review.activityId);
      if (cat) likedCategorySet.add(cat);
    }
  }

  // Fahrzeit je Aktivität schätzen (Luftlinie -> Heuristik).
  const homeLat = family.homeLatitude;
  const homeLon = family.homeLongitude;
  const scoringActivities: ScoringActivityInput[] = activities.map((a) => {
    let travelMinutes: number | null = null;
    if (homeLat != null && homeLon != null && a.latitude != null && a.longitude != null) {
      travelMinutes = travelMinutesBetween(homeLat, homeLon, a.latitude, a.longitude, "car");
    }
    return {
      id: a.id,
      name: a.name,
      category: a.category,
      estimatedCost: a.estimatedCost,
      estimatedDurationMinutes: a.estimatedDurationMinutes,
      minChildAgeMonths: a.minChildAgeMonths,
      maxChildAgeMonths: a.maxChildAgeMonths,
      dogFriendly: a.dogFriendly,
      strollerFriendly: a.strollerFriendly,
      rainSafe: a.rainSafe,
      indoor: a.indoor,
      outdoor: a.outdoor,
      foodAvailable: a.foodAvailable,
      tags: a.tags.map((t) => t.tag),
      travelMinutes,
      openNow: null, // Öffnungszeiten im MVP nicht strukturiert gepflegt
    };
  });

  const request: ScoringRequest = {
    childAgesMonths,
    dogMustJoin: input.dogMustJoin,
    strollerRequired: input.strollerRequired,
    maxBudget: input.maxBudget,
    preferFree: input.preferFree ?? false,
    maxTravelMinutes: input.maxTravelMinutes,
    timeBudgetMinutes: input.timeBudgetMinutes,
    energyLevel: input.energyLevel,
    weatherCondition: input.weatherCondition,
    feedbackByActivityId,
    likedCategories: [...likedCategorySet],
  };

  const ranked = rankActivities(scoringActivities, request, {
    limit: input.limit ?? 5,
  });

  const activityById = new Map(scoringActivities.map((a) => [a.id, a]));
  const items: RecommendationItem[] = ranked.map((r) => {
    const a = activityById.get(r.activityId)!;
    return {
      ...r,
      explanation: buildExplanation(r),
      activity: {
        id: a.id,
        name: a.name,
        category: a.category,
        estimatedCost: a.estimatedCost,
        estimatedDurationMinutes: a.estimatedDurationMinutes,
        travelMinutes: a.travelMinutes,
      },
    };
  });

  // Lauf samt Ergebnissen persistieren (für Nachvollziehbarkeit / Historie).
  const run = await prisma.recommendationRun.create({
    data: {
      familyProfileId: input.familyProfileId,
      timeBudgetMinutes: input.timeBudgetMinutes,
      maxBudget: input.maxBudget,
      maxTravelMinutes: input.maxTravelMinutes,
      dogMustJoin: input.dogMustJoin,
      strollerRequired: input.strollerRequired,
      energyLevel: input.energyLevel,
      weatherCondition: input.weatherCondition ?? undefined,
      results: {
        create: items.map((item) => ({
          activityId: item.activityId,
          score: item.score,
          explanation: item.explanation,
          warnings: JSON.stringify(item.warnings),
        })),
      },
    },
  });

  return { runId: run.id, items };
}
