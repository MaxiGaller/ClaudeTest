"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { runRecommendation } from "@/lib/recommend";
import type { EnergyLevel, WeatherCondition } from "@/lib/scoring";

/** Demo-User für das MVP (kein echtes Auth). */
async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", name: "Demo-Familie" },
  });
  return user.id;
}

function str(formData: FormData, key: string): string {
  return (formData.get(key) ?? "").toString().trim();
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function intOrNull(formData: FormData, key: string): number | null {
  const v = str(formData, key);
  if (v === "" || v.toLowerCase() === "egal") return null;
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
}

/** Empfehlungslauf starten und zur Ergebnisseite weiterleiten. */
export async function runRecommendationAction(formData: FormData) {
  const familyProfileId = str(formData, "familyProfileId");
  const weather = str(formData, "weatherCondition");

  const { runId } = await runRecommendation({
    familyProfileId,
    timeBudgetMinutes: Number.parseInt(str(formData, "timeBudgetMinutes") || "240", 10),
    maxBudget: intOrNull(formData, "maxBudget"),
    maxTravelMinutes: Number.parseInt(str(formData, "maxTravelMinutes") || "45", 10),
    dogMustJoin: bool(formData, "dogMustJoin"),
    strollerRequired: bool(formData, "strollerRequired"),
    energyLevel: (str(formData, "energyLevel") || "normal") as EnergyLevel,
    weatherCondition: (weather === "" ? null : weather) as WeatherCondition,
    preferFree: bool(formData, "preferFree"),
    limit: 5,
  });

  redirect(`/results/${runId}`);
}

/** Nutzerbewertung zu einer Aktivität speichern. */
export async function submitReviewAction(formData: FormData) {
  const userId = await getDemoUserId();
  const familyProfileId = str(formData, "familyProfileId");
  const activityId = str(formData, "activityId");
  const feedbackType = str(formData, "feedbackType") as
    | "fits"
    | "not_fitting"
    | "more_like_this"
    | "never_again";

  await prisma.activityReview.create({
    data: { userId, familyProfileId, activityId, feedbackType },
  });

  revalidatePath(`/results`);
}

/** Mobilitäts-Preset aktualisieren. */
export async function updateMobilityAction(formData: FormData) {
  const familyProfileId = str(formData, "familyProfileId");
  const data = {
    hasCar: bool(formData, "hasCar"),
    publicTransportOk: bool(formData, "publicTransportOk"),
    bikeOk: bool(formData, "bikeOk"),
    strollerRequired: bool(formData, "strollerRequired"),
    maxTravelMinutes: Number.parseInt(str(formData, "maxTravelMinutes") || "45", 10),
  };
  await prisma.mobilityPreset.upsert({
    where: { familyProfileId },
    update: data,
    create: { familyProfileId, ...data },
  });
  revalidatePath(`/profile/${familyProfileId}`);
}

/** Budget-Preset aktualisieren. */
export async function updateBudgetAction(formData: FormData) {
  const familyProfileId = str(formData, "familyProfileId");
  const data = {
    maxCostTotal: intOrNull(formData, "maxCostTotal"),
    preferFree: bool(formData, "preferFree"),
  };
  await prisma.budgetPreset.upsert({
    where: { familyProfileId },
    update: data,
    create: { familyProfileId, ...data },
  });
  revalidatePath(`/profile/${familyProfileId}`);
}

/** Person zum Haushalt hinzufügen. */
export async function addPersonAction(formData: FormData) {
  const familyProfileId = str(formData, "familyProfileId");
  const type = str(formData, "type") === "child" ? "child" : "adult";
  const birth = str(formData, "birthDate");
  await prisma.person.create({
    data: {
      familyProfileId,
      name: str(formData, "name") || "Unbenannt",
      type,
      birthDate: type === "child" && birth ? new Date(birth) : null,
    },
  });
  revalidatePath(`/profile/${familyProfileId}`);
}

export async function deletePersonAction(formData: FormData) {
  const familyProfileId = str(formData, "familyProfileId");
  await prisma.person.delete({ where: { id: str(formData, "personId") } });
  revalidatePath(`/profile/${familyProfileId}`);
}

/** Haustier hinzufügen. */
export async function addPetAction(formData: FormData) {
  const familyProfileId = str(formData, "familyProfileId");
  const type = str(formData, "type");
  await prisma.pet.create({
    data: {
      familyProfileId,
      name: str(formData, "name") || "Tier",
      type: (type === "cat" || type === "other" ? type : "dog") as
        | "dog"
        | "cat"
        | "other",
      mustJoinDefault: bool(formData, "mustJoinDefault"),
    },
  });
  revalidatePath(`/profile/${familyProfileId}`);
}

export async function deletePetAction(formData: FormData) {
  const familyProfileId = str(formData, "familyProfileId");
  await prisma.pet.delete({ where: { id: str(formData, "petId") } });
  revalidatePath(`/profile/${familyProfileId}`);
}

/** Neues (leeres) Familienprofil anlegen. */
export async function createFamilyAction(formData: FormData) {
  const userId = await getDemoUserId();
  const family = await prisma.familyProfile.create({
    data: {
      userId,
      name: str(formData, "name") || "Neue Familie",
      homeLocationName: str(formData, "homeLocationName") || "München",
      homeLatitude: 48.1374,
      homeLongitude: 11.5755,
      mobilityPreset: { create: {} },
      budgetPreset: { create: {} },
    },
  });
  redirect(`/profile/${family.id}`);
}
