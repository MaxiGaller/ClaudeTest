# Was machen wir heute? – Familien-Aktivitäts-Empfehler (MVP)

Eine WebApp, die Familien **konkrete Freizeitvorschläge** macht, die wirklich zur
jeweiligen Situation passen: Kinderalter, Hund, Mobilität, Budget, Zeit, Wetter
und Tagesform. Statt einer endlosen Eventliste gibt es ein paar Ideen, die heute
passen – inklusive **Begründung** und **Warnhinweisen**.

> Leitfrage der App: **„Was passt heute zu genau unserer Familie?"**
> Startregion: München / Südbayern (später erweiterbar).

## Tech-Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** ORM + **PostgreSQL** (PostGIS/Umkreissuche später möglich)
- **Tailwind CSS** (mobile-first, familienfreundlich)
- **Vitest** für die Tests der Scoring-Logik
- Empfehlungslogik bewusst **DB-unabhängig** in `lib/scoring.ts`

## Projektstruktur

```
app/
  page.tsx                  Dashboard (Profile wählen / anlegen)
  profile/[id]/page.tsx     Familienprofil verwalten (Personen, Tiere, Mobilität, Budget)
  recommend/[id]/page.tsx   Empfehlung starten (Zeit, Budget, Hund, Wetter, Tagesform …)
  results/[runId]/page.tsx  Top-Vorschläge mit Score, Begründung, Warnungen, Feedback
  item/[type]/[id]/page.tsx Detailseite (Attraktion oder Event)
  actions.ts                Server Actions (Empfehlung, Feedback, Profil-Updates)
lib/
  scoring.ts                Reine Scoring-Logik (Score + reasons + warnings)
  feed.ts                   Vereint Attraktion + Event auf die Scoring-Eingabe
  regions.ts                Region-Registry (config-getrieben; aktuell nur München aktiv)
  geo.ts                    Haversine + grobe Fahrzeitschätzung
  recommend.ts              Bindeglied: DB + Geo + Scoring -> Empfehlungslauf
  prisma.ts                 Prisma-Client (Singleton)
  ingest/                   Täglicher Ingestion-Job (Quellen, Klassifikation, Upsert)
    run.ts                  Orchestrator: pro Region zwei Pipelines (Events / Attraktionen)
    classify.ts             Regelbasierte Anreicherung (Fallback + Testanker)
    ai.ts                   Optionaler, gebündelter Claude-Call (Structured Output)
    sources/                Quellen-Adapter (Fixtures + Gerüste für Feed/Overpass)
scripts/
  ingest.ts                 Entry-Point des Tagesjobs (npm run ingest)
prisma/
  schema.prisma             Datenmodell
  seed.ts                   Seed-Daten München/Südbayern + Demo-Familie
.github/workflows/
  daily-ingest.yml          Cron-Job (täglich) für die Ingestion
```

## Datenmodell: zwei Tabellen, ein Feed

Inhalte liegen in zwei Tabellen, die der Empfehlungs-Feed vereint:

- **`Attraction`** – dauerhafte Ausflugsziele (Zoo, Spielplatz, Wanderung, Badesee …).
- **`Event`** – zeitbegrenzte Veranstaltungen (Flohmarkt, Zirkus, Fest …); laufen
  nach `validUntil` ab und werden vom Tagesjob geprunt.

Beide tragen ein `region`-Feld (siehe `lib/regions.ts`). Tags (`ItemTag`),
Bewertungen (`Review`) und Empfehlungsergebnisse verweisen **polymorph**
(`itemType` + `itemId`) auf eines der beiden, sodass der Feed einheitlich bleibt.
`lib/feed.ts` bildet beide Tabellen auf die gemeinsame Scoring-Eingabe ab (ID
z. B. `attraction:<id>` / `event:<id>`) – das Scoring selbst kennt den Unterschied
nicht.

## Täglicher Ingestion-Job

Ein zentraler Job (lokal `npm run ingest` oder via GitHub-Actions-Cron) beschafft
Inhalte – **nicht** pro Nutzer. Er ist region-agnostisch und läuft über alle aktiven
Regionen (`lib/regions.ts`). Pro Region zwei Pipelines mit je eigener Quellen-Familie:

- **Events** (heute/zukünftig) → Tabelle `Event`, abgelaufene werden entfernt.
- **Attraktionen** (evergreen) → Tabelle `Attraction`, kein Datums-Pruning.

Quellen liefern rohe Kandidaten, die **dedupliziert**, **angereichert** und
idempotent **upgesertet** werden (per `sourceName` + `externalId`). Mitgeliefert sind
Offline-Fixtures sowie Gerüste für echte Quellen (`muenchen-open-data` via
`EVENT_FEED_URL`, OSM-Ausflugsziele via `OVERPASS_API_URL`); nicht konfigurierte
Quellen werden übersprungen, ohne den Lauf abzubrechen.

Die **KI-Anreicherung** ist optional und passiert ausschließlich hier (ein
gebündelter Claude-Call mit Structured Output, Modell aus `ANTHROPIC_MODEL`). Ohne
`ANTHROPIC_API_KEY` greift der deterministische, regelbasierte Fallback. Der
**Nutzerpfad bleibt KI-frei und deterministisch.**

```bash
npm run ingest               # alle aktiven Regionen
INGEST_REGION=muenchen npm run ingest   # nur eine Region
```

## Schnellstart

### 1. Voraussetzungen
- Node.js ≥ 18 (getestet mit Node 22)
- PostgreSQL (per Docker **oder** lokal installiert)

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Datenbank bereitstellen

**Variante A – Docker (empfohlen):**
```bash
docker compose up -d
```
Das startet Postgres passend zur `DATABASE_URL` in `.env.example`.

**Variante B – lokale PostgreSQL-Instanz:**
Lege eine Datenbank an und setze die Verbindung in `.env`:
```bash
cp .env.example .env
# .env anpassen: DATABASE_URL="postgresql://USER:PASS@localhost:5432/family_recommender?schema=public"
```

### 4. Schema anlegen + Seed-Daten laden
```bash
npm run db:push     # Schema in die DB schreiben
npm run db:seed     # Beispiel-Attraktionen/-Events + Demo-Familie anlegen
```
Praktisch: `npm run db:reset` setzt die DB zurück und seedet neu.

### 5. App starten
```bash
npm run dev
```
→ http://localhost:3000

## Tests

Die Scoring-Logik ist vollständig isoliert und ohne Datenbank testbar:
```bash
npm test          # einmalig
npm run test:watch
```

## Scoring-Logik

`lib/scoring.ts` enthält `scoreActivity(activity, request)`. Rückgabe ist
nachvollziehbar – nicht nur ein Score, sondern auch Gründe und Warnungen:

```ts
{
  activityId: "...",
  score: 86,            // 0–100
  reasons: [
    "hundefreundlich",
    "kinderwagentauglich",
    "im Budget (~30 €)",
    "innerhalb der gewünschten Fahrzeit (~27 Min)"
  ],
  warnings: [
    "bei Regen eher ungeeignet"
  ],
  eligible: true        // false bei hartem Ausschluss
}
```

Berücksichtigt werden u. a.:
- **Alter** der Kinder vs. Altersbereich der Aktivität
- **Hund**: muss mit → Aktivität muss hundetauglich sein (sonst harter Ausschluss)
- **Kinderwagen**: nötig → Aktivität muss kinderwagentauglich sein (sonst Ausschluss)
- **Budget**: kostenlos / im Budget / zu teuer
- **Fahrzeit** vs. maximale Fahrzeit (deutlich zu weit = Ausschluss)
- **Zeitbudget** vs. Dauer
- **Wetter**: Regen/Sonne/Hitze/Kälte vs. indoor/outdoor/regensicher/Wasser
- **Tagesform**: ruhig / normal / Action
- **Öffnungszeiten** (falls gepflegt)
- **Feedback-Historie**: „passt", „mehr davon", „nicht passend", **„nie wieder"** (harter Ausschluss)
- **Ähnliche Vorlieben** auf Kategorieebene

`buildExplanation()` formt daraus einen lesbaren Satz, `rankActivities()`
sortiert und filtert nicht-eignungsfähige Treffer.

## Datenqualität / Hinweis

Die Seed-Daten sind **realistisch strukturiert, aber nicht verifiziert**.
Preise und Öffnungszeiten sind Platzhalter (siehe Feld `source` je Eintrag)
und vor echter Nutzung zu prüfen. Die App-Struktur steht im Vordergrund, nicht
perfekte Daten.

## Bewusst (noch) nicht enthalten

Kein komplexes KI-System, keine deutschlandweite Datenintegration, kein
Chatbot-Interface, keine Social-Features, kein großes Adminsystem. Auth ist im
MVP nur eine einfache Demo-User-Annahme.

## Mögliche nächste Schritte

- Echte Geocodierung + Routing statt Luftlinien-Heuristik (ggf. PostGIS)
- Strukturierte Öffnungszeiten und „jetzt geöffnet"-Logik
- Echtes Auth / mehrere Nutzer
- Mehr Aktivitäten und weitere Regionen
