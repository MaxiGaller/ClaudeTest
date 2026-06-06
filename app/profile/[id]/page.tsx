import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import {
  addPersonAction,
  addPetAction,
  deletePersonAction,
  deletePetAction,
  updateBudgetAction,
  updateMobilityAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

const btn = "btn-ghost px-4 py-2 text-sm";

function ageLabel(birthDate: Date | null): string {
  if (!birthDate) return "";
  const now = new Date();
  const months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  if (months < 24) return `${months} Mon.`;
  return `${Math.floor(months / 12)} J.`;
}

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const family = await prisma.familyProfile.findUnique({
    where: { id: params.id },
    include: { persons: true, pets: true, mobilityPreset: true, budgetPreset: true },
  });
  if (!family) notFound();

  const mob = family.mobilityPreset;
  const bud = family.budgetPreset;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-slate-400 transition hover:text-slate-200">
          ← Zurück
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-white">{family.name}</h1>
        {family.homeLocationName && (
          <p className="text-sm text-slate-400">📍 {family.homeLocationName}</p>
        )}
      </div>

      {/* Personen */}
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold text-white">Personen im Haushalt</h2>
        <ul className="space-y-1.5">
          {family.persons.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm"
            >
              <span className="text-slate-200">
                {p.type === "child" ? "🧒" : "🧑"} {p.name}{" "}
                <span className="text-slate-500">
                  ({p.type === "child" ? "Kind" : "Erwachsen"}
                  {p.type === "child" && p.birthDate ? `, ${ageLabel(p.birthDate)}` : ""})
                </span>
              </span>
              <form action={deletePersonAction}>
                <input type="hidden" name="familyProfileId" value={family.id} />
                <input type="hidden" name="personId" value={p.id} />
                <button className="text-xs text-rose-400 transition hover:text-rose-300">entfernen</button>
              </form>
            </li>
          ))}
          {family.persons.length === 0 && (
            <li className="text-sm text-slate-500">Noch keine Personen.</li>
          )}
        </ul>
        <form action={addPersonAction} className="flex flex-wrap gap-2 pt-1">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <input name="name" placeholder="Name" className="input-dark flex-1" required />
          <select name="type" className="input-dark w-auto" defaultValue="child">
            <option value="adult">Erwachsen</option>
            <option value="child">Kind</option>
          </select>
          <input name="birthDate" type="date" className="input-dark w-auto" title="Geburtsdatum (nur bei Kindern)" />
          <button className={btn} type="submit">+ Person</button>
        </form>
      </Card>

      {/* Haustiere */}
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold text-white">Haustiere</h2>
        <ul className="space-y-1.5">
          {family.pets.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm"
            >
              <span className="text-slate-200">
                {p.type === "dog" ? "🐕" : p.type === "cat" ? "🐈" : "🐾"} {p.name}{" "}
                <span className="text-slate-500">({p.mustJoinDefault ? "muss meist mit" : p.type})</span>
              </span>
              <form action={deletePetAction}>
                <input type="hidden" name="familyProfileId" value={family.id} />
                <input type="hidden" name="petId" value={p.id} />
                <button className="text-xs text-rose-400 transition hover:text-rose-300">entfernen</button>
              </form>
            </li>
          ))}
          {family.pets.length === 0 && <li className="text-sm text-slate-500">Keine Haustiere.</li>}
        </ul>
        <form action={addPetAction} className="flex flex-wrap items-center gap-2 pt-1">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <input name="name" placeholder="Name" className="input-dark flex-1" required />
          <select name="type" className="input-dark w-auto" defaultValue="dog">
            <option value="dog">Hund</option>
            <option value="cat">Katze</option>
            <option value="other">Andere</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-300">
            <input type="checkbox" name="mustJoinDefault" className="h-4 w-4 accent-accent-500" /> muss mit
          </label>
          <button className={btn} type="submit">+ Tier</button>
        </form>
      </Card>

      {/* Mobilität */}
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold text-white">Mobilität</h2>
        <form action={updateMobilityAction} className="space-y-3">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hasCar" defaultChecked={mob?.hasCar ?? true} className="h-4 w-4 accent-accent-500" /> 🚗 Auto
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="publicTransportOk" defaultChecked={mob?.publicTransportOk ?? true} className="h-4 w-4 accent-accent-500" /> 🚆 ÖPNV
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="bikeOk" defaultChecked={mob?.bikeOk ?? false} className="h-4 w-4 accent-accent-500" /> 🚲 Fahrrad
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="strollerRequired" defaultChecked={mob?.strollerRequired ?? false} className="h-4 w-4 accent-accent-500" /> 👶 Kinderwagen
            </label>
          </div>
          <label className="block text-sm text-slate-300">
            Max. Fahrzeit (Min)
            <input
              name="maxTravelMinutes"
              type="number"
              min={5}
              max={180}
              defaultValue={mob?.maxTravelMinutes ?? 45}
              className="input-dark mt-1"
            />
          </label>
          <button className={btn} type="submit">Mobilität speichern</button>
        </form>
      </Card>

      {/* Budget */}
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold text-white">Budget</h2>
        <form action={updateBudgetAction} className="space-y-3">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <label className="block text-sm text-slate-300">
            Max. Gesamtbudget (€, leer = egal)
            <input
              name="maxCostTotal"
              type="number"
              min={0}
              defaultValue={bud?.maxCostTotal ?? ""}
              className="input-dark mt-1"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" name="preferFree" defaultChecked={bud?.preferFree ?? false} className="h-4 w-4 accent-accent-500" /> 💚 Lieber kostenlos
          </label>
          <button className={btn} type="submit">Budget speichern</button>
        </form>
      </Card>

      <Link href={`/recommend/${family.id}`} className="btn-gradient w-full">
        ✨ Vorschläge generieren
      </Link>
    </div>
  );
}
