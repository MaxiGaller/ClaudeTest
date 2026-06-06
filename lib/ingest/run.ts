/**
 * Orchestrator des täglichen Ingestion-Laufs.
 *
 * Region-agnostisch: iteriert über die aktiven Regionen (lib/regions.ts). Pro
 * Region laufen zwei Pipelines:
 *   - Events:       zeitbegrenzt -> Tabelle `Event`  (heute/zukünftig, prunt Abgelaufenes)
 *   - Attraktionen: dauerhaft    -> Tabelle `Attraction` (kein Datums-Pruning)
 *
 * Je Pipeline: Quellen laden -> dedupen -> anreichern (KI wenn ANTHROPIC_API_KEY
 * vorhanden, sonst regelbasiert) -> idempotent upserten (per sourceName+externalId).
 *
 * KI wird genau hier (gebündelt im Job) eingesetzt – nie pro Nutzer.
 */
import { prisma } from "../prisma";
import { ruleBasedClassifyMany } from "./classify";
import { dedupeRawItems } from "./dedupe";
import { deriveValidUntil } from "./validity";
import { fixtureSource } from "./sources/fixture";
import { muenchenOpenDataSource } from "./sources/muenchenOpenData";
import { attractionFixtureSource } from "./sources/attractionFixture";
import { overpassHikingSource } from "./sources/overpassHiking";
import { activeRegions, getRegion, type RegionConfig } from "../regions";
import type { ClassifiedItem, RawItem, Source } from "./types";

export interface IngestOptions {
  /** Nur diese Region ingestieren; default: alle aktiven Regionen. */
  region?: string;
}

export interface RegionIngestSummary {
  runId: string;
  region: string;
  enrichedBy: "ai" | "rule-based";
  eventsCreated: number;
  eventsUpdated: number;
  eventsPruned: number;
  attractionsCreated: number;
  attractionsUpdated: number;
}

/** Quellen-Adapter nach Name auflösen (region-parametrisiert). */
function makeSource(name: string, regionSlug: string): Source {
  switch (name) {
    case "fixture":
      return fixtureSource();
    case "muenchen-open-data":
      return muenchenOpenDataSource();
    case "attraction-fixture":
      return attractionFixtureSource();
    case "overpass-hiking":
      return overpassHikingSource(regionSlug);
    default:
      throw new Error(`Unbekannte Quelle: ${name}`);
  }
}

/** Lädt rohe Items aus mehreren Quellen; einzelne Ausfälle überspringen statt abbrechen. */
async function collectRaws(
  sourceNames: string[],
  regionSlug: string
): Promise<RawItem[]> {
  const all: RawItem[] = [];
  for (const name of sourceNames) {
    try {
      const source = makeSource(name, regionSlug);
      const items = await source.fetch();
      all.push(...items);
    } catch (err) {
      // z. B. nicht konfigurierte Feed-/Overpass-URL: andere Quellen weiterlaufen lassen.
      console.warn(`Quelle "${name}" übersprungen: ${(err as Error).message}`);
    }
  }
  return dedupeRawItems(all);
}

/** Enrichment-Strategie wählen: KI nur mit API-Key, sonst regelbasiert. */
async function enrich(
  raws: RawItem[]
): Promise<{ items: ClassifiedItem[]; enrichedBy: "ai" | "rule-based" }> {
  if (raws.length === 0) return { items: [], enrichedBy: "rule-based" };
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { aiClassify } = await import("./ai");
      return { items: await aiClassify(raws), enrichedBy: "ai" };
    } catch (err) {
      console.warn(
        `KI-Anreicherung fehlgeschlagen, nutze regelbasierten Fallback: ${(err as Error).message}`
      );
    }
  }
  return { items: ruleBasedClassifyMany(raws), enrichedBy: "rule-based" };
}

/** Gemeinsame Inhaltsfelder für beide Zieltabellen. */
function commonData(item: ClassifiedItem, region: string, sourceName: string, now: Date) {
  return {
    name: item.name,
    description: item.description,
    category: item.category,
    region,
    address: item.address ?? null,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    estimatedCost: item.estimatedCost,
    estimatedDurationMinutes: item.estimatedDurationMinutes,
    minChildAgeMonths: item.minChildAgeMonths,
    maxChildAgeMonths: item.maxChildAgeMonths,
    dogFriendly: item.dogFriendly,
    strollerFriendly: item.strollerFriendly,
    rainSafe: item.rainSafe,
    indoor: item.indoor,
    outdoor: item.outdoor,
    foodAvailable: item.foodAvailable,
    websiteUrl: item.sourceUrl ?? null,
    ticketUrl: item.ticketUrl ?? null,
    source: item.provenance,
    sourceName,
    sourceUrl: item.sourceUrl ?? null,
    externalId: item.externalId,
    lastSeenAt: now,
  };
}

/** Tags polymorph (neu) schreiben. */
async function replaceTags(
  itemType: "attraction" | "event",
  itemId: string,
  tags: string[]
): Promise<void> {
  await prisma.itemTag.deleteMany({ where: { itemType, itemId } });
  if (tags.length > 0) {
    await prisma.itemTag.createMany({
      data: tags.map((tag) => ({ itemType, itemId, tag })),
      skipDuplicates: true,
    });
  }
}

/** Event-Pipeline: upsert in `Event`, abgelaufene überspringen, danach prunen. */
async function ingestEvents(
  region: RegionConfig,
  now: Date
): Promise<{ created: number; updated: number; pruned: number; enrichedBy: "ai" | "rule-based"; skipped: number }> {
  const raws = await collectRaws(region.eventSources, region.slug);
  const { items, enrichedBy } = await enrich(raws);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const validUntil = deriveValidUntil(item.startsAt, item.endsAt);
    // Bereits abgelaufene Events gar nicht erst aufnehmen.
    if (validUntil && validUntil.getTime() < now.getTime()) {
      skipped++;
      continue;
    }
    const data = {
      ...commonData(item, region.slug, "event-source", now),
      startsAt: item.startsAt ? new Date(item.startsAt) : null,
      endsAt: item.endsAt ? new Date(item.endsAt) : null,
      validUntil,
    };

    const existing = await prisma.event.findUnique({
      where: { sourceName_externalId: { sourceName: "event-source", externalId: item.externalId } },
      select: { id: true },
    });

    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data });
      await replaceTags("event", existing.id, item.tags);
      updated++;
    } else {
      const ev = await prisma.event.create({ data });
      await replaceTags("event", ev.id, item.tags);
      created++;
    }
  }

  // Abgelaufene Events dieser Region entfernen.
  const pruned = await prisma.event.deleteMany({
    where: { region: region.slug, validUntil: { not: null, lt: now } },
  });

  return { created, updated, pruned: pruned.count, enrichedBy, skipped };
}

/** Attraktions-Pipeline: upsert in `Attraction` (evergreen, kein Pruning). */
async function ingestAttractions(
  region: RegionConfig,
  now: Date
): Promise<{ created: number; updated: number; enrichedBy: "ai" | "rule-based" }> {
  const raws = await collectRaws(region.attractionSources, region.slug);
  const { items, enrichedBy } = await enrich(raws);

  let created = 0;
  let updated = 0;

  for (const item of items) {
    const data = {
      ...commonData(item, region.slug, "attraction-source", now),
      difficulty: item.difficulty ?? null,
      lengthKm: item.lengthKm ?? null,
    };

    const existing = await prisma.attraction.findUnique({
      where: {
        sourceName_externalId: { sourceName: "attraction-source", externalId: item.externalId },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.attraction.update({ where: { id: existing.id }, data });
      await replaceTags("attraction", existing.id, item.tags);
      updated++;
    } else {
      const attr = await prisma.attraction.create({ data });
      await replaceTags("attraction", attr.id, item.tags);
      created++;
    }
  }

  return { created, updated, enrichedBy };
}

/** Ingestion für eine einzelne Region (beide Pipelines + Audit-Record). */
export async function runRegionIngest(region: RegionConfig): Promise<RegionIngestSummary> {
  const now = new Date();
  const run = await prisma.ingestRun.create({
    data: {
      region: region.slug,
      source: [...region.eventSources, ...region.attractionSources].join(","),
      status: "running",
    },
  });

  try {
    const events = await ingestEvents(region, now);
    const attractions = await ingestAttractions(region, now);
    // KI gilt als genutzt, sobald eine der Pipelines tatsächlich KI verwendet hat.
    const enrichedBy: "ai" | "rule-based" =
      events.enrichedBy === "ai" || attractions.enrichedBy === "ai" ? "ai" : "rule-based";

    await prisma.ingestRun.update({
      where: { id: run.id },
      data: {
        status: "done",
        enrichedBy,
        eventsCreated: events.created,
        eventsUpdated: events.updated,
        eventsPruned: events.pruned,
        attractionsCreated: attractions.created,
        attractionsUpdated: attractions.updated,
        notes: events.skipped > 0 ? `${events.skipped} bereits abgelaufene Events übersprungen` : null,
        finishedAt: new Date(),
      },
    });

    return {
      runId: run.id,
      region: region.slug,
      enrichedBy,
      eventsCreated: events.created,
      eventsUpdated: events.updated,
      eventsPruned: events.pruned,
      attractionsCreated: attractions.created,
      attractionsUpdated: attractions.updated,
    };
  } catch (err) {
    await prisma.ingestRun.update({
      where: { id: run.id },
      data: { status: "failed", notes: (err as Error).message, finishedAt: new Date() },
    });
    throw err;
  }
}

/**
 * Führt die Ingestion aus – für eine angegebene Region oder alle aktiven.
 * Gibt je Region eine Zusammenfassung zurück.
 */
export async function runIngest(opts: IngestOptions = {}): Promise<RegionIngestSummary[]> {
  const regions = opts.region ? [getRegion(opts.region)] : activeRegions();
  const summaries: RegionIngestSummary[] = [];
  for (const region of regions) {
    summaries.push(await runRegionIngest(region));
  }
  return summaries;
}
