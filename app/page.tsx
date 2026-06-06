import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createFamilyAction } from "./actions";
import { Card, Chip, SectionLabel } from "@/components/ui";

export const dynamic = "force-dynamic";

function monthsSince(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  return (now.getFullYear() - birthDate.getFullYear()) * 12 + (now.getMonth() - birthDate.getMonth());
}

function personAvatar(type: string, months: number | null): string {
  if (type === "adult") return "🧑";
  if (months != null && months < 24) return "👶";
  return "🧒";
}

function ageShort(type: string, months: number | null): string {
  if (type === "adult") return "Erw.";
  if (months == null) return "Kind";
  if (months < 24) return "Baby";
  return `${Math.floor(months / 12)}J`;
}

export default async function DashboardPage() {
  const families = await prisma.familyProfile.findMany({
    include: { persons: true, pets: true, mobilityPreset: true, budgetPreset: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="space-y-4 pt-2 text-center">
        <SectionLabel>Smarte Familienausflüge</SectionLabel>
        <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
          Was erleben wir
          <br />
          <span className="text-gradient">heute zusammen?</span>
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-400">
          Personalisierte Vorschläge für jede Person in eurer Familie — von Baby
          bis Oma, passend zu Alter, Hund, Budget, Zeit und Wetter.
        </p>
      </section>

      {/* Familienprofile */}
      <section className="space-y-4">
        {families.length === 0 && (
          <Card className="border-dashed text-center text-sm text-slate-400">
            Noch kein Familienprofil. Legt unten eins an. 👇
          </Card>
        )}

        {families.map((family) => {
          const persons = family.persons.map((p) => ({ ...p, months: monthsSince(p.birthDate) }));
          const kids = persons.filter((p) => p.type === "child");
          const hasBaby = kids.some((p) => p.months != null && p.months < 24);
          const dog = family.pets.find((p) => p.type === "dog");
          const mob = family.mobilityPreset;
          const bud = family.budgetPreset;

          return (
            <Card key={family.id} className="space-y-4">
              {/* Kopf */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-2xl">
                    👪
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">{family.name}</h2>
                    <p className="text-sm text-slate-400">
                      {family.persons.length} Personen
                      {family.homeLocationName ? ` · ${family.homeLocationName.split(",")[0]}` : ""}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/profile/${family.id}`}
                  aria-label="Profil bearbeiten"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.12] bg-white/[0.04] text-slate-300 transition hover:border-white/25 hover:bg-white/[0.08]"
                >
                  ✏️
                </Link>
              </div>

              {/* Personen */}
              {persons.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {persons.slice(0, 8).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center"
                    >
                      <div className="text-2xl">{personAvatar(p.type, p.months)}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{ageShort(p.type, p.months)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Status */}
              <div className="space-y-2">
                {hasBaby && (
                  <div className="rounded-xl border border-accent-400/25 bg-accent-500/[0.07] px-3.5 py-2.5 text-sm font-medium text-accent-200">
                    👶 Baby-Modus aktiv — alle Vorschläge babygeeignet
                  </div>
                )}
                {dog && (
                  <div className="rounded-xl border border-brand-400/25 bg-brand-500/[0.07] px-3.5 py-2.5 text-sm font-medium text-brand-200">
                    🐾 {dog.name} wird berücksichtigt
                  </div>
                )}
              </div>

              {/* Filter-Chips */}
              <div className="flex flex-wrap gap-2">
                {mob?.hasCar && <Chip>🚗 Auto</Chip>}
                {mob?.publicTransportOk && <Chip>🚆 ÖPNV</Chip>}
                <Chip>💶 {bud?.maxCostTotal != null ? `bis ${bud.maxCostTotal}€` : "egal"}</Chip>
                <Chip>🕐 bis {mob?.maxTravelMinutes ?? 45} Min</Chip>
              </div>

              {/* CTA */}
              <Link href={`/recommend/${family.id}`} className="btn-gradient w-full">
                ✨ Vorschläge generieren
              </Link>
            </Card>
          );
        })}
      </section>

      {/* Neues Profil */}
      <section>
        <Card>
          <h2 className="font-display text-lg font-bold text-white">Neue Familie hinzufügen</h2>
          <form action={createFamilyAction} className="mt-3 space-y-2.5">
            <input name="name" placeholder="Name (z. B. Familie Schmidt)" className="input-dark" required />
            <input name="homeLocationName" placeholder="Wohnort (z. B. München)" className="input-dark" />
            <button type="submit" className="btn-ghost w-full">
              Profil anlegen
            </button>
          </form>
        </Card>
      </section>
    </div>
  );
}
