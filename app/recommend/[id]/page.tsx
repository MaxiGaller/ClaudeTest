import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { runRecommendationAction } from "@/app/actions";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

const labelCls = "block text-sm font-medium text-slate-300";

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
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-slate-400 transition hover:text-slate-200">
          ← Zurück
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">
          Heute mit <span className="text-gradient">{family.name}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Kurz checken, was gerade passt – dann holen wir die besten Ideen.
        </p>
      </div>

      <form action={runRecommendationAction} className="space-y-5">
        <input type="hidden" name="familyProfileId" value={family.id} />

        <Card className="space-y-4">
          <div>
            <label className={labelCls} htmlFor="timeBudgetMinutes">
              ⏳ Zeitbudget
            </label>
            <select id="timeBudgetMinutes" name="timeBudgetMinutes" className="input-dark mt-1.5" defaultValue="240">
              <option value="120">1–2 Stunden</option>
              <option value="240">2–4 Stunden</option>
              <option value="360">halber Tag</option>
              <option value="600">ganzer Tag</option>
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="maxBudget">
              💶 Budget
            </label>
            <select
              id="maxBudget"
              name="maxBudget"
              className="input-dark mt-1.5"
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
              🚗 Maximale Fahrzeit
            </label>
            <select
              id="maxTravelMinutes"
              name="maxTravelMinutes"
              className="input-dark mt-1.5"
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
              ⚡ Tagesform
            </label>
            <select id="energyLevel" name="energyLevel" className="input-dark mt-1.5" defaultValue="normal">
              <option value="quiet">ruhig</option>
              <option value="normal">normal</option>
              <option value="action">Action</option>
            </select>
          </div>

          <div>
            <label className={labelCls} htmlFor="weatherCondition">
              🌤 Wetter (optional)
            </label>
            <select id="weatherCondition" name="weatherCondition" className="input-dark mt-1.5" defaultValue="">
              <option value="">egal / unbekannt</option>
              <option value="sun">Sonne</option>
              <option value="rain">Regen</option>
              <option value="cold">kalt</option>
              <option value="hot">heiß</option>
            </select>
          </div>
        </Card>

        <Card className="space-y-3">
          {hasDog && (
            <label className="flex items-center gap-2.5 text-sm text-slate-200">
              <input type="checkbox" name="dogMustJoin" defaultChecked={dogDefault} className="h-4 w-4 accent-accent-500" />
              🐕 Hund muss mit
            </label>
          )}
          <label className="flex items-center gap-2.5 text-sm text-slate-200">
            <input
              type="checkbox"
              name="strollerRequired"
              defaultChecked={mob?.strollerRequired ?? false}
              className="h-4 w-4 accent-accent-500"
            />
            👶 Kinderwagen nötig
          </label>
          <label className="flex items-center gap-2.5 text-sm text-slate-200">
            <input type="checkbox" name="preferFree" defaultChecked={bud?.preferFree ?? false} className="h-4 w-4 accent-accent-500" />
            💚 Lieber kostenlos
          </label>
        </Card>

        <button type="submit" className="btn-gradient w-full py-3.5 text-base">
          ✨ Vorschläge generieren
        </button>
      </form>
    </div>
  );
}
