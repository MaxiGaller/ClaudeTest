/**
 * Seed-Daten für das MVP – Region München / Südbayern.
 *
 * Hinweis: Preise und Öffnungszeiten sind grobe Platzhalter und KEINE harte
 * Wahrheit. Vor echter Nutzung verifizieren. Das Feld `source` markiert die
 * Datenherkunft/Unsicherheit.
 */
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_SOURCE = "seed-placeholder: Preise/Öffnungszeiten ungeprüft";

type ActivitySeed = Omit<Prisma.ActivityCreateInput, "tags"> & { tags: string[] };

const activities: ActivitySeed[] = [
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
    source: SEED_SOURCE,
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
    source: SEED_SOURCE,
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
    source: SEED_SOURCE,
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
    source: SEED_SOURCE,
    tags: ["playground", "free", "outdoor", "dog_friendly", "stroller_friendly", "toddler_friendly", "food_available", "action"],
  },
  {
    name: "Erlebnisbauernhof / Hofladen-Ausflug",
    description:
      "Familienfreundlicher Bauernhof im Umland mit Tieren zum Anschauen und Hofladen. Gut für kleine Kinder.",
    category: "Bauernhöfe / Erlebnisbauernhöfe",
    address: "Umland München (Platzhalter-Adresse)",
    latitude: 48.2200,
    longitude: 11.7000,
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
    source: SEED_SOURCE,
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
    source: SEED_SOURCE,
    tags: ["culture", "indoor", "rain_safe", "stroller_friendly", "toddler_friendly", "food_available", "high_entertainment"],
  },
  {
    name: "Indoor-Spielplatz",
    description:
      "Großer überdachter Indoor-Spielplatz mit Klettergerüsten, Rutschen und Bällebad. Perfekt bei Regen.",
    category: "Indoor-Spielplätze",
    address: "Großraum München (Platzhalter-Adresse)",
    latitude: 48.1800,
    longitude: 11.6100,
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
    source: SEED_SOURCE,
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
    source: SEED_SOURCE,
    tags: ["water", "free", "outdoor", "stroller_friendly", "toddler_friendly", "baby_friendly", "nap_compatible"],
  },
  {
    name: "Flohmarkt / Trödelmarkt",
    description:
      "Wechselnder Flohmarkt im Münchner Raum. Stöbern, schlendern, Schnäppchen – meist am Wochenende.",
    category: "Märkte / Flohmärkte",
    address: "wechselnde Orte München (bitte prüfen)",
    latitude: 48.1400,
    longitude: 11.5600,
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
    openingHoursText: "meist Wochenende vormittags (bitte prüfen)",
    websiteUrl: null,
    source: SEED_SOURCE,
    tags: ["market", "free", "outdoor", "dog_friendly", "stroller_friendly", "food_available", "quiet"],
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
    source: SEED_SOURCE,
    tags: ["restaurant", "playground", "dog_friendly", "stroller_friendly", "outdoor", "food_available", "low_budget", "toddler_friendly"],
  },
  {
    name: "Notfallidee: Eckspielplatz um die Ecke",
    description:
      "Kurze Idee für 1–2 Stunden, wenn die Zeit knapp ist: der nächste Spielplatz im Viertel.",
    category: "kurze Notfallideen für 1–2 Stunden",
    address: "wohnortnah (Platzhalter)",
    latitude: 48.1351,
    longitude: 11.5820,
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
    source: SEED_SOURCE,
    tags: ["playground", "free", "outdoor", "dog_friendly", "stroller_friendly", "toddler_friendly", "action"],
  },
];

async function main() {
  console.log("Seeding…");

  // Idempotent: vorhandene Aktivitäten/Tags zurücksetzen.
  await prisma.activityTag.deleteMany();
  await prisma.activity.deleteMany();

  for (const a of activities) {
    const { tags, ...data } = a;
    await prisma.activity.create({
      data: {
        ...data,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
    });
  }
  console.log(`  ${activities.length} Aktivitäten angelegt.`);

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
