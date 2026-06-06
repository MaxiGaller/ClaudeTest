import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { submitReviewAction } from "@/app/actions";

export const dynamic = "force-dynamic";

function scoreColor(score: number): string {
  if (score >= 75) return "bg-green-100 text-green-800";
  if (score >= 55) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
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
  { type: "not_fitting", label: "👎 nicht passend" },
  { type: "never_again", label: "🚫 nie wieder" },
] as const;

export default async function ResultsPage({
  params,
}: {
  params: { runId: string };
}) {
  const run = await prisma.recommendationRun.findUnique({
    where: { id: params.runId },
    include: {
      familyProfile: true,
      results: {
        orderBy: { score: "desc" },
        include: { activity: true },
      },
    },
  });
  if (!run) notFound();

  return (
    <div className="space-y-5">
      <div>
        <Link href={`/recommend/${run.familyProfileId}`} className="text-sm text-slate-500 hover:underline">
          ← Neue Suche
        </Link>
        <h1 className="mt-1 text-xl font-bold">Hier sind eure Vorschläge</h1>
        <p className="text-sm text-slate-500">
          {run.results.length} Ideen, die heute zu {run.familyProfile.name} passen.
        </p>
      </div>

      {run.results.length === 0 && (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          Heute passt mit diesen Filtern leider nichts. Versucht es mit mehr
          Fahrzeit oder höherem Budget.
        </p>
      )}

      <ul className="space-y-4">
        {run.results.map((r) => {
          const warnings = parseWarnings(r.warnings);
          return (
            <li
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/activity/${r.activity.id}`}
                    className="font-semibold hover:underline"
                  >
                    {r.activity.name}
                  </Link>
                  <p className="text-xs text-slate-400">{r.activity.category}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${scoreColor(r.score)}`}
                  title="Eignungs-Score"
                >
                  {r.score}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-700">{r.explanation}</p>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                <span>💶 {r.activity.estimatedCost === 0 ? "kostenlos" : `~${r.activity.estimatedCost} €`}</span>
                <span>⏱ ~{Math.round(r.activity.estimatedDurationMinutes / 60)} Std</span>
              </div>

              {warnings.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {warnings.map((w, i) => (
                    <li
                      key={i}
                      className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                    >
                      ⚠ {w}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {FEEDBACK.map((f) => (
                  <form key={f.type} action={submitReviewAction}>
                    <input type="hidden" name="familyProfileId" value={run.familyProfileId} />
                    <input type="hidden" name="activityId" value={r.activity.id} />
                    <input type="hidden" name="feedbackType" value={f.type} />
                    <button
                      type="submit"
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                    >
                      {f.label}
                    </button>
                  </form>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
