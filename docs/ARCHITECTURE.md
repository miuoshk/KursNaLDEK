# Architektura — Kurs na LDEK

> Stan na: kwiecień 2026. Dokument generowany na podstawie kodu źródłowego.

---

## Spis treści

1. [Stack technologiczny](#1-stack-technologiczny)
2. [Struktura folderów](#2-struktura-folderów)
3. [Schema bazy danych](#3-schema-bazy-danych)
4. [Moduły produktowe: KNNP i OSCE](#4-moduły-produktowe-knnp-i-osce)
5. [ANTARES engine](#5-antares-engine)
6. [Flow sesji nauki](#6-flow-sesji-nauki)
7. [Gamifikacja: XP, streak, rangi](#7-gamifikacja-xp-streak-rangi)
8. [Auth i RLS](#8-auth-i-rls)
9. [Deploy](#9-deploy)
10. [Schemat architektury](#10-schemat-architektury)
11. [Use cases (techniczne)](#11-use-cases-techniczne)
12. [User Journey](#12-user-journey)
13. [Architektura dla nietechnicznych stakeholderów](#13-architektura-dla-nietechnicznych-stakeholderów)
14. [Use cases dla użytkowników](#14-use-cases-dla-użytkowników)
15. [Struktura pytań do dodania do Supabase](#15-struktura-pytań-do-dodania-do-supabase)

---

## 1. Stack technologiczny

| Warstwa | Technologia | Wersja |
|---------|-------------|--------|
| Framework | Next.js (App Router) | 16.2 |
| UI | React | 19.2 |
| Język | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS (v4, PostCSS plugin) | 4.x |
| Baza + auth | Supabase (SSR + client + admin) | supabase-js 2.101, ssr 0.10 |
| Animacje | Framer Motion | 12.x |
| Wykresy | Recharts | 3.x |
| Prymitywy UI | Radix UI (accordion, dialog, dropdown, progress, scroll-area, switch, tabs, toggle-group, tooltip) | — |
| Stan klienta | Zustand (persist) | 5.x |
| Spaced repetition | ts-fsrs | 5.3 |
| Walidacja | Zod | 4.x |
| Drag & drop | DnD Kit | core 6, sortable 10 |
| Płatności | Stripe | 22.x |
| Markdown | react-markdown | 10.x |
| Ikony | lucide-react | 1.7 |
| Hosting | Vercel (auto-deploy z `main`) | — |

---

## 2. Struktura folderów

Projekt stosuje **feature-folder pattern** — logika domenowa żyje w `features/`, a `app/` odpowiada tylko za routing.

```
.
├── app/                        # Next.js App Router — layouty i strony
│   ├── (auth)/                 # /login, /register
│   ├── (admin)/                # /admin, /admin/pytania, /admin/uzytkownicy, /admin/bledy
│   ├── (dashboard)/            # Główny shell zalogowanego użytkownika
│   │   ├── pulpit/             # Dashboard home
│   │   ├── przedmioty/         # Lista przedmiotów KNNP + link do OSCE
│   │   ├── sesja/[sessionId]/  # Aktywna sesja nauki + /podsumowanie
│   │   ├── statystyki/         # Wykresy i statystyki
│   │   ├── osiagniecia/        # Rangi, osiągnięcia, ranking
│   │   ├── ustawienia/         # Profil, data egzaminu, powiadomienia
│   │   └── osce/               # Atlas, stacje, symulacja OSCE
│   └── cennik/                 # Strona cenowa (Stripe)
├── features/                   # Moduły domenowe
│   ├── admin/                  # Panel admina: metryki, pytania, użytkownicy
│   ├── auth/                   # Login, rejestracja, logout, test mode
│   ├── gamification/           # Rangi, osiągnięcia, XP, leaderboard
│   ├── osce/                   # Stacje OSCE, symulacja, atlas OPG
│   ├── pulpit/                 # Dashboard: hero stats, heatmapa, wykres postępu, słabe punkty, quick start
│   ├── session/                # Sesje nauki, ANTARES, FSRS, podsumowania
│   ├── settings/               # Ustawienia profilu
│   ├── shared/                 # Sidebar, topbar, konteksty, store, toasty
│   ├── statistics/             # Wykresy statystyk
│   └── subjects/               # Siatka przedmiotów i tematów KNNP
├── lib/                        # Współdzielone utility
│   ├── supabase/               # client.ts, server.ts, admin.ts
│   └── dashboard/              # cachedProfile, getDashboardYear, getDueReviewCount
├── hooks/                      # Globalne hooki (usePinchZoom)
├── scripts/                    # Seedy SQL, migracje, shell scripts
├── proxy.ts                    # Next.js 16 auth proxy (odpowiednik middleware)
├── supabase-schema.sql         # Pełny schemat bazy (greenfield)
└── supabase-migrations-*.sql   # Migracje przyrostowe
```

Każdy folder w `features/` ma typową strukturę wewnętrzną:

```
features/<moduł>/
├── components/     # Komponenty React (PascalCase)
├── server/         # Loadery danych, logika server-side
├── api/            # Server actions ("use server")
├── hooks/          # Hooki klienckie
├── lib/            # Helpery, stałe, logika pure
└── types.ts        # Typy TypeScript
```

---

## 3. Schema bazy danych

Pełna definicja: [`supabase-schema.sql`](../supabase-schema.sql)

### Tabele i relacje

```
auth.users
  └─ profiles (1:1, trigger handle_new_user)
       ├─ study_sessions (1:N)
       │    └─ session_answers (1:N)
       ├─ user_question_progress (1:N, FSRS state)
       ├─ learning_events (1:N)
       ├─ topic_mastery_cache (1:N)
       ├─ user_achievements (1:N)
       ├─ user_challenge_progress (1:N)
       ├─ osce_simulations (1:N)
       │    └─ osce_station_results (1:N)
       ├─ saved_questions (1:N)
       └─ question_discussions (1:N)

subjects
  ├─ topics (1:N)
  │    └─ questions (1:N)
  ├─ daily_challenges (1:N)
  └─ osce_station_results (FK station_id)

achievements
  └─ user_achievements (1:N)
```

### Kluczowe tabele

| Tabela | Rola | Kluczowe kolumny |
|--------|------|------------------|
| `profiles` | Profil użytkownika | `current_product` (knnp/ldek), `xp`, `current_streak`, `rank_tier`, `exam_date`, `exam_readiness_score`, `learning_velocity` |
| `subjects` | Przedmioty (KNNP) / stacje (OSCE) | `product` (knnp/osce), `year`, `track`, `exam_day` |
| `topics` | Tematy w przedmiocie | `subject_id`, `question_count`, `knowledge_card` |
| `questions` | Pytania | `topic_id`, `question_type` (single_choice, ordering, image_identify, conversion_drill), `difficulty`, `options` (JSONB) |
| `user_question_progress` | Stan FSRS per pytanie per user | `stability`, `difficulty_rating`, `next_review`, `state`, `correct_streak`, `wrong_streak`, `is_leech` |
| `study_sessions` | Sesje nauki | `mode`, `total_questions`, `correct_answers`, `xp_earned`, `session_insights` (JSONB) |
| `session_answers` | Odpowiedzi w sesji | `is_correct`, `confidence`, `time_spent_seconds`, `is_first_exposure` |
| `learning_events` | Zdarzenia ANTARES | `event_type`, `payload` (JSONB) |
| `topic_mastery_cache` | Cache opanowania tematu | `mastery_score`, `avg_retrievability`, `trend`, `weakness_rank` |
| `osce_simulations` | Symulacje OSCE | `exam_day`, `passed_overall`, `overall_percent` |
| `osce_station_results` | Wyniki per stacja | `correct_count`, `total_questions`, `passed` |

---

## 4. Moduły produktowe: KNNP i OSCE

Oba moduły współdzielą tabelę `subjects`. Rozróżnienie odbywa się przez kolumnę **`product`**:

```sql
-- KNNP (nauki podstawowe)
SELECT * FROM subjects WHERE product = 'knnp';

-- OSCE (egzamin praktyczny)
SELECT * FROM subjects WHERE product = 'osce';
```

### KNNP — Kolokwium z Nauk Podstawowych

- **Dane**: [`features/shared/server/knnpCatalogCache.ts`](../features/shared/server/knnpCatalogCache.ts) — cachowany katalog przedmiotów (z topic IDs) filtrowany po `track` i `year`
- **Loader**: [`features/subjects/server/loadKnnpSubjects.ts`](../features/subjects/server/loadKnnpSubjects.ts) — buduje listę z mastery per przedmiot na bazie `user_question_progress` (FSRS state), pobiera `last_studied_at` z `study_sessions`, agreguje postęp ogólny roku (answered/mastered/reviewing)
- **Builder**: [`features/subjects/server/buildKnnpSubjectsList.ts`](../features/subjects/server/buildKnnpSubjectsList.ts) — filtruje OSCE z siatki KNNP (OSCE ma osobną sekcję "Egzamin praktyczny"), mapuje mastery i last_studied_at per przedmiot
- **UI**: [`app/(dashboard)/przedmioty/page.tsx`](../app/(dashboard)/przedmioty/page.tsx) — siatka kart z postępem, sekcja OverallProgress (postęp roku z segmentowanym progress barem), sekcja Egzamin praktyczny (link do OSCE)
- **Karty przedmiotów**: [`SubjectCard.tsx`](../features/subjects/components/SubjectCard.tsx) — stan "Wkrótce dostępne" dla przedmiotów bez pytań (ikona zegara, disabled), relative-time "Ostatnio: wczoraj" dla aktywnych
- **Sesje**: standardowy flow `startSession` → `submitAnswer` → `completeSession`
- **Tryby sesji**: `inteligentna` (ANTARES), `przeglad` (shuffle), `katalog` (browse)

### OSCE — Objective Structured Clinical Examination

- **Dane**: [`features/osce/server/loadOsceStations.ts`](../features/osce/server/loadOsceStations.ts) — stacje z `product = 'osce'`, pogrupowane po `exam_day`
- **Typy pytań**: single_choice, ordering (drag & drop), image_identify (hotspoty), conversion_drill
- **Symulacja**: [`features/osce/components/OSCESimulation.tsx`](../features/osce/components/OSCESimulation.tsx) — timer per stacja, próg zdawalności, zapis do `osce_simulations` + `osce_station_results`
- **Atlas OPG**: [`features/osce/components/OPGAtlas.tsx`](../features/osce/components/OPGAtlas.tsx) — przeglądarka panoram
- **Topic session**: [`features/osce/components/TopicSession.tsx`](../features/osce/components/TopicSession.tsx) — ćwiczenie tematu ze stacji, korzysta z `submitAnswer` / `completeSession`

### Profil i nawigacja

`profiles.current_product` przechowuje wybrany moduł (`knnp` / `ldek`). Sidebar prowadzi do przedmiotów KNNP, a OSCE jest dostępne przez kartę „Egzamin praktyczny" na stronie przedmiotów oraz dedykowane trasy `/osce/*`.

---

## 5. ANTARES engine

ANTARES to wewnętrzny silnik inteligentnego doboru pytań i analizy postępu, zbudowany na algorytmie **FSRS** (Free Spaced Repetition Scheduler) z biblioteki `ts-fsrs`.

### Pliki silnika

Wszystkie w [`features/session/lib/antares/`](../features/session/lib/antares/):

| Plik | Odpowiedzialność |
|------|------------------|
| [`index.ts`](../features/session/lib/antares/index.ts) | Barrel export |
| [`retrievability.ts`](../features/session/lib/antares/retrievability.ts) | Oblicza R (prawdopodobieństwo przypomnienia) z parametrów FSRS karty |
| [`urgencyScore.ts`](../features/session/lib/antares/urgencyScore.ts) | Ranking pilności powtórki: R, overdue days, słabość tematu, korekcja leech |
| [`newQuestionPriority.ts`](../features/session/lib/antares/newQuestionPriority.ts) | Priorytet nowych (niewidzianych) pytań |
| [`sessionComposer.ts`](../features/session/lib/antares/sessionComposer.ts) | Buduje sesję: proporcje due/new/leech, interleave tematów, krzywa trudności |
| [`midSessionAdapter.ts`](../features/session/lib/antares/midSessionAdapter.ts) | Adaptacja w trakcie sesji: swap trudności, wykrywanie zmęczenia |
| [`leechDetector.ts`](../features/session/lib/antares/leechDetector.ts) | Oznaczanie „pijawek" (≥3 błędy z rzędu), reset po 2 poprawnych |
| [`confidenceCalibration.ts`](../features/session/lib/antares/confidenceCalibration.ts) | Kalibracja pewności siebie vs rzeczywista trafność |
| [`sessionInsights.ts`](../features/session/lib/antares/sessionInsights.ts) | Generowanie insightów po sesji (zapisywane jako JSONB w `study_sessions.session_insights`) |
| [`recalculateTopicMastery.ts`](../features/session/lib/antares/recalculateTopicMastery.ts) | Przebudowa `topic_mastery_cache`: pokrycie, trafność, avg R, trend 7d, weakness rank |
| [`examReadiness.ts`](../features/session/lib/antares/examReadiness.ts) | Gotowość egzaminowa: ważona średnia mastery × kara za pokrycie, verdict, rekomendacja dzienna |

### Pliki wspierające (server)

| Plik | Rola |
|------|------|
| [`server/buildAntaresInteligentnaSession.ts`](../features/session/server/buildAntaresInteligentnaSession.ts) | Buduje pulę kandydatów (due, leech, unseen), rankuje po urgency/priority, przekazuje do `composeSession` |
| [`server/persistUserProgressFsrs.ts`](../features/session/server/persistUserProgressFsrs.ts) | Przelicza stan FSRS karty po odpowiedzi, upsert do `user_question_progress` |
| [`server/completeSessionPostAntares.ts`](../features/session/server/completeSessionPostAntares.ts) | Post-processing: `recalculateTopicMastery`, insights, exam readiness, zapis do profilu |
| [`lib/spaced-repetition.ts`](../features/session/lib/spaced-repetition.ts) | Wrapper ts-fsrs: `confidenceToRating`, `calculateNextReview` |

### Jak się łączą

```
startSession (tryb inteligentna)
  → buildAntaresInteligentnaSession
      → getRetrievability (R per kartę)
      → calculateDueUrgency (ranking due)
      → newQuestionPriority (ranking unseen)
      → composeSession
          → proporcje due/new/leech (dostosowane do daty egzaminu)
          → interleaveByTopic (unikanie sąsiedztwa tematów)
          → applyDifficultyCurve (rozgrzewka → rdzeń → schłodzenie)

submitAnswer
  → persistUserProgressFsrs → calculateNextReview (ts-fsrs)
  → updateLeechStatus
  → learning_events (answer + leech)
  → [client] adaptRemainingQuestions + applyDifficultySwapsToRemaining
  → [client] detectFatigue

completeSession (background)
  → recalculateTopicMastery (cache per topic)
  → generateSessionInsights → session_insights JSONB
  → calculateExamReadiness → profiles.exam_readiness_score
```

---

## 6. Flow sesji nauki

### Przegląd trybów

| Tryb | `mode` w DB | FSRS | ANTARES | Opis |
|------|-------------|------|---------|------|
| Inteligentna | `nauka` | tak | pełny | Algorytm dobiera pytania, adaptacja w trakcie |
| Przegląd | `egzamin` | nie (`skipFsrs: true`) | nie | Losowe pytania, symulacja egzaminu |
| Katalog | — (brak rekordu) | nie | nie | Przeglądanie pytań offline |
| Retry wrong | `nauka` | tak | nie | Powtórzenie błędnych z poprzedniej sesji |

### Szczegółowy flow

#### 1. `startSession` — [`features/session/api/startSession.ts`](../features/session/api/startSession.ts)

```
Wejście: subjectId | topicId, mode, count, [questionIds]
  │
  ├─ inteligentna → buildAntaresInteligentnaSession(...)
  │                    fallback: mixNaukaQuestionIds(due + unseen)
  ├─ przeglad    → shuffle(pool).slice(0, count)
  ├─ katalog     → pool (bez zapisu do DB)
  └─ retry       → explicit questionIds
  │
  ├─ INSERT study_sessions (id, user_id, subject_id, mode, total_questions, question_ids)
  └─ RETURN { sessionId, questions: SessionQuestion[] }
```

#### 2. `submitAnswer` — [`features/session/api/submitAnswer.ts`](../features/session/api/submitAnswer.ts)

```
Wejście: sessionId, questionId, selectedOptionId, confidence, timeSpentSeconds
  │
  ├─ UPSERT session_answers
  ├─ persistUserProgressFsrs (jeśli !skipFsrs)
  ├─ [pierwszy raz] aktualizacja leech streaks w user_question_progress
  ├─ [pierwszy raz] INSERT learning_events (answer + opcjonalnie leech)
  ├─ UPDATE study_sessions (correct_answers, duration_seconds)
  └─ [client] midSessionAdapter: adaptRemainingQuestions, detectFatigue
```

#### 3. `completeSession` — [`features/session/api/completeSession.ts`](../features/session/api/completeSession.ts)

```
Wejście: sessionId, durationSecondsFallback
  │
  ├─ computeSessionXp → xp_earned
  ├─ nextStreakValues → streak update
  ├─ UPDATE study_sessions (is_completed, xp_earned, accuracy, duration)
  ├─ UPDATE profiles (xp, streak, last_active_date, rank_tier)
  ├─ buildSessionSummary → SessionSummaryData
  ├─ revalidatePath
  └─ [background] runCompleteSessionPostAntares
       ├─ recalculateTopicMastery
       ├─ generateSessionInsights → session_insights
       ├─ calculateExamReadiness → exam_readiness_score
       ├─ avg_session_hour update
       ├─ learning_velocity update
       └─ learning_events (session_end)
```

### Cykl życia na kliencie

1. `/sesja/new?...` → `SessionPageClient` wywołuje `startSession`, cachuje w `sessionStorage`, redirect do `/sesja/{uuid}`
2. `SessionStudyView` renderuje pytania sekwencyjnie: wybór opcji → sprawdzenie → pewność siebie → `submitAnswerWithRetry` (retry × 3 z backoff)
3. W trybie inteligentna: po każdej odpowiedzi `adaptRemainingQuestions` + ewentualne swapy trudności
4. Po ≥15 odpowiedziach: `detectFatigue` → toast z sugestią przerwy
5. Ostatnia odpowiedź → `buildClientSessionSummary` (instant UI) → `scheduleServerSessionComplete` → URL zmienia się na `/sesja/{uuid}/podsumowanie`
6. `SessionSummaryClient`: hero, pasek odpowiedzi, rozbicie tematów, karta XP, przyciski akcji

---

## 7. Gamifikacja: XP, streak, rangi

### Pliki

- Definicje: [`features/gamification/lib/ranks.ts`](../features/gamification/lib/ranks.ts)
- Osiągnięcia: [`features/gamification/lib/achievements-config.ts`](../features/gamification/lib/achievements-config.ts)
- Obliczanie XP: [`features/session/server/computeSessionXp.ts`](../features/session/server/computeSessionXp.ts)
- Streak: [`features/session/server/sessionStreak.ts`](../features/session/server/sessionStreak.ts)

### Reguły XP

| Zdarzenie | XP |
|-----------|-----|
| Poprawna odpowiedź | +5 |
| Poprawna na trudne pytanie | +10 |
| Seria ≥5 poprawnych z rzędu w sesji | +15 (bonus) |
| Ukończenie sesji ≥10 pytań | +20 |

### Rangi

| Ranga | Próg XP |
|-------|---------|
| Praktykant | 0 – 500 |
| Asystent | 500 – 1 500 |
| Rezydent I° | 1 500 – 3 000 |
| Rezydent II° | 3 000 – 5 000 |
| Rezydent III° | 5 000 – 8 000 |
| Specjalista | 8 000 – 12 000 |
| Mistrz LDEK | 12 000+ |

Ranga jest obliczana z `profiles.xp` przez `getCurrentRank()`. Postęp do następnej rangi: `getXpProgress()`.

### Streak

- `profiles.current_streak` — dni z rzędu z aktywnością
- `profiles.longest_streak` — rekord
- `profiles.last_active_date` — aktualizowane przy `completeSession`
- Logika: [`sessionStreak.ts`](../features/session/server/sessionStreak.ts) — porównanie `last_active_date` z dzisiejszą datą

### Osiągnięcia

12 osiągnięć zdefiniowanych w `achievements-config.ts`, m.in.:
- Pierwsza sesja, 100 / 1000 pytań, maraton (50+ w sesji)
- Perfekcyjna sesja (100%), snajper (90%+ przez 10 sesji)
- Streaki: 3, 7, 30 dni
- Wszechstronny (≥5 przedmiotów), nocny maratończyk, wczesny ptak

Postęp śledzony w `user_achievements`, ładowany przez [`loadGamification.ts`](../features/gamification/server/loadGamification.ts).

---

## 8. Auth i RLS

### Flow autentykacji

```
              ┌──────────────┐
              │  proxy.ts    │  (Next.js 16 auth proxy, odpowiednik middleware)
              └──────┬───────┘
                     │
    ┌────────────────┼────────────────┐
    │ brak sesji     │ sesja          │ test mode cookie
    │ → /login       │ → przepuść     │ → przepuść (demo)
    └────────────────┴────────────────┘
```

- **Rejestracja**: [`features/auth/actions.ts`](../features/auth/actions.ts) — `registerAction` z Zod walidacją, `supabase.auth.signUp` z `display_name` w metadata
- **Login**: `loginAction` — `signInWithPassword`, + osobna ścieżka test mode (cookie bez Supabase)
- **Logout**: `logoutAction` — usunięcie test cookie + `supabase.auth.signOut`
- **Trigger DB**: `handle_new_user()` — po `INSERT` na `auth.users` automatycznie tworzy wiersz w `profiles` z `display_name` i `avatar_initials`

### Klienty Supabase

| Plik | Kontekst | Klucz |
|------|----------|-------|
| [`lib/supabase/client.ts`](../lib/supabase/client.ts) | Przeglądarka | `ANON_KEY` |
| [`lib/supabase/server.ts`](../lib/supabase/server.ts) | Server Components / Server Actions | `ANON_KEY` + cookies |
| [`lib/supabase/admin.ts`](../lib/supabase/admin.ts) | Operacje uprzywilejowane | `SERVICE_ROLE_KEY` |

### Row Level Security

RLS jest włączony na **wszystkich** tabelach. Zasada ogólna:

| Wzorzec | Tabele |
|---------|--------|
| `auth.uid() = user_id` (SELECT/INSERT/UPDATE) | profiles, user_question_progress, study_sessions, learning_events, topic_mastery_cache, user_achievements, user_challenge_progress, osce_simulations, saved_questions |
| Subquery przez parent (`session_id IN (SELECT id FROM study_sessions WHERE user_id = auth.uid())`) | session_answers, osce_station_results |
| Publiczny SELECT dla authenticated | subjects, topics, questions, achievements, daily_challenges, question_discussions |
| Admin override (`profiles.role = 'admin'`) | questions (ALL), profiles (SELECT all), study_sessions (SELECT all), error_reports |

Profil tworzy trigger (SECURITY DEFINER) — klient nie ma INSERT na `profiles`.

---

## 9. Deploy

```
git push origin main
       │
       ▼
   Vercel auto-deploy
       │
       ├─ next build
       ├─ Edge Functions (proxy.ts)
       └─ Serverless Functions (server actions, server components)
```

- Brak `vercel.json` — konfiguracja domyślna Vercel dla Next.js
- Brak GitHub Actions / CI — Vercel webhook na push
- Zmienne środowiskowe w Vercel Dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY` (+ webhook secret)
- Migracje bazy: ręcznie przez Supabase Dashboard / CLI (`supabase-schema.sql` + `supabase-migrations-*.sql`)
- Seedy: skrypty w [`scripts/`](../scripts/) — `seed-all.sh` uruchamia wszystkie SQL-e

---

## 10. Schemat architektury

```
┌─────────────────────────────────────────────────────────────────────┐
│                           KLIENT (React 19)                        │
│                                                                     │
│  ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ SessionStudy│  │ OSCE Simul.  │  │ Gamification│  │ Dashboard  │ │
│  │ View       │  │              │  │ UI          │  │ Widgets    │ │
│  └─────┬──────┘  └──────┬───────┘  └─────┬──────┘  └─────┬──────┘ │
│        │                │                 │               │        │
│  ┌─────▼────────────────▼─────────────────▼───────────────▼──────┐ │
│  │                    Zustand Store + React Context               │ │
│  │  (sidebarStore, DashboardUserContext, DashboardDataContext)    │ │
│  └───────────────────────────┬───────────────────────────────────┘ │
│                              │ Server Actions                      │
└──────────────────────────────┼─────────────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────────────┐
│                       SERWER (Next.js 16)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  proxy.ts — auth guard, session check, test mode, redirect   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐    │
│  │ Server       │  │ Server       │  │ Server Actions        │    │
│  │ Components   │  │ Loaders      │  │ ("use server")        │    │
│  │ (app/ pages) │  │ (features/   │  │ startSession          │    │
│  │              │  │  server/)    │  │ submitAnswer           │    │
│  │              │  │              │  │ completeSession        │    │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘    │
│         │                 │                       │                 │
│  ┌──────▼─────────────────▼───────────────────────▼──────────────┐ │
│  │                    ANTARES Engine                              │ │
│  │  retrievability · urgencyScore · sessionComposer              │ │
│  │  midSessionAdapter · leechDetector · recalculateTopicMastery  │ │
│  │  examReadiness · sessionInsights · confidenceCalibration      │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                              │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │  ts-fsrs scheduler (request_retention: 0.9, max_interval: 365)│ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                         SUPABASE                                    │
│                                                                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Auth       │  │ PostgreSQL │  │ RLS Policies │  │ Triggers   │  │
│  │ (GoTrue)   │  │ (18 tabel) │  │ (per table)  │  │ (new user) │  │
│  └────────────┘  └────────────┘  └──────────────┘  └────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                    ┌─────────────────┐
                    │  Stripe         │
                    │  (subskrypcje)  │
                    └─────────────────┘
```

### Przepływ danych sesji nauki

```
Klient                          Serwer                           Supabase
  │                               │                                │
  │──startSession(params)────────▶│                                │
  │                               │──ANTARES: build session───────▶│ (read UQP, questions)
  │                               │◀──ranked questions─────────────│
  │                               │──INSERT study_sessions────────▶│
  │◀──{sessionId, questions}──────│                                │
  │                               │                                │
  │──submitAnswer(answer)────────▶│                                │
  │                               │──UPSERT session_answers───────▶│
  │                               │──persistUserProgressFsrs──────▶│ (UPSERT UQP)
  │                               │──INSERT learning_events───────▶│
  │◀──{isCorrect, explanation}────│                                │
  │                               │                                │
  │  [adaptRemainingQuestions]     │                                │
  │  [detectFatigue]              │                                │
  │                               │                                │
  │──completeSession(id)─────────▶│                                │
  │                               │──computeSessionXp              │
  │                               │──UPDATE sessions, profiles────▶│
  │◀──SessionSummaryData──────────│                                │
  │                               │                                │
  │                               │──[background]                  │
  │                               │  recalculateTopicMastery──────▶│
  │                               │  generateSessionInsights──────▶│
  │                               │  calculateExamReadiness───────▶│
```

---

## 11. Use cases (techniczne)

### UC-1: Sesja inteligentna (KNNP)

1. Użytkownik wybiera przedmiot i tryb „Inteligentna"
2. `startSession` → ANTARES dobiera pytania (due reviews + nowe + leeche, proporcje zależne od daty egzaminu)
3. Pytania interleave po tematach z krzywą trudności (rozgrzewka → rdzeń → schłodzenie)
4. Po każdej odpowiedzi: FSRS update, leech detection, mid-session difficulty adaptation
5. Po ≥15 odpowiedziach: fatigue detection (spadek trafności > 20% lub wzrost czasu > 50%)
6. Podsumowanie: XP, streak, rozbicie tematów, insights ANTARES
7. Background: topic mastery cache, exam readiness score

### UC-2: Symulacja OSCE

1. Użytkownik wybiera dzień egzaminu (1 lub 2)
2. System ładuje stacje z pytaniami, randomizuje tematy
3. Każda stacja ma timer i próg zdawalności
4. Typy pytań: MCQ, ordering (drag & drop), image identify (hotspoty), conversion drill
5. Po zakończeniu: zapis do `osce_simulations` + `osce_station_results`, wynik procentowy per stacja

### UC-3: Przegląd powtórek

1. Dashboard pokazuje liczbę pytań due (`getDueReviewCount` z `user_question_progress.next_review`)
2. Użytkownik klika „Powtórki" → sesja z pytaniami where `next_review <= now()`
3. Tryb przegląd: `skipFsrs: true`, brak aktualizacji stanu FSRS, losowa kolejność

### UC-4: Retry błędnych

1. Po sesji użytkownik klika „Powtórz błędne"
2. `retryWrongStorage` przechowuje ID błędnych pytań w sessionStorage
3. `startSession` z explicit `questionIds` — nowa sesja z FSRS

### UC-5: Śledzenie postępu i pulpit

1. `topic_mastery_cache` przeliczany po każdej sesji (background)
2. `mastery_score = coverage × 0.3 + accuracy × 0.3 + avg_retrievability × 0.4`
3. `weakness_rank` — globalny ranking słabych tematów per user
4. `exam_readiness_score` — gotowość egzaminowa 0–100 z verdict i rekomendacją dzienną
5. Statystyki UI: wykresy Recharts z historii sesji i postępu

**Pulpit (`features/pulpit/`)** — główna strona po zalogowaniu:

| Sekcja | Komponent | Loader | Opis |
|--------|-----------|--------|------|
| Hero Stats | `PulpitTodayCards` | `loadPulpit` (profiles, UQP) | 4 karty: cel dzienny (SVG ring), streak, powtórki, ranga (XP progress) |
| Quick Start | `PulpitQuickStart` | `loadPulpit` (study_sessions) | 2 karty: powtórki ANTARES CTA + kontynuuj naukę |
| Heatmapa aktywności | `ActivityHeatmap` | `loadActivityHeatmap` (session_answers, 91 dni) | Siatka 13×7 tygodni w stylu GitHub contributions z Radix Tooltip |
| Wykres postępu | `ProgressChart` | `loadProgressHistory` (study_sessions, 60 dni) | Recharts AreaChart: avg accuracy (%) z filtrem 30/60 dni |
| Słabe punkty | `WeakPoints` | `loadWeakPoints` (topic_mastery_cache < 80%) | Top 5 tematów z najniższym mastery, progress bary, link "Ćwicz" |
| Historia sesji | `PulpitRecentSessions` | `loadPulpit` (study_sessions, top 3) | Ostatnie 3 ukończone sesje z linkiem do /statystyki |

Animacje: `motion.div` fade-in na dashboardzie, stagger 80ms na hero stats kartach.

### UC-6: Gamifikacja

1. XP naliczane przy `completeSession` (5/10 per odpowiedź + bonusy)
2. Ranga aktualizowana automatycznie z progów XP
3. Streak utrzymywany dzienną aktywnością (porównanie dat)
4. Osiągnięcia: progress bar, unlock z `xp_reward`
5. Leaderboard: ranking XP per okres (tydzień/miesiąc/wszechczasów)

### UC-7: Tryb testowy (demo)

1. Login z credentials test mode → cookie `kurs_test_mode` (14 dni)
2. `proxy.ts` traktuje cookie jako ważną sesję
3. Dashboard ładuje syntetyczny profil „Tryb testowy"
4. Brak interakcji z Supabase Auth — dane demo

---

## 12. User Journey

### Pierwszy kontakt → aktywny użytkownik

```
Rejestracja (/register)
  │ podanie: email, hasło, imię
  │ trigger: handle_new_user → profiles (year=1, track=stomatologia, xp=0, rank=praktykant)
  ▼
Pulpit (/pulpit)
  │ "Witaj, Anna!" + podsumowanie dnia
  │ Hero stats: cel 0/25, streak 0, powtórki 0, ranga Praktykant
  │ Placeholder: "Zacznij rozwiązywać pytania..."
  ▼
Wybór przedmiotu (/przedmioty)
  │ Siatka kart: Biochemia, Anatomia, Mikrobiologia JU...
  │ Przedmioty bez pytań → "Wkrótce dostępne"
  │ OSCE w osobnej sekcji "Egzamin praktyczny"
  ▼
Pierwsza sesja (/sesja/new → /sesja/{uuid})
  │ Tryb inteligentna: ANTARES dobiera 10 pytań
  │ Pytanie → odpowiedź → wyjaśnienie → pewność siebie → następne
  │ Adaptacja trudności w trakcie sesji
  ▼
Podsumowanie (/sesja/{uuid}/podsumowanie)
  │ Wynik: 7/10 (70%), +85 XP, streak 1 dzień
  │ Rozbicie per temat, insights ANTARES
  │ Opcje: "Powtórz błędne", "Nowa sesja", "Wróć do przedmiotu"
  ▼
Powrót na pulpit
  │ Ring: 10/25 pytań, streak 1, ranga Praktykant (85/500 XP)
  │ Heatmapa: 1 zielony kwadrat
  │ Quick Start: "Kontynuuj Biochemię — 70% opanowania"
  ▼
Kolejne dni → nawyk
  │ Codzienne sesje → streak rośnie
  │ ANTARES planuje powtórki → "Powtórki na dziś: 8 pytań"
  │ Słabe punkty: "Enzymy i kinetyka enzymatyczna — 35%"
  │ Ranga: Praktykant → Asystent → Rezydent I°
  ▼
Przygotowanie do egzaminu
  │ exam_readiness_score rośnie
  │ Symulacja OSCE: timer per stacja, próg zdawalności
  │ Statystyki: trend trafności, rozkład per przedmiot
```

### Codzienna pętla aktywnego użytkownika

```
Otwarcie aplikacji
  ├─ Pulpit: "Powtórki na dziś: 12 pytań" → klik
  ├─ Sesja inteligentna (ANTARES: due reviews + nowe)
  ├─ Podsumowanie → XP, streak, insights
  ├─ Powrót na pulpit: cel dzienny 12/25
  ├─ Ewentualnie: kolejna sesja lub OSCE
  └─ Zamknięcie → jutro kolejna powtórka
```

---

## 13. Architektura dla nietechnicznych stakeholderów

### Co to jest "Kurs na LDEK"?

Aplikacja webowa do nauki na egzaminy stomatologiczne (LDEK). Studenci logują się, rozwiązują pytania, a system inteligentnie planuje powtórki i śledzi postęp.

### Jak to działa — uproszczony schemat

```
┌─────────────────────────────────────┐
│         PRZEGLĄDARKA STUDENTA       │
│                                     │
│  Pulpit → Przedmioty → Sesja nauki │
│  Statystyki → Osiągnięcia → OSCE   │
└──────────────┬──────────────────────┘
               │ internet
┌──────────────▼──────────────────────┐
│       SERWER APLIKACJI (Vercel)     │
│                                     │
│  Strony, logika biznesowa,          │
│  algorytm ANTARES (planuje          │
│  powtórki i dobiera pytania)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         BAZA DANYCH (Supabase)      │
│                                     │
│  Konta użytkowników, pytania,       │
│  postęp nauki, wyniki sesji,        │
│  XP i rangi, osiągnięcia            │
└─────────────────────────────────────┘
```

### Kluczowe pojęcia

| Pojęcie | Co to znaczy |
|---------|-------------|
| **ANTARES** | Wewnętrzny algorytm, który decyduje jakie pytania pokazać studentowi i kiedy zaplanować powtórkę. Bazuje na badaniach naukowych o zapamiętywaniu (spaced repetition). |
| **FSRS** | Algorytm naukowy (Free Spaced Repetition Scheduler) wbudowany w ANTARES. Oblicza kiedy student zapomni dane pytanie i planuje powtórkę tuż przed tym momentem. |
| **Mastery** | Stopień opanowania tematu (0-100%). Uwzględnia: ile pytań student widział, ile odpowiedział poprawnie, i jak dobrze pamięta materiał. |
| **Streak** | Seria dni z rzędu, w których student był aktywny. Motywuje do codziennej nauki. |
| **Ranga** | Poziom studenta (Praktykant → Asystent → Rezydent → Specjalista → Mistrz LDEK) oparty na zdobytych XP. |
| **KNNP** | Kolokwium z Nauk Podstawowych — moduł z pytaniami testowymi z przedmiotów podstawowych. |
| **OSCE** | Objective Structured Clinical Examination — moduł symulujący egzamin praktyczny ze stacjami klinicznymi. |
| **Leech** | Pytanie, które student ciągle myli (≥3 błędy z rzędu). System oznacza je i częściej pokazuje. |

### Co widzi student

1. **Pulpit** — podsumowanie dnia: cel dzienny, streak, zaległe powtórki, ranga, heatmapa aktywności, wykres postępu, słabe punkty
2. **Przedmioty** — lista przedmiotów z postępem (Biochemia 45%, Anatomia 72%...), postęp ogólny roku
3. **Sesja nauki** — pytania jedno po drugim, z wyjaśnieniami i oceną pewności siebie
4. **Podsumowanie** — wynik sesji, zdobyte XP, rozbicie per temat
5. **Statystyki** — wykresy trafności, aktywności, rozkład per przedmiot
6. **OSCE** — symulacja egzaminu praktycznego z timerem

### Dane i bezpieczeństwo

- Każdy student widzi **tylko swoje** dane (enforced na poziomie bazy danych)
- Hasła zarządzane przez Supabase Auth (nie przechowujemy ich sami)
- Hosting na Vercel (automatyczny deploy z repozytorium)
- Baza danych na Supabase (managed PostgreSQL)

---

## 14. Use cases dla użytkowników

### UC-U1: "Chcę się uczyć na kolokwium z biochemii"

1. Logujesz się do aplikacji
2. Na pulpicie klikasz "Rozpocznij sesję" lub idziesz do "Moje przedmioty"
3. Wybierasz "Biochemia" z listy przedmiotów
4. Klikasz "Rozpocznij sesję" — system dobiera 10 pytań dopasowanych do Twojego poziomu
5. Odpowiadasz na pytania — po każdym widzisz wyjaśnienie
6. Po sesji widzisz wynik (np. 8/10) i zdobyte punkty XP
7. System zaplanuje powtórkę pytań, które sprawiły Ci trudność

### UC-U2: "Mam zaległe powtórki"

1. Na pulpicie widzisz kafelek "Powtórki na dziś: 15 pytań"
2. Klikasz "Rozpocznij powtórkę"
3. System pokazuje Ci pytania, które powinieneś powtórzyć właśnie dziś (na podstawie algorytmu ANTARES)
4. Po sesji powtórkowej system przesunie termin następnej powtórki — im lepiej odpowiadasz, tym rzadziej wracają

### UC-U3: "Chcę zobaczyć swój postęp"

1. Na pulpicie widzisz: cel dzienny (np. 12/25 pytań), streak (5 dni), rangę (Rezydent I°)
2. Heatmapa pokazuje Twoją aktywność z ostatnich 13 tygodni (jak na GitHubie)
3. Wykres "Twój postęp" pokazuje jak zmienia się Twoja trafność w czasie
4. "Słabe punkty" pokazują 5 tematów, które warto powtórzyć
5. Na stronie przedmiotów widzisz postęp ogólny roku (np. 43/73 pytań, 59%)

### UC-U4: "Chcę ćwiczyć na egzamin OSCE"

1. Na stronie przedmiotów klikasz "Egzamin praktyczny" → OSCE
2. Wybierasz dzień egzaminu (1 lub 2)
3. Przechodzisz przez stacje z pytaniami — każda ma timer
4. Typy pytań: test jednokrotnego wyboru, porządkowanie, identyfikacja na obrazie
5. Po zakończeniu widzisz wynik per stacja i czy zdałeś

### UC-U5: "Chcę wiedzieć ile mi brakuje do następnej rangi"

1. Na pulpicie kafelek "Ranga" pokazuje Twój aktualny poziom (np. Asystent)
2. Pasek postępu pokazuje ile XP masz i ile potrzebujesz do następnej rangi
3. XP zdobywasz za: poprawne odpowiedzi (+5), trudne pytania (+10), serie poprawnych (+15), ukończenie sesji (+20)
4. Rangi: Praktykant → Asystent → Rezydent I° → II° → III° → Specjalista → Mistrz LDEK

### UC-U6: "Pomyliłem pytania w sesji i chcę je powtórzyć"

1. Po zakończeniu sesji klikasz "Powtórz błędne"
2. System tworzy nową sesję tylko z pytaniami, które pomyliłeś
3. Tym razem po poprawnej odpowiedzi system zaktualizuje Twój postęp

---

## 15. Struktura pytań do dodania do Supabase

### Hierarchia: przedmiot → temat → pytanie

```
subjects (przedmiot)
  └── topics (temat/dział)
        └── questions (pytanie)
```

### 1. Dodawanie przedmiotu (`subjects`)

Przedmioty są już seeded w bazie. Jeśli trzeba dodać nowy:

```sql
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order)
VALUES (
  'stoma-farmakologia',          -- id: unikalne, pattern: {track}-{nazwa}
  'Farmakologia',                -- name: pełna nazwa
  'Farmakologia',                -- short_name: skrócona (na kartach)
  'pill',                        -- icon_name: nazwa ikony z lucide-react
  2,                             -- year: rok studiów (1, 2, 3...)
  'stomatologia',                -- track: kierunek (stomatologia / lekarski)
  'knnp',                        -- product: moduł (knnp / osce)
  12                             -- display_order: kolejność na liście
);
```

Dostępne ikony (`icon_name`): `book-open`, `bone`, `microscope`, `zap`, `flask-conical`, `dna`, `heart-pulse`, `bug`, `pill`, `activity`, `clipboard-check`, `scan`

### 2. Dodawanie tematu (`topics`)

```sql
INSERT INTO topics (id, subject_id, name, display_order, question_count)
VALUES (
  'FARM-01',                     -- id: unikalne, pattern: {SKRÓT}-{NR}
  'stoma-farmakologia',          -- subject_id: FK do subjects.id
  'Farmakokinetyka',             -- name: nazwa tematu
  1,                             -- display_order: kolejność w przedmiocie
  10                             -- question_count: ile pytań w temacie
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  question_count = EXCLUDED.question_count;
```

**Ważne**: `question_count` musi odpowiadać rzeczywistej liczbie aktywnych pytań w temacie. Po dodaniu pytań zaktualizuj tę wartość.

### 3. Dodawanie pytań (`questions`)

#### Format pytania jednokrotnego wyboru (standard KNNP)

```sql
INSERT INTO questions (
  id, topic_id, text, options, correct_option_id, 
  explanation, difficulty, source_exam, source_code,
  question_type, is_active
) VALUES (
  'farm-01-001',                 -- id: unikalne, pattern: {temat}-{nr}
  'FARM-01',                     -- topic_id: FK do topics.id
  
  'Który parametr farmakokinetyczny opisuje frakcję leku, która dociera do krążenia ogólnego w postaci niezmienionej?',
  -- text: treść pytania (plain text, bez numeracji opcji)
  
  '[
    {"id": "a", "text": "Klirens nerkowy"},
    {"id": "b", "text": "Objętość dystrybucji"},
    {"id": "c", "text": "Biodostępność"},
    {"id": "d", "text": "Okres półtrwania"},
    {"id": "e", "text": "Stałe wiązania z białkami"}
  ]'::jsonb,
  -- options: JSONB array, każda opcja ma id (a-e) i text
  
  'c',                           -- correct_option_id: id poprawnej opcji
  
  $E$Biodostępność (F) to frakcja podanej dawki leku, która dociera 
  do krążenia ogólnego w postaci aktywnej farmakologicznie. Dla leków 
  podawanych dożylnie F = 1 (100%). Dla leków doustnych F < 1 ze 
  względu na efekt pierwszego przejścia przez wątrobę, niepełne 
  wchłanianie z przewodu pokarmowego, oraz metabolizm w ścianie 
  jelita.$E$,
  -- explanation: wyjaśnienie poprawnej odpowiedzi (dollar-quoted string)
  
  'srednie',                     -- difficulty: 'latwe' | 'srednie' | 'trudne'
  NULL,                          -- source_exam: opcjonalnie źródło egzaminu
  NULL,                          -- source_code: opcjonalnie kod pytania
  'single_choice',               -- question_type: typ pytania
  true                           -- is_active: czy pytanie jest aktywne
);
```

#### Format opcji (JSONB)

```json
[
  {"id": "a", "text": "Treść opcji A"},
  {"id": "b", "text": "Treść opcji B"},
  {"id": "c", "text": "Treść opcji C"},
  {"id": "d", "text": "Treść opcji D"},
  {"id": "e", "text": "Treść opcji E"}
]
```

- Zawsze 5 opcji (a-e) — standard egzaminu LDEK
- `correct_option_id` musi odpowiadać jednemu z `id` w tablicy options

#### Poziomy trudności

| Wartość | Znaczenie | Kiedy używać |
|---------|-----------|-------------|
| `latwe` | Podstawowa wiedza | Fakty, definicje, proste skojarzenia |
| `srednie` | Wymaga zrozumienia | Mechanizmy, porównania, zastosowanie wiedzy |
| `trudne` | Analiza i synteza | Przypadki kliniczne, wieloetapowe rozumowanie |

#### Typy pytań (OSCE)

Oprócz `single_choice` (standard KNNP), OSCE wspiera:

| `question_type` | Dodatkowe kolumny | Opis |
|-----------------|-------------------|------|
| `single_choice` | — | Standardowe pytanie MCQ |
| `ordering` | `correct_order` (JSONB) | Uporządkuj elementy we właściwej kolejności |
| `image_identify` | `image_url`, `hotspots` (JSONB) | Wskaż strukturę na obrazie |
| `conversion_drill` | `drill_questions` (JSONB) | Przeliczanie jednostek / dawek |

### 4. Batch insert — wzorzec dla wielu pytań

```sql
INSERT INTO questions (id, topic_id, text, options, correct_option_id, explanation, difficulty) VALUES

('farm-01-001', 'FARM-01',
 'Treść pytania 1...',
 '[{"id":"a","text":"Opcja A"},{"id":"b","text":"Opcja B"},{"id":"c","text":"Opcja C"},{"id":"d","text":"Opcja D"},{"id":"e","text":"Opcja E"}]'::jsonb,
 'c',
 $E$Wyjaśnienie 1...$E$,
 'srednie'),

('farm-01-002', 'FARM-01',
 'Treść pytania 2...',
 '[{"id":"a","text":"Opcja A"},{"id":"b","text":"Opcja B"},{"id":"c","text":"Opcja C"},{"id":"d","text":"Opcja D"},{"id":"e","text":"Opcja E"}]'::jsonb,
 'a',
 $E$Wyjaśnienie 2...$E$,
 'latwe')

ON CONFLICT (id) DO UPDATE SET
  text = EXCLUDED.text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  difficulty = EXCLUDED.difficulty;

-- Po dodaniu pytań, zaktualizuj question_count w topics:
UPDATE topics SET question_count = (
  SELECT COUNT(*) FROM questions 
  WHERE topic_id = 'FARM-01' AND is_active = true
) WHERE id = 'FARM-01';
```

### 5. Checklist dodawania contentu

1. Upewnij się, że przedmiot (`subjects`) istnieje w bazie
2. Dodaj/zaktualizuj temat (`topics`) z poprawnym `subject_id`
3. Dodaj pytania (`questions`) z poprawnym `topic_id`
4. Zaktualizuj `question_count` w temacie
5. Sprawdź w panelu admina (`/admin/pytania`) czy pytania się wyświetlają
6. Uruchom testową sesję z danego tematu
