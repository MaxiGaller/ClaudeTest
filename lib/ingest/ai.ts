/**
 * KI-Anreicherung: EIN zentraler, gebündelter Claude-Aufruf pro Lauf.
 *
 * Klassifikation/Extraktion ist ein einfacher Single-Call-Anwendungsfall
 * (kein Agent). Wir nutzen Structured Outputs, damit die Antwort exakt unser
 * Schema erfüllt, und validieren zusätzlich mit zod.
 *
 * Das Modell kommt aus der Umgebung (ANTHROPIC_MODEL) – nicht hartkodiert.
 * Wird nur aufgerufen, wenn ANTHROPIC_API_KEY gesetzt ist (siehe run.ts).
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ClassifiedItem, RawItem } from "./types";

/** Tags, die das Scoring kennt – die KI darf nur aus diesem Vokabular wählen. */
export const ALLOWED_TAGS = [
  "dog_friendly", "stroller_friendly", "rain_safe", "free", "low_budget",
  "toddler_friendly", "baby_friendly", "requires_car", "public_transport_friendly",
  "outdoor", "indoor", "food_available", "nap_compatible", "high_entertainment",
  "quiet", "action", "animals", "playground", "water", "culture", "market", "restaurant",
] as const;

const CATEGORIES = [
  "Tiere & Natur", "Spielplätze", "Badeseen", "Museen kinderfreundlich",
  "Indoor-Spielplätze", "Spaziergänge mit Hund", "Bauernhöfe / Erlebnisbauernhöfe",
  "Märkte / Flohmärkte", "kostenlose Events", "Restaurants mit Spielplatz",
  "kurze Notfallideen für 1–2 Stunden",
];

const BATCH_SIZE = 8;

// zod-Schema zur Laufzeit-Validierung der Modellantwort (pro Item).
const itemSchema = z.object({
  externalId: z.string(),
  category: z.string(),
  estimatedCost: z.number().int().min(0),
  estimatedDurationMinutes: z.number().int().min(15),
  minChildAgeMonths: z.number().int().min(0),
  maxChildAgeMonths: z.number().int().min(0),
  dogFriendly: z.boolean(),
  strollerFriendly: z.boolean(),
  rainSafe: z.boolean(),
  indoor: z.boolean(),
  outdoor: z.boolean(),
  foodAvailable: z.boolean(),
  tags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

// JSON-Schema für Structured Outputs (additionalProperties:false ist Pflicht).
const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    activities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          externalId: { type: "string" },
          category: { type: "string", enum: CATEGORIES },
          estimatedCost: { type: "integer" },
          estimatedDurationMinutes: { type: "integer" },
          minChildAgeMonths: { type: "integer" },
          maxChildAgeMonths: { type: "integer" },
          dogFriendly: { type: "boolean" },
          strollerFriendly: { type: "boolean" },
          rainSafe: { type: "boolean" },
          indoor: { type: "boolean" },
          outdoor: { type: "boolean" },
          foodAvailable: { type: "boolean" },
          tags: { type: "array", items: { type: "string", enum: [...ALLOWED_TAGS] } },
          confidence: { type: "number" },
        },
        required: [
          "externalId", "category", "estimatedCost", "estimatedDurationMinutes",
          "minChildAgeMonths", "maxChildAgeMonths", "dogFriendly", "strollerFriendly",
          "rainSafe", "indoor", "outdoor", "foodAvailable", "tags", "confidence",
        ],
      },
    },
  },
  required: ["activities"],
} as const;

const SYSTEM_PROMPT = `Du klassifizierst Familien-Freizeit-Events in Südbayern/München für eine Empfehlungs-App.
Für jedes Event bestimmst du Kategorie, Eignung (Alter, Hund, Kinderwagen, Wetter), grobe Kosten/Dauer und passende Tags.
Schätze konservativ. Wähle Tags ausschließlich aus dem vorgegebenen Vokabular. Gib pro Event eine confidence (0–1) an.
Bewahre die externalId jedes Events unverändert.`;

function buildUserPrompt(raws: RawItem[]): string {
  const list = raws.map((r) => ({
    externalId: r.externalId,
    name: r.name,
    description: r.description,
    categoryHint: r.categoryHint,
    address: r.address,
    estimatedCost: r.estimatedCost,
  }));
  return `Klassifiziere diese Events. Antworte als JSON-Objekt {"activities":[...]} mit genau einem Eintrag pro Event:\n${JSON.stringify(list, null, 2)}`;
}

/**
 * Reichert eine Liste roher Events per Claude an. Erwartet, dass
 * ANTHROPIC_API_KEY und ANTHROPIC_MODEL gesetzt sind.
 */
export async function aiClassify(raws: RawItem[]): Promise<ClassifiedItem[]> {
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    throw new Error("ANTHROPIC_MODEL ist nicht gesetzt (aktuelles Claude-Modell eintragen).");
  }
  const client = new Anthropic(); // liest ANTHROPIC_API_KEY aus der Umgebung

  const byId = new Map(raws.map((r) => [r.externalId, r]));
  const out: ClassifiedItem[] = [];

  for (let i = 0; i < raws.length; i += BATCH_SIZE) {
    const batch = raws.slice(i, i + BATCH_SIZE);
    const params = {
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(batch) }],
      output_config: { format: { type: "json_schema", schema: responseSchema } },
    };
    // output_config ist in dieser SDK-Version evtl. noch nicht voll typisiert.
    const resp = await client.messages.create(
      params as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming
    );

    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = z
      .object({ activities: z.array(itemSchema) })
      .parse(JSON.parse(text));

    for (const item of parsed.activities) {
      const raw = byId.get(item.externalId);
      if (!raw) continue;
      const tags = item.tags.filter((t) => (ALLOWED_TAGS as readonly string[]).includes(t));
      out.push({
        externalId: item.externalId,
        name: raw.name,
        description: raw.description,
        category: item.category,
        estimatedCost: item.estimatedCost,
        estimatedDurationMinutes: item.estimatedDurationMinutes,
        minChildAgeMonths: item.minChildAgeMonths,
        maxChildAgeMonths: Math.max(item.minChildAgeMonths, item.maxChildAgeMonths),
        dogFriendly: item.dogFriendly,
        strollerFriendly: item.strollerFriendly,
        rainSafe: item.rainSafe,
        indoor: item.indoor,
        outdoor: item.outdoor,
        foodAvailable: item.foodAvailable,
        tags,
        address: raw.address,
        latitude: raw.latitude,
        longitude: raw.longitude,
        startsAt: raw.startsAt,
        endsAt: raw.endsAt,
        sourceUrl: raw.sourceUrl,
        ticketUrl: raw.ticketUrl,
        difficulty: raw.difficulty,
        lengthKm: raw.lengthKm,
        provenance: `KI-angereichert (confidence ${item.confidence.toFixed(2)}) – Preise/Termine ungeprüft`,
      });
    }
  }

  return out;
}
