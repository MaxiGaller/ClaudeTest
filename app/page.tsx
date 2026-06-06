import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createFamilyAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const families = await prisma.familyProfile.findMany({
    include: { persons: true, pets: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Was passt heute zu eurer Familie?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Wählt euer Profil und bekommt konkrete Ideen – passend zu Alter,
          Hund, Budget, Zeit und Wetter.
        </p>
      </section>

      <section className="space-y-3">
        {families.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            Noch kein Familienprofil. Legt unten eins an.
          </p>
        )}

        {families.map((family) => {
          const kids = family.persons.filter((p) => p.type === "child").length;
          const adults = family.persons.filter((p) => p.type === "adult").length;
          return (
            <div
              key={family.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{family.name}</h2>
                  <p className="text-sm text-slate-500">
                    {adults} Erw. · {kids} Kind(er)
                    {family.pets.length > 0 && ` · ${family.pets.length} Haustier(e)`}
                  </p>
                  {family.homeLocationName && (
                    <p className="text-xs text-slate-400">📍 {family.homeLocationName}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/recommend/${family.id}`}
                  className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Was können wir heute machen?
                </Link>
                <Link
                  href={`/profile/${family.id}`}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium hover:bg-slate-50"
                >
                  Profil
                </Link>
              </div>
            </div>
          );
        })}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-700">Neues Familienprofil</h2>
        <form action={createFamilyAction} className="mt-3 space-y-2">
          <input
            name="name"
            placeholder="Name (z. B. Familie Schmidt)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            required
          />
          <input
            name="homeLocationName"
            placeholder="Wohnort (z. B. München)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Profil anlegen
          </button>
        </form>
      </section>
    </div>
  );
}
