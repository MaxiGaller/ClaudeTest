/**
 * Anreicherung roher Events zu klassifizierten Aktivitäten.
 *
 * Zwei Wege mit identischer Ausgabe:
 *  - ruleBasedClassify: deterministisch, ohne Netzwerk. Fallback + Testanker.
 *  - aiClassify: EIN zentraler, gebündelter Claude-Aufruf pro Lauf (Structured
 *    Output). Wird nur genutzt, wenn ANTHROPIC_API_KEY gesetzt ist; bei Fehler
 *    fällt der Orchestrator auf die regelbasierte Variante zurück.
 *
 * Wichtig: KI wird ausschließlich hier (im Tagesjob) verwendet – niemals im
 * Nutzerpfad. Das Scoring bleibt deterministisch.
 */
import type { ClassifiedItem, RawItem } from "./types";

const RULE_PROVENANCE = "regelbasiert klassifiziert – Daten ungeprüft";

interface Acc {
  category: string;
  tags: Set<string>;
  estimatedCost: number | null;
  estimatedDurationMinutes: number;
  minChildAgeMonths: number;
  maxChildAgeMonths: number;
  dogFriendly: boolean;
  strollerFriendly: boolean;
  rainSafe: boolean;
  indoor: boolean;
  outdoor: boolean;
  foodAvailable: boolean;
}

interface Rule {
  match: RegExp;
  apply: (a: Acc) => void;
}

// Reihenfolge: spezifische Kategorien zuerst. Mehrere Regeln dürfen greifen.
const RULES: Rule[] = [
  {
    match: /\b(zoo|tierpark|wildpark|tiere?)\b/i,
    apply: (a) => {
      a.category = "Tiere & Natur";
      a.tags.add("animals");
      a.outdoor = true;
    },
  },
  {
    match: /\b(badesee|freibad|baden|schwimm\w*|see|strand)\b/i,
    apply: (a) => {
      a.category = "Badeseen";
      a.tags.add("water");
      a.outdoor = true;
    },
  },
  {
    match: /\b(indoor|spielhalle|hallenspielplatz|kletterhalle|trampolin)\b/i,
    apply: (a) => {
      a.category = "Indoor-Spielplätze";
      a.tags.add("playground");
      a.tags.add("action");
      a.indoor = true;
      a.rainSafe = true;
    },
  },
  {
    match: /\b(spielplatz|spielpark|abenteuerspielplatz)\b/i,
    apply: (a) => {
      a.category = "Spielplätze";
      a.tags.add("playground");
      a.tags.add("action");
      a.outdoor = true;
    },
  },
  {
    match: /\b(museum|ausstellung|galerie|kinderreich)\b/i,
    apply: (a) => {
      a.category = "Museen kinderfreundlich";
      a.tags.add("culture");
      a.indoor = true;
      a.rainSafe = true;
    },
  },
  {
    match: /\b(bauernhof|erlebnishof|hofladen|hof)\b/i,
    apply: (a) => {
      a.category = "Bauernhöfe / Erlebnisbauernhöfe";
      a.tags.add("animals");
      a.outdoor = true;
    },
  },
  {
    match: /\b(flohmarkt|trödel\w*|markt|basar)\b/i,
    apply: (a) => {
      a.category = "Märkte / Flohmärkte";
      a.tags.add("market");
      a.outdoor = true;
    },
  },
  {
    match: /\b(biergarten|restaurant|café|cafe|gasthaus|wirtshaus)\b/i,
    apply: (a) => {
      a.category = "Restaurants mit Spielplatz";
      a.tags.add("restaurant");
      a.foodAvailable = true;
      a.tags.add("food_available");
    },
  },
  {
    match: /\b(spaziergang|wald|wanderung|wandern|naturpark|park)\b/i,
    apply: (a) => {
      if (a.category === "") a.category = "Spaziergänge mit Hund";
      a.outdoor = true;
      a.tags.add("quiet");
    },
  },
  {
    match: /\b(konzert|theater|fest|festival|aufführung|bühne)\b/i,
    apply: (a) => {
      if (a.category === "") a.category = "kostenlose Events";
      a.tags.add("culture");
      a.tags.add("high_entertainment");
    },
  },
  // Querschnitts-Flags
  { match: /\bhund\w*\b/i, apply: (a) => { a.dogFriendly = true; a.tags.add("dog_friendly"); } },
  {
    match: /\b(kostenlos|gratis|umsonst|eintritt frei|freier eintritt)\b/i,
    apply: (a) => { a.estimatedCost = 0; },
  },
  {
    match: /\b(baby|säugling|krabbel\w*)\b/i,
    apply: (a) => { a.tags.add("baby_friendly"); a.tags.add("nap_compatible"); },
  },
  {
    match: /\b(kleinkind\w*|kinder|familie\w*)\b/i,
    apply: (a) => { a.tags.add("toddler_friendly"); },
  },
  {
    match: /\b(action|toben|abenteuer|klettern)\b/i,
    apply: (a) => { a.tags.add("action"); a.tags.add("high_entertainment"); },
  },
  {
    match: /\b(ruhig|entspann\w*|erholung)\b/i,
    apply: (a) => { a.tags.add("quiet"); a.tags.add("nap_compatible"); },
  },
  {
    match: /\b(essen|imbiss|kiosk|verpflegung|kulinarisch)\b/i,
    apply: (a) => { a.foodAvailable = true; a.tags.add("food_available"); },
  },
];

/** Deterministische, netzwerkfreie Klassifikation eines Items. */
export function ruleBasedClassify(raw: RawItem): ClassifiedItem {
  const haystack = [raw.name, raw.description, raw.categoryHint ?? ""].join(" ").toLowerCase();

  const acc: Acc = {
    category: "",
    tags: new Set<string>(),
    estimatedCost: raw.estimatedCost ?? null,
    estimatedDurationMinutes: 120,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: false,
    strollerFriendly: true, // Default kinderwagenfreundlich, außer es spricht etwas dagegen
    rainSafe: false,
    indoor: false,
    outdoor: false,
    foodAvailable: false,
  };

  for (const rule of RULES) {
    if (rule.match.test(haystack)) rule.apply(acc);
  }

  // Defaults nachziehen
  if (acc.category === "") acc.category = raw.categoryHint || "kostenlose Events";
  if (!acc.indoor && !acc.outdoor) acc.outdoor = true;
  if (/\b(kletter\w*|wanderung|wandern|gelände)\b/i.test(haystack)) acc.strollerFriendly = false;

  const estimatedCost = acc.estimatedCost ?? 10; // unbekannt -> grob, als low_budget markiert
  if (estimatedCost === 0) {
    acc.tags.add("free");
    acc.tags.add("low_budget");
  } else if (estimatedCost <= 20) {
    acc.tags.add("low_budget");
  }
  if (acc.strollerFriendly) acc.tags.add("stroller_friendly");
  if (acc.outdoor) acc.tags.add("outdoor");
  if (acc.indoor) acc.tags.add("indoor");
  if (acc.rainSafe) acc.tags.add("rain_safe");

  return {
    externalId: raw.externalId,
    name: raw.name,
    description: raw.description,
    category: acc.category,
    estimatedCost,
    estimatedDurationMinutes: acc.estimatedDurationMinutes,
    minChildAgeMonths: acc.minChildAgeMonths,
    maxChildAgeMonths: acc.maxChildAgeMonths,
    dogFriendly: acc.dogFriendly,
    strollerFriendly: acc.strollerFriendly,
    rainSafe: acc.rainSafe,
    indoor: acc.indoor,
    outdoor: acc.outdoor,
    foodAvailable: acc.foodAvailable,
    tags: [...acc.tags],
    address: raw.address,
    latitude: raw.latitude,
    longitude: raw.longitude,
    startsAt: raw.startsAt,
    endsAt: raw.endsAt,
    sourceUrl: raw.sourceUrl,
    difficulty: raw.difficulty,
    lengthKm: raw.lengthKm,
    provenance: RULE_PROVENANCE,
  };
}

export function ruleBasedClassifyMany(raws: RawItem[]): ClassifiedItem[] {
  return raws.map(ruleBasedClassify);
}
