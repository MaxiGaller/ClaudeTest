/**
 * Entry-Point für den täglichen Ingestion-Job: `npm run ingest`.
 * Läuft zentral (lokal oder via GitHub Actions Cron), nicht pro Nutzer.
 */
import { prisma } from "../lib/prisma";
import { runIngest } from "../lib/ingest/run";

async function main() {
  console.log("Ingestion startet…");
  // Optionale Region-Beschränkung über INGEST_REGION (sonst alle aktiven Regionen).
  const region = process.env.INGEST_REGION || undefined;
  const summaries = await runIngest({ region });
  for (const s of summaries) {
    console.log(
      `Region ${s.region} (${s.enrichedBy}): ` +
        `Events ${s.eventsCreated} neu / ${s.eventsUpdated} aktualisiert / ${s.eventsPruned} entfernt, ` +
        `Attraktionen ${s.attractionsCreated} neu / ${s.attractionsUpdated} aktualisiert.`
    );
  }
}

main()
  .catch((e) => {
    console.error("Ingestion fehlgeschlagen:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
