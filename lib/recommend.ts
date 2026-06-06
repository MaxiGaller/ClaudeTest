/**
 * Verbindet Datenbank, Geo-Schätzung und Scoring zu einem Empfehlungslauf.
 * Hier liegt die DB-Anbindung – die reine Logik bleibt in scoring.ts / feed.ts.
 *
 * Der Feed vereint dauerhafte Attraktionen und aktive Events (lib/feed.ts);
 * das Scoring sieht nur eine einheitliche Liste.
 */
import { prisma } from "./prisma";
import { travelMinutesBetween } from "./geo";
import { DEFAULT_REGION } from "./regions";
import {
  feedId,
  parseFeedId,
  toScoringInput,
  type FeedItemRow,
  type FeedItemType,
} from "./feed";
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
  region?: string;
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
  item: {
    type: FeedItemType;
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

interface FeedEntry {
  type: FeedItemType;
  row: FeedItemRow;
}

/**
 * Führt einen Empfehlungslauf aus, persistiert ihn und gibt die Top-Treffer
 * inklusive Begründung zurück.
 */
export async function runRecommendation(
  input: RecommendInput
): Promise<RecommendationOutput> {
  const now = new Date();
  const region = input.region ?? DEFAULT_REGION;

  const family = await prisma.familyProfile.findUnique({
    where: { id: input.familyProfileId },
    include: { persons: true, reviews: true },
  });
  if (!family) throw new Error("Familienprofil nicht gefunden");

  const childAgesMonths = family.persons
    .filter((p) => p.type === "child")
    .map((p) => ageInMonths(p.birthDate, now))
    .filter((m): m is number => m !== null);

  // Vereinter Feed: alle Attraktionen der Region + aktive Events der Region.
  const [attractions, events] = await Promise.all([
    prisma.attraction.findMany({ where: { region } }),
    prisma.event.findMany({
      where: { region, OR: [{ validUntil: null }, { validUntil: { gte: now } }] },
    }),
  ]);

  const feed: FeedEntry[] = [
    ...attractions.map((a) => ({ type: "attraction" as const, row: a })),
    ...events.map((e) => ({ type: "event" as const, row: e })),
  ];

  // Tags polymorph laden und nach Feed-ID gruppieren.
  const tagsByFeedId = new Map<string, string[]>();
  if (feed.length > 0) {
    const tagRows = await prisma.itemTag.findMany({
      where: { OR: feed.map((f) => ({ itemType: f.type, itemId: f.row.id })) },
    });
    for (const t of tagRows) {
      const key = feedId(t.itemType as FeedItemType, t.itemId);
      const arr = tagsByFeedId.get(key) ?? [];
      arr.push(t.tag);
      tagsByFeedId.set(key, arr);
    }
  }

  // Kategorie je Feed-ID (für das Lernen bevorzugter Kategorien aus Feedback).
  const categoryByFeedId = new Map<string, string>();
  for (const f of feed) {
    categoryByFeedId.set(feedId(f.type, f.row.id), f.row.category);
  }

  // Feedback-Historie der Familie aufbereiten (Schlüssel = Feed-ID).
  const feedbackByActivityId: Record<string, FeedbackType[]> = {};
  const likedCategorySet = new Set<string>();
  for (const review of family.reviews) {
    const key = feedId(review.itemType as FeedItemType, review.itemId);
    const arr = feedbackByActivityId[key] ?? [];
    arr.push(review.feedbackType as FeedbackType);
    feedbackByActivityId[key] = arr;
    if (review.feedbackType === "fits" || review.feedbackType === "more_like_this") {
      const cat = categoryByFeedId.get(key);
      if (cat) likedCategorySet.add(cat);
    }
  }

  // Fahrzeit je Item schätzen (Luftlinie -> Heuristik).
  const homeLat = family.homeLatitude;
  const homeLon = family.homeLongitude;
  const scoringActivities: ScoringActivityInput[] = feed.map((f) => {
    let travelMinutes: number | null = null;
    if (homeLat != null && homeLon != null && f.row.latitude != null && f.row.longitude != null) {
      travelMinutes = travelMinutesBetween(homeLat, homeLon, f.row.latitude, f.row.longitude, "car");
    }
    const key = feedId(f.type, f.row.id);
    return toScoringInput(f.type, f.row, tagsByFeedId.get(key) ?? [], travelMinutes);
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

  const byId = new Map(scoringActivities.map((a) => [a.id, a]));
  const items: RecommendationItem[] = ranked.map((r) => {
    const a = byId.get(r.activityId)!;
    const { type, id } = parseFeedId(r.activityId);
    return {
      ...r,
      explanation: buildExplanation(r),
      item: {
        type,
        id,
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
      region,
      timeBudgetMinutes: input.timeBudgetMinutes,
      maxBudget: input.maxBudget,
      maxTravelMinutes: input.maxTravelMinutes,
      dogMustJoin: input.dogMustJoin,
      strollerRequired: input.strollerRequired,
      energyLevel: input.energyLevel,
      weatherCondition: input.weatherCondition ?? undefined,
      results: {
        create: items.map((item) => ({
          itemType: item.item.type,
          itemId: item.item.id,
          score: item.score,
          explanation: item.explanation,
          warnings: JSON.stringify(item.warnings),
        })),
      },
    },
  });

  return { runId: run.id, items };
}
