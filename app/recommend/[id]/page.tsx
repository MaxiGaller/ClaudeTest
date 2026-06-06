import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { runRecommendationAction } from "@/app/actions";

export const dynamic = "force-dynamic";

const labelCls = "block text-sm font-medium text-slate-700";
const fieldCls =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white";

export default async function RecommendPage({
  params,
}: {
  params: { id: string };
}) {
  const family = await prisma.familyProfile.findUnique({
    where: { id: params.id },
    include: { mobilityPreset: true, budgetPreset: true, pets: true },
  });
  if (!family) notFound();

  const mob = family.mobilityPreset;
  const bud = family.budgetPreset;
  const hasDog = family.pets.some((p) => p.type === "dog");
  const dogDefault = family.pets.some((p) => p.type === "dog" && p.mustJoinDefault);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Zurück
        </Link>
        <h1 className="mt-1 text-xl font-bold">Heute mit {family.name}</h1>
        <p className="text-sm text-slate-500">
          Kurz checken, was gerade passt – dann Vorschläge holen.
        </p>
      </div>

      <form action={runRecommendationAction} className="space-y-4">
        <input type="hidden" name="familyProfileId" value={family.id} />

        <div>
          <label className={labelCls} htmlFor="timeBudgetMinutes">
            Zeitbudget
          </label>
          <select id="timeBudgetMinutes" name="timeBudgetMinutes" className={fieldCls} defaultValue="240">
            <option value="120">1–2 Stunden</option>
            <option value="240">2–4 Stunden</option>
            <option value="360">halber Tag</option>
            <option value="600">ganzer Tag</option>
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="maxBudget">
            Budget
          </label>
          <select
            id="maxBudget"
            name="maxBudget"
            className={fieldCls}
            defaultValue={bud?.maxCostTotal != null ? String(bud.maxCostTotal) : "egal"}
          >
            <option value="0">kostenlos</option>
            <option value="20">bis 20 €</option>
            <option value="50">bis 50 €</option>
            <option value="egal">egal</option>
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="maxTravelMinutes">
            Maximale Fahrzeit
          </label>
          <select
            id="maxTravelMinutes"
            name="maxTravelMinutes"
            className={fieldCls}
            defaultValue={String(mob?.maxTravelMinutes ?? 45)}
          >
            <option value="15">bis 15 Min</option>
            <option value="30">bis 30 Min</option>
            <option value="45">bis 45 Min</option>
            <option value="60">bis 60 Min</option>
            <option value="90">bis 90 Min</option>
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="energyLevel">
            Tagesform
          </label>
          <select id="energyLevel" name="energyLevel" className={fieldCls} defaultValue="normal">
            <option value="quiet">ruhig</option>
            <option value="normal">normal</option>
            <option value="action">Action</option>
          </select>
        </div>

        <div>
          <label className={labelCls} htmlFor="weatherCondition">
            Wetter (optional)
          </label>
          <select id="weatherCondition" name="weatherCondition" className={fieldCls} defaultValue="">
            <option value="">egal / unbekannt</option>
            <option value="sun">Sonne</option>
            <option value="rain">Regen</option>
            <option value="cold">kalt</option>
            <option value="hot">heiß</option>
          </select>
        </div>

        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          {hasDog && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="dogMustJoin" defaultChecked={dogDefault} />
              Hund muss mit
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="strollerRequired"
              defaultChecked={mob?.strollerRequired ?? false}
            />
            Kinderwagen nötig
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="preferFree" defaultChecked={bud?.preferFree ?? false} />
            Lieber kostenlos
          </label>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white hover:bg-brand-700"
        >
          Vorschläge anzeigen
        </button>
      </form>
    </div>
  );
}
