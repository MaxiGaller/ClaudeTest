/**
 * Kleine, rein präsentationale UI-Bausteine im „FamilienAbenteuer"-Look:
 * dunkles Mitternachtsblau, Blau-/Grün-Akzente, Glas-Karten, Verlaufselemente.
 * Server-Komponenten (keine Interaktivität) – wiederverwendet über alle Seiten.
 */
import type { ReactNode } from "react";

/** Kleines, gesperrtes Uppercase-Label in Pille (z. B. „SMARTE FAMILIENAUSFLÜGE"). */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-accent-400/30 bg-accent-400/[0.06] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-300">
      {children}
    </span>
  );
}

/** Glas-Karte als Standard-Container. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`surface p-5 ${className}`}>{children}</div>;
}

type ChipTone = "slate" | "brand" | "accent";

const chipTones: Record<ChipTone, string> = {
  slate: "border-white/[0.12] bg-white/[0.04] text-slate-300",
  brand: "border-brand-400/30 bg-brand-500/10 text-brand-200",
  accent: "border-accent-400/30 bg-accent-500/10 text-accent-200",
};

/** Rundes Info-Chip (Filter, Stats, Tags). */
export function Chip({
  children,
  tone = "slate",
  className = "",
}: {
  children: ReactNode;
  tone?: ChipTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${chipTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Badge oben rechts an Ergebnis-Karten (z. B. „Event" / „Ausflugsziel"). */
export function Badge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: ChipTone;
}) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${chipTones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Grün getönte „Warum für euch"-Box mit Begründungen. */
export function ReasonBox({
  title = "Warum für euch",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-accent-400/25 bg-accent-500/[0.07] p-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent-300">
        <span>✨</span>
        <span>{title}</span>
      </div>
      <div className="text-sm leading-relaxed text-slate-200">{children}</div>
    </div>
  );
}

// Kategorie -> Emoji-Icon + Tonalität, damit Karten lebendig wirken.
const CATEGORY_ICONS: Record<string, string> = {
  "Tiere & Natur": "🦊",
  "Spielplätze": "🛝",
  "Badeseen": "🏊",
  "Museen kinderfreundlich": "🖼️",
  "Indoor-Spielplätze": "🤸",
  "Spaziergänge mit Hund": "🐕",
  "Bauernhöfe / Erlebnisbauernhöfe": "🚜",
  "Märkte / Flohmärkte": "🛍️",
  "kostenlose Events": "🎉",
  "Restaurants mit Spielplatz": "🍽️",
  "kurze Notfallideen für 1–2 Stunden": "⏱️",
};

export function categoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📍";
}
