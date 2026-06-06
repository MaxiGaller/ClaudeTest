/**
 * Seed-Daten für das MVP – Region München / Südbayern.
 *
 * Zwei Inhaltstabellen:
 *   - Attraction: dauerhafte Ausflugsziele (evergreen)
 *   - Event:      zeitbegrenzte Veranstaltungen (Beispiel-Termine)
 * Tags liegen polymorph in ItemTag (itemType + itemId).
 *
 * Hinweis: Preise und Öffnungszeiten sind grobe Platzhalter und KEINE harte
 * Wahrheit. Vor echter Nutzung verifizieren. Das Feld `source` markiert die
 * Datenherkunft/Unsicherheit.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_SOURCE = "seed-placeholder: Preise/Öffnungszeiten ungeprüft";
const REGION = "muenchen";

interface AttractionSeed {
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  estimatedCost: number;
  estimatedDurationMinutes: number;
  minChildAgeMonths: number;
  maxChildAgeMonths: number;
  dogFriendly: boolean;
  strollerFriendly: boolean;
  rainSafe: boolean;
  indoor: boolean;
  outdoor: boolean;
  foodAvailable: boolean;
  openingHoursText: string | null;
  websiteUrl: string | null;
  ticketUrl?: string;
  difficulty?: string;
  lengthKm?: number;
  tags: string[];
}

interface EventSeed {
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  estimatedCost: number;
  estimatedDurationMinutes: number;
  minChildAgeMonths: number;
  maxChildAgeMonths: number;
  dogFriendly: boolean;
  strollerFriendly: boolean;
  rainSafe: boolean;
  indoor: boolean;
  outdoor: boolean;
  foodAvailable: boolean;
  websiteUrl: string | null;
  ticketUrl?: string;
  startsAt: Date;
  endsAt: Date;
  tags: string[];
}

const attractions: AttractionSeed[] = [
  {
    name: "Tierpark Hellabrunn",
    description:
      "Großer Münchner Zoo an der Isar. Viele Tiere, weitläufiges Gelände, gut für einen halben bis ganzen Tag.",
    category: "Tiere & Natur",
    address: "Tierparkstraße 30, 81543 München",
    latitude: 48.0998,
    longitude: 11.5556,
    estimatedCost: 40,
    estimatedDurationMinutes: 300,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: false,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: true,
    openingHoursText: "ca. 9–18 Uhr (saisonabhängig, bitte prüfen)",
    websiteUrl: "https://www.hellabrunn.de",
    ticketUrl: "https://www.getyourguide.de/muenchen-l34/tierpark-hellabrunn-t000",
    tags: ["animals", "stroller_friendly", "outdoor", "food_available", "toddler_friendly", "baby_friendly", "high_entertainment"],
  },
  {
    name: "Wildpark Poing",
    description:
      "Wildpark östlich von München mit freilaufendem Damwild, Greifvogelschau und großem Abenteuerspielplatz.",
    category: "Tiere & Natur",
    address: "Osterfeldweg 20, 85586 Poing",
    latitude: 48.1707,
    longitude: 11.8076,
    estimatedCost: 30,
    estimatedDurationMinutes: 240,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: true,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: true,
    openingHoursText: "ca. 9–17 Uhr (bitte prüfen)",
    websiteUrl: "https://www.wildpark-poing.de",
    ticketUrl: "https://www.getyourguide.de/poing-l00/wildpark-poing-t000",
    tags: ["animals", "dog_friendly", "stroller_friendly", "outdoor", "playground", "food_available", "toddler_friendly", "high_entertainment", "requires_car"],
  },
  {
    name: "Spaziergang Forstenrieder Park",
    description:
      "Großes Waldgebiet im Münchner Süden. Ruhige Wege, ideal für einen entspannten Spaziergang mit Hund.",
    category: "Spaziergänge mit Hund",
    address: "Forstenrieder Park, München",
    latitude: 48.0556,
    longitude: 11.4719,
    estimatedCost: 0,
    estimatedDurationMinutes: 90,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: true,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: false,
    openingHoursText: "jederzeit zugänglich",
    websiteUrl: null,
    difficulty: "easy",
    lengthKm: 4,
    tags: ["dog_friendly", "stroller_friendly", "outdoor", "free", "quiet", "nap_compatible", "baby_friendly"],
  },
  {
    name: "Spielplatz im Westpark",
    description:
      "Mehrere Spielplätze in einem schönen Landschaftspark. Wiesen, Seen und genug Platz zum Toben.",
    category: "Spielplätze",
    address: "Westpark, 81373 München",
    latitude: 48.1219,
    longitude: 11.5219,
    estimatedCost: 0,
    estimatedDurationMinutes: 120,
    minChildAgeMonths: 6,
    maxChildAgeMonths: 144,
    dogFriendly: true,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: true,
    openingHoursText: "jederzeit zugänglich",
    websiteUrl: null,
    tags: ["playground", "free", "outdoor", "dog_friendly", "stroller_friendly", "toddler_friendly", "food_available", "action"],
  },
  {
    name: "Erlebnisbauernhof / Hofladen-Ausflug",
    description:
      "Familienfreundlicher Bauernhof im Umland mit Tieren zum Anschauen und Hofladen. Gut für kleine Kinder.",
    category: "Bauernhöfe / Erlebnisbauernhöfe",
    address: "Umland München (Platzhalter-Adresse)",
    latitude: 48.22,
    longitude: 11.7,
    estimatedCost: 10,
    estimatedDurationMinutes: 150,
    minChildAgeMonths: 6,
    maxChildAgeMonths: 144,
    dogFriendly: false,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: true,
    openingHoursText: "variiert je nach Hof (bitte prüfen)",
    websiteUrl: null,
    tags: ["animals", "low_budget", "outdoor", "stroller_friendly", "toddler_friendly", "food_available", "requires_car"],
  },
  {
    name: "Deutsches Museum – Kinderreich",
    description:
      "Großer Mitmach-Bereich für kleine Kinder im Deutschen Museum. Drinnen, daher wetterunabhängig.",
    category: "Museen kinderfreundlich",
    address: "Museumsinsel 1, 80538 München",
    latitude: 48.1298,
    longitude: 11.5832,
    estimatedCost: 30,
    estimatedDurationMinutes: 180,
    minChildAgeMonths: 36,
    maxChildAgeMonths: 96,
    dogFriendly: false,
    strollerFriendly: true,
    rainSafe: true,
    indoor: true,
    outdoor: false,
    foodAvailable: true,
    openingHoursText: "ca. 9–17 Uhr (bitte prüfen)",
    websiteUrl: "https://www.deutsches-museum.de",
    ticketUrl: "https://www.tiqets.com/de/muenchen-attraktionen-c000/deutsches-museum-p000",
    tags: ["culture", "indoor", "rain_safe", "stroller_friendly", "toddler_friendly", "food_available", "high_entertainment"],
  },
  {
    name: "Indoor-Spielplatz",
    description:
      "Großer überdachter Indoor-Spielplatz mit Klettergerüsten, Rutschen und Bällebad. Perfekt bei Regen.",
    category: "Indoor-Spielplätze",
    address: "Großraum München (Platzhalter-Adresse)",
    latitude: 48.18,
    longitude: 11.61,
    estimatedCost: 25,
    estimatedDurationMinutes: 180,
    minChildAgeMonths: 12,
    maxChildAgeMonths: 144,
    dogFriendly: false,
    strollerFriendly: true,
    rainSafe: true,
    indoor: true,
    outdoor: false,
    foodAvailable: true,
    openingHoursText: "ca. 10–19 Uhr (bitte prüfen)",
    websiteUrl: null,
    ticketUrl: "https://www.regiondo.de/indoor-spielplatz-muenchen-000",
    tags: ["playground", "indoor", "rain_safe", "stroller_friendly", "toddler_friendly", "food_available", "action", "high_entertainment"],
  },
  {
    name: "Badesee Unterföhring (Feringasee)",
    description:
      "Beliebter Badesee nördlich von München mit Liegewiesen. Im Sommer schöne Abkühlung für die ganze Familie.",
    category: "Badeseen",
    address: "Feringasee, 85774 Unterföhring",
    latitude: 48.1969,
    longitude: 11.6606,
    estimatedCost: 0,
    estimatedDurationMinutes: 240,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: false,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: false,
    openingHoursText: "jederzeit zugänglich (Saison Sommer)",
    websiteUrl: null,
    tags: ["water", "free", "outdoor", "stroller_friendly", "toddler_friendly", "baby_friendly", "nap_compatible"],
  },
  {
    name: "Biergarten mit Spielplatz (z. B. Hirschgarten)",
    description:
      "Klassischer Münchner Biergarten mit großem Spielplatz nebenan. Eltern entspannen, Kinder spielen.",
    category: "Restaurants mit Spielplatz",
    address: "Hirschgarten 1, 80639 München",
    latitude: 48.1486,
    longitude: 11.5181,
    estimatedCost: 20,
    estimatedDurationMinutes: 150,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: true,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: true,
    openingHoursText: "ca. 11–23 Uhr (saison-/wetterabhängig)",
    websiteUrl: null,
    tags: ["restaurant", "playground", "dog_friendly", "stroller_friendly", "outdoor", "food_available", "low_budget", "toddler_friendly"],
  },
  {
    name: "Notfallidee: Eckspielplatz um die Ecke",
    description:
      "Kurze Idee für 1–2 Stunden, wenn die Zeit knapp ist: der nächste Spielplatz im Viertel.",
    category: "kurze Notfallideen für 1–2 Stunden",
    address: "wohnortnah (Platzhalter)",
    latitude: 48.1351,
    longitude: 11.582,
    estimatedCost: 0,
    estimatedDurationMinutes: 60,
    minChildAgeMonths: 6,
    maxChildAgeMonths: 144,
    dogFriendly: true,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: false,
    openingHoursText: "jederzeit zugänglich",
    websiteUrl: null,
    tags: ["playground", "free", "outdoor", "dog_friendly", "stroller_friendly", "toddler_friendly", "action"],
  },
];

// Beispiel-Events mit Terminen relativ zu heute, damit sie im Feed aktiv sind.
function inDays(days: number, hour: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

const events: EventSeed[] = [
  {
    name: "Flohmarkt am Riem",
    description:
      "Großer Wochenend-Flohmarkt zum Stöbern und Schlendern. Draußen, hundefreundlich, kostenloser Eintritt.",
    category: "Märkte / Flohmärkte",
    address: "Am Messesee, 81829 München",
    latitude: 48.14,
    longitude: 11.56,
    estimatedCost: 0,
    estimatedDurationMinutes: 120,
    minChildAgeMonths: 0,
    maxChildAgeMonths: 216,
    dogFriendly: true,
    strollerFriendly: true,
    rainSafe: false,
    indoor: false,
    outdoor: true,
    foodAvailable: true,
    websiteUrl: null,
    startsAt: inDays(5, 8),
    endsAt: inDays(5, 14),
    tags: ["market", "free", "outdoor", "dog_friendly", "stroller_friendly", "food_available", "quiet"],
  },
  {
    name: "Zirkus-Gastspiel für Familien",
    description:
      "Buntes Zirkusprogramm mit Akrobatik und Clowns – drinnen im Zelt, daher auch bei Regen ein Erlebnis. Für Kinder ab 3 Jahren.",
    category: "kostenlose Events",
    address: "Festplatz, München",
    latitude: 48.131,
    longitude: 11.55,
    estimatedCost: 22,
    estimatedDurationMinutes: 120,
    minChildAgeMonths: 36,
    maxChildAgeMonths: 180,
    dogFriendly: false,
    strollerFriendly: true,
    rainSafe: true,
    indoor: true,
    outdoor: false,
    foodAvailable: true,
    websiteUrl: null,
    ticketUrl: "https://www.eventim.de/event/zirkus-gastspiel-muenchen-000",
    startsAt: inDays(9, 15),
    endsAt: inDays(9, 17),
    tags: ["culture", "high_entertainment", "indoor", "rain_safe", "stroller_friendly", "toddler_friendly", "food_available"],
  },
];

async function main() {
  console.log("Seeding…");

  // Idempotent: vorhandene Inhalte/Tags zurücksetzen.
  await prisma.itemTag.deleteMany();
  await prisma.attraction.deleteMany();
  await prisma.event.deleteMany();

  for (const a of attractions) {
    const { tags, ...data } = a;
    const created = await prisma.attraction.create({
      data: { ...data, region: REGION, source: SEED_SOURCE, sourceName: "seed", externalId: a.name },
    });
    if (tags.length > 0) {
      await prisma.itemTag.createMany({
        data: tags.map((tag) => ({ itemType: "attraction" as const, itemId: created.id, tag })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`  ${attractions.length} Attraktionen angelegt.`);

  for (const e of events) {
    const { tags, ...data } = e;
    const created = await prisma.event.create({
      data: {
        ...data,
        region: REGION,
        source: SEED_SOURCE,
        sourceName: "seed",
        externalId: e.name,
        validUntil: e.endsAt,
      },
    });
    if (tags.length > 0) {
      await prisma.itemTag.createMany({
        data: tags.map((tag) => ({ itemType: "event" as const, itemId: created.id, tag })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`  ${events.length} Events angelegt.`);

  // Demo-User + Familienprofil (idempotent über email/upsert).
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", name: "Demo-Familie" },
  });

  const existingFamily = await prisma.familyProfile.findFirst({
    where: { userId: user.id, name: "Familie Mustermann" },
  });

  if (!existingFamily) {
    const family = await prisma.familyProfile.create({
      data: {
        userId: user.id,
        name: "Familie Mustermann",
        homeLocationName: "München, Marienplatz",
        homeLatitude: 48.1374,
        homeLongitude: 11.5755,
        persons: {
          create: [
            { name: "Anna", type: "adult" },
            { name: "Ben", type: "adult" },
            { name: "Mia", type: "child", birthDate: new Date("2022-06-01") },
            { name: "Lukas", type: "child", birthDate: new Date("2024-01-15") },
          ],
        },
        pets: {
          create: [{ name: "Rex", type: "dog", mustJoinDefault: true }],
        },
        mobilityPreset: {
          create: {
            hasCar: true,
            publicTransportOk: true,
            bikeOk: false,
            strollerRequired: true,
            maxTravelMinutes: 45,
          },
        },
        budgetPreset: {
          create: { maxCostTotal: 50, preferFree: false },
        },
      },
    });
    console.log(`  Demo-Familienprofil angelegt: ${family.name}`);
  } else {
    console.log("  Demo-Familienprofil existiert bereits.");
  }

  console.log("Seeding fertig.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
