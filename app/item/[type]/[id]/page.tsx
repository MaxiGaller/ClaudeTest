import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function YesNo({ value, label }: { value: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
      <span>{label}</span>
      <span className={value ? "font-semibold text-green-700" : "text-slate-400"}>
        {value ? "ja" : "nein"}
      </span>
    </div>
  );
}

function formatDate(d: Date | null): string | null {
  if (!d) return null;
  return d.toLocaleString("de-DE", { dateStyle: "full", timeStyle: "short" });
}

/**
 * Detailseite für ein Feed-Item. `type` entscheidet, aus welcher Tabelle geladen
 * wird (Attraktion oder Event); die Tags liegen polymorph in ItemTag.
 */
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

  const isEvent = type === "event";
  const ev = isEvent ? (item as { startsAt: Date | null; endsAt: Date | null }) : null;
  const attr = !isEvent
    ? (item as { difficulty: string | null; lengthKm: number | null; openingHoursText: string | null })
    : null;

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Zurück
      </Link>

      <div>
        <p className="text-xs uppercase tracking-wide text-brand-600">
          {isEvent ? "🗓 Event" : "📍 Ausflugsziel"} · {item.category}
        </p>
        <h1 className="text-2xl font-bold">{item.name}</h1>
      </div>

      <p className="text-sm leading-relaxed text-slate-700">{item.description}</p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-400">Kosten</div>
          <div className="font-medium">
            {item.estimatedCost === 0 ? "kostenlos" : `~${item.estimatedCost} €`}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-400">Dauer</div>
          <div className="font-medium">~{Math.round(item.estimatedDurationMinutes / 60)} Std</div>
        </div>
      </div>

      {isEvent && ev && (ev.startsAt || ev.endsAt) && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <div className="text-xs text-amber-500">Termin</div>
          <div>
            {formatDate(ev.startsAt) ?? "?"}
            {ev.endsAt ? ` – ${ev.endsAt.toLocaleTimeString("de-DE", { timeStyle: "short" })}` : ""}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <YesNo value={item.dogFriendly} label="🐕 Hundetauglich" />
        <YesNo value={item.strollerFriendly} label="👶 Kinderwagentauglich" />
        <YesNo value={item.rainSafe} label="🌧 Regengeeignet" />
        <YesNo value={item.indoor} label="🏠 Indoor" />
        <YesNo value={item.outdoor} label="🌳 Outdoor" />
        <YesNo value={item.foodAvailable} label="🍽 Essen vor Ort" />
      </div>

      {attr && (attr.difficulty || attr.lengthKm != null) && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {attr.difficulty && <span>🥾 {attr.difficulty}</span>}
          {attr.lengthKm != null && <span>📏 ~{attr.lengthKm} km</span>}
        </div>
      )}

      {item.address && (
        <div className="text-sm">
          <div className="text-xs text-slate-400">Adresse</div>
          <div>{item.address}</div>
        </div>
      )}

      {attr?.openingHoursText && (
        <div className="text-sm">
          <div className="text-xs text-slate-400">Öffnungszeiten</div>
          <div>{attr.openingHoursText}</div>
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
            >
              {t.tag}
            </span>
          ))}
        </div>
      )}

      {item.websiteUrl && (
        <a
          href={item.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Zur Website ↗
        </a>
      )}

      {item.source && (
        <p className="text-xs text-slate-400">ℹ Datenhinweis: {item.source}</p>
      )}
    </div>
  );
}
