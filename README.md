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
  results/[runId]/page.tsx  Top-5-Vorschläge mit Score, Begründung, Warnungen, Feedback
  activity/[id]/page.tsx    Aktivitätsdetail
  actions.ts                Server Actions (Empfehlung, Feedback, Profil-Updates)
lib/
  scoring.ts                Reine Scoring-Logik (Score + reasons + warnings)
  scoring.test.ts           Vitest-Tests der Scoring-Logik
  geo.ts                    Haversine + grobe Fahrzeitschätzung
  recommend.ts              Bindeglied: DB + Geo + Scoring -> Empfehlungslauf
  prisma.ts                 Prisma-Client (Singleton)
prisma/
  schema.prisma             Datenmodell
  seed.ts                   Seed-Daten München/Südbayern + Demo-Familie
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
npm run db:seed     # Beispielaktivitäten + Demo-Familie anlegen
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
Preise und Öffnungszeiten sind Platzhalter (siehe Feld `source` je Aktivität)
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
