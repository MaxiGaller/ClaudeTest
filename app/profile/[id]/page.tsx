import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  addPersonAction,
  addPetAction,
  deletePersonAction,
  deletePetAction,
  updateBudgetAction,
  updateMobilityAction,
} from "@/app/actions";

export const dynamic = "force-dynamic";

const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3";
const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const btn = "rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700";

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
    include: {
      persons: true,
      pets: true,
      mobilityPreset: true,
      budgetPreset: true,
    },
  });
  if (!family) notFound();

  const mob = family.mobilityPreset;
  const bud = family.budgetPreset;

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← Zurück
        </Link>
        <h1 className="mt-1 text-xl font-bold">{family.name}</h1>
        {family.homeLocationName && (
          <p className="text-sm text-slate-500">📍 {family.homeLocationName}</p>
        )}
      </div>

      {/* Personen */}
      <section className={card}>
        <h2 className="font-semibold">Personen im Haushalt</h2>
        <ul className="space-y-1">
          {family.persons.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span>
                {p.name}{" "}
                <span className="text-slate-400">
                  ({p.type === "child" ? "Kind" : "Erwachsen"}
                  {p.type === "child" && p.birthDate ? `, ${ageLabel(p.birthDate)}` : ""})
                </span>
              </span>
              <form action={deletePersonAction}>
                <input type="hidden" name="familyProfileId" value={family.id} />
                <input type="hidden" name="personId" value={p.id} />
                <button className="text-xs text-red-500 hover:underline">entfernen</button>
              </form>
            </li>
          ))}
          {family.persons.length === 0 && (
            <li className="text-sm text-slate-400">Noch keine Personen.</li>
          )}
        </ul>
        <form action={addPersonAction} className="flex flex-wrap gap-2 pt-2">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <input name="name" placeholder="Name" className={`${field} flex-1`} required />
          <select name="type" className={field} defaultValue="child">
            <option value="adult">Erwachsen</option>
            <option value="child">Kind</option>
          </select>
          <input
            name="birthDate"
            type="date"
            className={field}
            title="Geburtsdatum (nur bei Kindern)"
          />
          <button className={btn} type="submit">+ Person</button>
        </form>
      </section>

      {/* Haustiere */}
      <section className={card}>
        <h2 className="font-semibold">Haustiere</h2>
        <ul className="space-y-1">
          {family.pets.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <span>
                {p.name}{" "}
                <span className="text-slate-400">
                  ({p.type}
                  {p.mustJoinDefault ? ", muss meist mit" : ""})
                </span>
              </span>
              <form action={deletePetAction}>
                <input type="hidden" name="familyProfileId" value={family.id} />
                <input type="hidden" name="petId" value={p.id} />
                <button className="text-xs text-red-500 hover:underline">entfernen</button>
              </form>
            </li>
          ))}
          {family.pets.length === 0 && (
            <li className="text-sm text-slate-400">Keine Haustiere.</li>
          )}
        </ul>
        <form action={addPetAction} className="flex flex-wrap items-center gap-2 pt-2">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <input name="name" placeholder="Name" className={`${field} flex-1`} required />
          <select name="type" className={field} defaultValue="dog">
            <option value="dog">Hund</option>
            <option value="cat">Katze</option>
            <option value="other">Andere</option>
          </select>
          <label className="flex items-center gap-1 text-xs">
            <input type="checkbox" name="mustJoinDefault" /> muss mit
          </label>
          <button className={btn} type="submit">+ Tier</button>
        </form>
      </section>

      {/* Mobilität */}
      <section className={card}>
        <h2 className="font-semibold">Mobilität</h2>
        <form action={updateMobilityAction} className="space-y-2">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="hasCar" defaultChecked={mob?.hasCar ?? true} /> Auto
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="publicTransportOk" defaultChecked={mob?.publicTransportOk ?? true} /> ÖPNV
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="bikeOk" defaultChecked={mob?.bikeOk ?? false} /> Fahrrad
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="strollerRequired" defaultChecked={mob?.strollerRequired ?? false} /> Kinderwagen nötig
            </label>
          </div>
          <label className="block text-sm">
            Max. Fahrzeit (Min)
            <input
              name="maxTravelMinutes"
              type="number"
              min={5}
              max={180}
              defaultValue={mob?.maxTravelMinutes ?? 45}
              className={field}
            />
          </label>
          <button className={btn} type="submit">Mobilität speichern</button>
        </form>
      </section>

      {/* Budget */}
      <section className={card}>
        <h2 className="font-semibold">Budget</h2>
        <form action={updateBudgetAction} className="space-y-2">
          <input type="hidden" name="familyProfileId" value={family.id} />
          <label className="block text-sm">
            Max. Gesamtbudget (€, leer = egal)
            <input
              name="maxCostTotal"
              type="number"
              min={0}
              defaultValue={bud?.maxCostTotal ?? ""}
              className={field}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="preferFree" defaultChecked={bud?.preferFree ?? false} /> Lieber kostenlos
          </label>
          <button className={btn} type="submit">Budget speichern</button>
        </form>
      </section>

      <Link
        href={`/recommend/${family.id}`}
        className="block rounded-lg bg-brand-600 px-4 py-3 text-center font-semibold text-white hover:bg-brand-700"
      >
        Was können wir heute machen?
      </Link>
    </div>
  );
}
