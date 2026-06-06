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

export default async function ActivityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const activity = await prisma.activity.findUnique({
    where: { id: params.id },
    include: { tags: true },
  });
  if (!activity) notFound();

  return (
    <div className="space-y-5">
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        ← Zurück
      </Link>

      <div>
        <p className="text-xs uppercase tracking-wide text-brand-600">
          {activity.category}
        </p>
        <h1 className="text-2xl font-bold">{activity.name}</h1>
      </div>

      <p className="text-sm leading-relaxed text-slate-700">{activity.description}</p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-400">Kosten</div>
          <div className="font-medium">
            {activity.estimatedCost === 0 ? "kostenlos" : `~${activity.estimatedCost} €`}
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="text-xs text-slate-400">Dauer</div>
          <div className="font-medium">~{Math.round(activity.estimatedDurationMinutes / 60)} Std</div>
        </div>
      </div>

      <div className="space-y-1.5">
        <YesNo value={activity.dogFriendly} label="🐕 Hundetauglich" />
        <YesNo value={activity.strollerFriendly} label="👶 Kinderwagentauglich" />
        <YesNo value={activity.rainSafe} label="🌧 Regengeeignet" />
        <YesNo value={activity.indoor} label="🏠 Indoor" />
        <YesNo value={activity.outdoor} label="🌳 Outdoor" />
        <YesNo value={activity.foodAvailable} label="🍽 Essen vor Ort" />
      </div>

      {activity.address && (
        <div className="text-sm">
          <div className="text-xs text-slate-400">Adresse</div>
          <div>{activity.address}</div>
        </div>
      )}

      {activity.openingHoursText && (
        <div className="text-sm">
          <div className="text-xs text-slate-400">Öffnungszeiten</div>
          <div>{activity.openingHoursText}</div>
        </div>
      )}

      {activity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activity.tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
            >
              {t.tag}
            </span>
          ))}
        </div>
      )}

      {activity.websiteUrl && (
        <a
          href={activity.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Zur Website ↗
        </a>
      )}

      {activity.source && (
        <p className="text-xs text-slate-400">
          ℹ Datenhinweis: {activity.source}
        </p>
      )}
    </div>
  );
}
