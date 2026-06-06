import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildAffiliateLink } from "@/lib/affiliate";
import { Card, Chip, categoryIcon } from "@/components/ui";

export const dynamic = "force-dynamic";

function Feature({ value, label }: { value: boolean; label: string }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${
        value
          ? "border-accent-400/25 bg-accent-500/[0.07] text-slate-100"
          : "border-white/[0.08] bg-white/[0.02] text-slate-500"
      }`}
    >
      <span>{label}</span>
      <span className={value ? "font-semibold text-accent-300" : "text-slate-600"}>
        {value ? "✓" : "–"}
      </span>
    </div>
  );
}

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleString("de-DE", { dateStyle: "full", timeStyle: "short" });
}

export default async function ItemDetailPage({
  params,
}: {
  params: { type: string; id: string };
}) {
  const type = params.type === "event" ? "event" : "attraction";

  const item =
    type === "event"
      ? await prisma.event.findUnique({ where: { id: params.id } })
      : await prisma.attraction.findUnique({ where: { id: params.id } });
  if (!item) notFound();

  const tags = await prisma.itemTag.findMany({
    where: { itemType: type, itemId: params.id },
  });

  // Ticket-/Affiliate-Link aus der rohen Ticketshop-URL bauen (falls vorhanden).
  const ticket = buildAffiliateLink(item.ticketUrl);

  const isEvent = type === "event";
  const ev = isEvent ? (item as { startsAt: Date | null; endsAt: Date | null }) : null;
  const attr = !isEvent
    ? (item as { difficulty: string | null; lengthKm: number | null; openingHoursText: string | null })
    : null;

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-slate-400 transition hover:text-slate-200">
        ← Zurück
      </Link>

      {/* Kopf */}
      <div className="flex items-start gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent-400/20 to-brand-400/20 text-3xl">
          {categoryIcon(item.category)}
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-accent-300">
            {isEvent ? "🗓 Event" : "📍 Ausflugsziel"} · {item.category}
          </p>
          <h1 className="font-display text-2xl font-bold leading-tight text-white">{item.name}</h1>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-300">{item.description}</p>

      {/* Eckdaten */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="!p-3.5">
          <div className="text-xs text-slate-400">Kosten</div>
          <div className="font-display text-lg font-bold text-white">
            {item.estimatedCost === 0 ? "kostenlos" : `~${item.estimatedCost} €`}
          </div>
        </Card>
        <Card className="!p-3.5">
          <div className="text-xs text-slate-400">Dauer</div>
          <div className="font-display text-lg font-bold text-white">
            ~{Math.round(item.estimatedDurationMinutes / 60)} Std
          </div>
        </Card>
      </div>

      {isEvent && ev && (ev.startsAt || ev.endsAt) && (
        <div className="rounded-xl border border-accent-400/25 bg-accent-500/[0.07] px-3.5 py-2.5 text-sm text-accent-100">
          <div className="text-xs uppercase tracking-wide text-accent-300">Termin</div>
          <div>
            {formatDate(ev.startsAt) ?? "?"}
            {ev.endsAt ? ` – ${ev.endsAt.toLocaleTimeString("de-DE", { timeStyle: "short" })}` : ""}
          </div>
        </div>
      )}

      {/* Eignung */}
      <div className="grid grid-cols-2 gap-2">
        <Feature value={item.dogFriendly} label="🐕 Hundetauglich" />
        <Feature value={item.strollerFriendly} label="👶 Kinderwagen" />
        <Feature value={item.rainSafe} label="🌧 Regengeeignet" />
        <Feature value={item.indoor} label="🏠 Indoor" />
        <Feature value={item.outdoor} label="🌳 Outdoor" />
        <Feature value={item.foodAvailable} label="🍽 Essen vor Ort" />
      </div>

      {attr && (attr.difficulty || attr.lengthKm != null) && (
        <div className="flex flex-wrap gap-2">
          {attr.difficulty && <Chip tone="accent">🥾 {attr.difficulty}</Chip>}
          {attr.lengthKm != null && <Chip tone="accent">📏 ~{attr.lengthKm} km</Chip>}
        </div>
      )}

      {item.address && (
        <div className="text-sm">
          <div className="text-xs text-slate-400">Adresse</div>
          <div className="text-slate-200">{item.address}</div>
        </div>
      )}

      {attr?.openingHoursText && (
        <div className="text-sm">
          <div className="text-xs text-slate-400">Öffnungszeiten</div>
          <div className="text-slate-200">{attr.openingHoursText}</div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Chip key={t.id} tone="brand">
              {t.tag}
            </Chip>
          ))}
        </div>
      )}

      {/* Aktionen */}
      <div className="space-y-2.5 pt-1">
        {ticket && (
          <div className="space-y-1.5">
            <a href={ticket.url} target="_blank" rel="sponsored noopener noreferrer" className="btn-gradient w-full">
              🎟 Tickets kaufen{ticket.network ? ` bei ${ticket.network.label}` : ""} ↗
            </a>
            {ticket.isAffiliate && (
              <p className="text-center text-xs text-slate-500">
                Anzeige · Affiliate-Link – beim Kauf erhalten wir ggf. eine Provision, für euch ohne Mehrkosten.
              </p>
            )}
          </div>
        )}

        {item.websiteUrl && (
          <a href={item.websiteUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full">
            Zur Website ↗
          </a>
        )}
      </div>

      {item.source && (
        <p className="text-xs text-slate-500">ℹ Datenhinweis: {item.source}</p>
      )}
    </div>
  );
}
