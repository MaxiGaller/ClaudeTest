import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { submitReviewAction } from "@/app/actions";
import { feedId, type FeedItemType } from "@/lib/feed";
import { Badge, Chip, ReasonBox, categoryIcon } from "@/components/ui";

export const dynamic = "force-dynamic";

function scoreTone(score: number): string {
  if (score >= 75) return "border-accent-400/40 bg-accent-500/[0.15] text-accent-200";
  if (score >= 55) return "border-amber-400/40 bg-amber-500/[0.15] text-amber-200";
  return "border-white/[0.15] bg-white/[0.05] text-slate-300";
}

function parseWarnings(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const FEEDBACK = [
  { type: "fits", label: "👍 passt" },
  { type: "more_like_this", label: "💚 mehr davon" },
  { type: "not_fitting", label: "👎 unpassend" },
  { type: "never_again", label: "🚫 nie wieder" },
] as const;

interface ItemMeta {
  name: string;
  category: string;
  description: string;
  address: string | null;
  estimatedCost: number;
  estimatedDurationMinutes: number;
}

export default async function ResultsPage({
  params,
}: {
  params: { runId: string };
}) {
  const run = await prisma.recommendationRun.findUnique({
    where: { id: params.runId },
    include: {
      familyProfile: true,
      results: { orderBy: { score: "desc" } },
    },
  });
  if (!run) notFound();

  const attractionIds = run.results.filter((r) => r.itemType === "attraction").map((r) => r.itemId);
  const eventIds = run.results.filter((r) => r.itemType === "event").map((r) => r.itemId);
  const select = {
    id: true,
    name: true,
    category: true,
    description: true,
    address: true,
    estimatedCost: true,
    estimatedDurationMinutes: true,
  };
  const [attractions, events] = await Promise.all([
    attractionIds.length
      ? prisma.attraction.findMany({ where: { id: { in: attractionIds } }, select })
      : Promise.resolve([]),
    eventIds.length
      ? prisma.event.findMany({ where: { id: { in: eventIds } }, select })
      : Promise.resolve([]),
  ]);
  const meta = new Map<string, ItemMeta>();
  for (const a of attractions) meta.set(feedId("attraction", a.id), a);
  for (const e of events) meta.set(feedId("event", e.id), e);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <Link
            href={`/recommend/${run.familyProfileId}`}
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            ← Neue Suche
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Eure Vorschläge</h1>
          <p className="text-sm text-slate-400">
            {run.results.length} Ideen, die heute zu {run.familyProfile.name} passen.
          </p>
        </div>
        <Link href={`/recommend/${run.familyProfileId}`} className="btn-ghost shrink-0 px-4 py-2 text-sm">
          🔀 Neu mischen
        </Link>
      </div>

      {run.results.length === 0 && (
        <div className="surface p-5 text-sm text-slate-400">
          Heute passt mit diesen Filtern leider nichts. Versucht es mit mehr
          Fahrzeit oder höherem Budget.
        </div>
      )}

      <ul className="space-y-4">
        {run.results.map((r) => {
          const warnings = parseWarnings(r.warnings);
          const m = meta.get(feedId(r.itemType as FeedItemType, r.itemId));
          if (!m) return null;
          const isEvent = r.itemType === "event";
          return (
            <li key={r.id} className="surface overflow-hidden">
              {/* Akzent-Leiste oben */}
              <div className="h-1 w-full bg-gradient-to-r from-accent-400/70 to-brand-400/70" />
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-2xl">
                      {categoryIcon(m.category)}
                    </span>
                    <div>
                      <Link
                        href={`/item/${r.itemType}/${r.itemId}`}
                        className="font-display text-xl font-bold leading-tight text-white hover:text-accent-200"
                      >
                        {m.name}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                        📍 {m.address?.split(",").slice(-1)[0]?.trim() || "München"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={isEvent ? "accent" : "brand"}>{isEvent ? "Event" : "Ausflug"}</Badge>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${scoreTone(r.score)}`}>
                      {r.score}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-slate-300">{m.description}</p>

                <ReasonBox>{r.explanation}</ReasonBox>

                {warnings.length > 0 && (
                  <p className="flex items-start gap-1.5 text-sm text-amber-200/90">
                    <span>💡</span>
                    <span>{warnings.join(" · ")}</span>
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Chip>⏱ ~{Math.round(m.estimatedDurationMinutes / 60)} Std</Chip>
                  <Chip tone={m.estimatedCost === 0 ? "accent" : "slate"}>
                    💶 {m.estimatedCost === 0 ? "kostenlos" : `~${m.estimatedCost} €`}
                  </Chip>
                  <Chip tone="brand">{m.category}</Chip>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
                  {FEEDBACK.map((f) => (
                    <form key={f.type} action={submitReviewAction}>
                      <input type="hidden" name="familyProfileId" value={run.familyProfileId} />
                      <input type="hidden" name="itemType" value={r.itemType} />
                      <input type="hidden" name="itemId" value={r.itemId} />
                      <input type="hidden" name="feedbackType" value={f.type} />
                      <button
                        type="submit"
                        className="rounded-full border border-white/[0.12] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/25 hover:bg-white/[0.07]"
                      >
                        {f.label}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
