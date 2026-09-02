# PRODUKT-MATRYCA — Kurs na LDEK / Zenit Labs

Inwentarz funkcji i metryk. Każde twierdzenie ma pokrycie w kodzie, schemacie albo w zapytaniu do produkcji.

| Pole | Wartość |
|---|---|
| Snapshot | 2026-08-29 |
| Repo | working tree `main` + git HEAD |
| Prod DB | Supabase `unfcpipxraiyacyzqanh`, region `eu-central-1`, Postgres 17 |
| Host publiczny | `https://kursnaldek.pl` |

**Rozjazd working tree vs produkcja (OSCE).** W niezcommitowanym working tree skasowano `app/(dashboard)/osce/**` i `features/osce/**`, a `next.config.ts` dodaje redirect `/osce` → `/przedmioty`. Na produkcji `https://kursnaldek.pl/osce` nadal odpowiada stroną logowania (nie 404). Karty OSCE opisują **stan zdeployowany / git HEAD**, z adnotacją o lokalnym usunięciu.

---

## 1. Metryki twarde

Źródło liczb: produkcja, 2026-08-29, o ile nie napisano inaczej. `aktywne` = `questions.is_active = true`.

### 1.1 Pytania ogółem

| Zakres | Aktywne | Wszystkie |
|---|---:|---:|
| Cała baza | 18 885 | 18 925 |
| `subjects.product = knnp` | 10 886 | 10 926 |
| `subjects.product = ldew` | 7 930 | 7 930 |
| `subjects.product = osce` | 69 | 69 |
| `subjects.product = ldek` | 0 | 0 |

`question_type` na produkcji: wyłącznie `single_choice` (18 885 aktywnych). Typy `ordering`, `image_identify`, `conversion_drill` istnieją w mapperach kodu; w prod **0** wierszy.

### 1.2 Źródła (`questions.source`)

| Produkt | `own` | `cem` | `uczelnia` |
|---|---:|---:|---:|
| knnp | 5 482 | 846 | 4 558 |
| ldew | 7 930 | 0 | 0 |
| osce | 69 | 0 | 0 |
| ldek | — | — | — |

### 1.3 Przedmioty i tematy

| `subjects.product` | Przedmioty | Tematy | `topics.is_inbox` |
|---|---:|---:|---:|
| knnp | 34 | 162 | 0 |
| ldew | 8 | 161 | 0 |
| osce | 7 | 18 | 0 |
| ldek | 0 | 0 | 0 |
| **suma** | 49 | 341 | 0 |

### 1.4 KNNP — aktywne pytania per przedmiot

Treść wspólna (anatomia, histologia, biofizyka, fizjologia, mikrobiologia, farmakologia) leży na kanonicznych ID, nie na powłokach `stoma-*` / `lek-*`. Powłoka z `active = 0` nie znaczy „brak treści w UI”. Mapowanie: `features/session/server/sharedSubjects.ts`.

| id | Nazwa | track / rok | aktywne |
|---|---|---|---:|
| anatomia | Anatomia | shared / 1 | 1 552 |
| histologia | Histologia i embriologia | shared / 1 | 1 184 |
| biofizyka | Biofizyka | shared / 1 | 852 |
| fizjologia | Fizjologia | shared / 2 | 933 |
| mikrobiologia | Mikrobiologia | shared / 2 | 560 |
| farmakologia | Farmakologia | shared / 3 | 1 738 |
| stoma-angielski | Język angielski medyczny | stoma / 1 | 1 361 |
| lek-prof-humanizm | Profesjonalizm i humanizm | lek / 1 | 608 |
| stoma-zakazne | Choroby zakaźne | stoma / 3 | 882 |
| stoma-patologia | Patomorfologia | stoma / 2 | 576 |
| stoma-mikrobio-ju | Mikrobiologia jamy ustnej | stoma / 2 | 465 |
| stoma-narzad-zucia | Anatomia i Fizjologia Narządu Żucia | stoma / 2 | 111 |
| stoma-socjologia | Socjologia medycyny | stoma / 1 | 64 |
| stoma-biochemia | Biochemia | stoma / 2 | 0 (10 nieaktywnych) |
| stoma-osce | OSCE (placeholder KNNP) | stoma / 2 | 0 |
| lek-anatomia, lek-biofizyka, lek-histologia, lek-biologia-mol, lek-biochemia, lek-fizjologia, lek-angielski, lek-immunologia, lek-patofizjologia, lek-farmakologia, lek-mikrobio, stoma-anatomia, stoma-histologia, stoma-biofizyka, stoma-biologia, stoma-chemia, stoma-fizjologia, stoma-mikrobio, stoma-farmakologia | powłoki / puste | — | 0 |

Ukryte w katalogu stomatologii (`HIDDEN_STOMA_CATALOG_SUBJECT_IDS` w `lib/content/catalogSubjectVisibility.ts`): `stoma-biochemia`, `stoma-fizjologia`, `stoma-mikrobio`, `stoma-mikrobio-ju`. `stoma-mikrobio-ju` ma 465 pytań w DB i **nie jest listowany** w katalogu stoma.

### 1.5 LDEW — aktywne pytania per przedmiot

| id | Nazwa | aktywne |
|---|---|---:|
| ldew-chirurgia-stomatologiczna | Chirurgia stomatologiczna i szczękowo-twarzowa | 2 349 |
| ldew-stomatologia-zachowawcza | Stomatologia zachowawcza | 1 464 |
| ldew-stomatologia-dziecieca | Stomatologia dziecięca | 1 060 |
| ldew-protetyka | Protetyka stomatologiczna | 1 039 |
| ldew-ortodoncja | Ortodoncja | 759 |
| ldew-endodoncja | Endodoncja | 644 |
| ldew-periodontologia | Periodontologia | 383 |
| ldew-choroby-sluzowki | Choroby błony śluzowej | 232 |

Seed `scripts/2026-08-04-ldew-clinical-subjects-periodontologia.sql` wstawiał radiologię, zdrowie publiczne, orzecznictwo i osobną chirurgię szczękowo-twarzową. Na prod tych kafli nie ma (zgodne z `FormatPisaniaPytan-LDEW.md`: usunięte kafle).

### 1.6 OSCE — stacje (prod)

| id | short_name | aktywne |
|---|---|---:|
| osce-s1-pedodoncja-komunikacja | Pedo + Komunikacja | 6 |
| osce-s2-morfologia | Morfologia | 11 |
| osce-s3-zachowawcza-endo | Zachowawcza + Endo | 6 |
| osce-s4-chirurgia | Chirurgia | 16 |
| osce-s5-protetyka | Protetyka | 9 |
| osce-s6-periodontologia | Perio | 10 |
| osce-s7-materialoznawstwo | Materiałoznawstwo | 11 |

Atlas OPG: `opg_atlas_images` = **1**; `opg_structures` = **30**.  
Kolumny `hotspots` / `correct_order` / `drill_questions` na aktywnych pytaniach: **0**.

### 1.7 Wyjaśnienia (prod)

| Metryka | n |
|---|---:|
| `explanation` niepuste (trim) | 17 522 |
| `explanation` puste (`''`) | 1 363 |
| `explanation_status = reviewed` | 18 885 |
| `draft` / `missing` | 0 / 0 |
| `explanation_blocks` nie-NULL | 0 |
| `image_url` niepuste | 14 |

Kolumna `questions.explanation` jest `NOT NULL` w schemacie; puste to pusty string. Standard redakcyjny (`FormatPisaniaPytan.md`): min. 2–5 zdań, 5 opcji `a`–`e`. Struktura `{ takeaway, correctReason, distractors }` jest w kodzie (`explanation_blocks`); na prod nieużywana.

### 1.8 Egzaminy CEM (`cem_sessions`)

14 wierszy, wszystkie `product = ldek`, **`is_published = false`**, **`total_questions = 0`**.

ID: `ldek-2017-s1`, `ldek-2018-s1`, `ldek-2019-s1`, `ldek-2019-s2`, `ldek-2020-s1`, `ldek-2021-s1`, `ldek-2022-s1`, `ldek-2023-s1`, `ldek-2023-s2`, `ldek-2023-s3`, `ldek-2024-s1`, `ldek-2024-s2`, `ldek-2025-s1`, `ldek-2025-s2`.

Brak sesji `product = ldew`.

### 1.9 Osiągnięcia i rangi

- Osiągnięcia w DB: **12** (`scripts/seed-achievements.sql`, `features/gamification/lib/achievements-config.ts`).
- Rangi: **7** w kodzie (`RANK_TIERS` w `features/gamification/lib/ranks.ts`). Nie są tabelą. `profiles.rank_tier` default `'praktykant'`.

### 1.10 Eksperymenty nauki (prod `learning_experiment_configs`)

| experiment_key | active | rollout_percent | scheduler_version |
|---|---|---:|---|
| memory-v2-rollout | false | 0 | memory-v2/ts-fsrs-5.4.1 |
| adaptive-feedback-v1 | false | 0 | not-applicable |
| daily-plan-v1 | false | 0 | not-applicable |

---

## 2. Silnik nauki

### Inteligentna sesja (ANTARES)

- **Co to robi:** Student startuje sesję trybu „inteligentna”. Dostaje listę pytań złożoną z powtórek z terminem, pytań jeszcze nie widzianych i leechy. W trakcie sesji kolejność pozostałych pozycji może się zmienić.
- **Jak działa pod maską:**
  - Wejście: `startSession({ mode: "inteligentna" })`. W DB: `study_sessions.mode = 'nauka'`, `session_kind = 'intelligent'`.
  - Pule kandydatów: due i unseen, każda cap **800** (`MAX_DUE_CANDIDATES`, `MAX_UNSEEN_CANDIDATES` w `buildAntaresInteligentnaSession.ts`).
  - Ranking due — `calculateDueUrgency`:
    - `retrievabilityUrgency = 1 - R`
    - `overdueFactor = min(1.5, daysOverdue / 30)`
    - `weaknessBoost = (1 - mastery) * 0.3`
    - `leechFactor = 0.7` gdy leech, inaczej `1`
    - wynik = `(retrievabilityUrgency * 0.5 + overdueFactor * 0.3 + weaknessBoost * 0.2) * leechFactor`, clamp `[0, 1]`
  - Ranking nowych — `calculateNewQuestionPriority`: `(1 - coverage) * 0.55 + (1 - mastery) * 0.45`, clamp `[0, 1]`.
  - `learningValueScore` = `(100 * risk * overdueMul * sourceMul * recurrenceMul * weaknessMul * leechMul * conceptMul) / timeCost`
    - `risk` = `0.55` dla nowych, inaczej `max(0.05, 1 - R)`
    - `overdueMul = 1 + min(1, overdueDays / 30)`
    - `sourceMul = 1.25` gdy `source ∈ {cem, lek, ldek}`, inaczej `1`
    - `recurrenceMul = 1 + min(0.5, repeatCount * 0.08)`
    - `weaknessMul = 0.6 + (1 - mastery) * 0.8`
    - `leechMul = 1.2` gdy leech
    - `conceptMul` max `+15%`
    - `timeCost` clamp 15–180 s, default 45
  - Mix (gdy brak `targetMix` z planu dnia):
    - `dueRatio = dueCount / (totalPool + 1)`, potem clamp `[0.1, 0.95]`
    - egzamin `< 14` dni: `dueRatio += 0.2`; `< 30` dni: `+= 0.1`
    - `accuracyLast20 < 0.5`: `+= 0.15`; `> 0.8`: `-= 0.1`
    - `questionsToday >= daily_goal`: `+= 0.1`; `questionsToday + count < daily_goal * 0.5`: `-= 0.05`
    - max **3** leeche wstawiane w miejsce due
  - Potem: `interleaveByTopic` (round-robin tematów), `applyPersonalizedCurve` (20% rozgrzewka wg `personalEase`, 60% rdzeń po `score`, 20% schłodzenie).
  - Rezerwa: `ceil(count * 0.3)`, clamp 2–10; `0` gdy `count < 5` (`RESERVE_RATIO = 0.3`, `RESERVE_MIN = 2`, `RESERVE_MAX = 10`).
  - Temat w pełni widziany i `count >= pool.length` → `shuffle` całej puli, bez composera.
  - Tematy `topics.is_inbox = true` są wyłączane z puli (`fetchActiveQuestionsForTopics`).
  - `estimatedDuration` w composerze = `count * 15` sekund (stała, nie z czasu usera).
- **Liczby:** cap pul 800+800; max 3 leeche; rezerwa 0 / 2–10; krzywa 20/60/20.
- **Dowód:** `features/session/server/buildAntaresInteligentnaSession.ts`, `features/session/lib/antares/sessionComposer.ts`, `features/session/lib/antares/urgencyScore.ts`, `features/session/lib/antares/newQuestionPriority.ts`, `features/session/lib/antares/learningValueScore.ts`, `features/session/lib/antares/reservePool.ts`, `features/session/api/startSession.ts`.
- **Status:** LIVE (due i postęp z FSRS v1 / `user_question_progress`). `targetMix` z planu dnia tylko przy treatment `daily-plan-v1` — prod 0%.
- **Czego NIE komunikować:** że due liczy FSRS v2; że plan dnia układa mix na produkcji.

### FSRS / spaced repetition

- **Co to robi:** Po każdej odpowiedzi karta dostaje `next_review`. Powtórka due = `next_review <= now`.
- **Jak działa pod maską:**
  - Biblioteka: `ts-fsrs` **5.4.1** (`package.json`).
  - Identyfikator v1: `legacy-v1/ts-fsrs-5.4.1`. v2: `memory-v2/ts-fsrs-5.4.1`.
  - `enable_fuzz: false`.
  - Ustawienia **v1 używane przy zapisie due** (`LEGACY_SETTINGS` w `features/session/lib/spaced-repetition.ts`): `requestRetention = 0.9`, `maximumInterval = 365` dni.
  - Mapowanie oceny (`confidenceToRating` / `classifyAttemptRating`):
    - błąd → `Rating.Again` (1)
    - poprawna + `nie_wiedzialem` → Hard (2)
    - poprawna + `troche` → Good (3)
    - poprawna + `na_pewno` → Easy (4)
    - brak pewności (tryb klasyczny): błąd Again, poprawna Good; `source: "observed"`
  - `next_review` = `scheduler.next(card, now, rating).card.due`, zapis przez RPC `apply_user_question_review`.
  - `deriveRetentionPolicy` liczy `requestRetention` w `[0.82, 0.95]` i `maximumInterval` (3650 albo `daysToExam`) i zapisuje na `study_sessions`. **Due v1 i tak idzie przez `LEGACY_SETTINGS` 0.9 / 365**, nie przez tę policy.
  - v2: tabela `user_question_memory_v2`; treatment tylko gdy `memory-v2-rollout` treatment. Prod: `active=false`, 0%.
- **Liczby:** retencja v1 0.9; max interwał v1 365 dni; 4 stopnie oceny FSRS.
- **Dowód:** `features/session/lib/memory/scheduler.ts`, `features/session/lib/spaced-repetition.ts`, `features/session/server/persistUserProgressFsrs.ts`, `features/session/lib/memory/retentionPolicy.ts`.
- **Status:** v1 LIVE. v2 ZBUDOWANE-NIEWŁĄCZONE (shadow + rollout 0%).
- **Czego NIE komunikować:** spersonalizowanych wag FSRS jako silnika due; Brier/log loss z handoveru bez świeżego raportu.

### Tryby sesji

- **Co to robi:** Student wybiera sposób doboru i prezentacji pytań.
- **Jak działa pod maską:**

| UI | `startSession.mode` | DB `mode` | Dobór |
|---|---|---|---|
| Inteligentna | `inteligentna` | `nauka` | ANTARES |
| Klasyczna | `przeglad` | `egzamin` | temat: najpierw unseen (`mixTopicCompletionQuestionIds`); inaczej `shuffle(pool).slice(0, count)` |
| Katalog | `katalog` | `egzamin` | cała pula; UI podgląd `nauka` vs `egzamin` (odpowiedź ukryta do wyboru) |
| Powtórki due | `inteligentna` + `focus=due` | `nauka` | wyłącznie due; 0 due → błąd |
| Retry błędnych | query `retry` | jak sesja źródłowa | lista błędów z sesji |
| Mix (bez przedmiotu) | `subjectId` puste | `nauka` | pula z przedmiotów w zakresie roku/tracku |
| OSCE temat | `createOsceTopicSession` | `osce_topic`, `session_kind=osce` | loader OSCE |

`count`: Zod `min(1).max(5000)`. Default `profiles.default_question_count` i `last_session_question_count` = 25. `daily_goal` default 25.

- **Liczby:** max 5000 pytań na start; default 25.
- **Dowód:** `features/session/api/startSession.ts`, `features/session/lib/sessionModeLabel.ts`, `features/session/types.ts` (`KnnpSessionMode`).
- **Status:** LIVE (KNNP/LDEW). OSCE topic — LIVE na prod; usunięte w lokalnym working tree.
- **Czego NIE komunikować:** katalogu jako „egzamin CEM na czas”.

### Mastery_score i weakness_rank

- **Co to robi:** Po sesji student ma na temacie wynik opanowania i ranking „najsłabszy temat”.
- **Jak działa pod maską:**
  - `coverage = min(1, seen / totalQuestions)`; `seen` = liczba wierszy `user_question_progress` w temacie.
  - `accuracy = total_correct / total_answered` (sumy `times_answered` / `times_correct`).
  - `avg_retrievability` = średnia FSRS R po kartach z historią.
  - **`mastery_score = coverage * 0.3 + accuracy * 0.3 + avg_retrievability * 0.4`**.
  - Trend 7 dni: `accuracy_last_7d` vs globalna ±0.05 → `improving` / `declining` / `stable`.
  - `weakness_rank` = `row_number() OVER (ORDER BY mastery_score ASC, topic_id ASC)` — RPC `recompute_topic_mastery_weakness_rank`.
  - Kolumny `ref_total` / `ref_seen` / `ref_correct` liczone także dla KNNP (filtr UI nie musi być live).
- **Liczby:** wagi 0.3 / 0.3 / 0.4; próg trendu 0.05.
- **Dowód:** `features/session/lib/antares/recalculateTopicMastery.ts`, `scripts/2026-06-20-weakness-rank-rpc.sql`.
- **Status:** LIVE.

### Exam readiness

- **Co to robi:** Po sesji i na statystykach student widzi liczbę 0–100, etykietę, do trzech najsłabszych tematów, szacowaną datę gotowości i rekomendowaną dawkę dzienną.
- **Jak działa pod maską:**
  - Średnia ważona `masteryScore` tematów z `seenQuestions > 0` (waga = `totalQuestions`).
  - × `coveragePenalty(globalCoverage)`: `≥ 0.65` → 1; `≥ 0.35` → interpolacja 0.55–1; poniżej 0.35 → 0.25–0.55.
  - Przy `< 50` odpowiedziach: `score = score * blend + sessionPct * (1 - blend) * 0.35`, `blend = n / 50`.
  - Verdict: `≥ 85` „Zdasz z marszu”; `≥ 70` „Dobrze rokuje”; `≥ 50` „W połowie drogi”; `≥ 25` „Dużo do nadrobienia”; else „Na początku drogi”. Prefix gdy pokrycie `< 0.2` albo ocena wstępna.
  - `dailyRecommendation` default 25; gdy jest `exam_date` i remaining > 0: `clamp(round(remaining / daysToExam), 10, 100)`.
  - Percentyl kohorty: RPC `get_readiness_percentile`; cache na `profiles` (`readiness_percentile`, `readiness_cohort_size`, `readiness_user_attempts`, `readiness_computed_at`). W loaderze statystyk `readinessMargin = 0.05`.
- **Liczby:** skala 0–100; dawka 10–100 albo 25; percentyl z RPC.
- **Dowód:** `features/session/lib/antares/examReadiness.ts`, `scripts/2026-05-18-readiness-percentile.sql`, `features/statistics/server/refreshReadinessPercentileCache.ts`.
- **Status:** LIVE.
- **Czego NIE komunikować:** że readiness = trafność CEM. W kodzie jest TODO: `0.6 * mastery + 0.4 * CEM` gdy baza CEM przekroczy ~150/przedmiot — niezaimplementowane.

### Adaptacja w sesji, zmęczenie, transfer pojęć, leech

- **Co to robi:** W inteligentnej sesji kolejne pytania reagują na serię błędów/trafień; po błędzie może wejść pytanie z tego samego pojęcia; leeche są oznaczane.
- **Jak działa pod maską:**
  - `personalEaseScore` = `R * 0.4 + acc * 0.3 + topicMastery * 0.2 + fsrsEase * 0.1 − leechPenalty`; `fsrsEase = 1 − clamp(difficulty / 10)`; nowe: `acc` default 0.45; leech −0.15.
  - Mid-session (`adaptRemainingQuestions`): 3 błędy z rzędu → sort ogona po ease malejąco; 5 trafień → po `score`. Leeche wypychane z ostatnich 2 pozycji.
  - Reserve swap: po 3 błędach zamiana na łatwiejsze z rezerwy (próg +0.05 ease); po 5 trafieniach na trudniejsze (−0.05).
  - Concept transfer: po błędzie, jeśli `shouldSchedule` i wspólne `conceptIds`, wstawia siostrzane na indeks `min(2, tail.length - 1)`.
  - Zmęczenie (`detectFatigue`): od 15 odpowiedzi; pierwsze 10 vs ostatnie 10; `accuracyDrop > 0.2` **lub** `avgTimeLast / avgTimeFirst > 1.5`. Banner w UI tylko gdy `adaptiveFeedbackEnabled`.
  - Adaptive feedback: `remedial` przy błędzie lub leech; `concise` gdy poprawna, nie leech, `R ≥ 0.8`, `priorAccuracy ≥ 0.75`, czas ≤ `max(10, 0.85 × avgTime)`; inaczej `standard`. Włączane tylko treatment `adaptive-feedback-v1`.
  - Leech: 3 błędy z rzędu → `is_leech`; reset po 2 poprawnych z rzędu; `leech_count` nie maleje (`LEECH_THRESHOLD = 3`, `LEECH_RESET_STREAK = 2`).
- **Dowód:** `features/session/lib/antares/midSessionAdapter.ts`, `features/session/lib/antares/questionMeta.ts`, `features/session/lib/antares/conceptTransfer.ts`, `features/session/lib/antares/leechDetector.ts`, `features/session/lib/adaptiveFeedback.ts`, `features/session/hooks/useSessionStudyFlow.ts`.
- **Status:** mechanika kolejki LIVE w inteligentnej. Wariant feedbacku i banner zmęczenia: ZA FLAGĄ eksperymentu (prod 0%).

---

## 3. Moduły

### KNNP

- **Co to robi:** Student kierunku i roku dostaje katalog przedmiotów, sesje i postęp dla studiów (nie egzaminu nostryfikacyjnego).
- **Jak działa pod maską:** `profiles.current_product = 'knnp'`. Oferty: `knnp-stomatologia-1|2|3`, `knnp-lekarski-1` (`STUDY_OPTIONS` / `KNNP_YEAR_OFFERS`). Rejestracja zamknięta: `lekarski:2`, `lekarski:3` (`CLOSED_REGISTRATION_OPTIONS`). Entitlement: wiersz `user_year_entitlements` z `product = knnp`, `track`, `year`.
- **Liczby:** 4 oferty w kodzie; 10 886 aktywnych pytań; 34 przedmioty / 162 tematy (w tym puste powłoki i hidden).
- **Dowód:** `features/access/lib/studyAccess.ts`, `features/access/lib/gateCatalog.ts`, `features/access/server/entitlements.ts`.
- **Status:** LIVE (sprzedaż + darmowy rok 2 stoma).
- **Czego NIE komunikować:** filtra źródła CEM/uczelnia jako włączonego dla KNNP (`SOURCE_FILTER_LIVE` nie zawiera `knnp`). Lekarskiego 2–3. `stoma-mikrobio-ju` jako kafel katalogu stoma.

### OSCE

- **Co to robi:** Student trenuje stacje praktyczne: lista stacji, atlas OPG, trening tematu, symulacja dnia 1 albo 2.
- **Jak działa pod maską:**
  - `subjects.product = 'osce'` (osobny produkt DB, nie `StudyProduct` entitlements).
  - Placeholder KNNP `stoma-osce` jest wyłączany z listy KNNP (`EXCLUDED_SHORT_NAMES = OSCE`).
  - Symulacja (`osceSimulation.ts`): `OSCE_SIM_PASS_THRESHOLD = 0.6`; timer stacji `15 * 60` s; `OSCE_TOPICS_PER_STATION = 2`; `OSCE_QUESTIONS_PER_TOPIC = 2`; pauza feedback 2500 ms. `passed_overall` = każda stacja ≥ 0.6. Zapis: `osce_simulations`, `osce_station_results`.
  - Typy w SQL COMMENT: `single_choice | ordering | image_identify | conversion_drill`. Conversion drill: `timer_seconds ?? 10`. Hotspoty: kolumna JSONB, nie osobny `question_type`.
  - Copy i18n (nie COUNT z DB): „7 stacji · 14 zadań · próg 60%”; „Dzień 1: 3 stacje · Dzień 2: 4 stacje”.
  - Pinch-zoom: minScale 1, maxScale 4, doubleTap 2 (`usePinchZoom.ts`).
- **Liczby:** 7 stacji, 69 MCQ, 1 panorama, 30 struktur; próg 0.6; 15 min/stację.
- **Dowód:** git HEAD `features/osce/**`, `app/(dashboard)/osce/**`; prod tabele `osce_*`, `opg_atlas_images`, `opg_structures`.
- **Status:** LIVE na produkcji. Working tree: pliki usunięte; niezcommitowany redirect 301. `FEATURES` nie ma klucza OSCE.
- **Czego NIE komunikować:** hotspotów / ordering / conversion drill jako treści na prod (0 wierszy). OSCE po deployu obecnego working tree.

### Katalog pytań

- **Co to robi:** Student przegląda pulę tematu lub przedmiotu pytanie po pytaniu, z opcją podglądu odpowiedzi albo ukrycia do wyboru.
- **Jak działa pod maską:** `mode = katalog`; `chosenIds = pool` (bez composera). `focusQuestionId` idzie na początek. W UI lokalny przełącznik `nauka` / `egzamin`.
- **Dowód:** `features/session/api/startSession.ts`, `features/session/components/CatalogView.tsx`.
- **Status:** LIVE.

### Filtr źródła pytań i egzaminy CEM

- **Co to robi:** Na LDEK/LDEW (gdy flaga builda) student filtruje pulę: wszystkie / referencyjne / autorskie. W katalogu może zawęzić do etykiety sesji CEM i do pytań z `repeat_count > 1`.
- **Jak działa pod maską:**
  - UI: `FEATURES.cemSource && isSourceFilterLive(subject.product)`.
  - `FEATURES.cemSource` = `process.env.NEXT_PUBLIC_FEATURE_CEM_SOURCE === "true"` (wstrzykiwane przy buildzie).
  - `SOURCE_FILTER_LIVE = ["ldek", "ldew"]`.
  - `.env.example`: `NEXT_PUBLIC_FEATURE_CEM_SOURCE=false`. Wartość na Vercel: **[DO WERYFIKACJI]**.
  - Filtr silnika: `all | reference | own`. Dla ldek/ldew `reference` = `['cem']`. Dla knnp (infrastruktura, nie live UI) = `['uczelnia', 'cem']`.
  - `hasCemExams`: tylko `ldek` i `ldew`. Włącza dropdown sesji w katalogu i kolumny rezerwy. **Nie ma osobnego runnera arkusza z limitem czasu sesji CEM.**
  - Rezerwa: niewidziane `source=cem` i `reserve_bucket ≥ 70` trzymane, dopóki mastery tematu ≤ 0.7 **i** egzamin > 14 dni **i** istnieje opublikowana sesja CEM **i** `protect_cem_pool` (default true). Na prod wszystkie `cem_sessions.is_published = false` → `isCemReserveUnlocked` zwraca true (rezerwa się nie uruchamia).
  - Thin CEM: `THIN_CEM_MAX = 4`.
- **Liczby:** 14 sesji CEM, 0 published, 0 pytań w `total_questions`; KNNP ma 846 `source=cem` na przedmiotach knnp, nie na produkcie ldek.
- **Dowód:** `lib/featureFlags.ts`, `lib/products.ts`, `features/session/lib/sourceFilter.ts`, `features/session/lib/antares/cemReserve.ts`, `features/session/lib/questionSourceBadge.ts`, `scripts/2026-08-21-cem-source.sql`.
- **Status:** ZA FLAGĄ (build-time) ∩ lista `ldek`/`ldew`. KNNP filtr: ZBUDOWANE-NIEWŁĄCZONE. Arkusze opublikowane: nie.
- **Czego NIE komunikować:** pełnych arkuszy CEM na czas; 14 sesji jako dostępnych studentowi.

---

## 4. Gamifikacja

### XP

- **Co to robi:** Po sesji student dostaje XP dopisane do `profiles.xp` i `study_sessions.xp_earned`.
- **Jak działa pod maską:** `computeSessionXp`:
  - `+5` za każdą poprawną (`XP_RULES.CORRECT_ANSWER`);
  - `+15` jeśli najlepsza seria poprawnych w sesji ≥ 5 (`STREAK_5`);
  - `+20` jeśli `totalQuestionsInSession ≥ 10` i `rows.length > 0` (`SESSION_COMPLETE`).
  - Nieużywane w naliczaniu (tylko stałe w `ranks.ts`): `CORRECT_HARD: 10`, `DAILY_ACTIVITY: 10`, `REVIEW_ON_TIME: 8`.
- **Dowód:** `features/session/server/computeSessionXp.ts`, `features/gamification/lib/ranks.ts`.
- **Status:** LIVE (trzy pierwsze reguły). Pozostałe trzy stałe: ZBUDOWANE-NIEWŁĄCZONE.

### Streak

- **Co to robi:** Na pulpicie i w profilu widać bieżącą serię dni.
- **Jak działa pod maską:** `nextStreakValues(last_active_date, current_streak)`:
  - brak daty → 1;
  - last active = dziś → bez zmian;
  - last active = wczoraj → `current + 1`;
  - inaczej → 1.
  - Data: lokalny kalendarz `YYYY-MM-DD` (`todayDateString`), nie IANA. Licznik pytań „dziś” na pulpicie: strefa Warsaw (`countSessionAnswersTodayWarsaw`).
- **Dowód:** `features/session/server/sessionStreak.ts`.
- **Status:** LIVE.

### Rangi

- **Co to robi:** Student widzi tier od Praktykanta do Mistrza i pasek do następnego.
- **Jak działa pod maską:** `getCurrentRank(xp)` — pierwszy `RANK_TIERS` gdzie `minXp ≤ xp < maxXp`.

| id | minXp (włącznie) | maxXp (wyłącznie) |
|---|---:|---:|
| praktykant | 0 | 5 000 |
| asystent | 5 000 | 15 000 |
| rezydent-1 | 15 000 | 30 000 |
| rezydent-2 | 30 000 | 50 000 |
| rezydent-3 | 50 000 | 80 000 |
| specjalista | 80 000 | 120 000 |
| mistrz | 120 000 | ∞ |

Komentarz w kodzie: progi ×10 względem wcześniejszej wersji.

- **Dowód:** `features/gamification/lib/ranks.ts`.
- **Status:** LIVE.

### Osiągnięcia

- **Co to robi:** Na `/osiagniecia` student widzi 12 osiągnięć z postępem i XP.
- **Jak działa pod maską:** definicje w DB `achievements` + config TS. Odblokowanie: `user_achievements`.

| id | category | target_value | xp_reward |
|---|---|---:|---:|
| pierwsza-sesja | milestones | 1 | 25 |
| setka | milestones | 100 | 50 |
| tysiac | milestones | 1000 | 200 |
| maraton | milestones | 100 | 100 |
| perfekcyjna-sesja | accuracy | 1 | 100 |
| snajper | accuracy | 7 | 150 |
| tygodniowy-rytm | consistency | 7 | 50 |
| miesieczna-dyscyplina | consistency | 30 | 200 |
| kwartalna-konsekwencja | consistency | 90 | 500 |
| wszechstronny | mastery | 1 | 300 |
| nocny-maratonczyk | special | 50 | 75 |
| wczesny-ptak | special | 1 | 50 |

- **Dowód:** `scripts/seed-achievements.sql`, `features/gamification/lib/achievements-config.ts`.
- **Status:** LIVE.

### Leaderboard

- **Co to robi:** Na osiągnięciach student widzi ranking.
- **Jak działa pod maską:** okresy `"7" | "30" | "all"` (default `"30"`); zakres `"all" | "year"` (`profiles.current_year`). RPC `leaderboard_period_stats(p_since)`. Kto: ukończone sesje z `SUM(total_questions) > 0`. Limit `LEADERBOARD_LIMIT = 50` + dopisanie bieżącego usera. Sort: XP desc → accuracy desc → streak desc → displayName `pl`.
- **Dowód:** `features/gamification/server/loadGamification.ts`, `scripts/2026-05-24-leaderboard-period-stats.sql`.
- **Status:** LIVE.

### Wyzwania dnia

- **Co to robi:** Na `/osiagniecia` widać dwie karty wyzwań.
- **Jak działa pod maską:** komponent `DailyChallengeCard` z zahardkodowanym postępem `0/15` (XP 50) i `0/10` (XP 40). Tabele `daily_challenges` / `user_challenge_progress` są w schemacie; **brak odczytu/zapisu** w TS/TSX.
- **Dowód:** `features/gamification/components/DailyChallengeCard.tsx`, `app/(dashboard)/osiagniecia/page.tsx`.
- **Status:** ZBUDOWANE-NIEWŁĄCZONE.

---

## 5. Statystyki i postęp

### Pulpit

- **Co to robi:** Po zalogowaniu student widzi cel dnia, streak, powtórki, rangę, szybki start, heatmapę, wykres, słabe punkty, ostatnie sesje.
- **Jak działa pod maską:** `PulpitDashboard` składa loadery `loadPulpit`, `loadActivityHeatmap`, `loadProgressHistory`, `loadWeakPoints`, `countQuestionsToday`.
- **Widgety:** greeting + aktywni teraz; `PulpitTodayCards`; `PulpitQuickStart`; heatmapa pulpitowa; `ProgressChart`; `WeakPoints`; `PulpitRecentSessions`.
- **Dowód:** `features/pulpit/components/PulpitDashboard.tsx`.
- **Status:** LIVE.

### Statystyki

- **Co to robi:** Na `/statystyki` student widzi gotowość, percentyl, countdown egzaminu, heatmapę 30d, (warunkowo) trafność wg źródła, radar przedmiotów, czas nauki, trend trafności, słabe tematy, historię sesji, stopkę sum.
- **Jak działa pod maską:** `loadStatistics.ts`; zakresy `"7" | "30" | "90" | "all"`. `SourceAccuracyCard` tylko gdy `FEATURES.cemSource` i produkt na `SOURCE_FILTER_LIVE`.
- **Dowód:** `features/statistics/components/StatisticsDashboard.tsx`, `features/statistics/server/loadStatistics.ts`.
- **Status:** LIVE (SourceAccuracy ZA FLAGĄ).

### Podsumowanie sesji

- **Co to robi:** Po zakończeniu student widzi trafność, czas, porównanie z poprzednią, pasek odpowiedzi, rozbicie tematów, XP/streak/readiness, akcje retry/next/finish.
- **Jak działa pod maską:** `SessionSummaryClient` składa `SummaryHero`, `SummaryAnswerStrip`, `SummaryTopicBreakdown`, `SummaryPositivesBar`, `SummaryActions`. `SummaryXpCard` jest używany w OSCE `TopicSession`, nie w tym kliencie. `ExamReadinessCard` — na dashboardzie przedmiotu, nie na podsumowaniu sesji.
- **Dowód:** `features/session/components/SessionSummaryClient.tsx`.
- **Status:** LIVE.

### Zapisane pytania

- **Co to robi:** Student oznacza pytanie; lista na `/zapisane`; sygnał do scoringu pojęcia.
- **Jak działa pod maską:** `saved_questions`; `toggleBookmark`; w `learningValueScore` max +15%.
- **Dowód:** `features/session/api/toggleBookmark.ts`, `app/(dashboard)/zapisane`.
- **Status:** LIVE.

---

## 6. Treść i jakość

### Standard wyjaśnień

- **Co to robi:** Po odpowiedzi student widzi tekst wyjaśnienia (markdown, KaTeX). Opcjonalnie bloki ustrukturyzowane.
- **Jak działa pod maską:** `questions.explanation` TEXT NOT NULL. Render: `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex`. `explanation_blocks` JSON: `{ takeaway ≤ 2000, correctReason, distractors[a–e] ≤ 2000 }` (`structuredExplanation.ts`). Admin: `AdminStructuredExplanationFields`. Prod: 0 wierszy z `explanation_blocks`. Redakcja: `FormatPisaniaPytan.md` — 5 opcji a–e, explanation min. 2–5 zdań, bez emoji.
- **Liczby:** 17 522 niepustych / 1 363 pustych; 0 blocks.
- **Dowód:** `features/session/lib/mapSessionQuestion.ts`, `FormatPisaniaPytan.md`.
- **Status:** markdown LIVE. Bloki: ZBUDOWANE-NIEWŁĄCZONE (kolumna pusta).
- **Czego NIE komunikować:** że każde pytanie ma wyjaśnienie; że dystraktor-po-dystraktorze jest na prod.

### Źródło pytań i oznaczanie

- **Co to robi:** Student zgłasza błąd; admin widzi inbox; edycja pytań zostawia audyt.
- **Jak działa pod maską:**
  - Student: `reportError` — kategorie `wrong_answer | question_text | explanation | outdated | other`; opis 10–2000 znaków; `status = pending`. Tabela `error_reports`.
  - Admin `/admin/bledy`: `resolved | rejected | reviewed` + `admin_response`.
  - Audyt: `question_edits` (`changes` jsonb, `editor_id`, opcjonalnie `report_id`). Brak UPDATE/DELETE z aplikacji.
  - Shuffle: `disable_option_shuffle` (`scripts/2026-05-24-disable-option-shuffle.sql`).
  - Dyskusje: `question_discussions`.
  - CEM inbox: `/admin/cem/inbox` + `CemInboxMapper`.
- **Dowód:** `features/session/api/reportError.ts`, `scripts/2026-05-18-question-edits-audit.sql`, `features/admin/components/CemInboxMapper.tsx`.
- **Status:** LIVE.

---

## 7. Platforma i UX

### Logowanie, rejestracja, reset hasła

- Email + hasło (min. 6). `signInWithPassword`, `signUp`, `resetPasswordForEmail`. Rate limit. Ban: `account_bans`. Brak OAuth w kodzie.
- Rejestracja otwarta od `2026-05-17T19:00:00.000Z` (`lib/registrationWindow.ts`). `courseType` knnp|ldek|ldew; **ldek → błąd `coursePreparing`**.
- **Status:** LIVE.
- **Dowód:** `features/auth/actions.ts`.

### Onboarding / wybór roku

- Po auth: `/wybor-roku` (`PricingGate`). Entitlement-exempt wraz z `/ustawienia`.
- **Status:** LIVE.
- **Dowód:** `app/(dashboard)/wybor-roku/page.tsx`, `features/access/lib/dashboardRouteAccess.ts`.

### Ustawienia

- Profil: nick, avatar emoji, track/rok (nie dla produktów klinicznych), produkt tylko gdy `role = admin` (opcje UI: knnp, ldew — bez ldek).
- Egzamin: `exam_date`.
- Nauka: `daily_study_minutes` 5–240 (default 25), `daily_goal`, `default_session_mode`, `default_question_count`, `show_session_timer`, `show_session_topics`, `default_question_source` `all | reference | own` (CHECK po `scripts/2026-08-21-reference-sources.sql`).
- Powiadomienia: `notifications_reviews` (default true), `notifications_weekly` (default false) — **zapis do profilu, brak kodu wysyłki mail/push**.
- Locale: `pl|uk|ru|en`, cookie `NEXT_LOCALE`.
- **Dowód:** `features/settings/server/loadSettings.ts`, `i18n/config.ts`.
- **Status:** LIVE (toggles powiadomień bez delivery).

### Wyszukiwarka Ctrl/Cmd+K

- **Co to robi:** Paleta poleceń po `(metaKey || ctrlKey) + k`.
- **Jak działa pod maską:** szuka znormalizowanych (bez diakrytyków) etykiet nav + nazw przedmiotów. Nav: `/pulpit`, `/przedmioty`, `/statystyki`, `/osiagniecia`, `/zapisane`, `/ustawienia`. Przedmioty: `/przedmioty/{id}`.
- **Dowód:** `features/shared/components/TopBar.tsx`, `features/shared/components/CommandPalette.tsx`.
- **Status:** LIVE.

### Mobile i motyw

- `useMobileViewport`: `(max-width: 767px)`.
- Pinch-zoom: tylko OSCE (OPG, image identify).
- `profiles.theme` default `'dark'` w schemacie; **brak toggle** w UI; tokeny brandu ciemne.
- **Status:** viewport LIVE. Motyw: brak przełącznika.

### Multi-produkt

- `STUDY_PRODUCTS = knnp | ldek | ldew`. Student nie przełącza produktu w ustawieniach (tylko admin). LDEK: preview bez zakupu (`shouldBypassPurchaseGate`), rejestracja zablokowana, 0 subjects.
- **Status:** knnp i ldew LIVE. ldek: ZBUDOWANE-NIEWŁĄCZONE jako produkt treści.

### Pozostałe (jedna linia)

- Logowanie / wylogowanie / forgot-password / reset-password: trasy w `app/(auth)/*`.
- Regulamin i polityka: `/regulamin`, `/polityka-prywatnosci`; PDF-y `/legal/*` z osłabionym CSP pod iframe.
- Toast, sidebar, breadcrumb dashboardu, heatmapa GitHub-style.
- Zgoda konsumencka przy Stripe: `consent_log`.
- Kalkulator gabinetu: `/kalkulator` — osobny flow (praktyki, procedury, marże); nie jest entitlementem KNNP/LDEW.
- Demo/test cookie: **nie znaleziono** w obecnym kodzie (`PODSUMOWANIE_APLIKACJI.md` z maja 2026 wspomina demo).

---

## 8. Model biznesowy w kodzie

### Stripe i entitlements

- **Co to robi:** Student płaci raz i dostaje dostęp do wybranej oferty na określoną liczbę dni (albo darmowy rok testowy bez daty końca).
- **Jak działa pod maską:**
  - Checkout: `createCheckoutSessionAction`; webhook `app/api/stripe/webhook/route.ts` — `checkout.session.completed`; `charge.succeeded|updated|refunded|failed`.
  - Tabela: `user_year_entitlements` (`product`, `track`, `year`, `access_type`, `active`, `offer_key`, `access_days`). Unique `(user_id, product, track, year)` — `scripts/2026-08-29-entitlements-product-offers.sql`.
  - Płatne KNNP: `access_days` z oferty; fallback `CONSUMER_CONSENT_ACCESS_DAYS = 45`. Wygaśnięcie: `granted_at + access_days`; `free_test` nie wygasa (`getEntitlementExpiresAt` zwraca null).
  - `productRequiresPurchase`: `knnp` i `ldew`. `ldek` zawsze bypass. Admin + ldew: bypass.
- **SKU:**

| id | produkt | dni / rok | darmowy? |
|---|---|---|---|
| knnp-stomatologia-1 | knnp | rok 1, 45 dni paid | nie |
| knnp-stomatologia-2 | knnp | rok 2 | tak (`free_test`) |
| knnp-stomatologia-3 | knnp | rok 3, 45 dni paid | nie |
| knnp-lekarski-1 | knnp | rok 1, 45 dni paid | nie |
| ldew-30 / 180 / 365 | ldew | 30 / 180 / 365 | nie |
| ldek-30 / 180 / 365 | ldek | 30 / 180 / 365 w katalogu | sprzedaż niepodłączona |

Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STOMATOLOGIA_1`, `STRIPE_PRICE_STOMATOLOGIA_3`, `STRIPE_PRICE_LEKARSKI_1`, `STRIPE_PRICE_LDEW_30/180/365`. `STRIPE_PRICE_LDEK_*` w `.env.example` zakomentowane. `STRIPE_PRICE_LEKARSKI_2/3` zmapowane, rejestracja zamknięta.

- **Dowód:** `features/checkout/actions.ts`, `features/access/lib/gateCatalog.ts`, `features/access/lib/entitlementExpiry.ts`, `features/access/lib/purchaseGate.ts`, `.env.example`.
- **Status:** KNNP + LDEW LIVE. LDEK SKU: ZBUDOWANE-NIEWŁĄCZONE.
- **Czego NIE komunikować:** subskrypcji (nazwa kolumn `subscription_*` przy checkout jednorazowym). LDEK jako ofertę w sprzedaży.

---

## 9. Fundamenty

**Stack.** Next.js `^16.3.0`, React 19.2.4, TypeScript 5, Tailwind 4, `@supabase/supabase-js` 2.101, `@supabase/ssr` 0.10, Stripe 22, next-intl 4.13, Zustand 5, Framer Motion 12, Recharts 3, Zod 4, ts-fsrs 5.4.1, lucide-react, Radix UI. Hosting: Vercel (CSP + HSTS w prod, `next.config.ts`). CI: `.github/workflows/security.yml` — `npm audit --audit-level=high` na `main` i PR, Node 22.

**RLS.** Włączone na `profiles`, `user_question_progress`, `study_sessions`, `session_answers`, `learning_events`, `topic_mastery_cache`, treściach (SELECT dla `authenticated` na `subjects`/`topics`/`questions`), `user_achievements`, dyskusjach. User czyta/zapisuje własne wiersze postępu. Admin: `profiles.role ∈ {admin, moderator}`; część akcji wymaga super-admin.

**Panel admina.** Trasy: `/admin` (KPI, growth DAU/WAU/MAU, finance Stripe, investor), `/admin/pytania`, `/admin/testy` (DOCX „jak CEM”), `/admin/bledy`, `/admin/dyskusje`, `/admin/uzytkownicy`, `/admin/historia-pytan`, `/admin/cem/inbox`. UI po polsku, bez i18n.

---

## A. Liczby do pitcha

Tylko LIVE i zweryfikowane 2026-08-29 w prod albo w kodzie due-path bez flagi 0%.

1. 18 885 aktywnych pytań MCQ A–E.
2. 10 886 w KNNP, 7 930 w LDEW, 69 w OSCE.
3. 0 przedmiotów i pytań z `product = ldek`.
4. 17 522 aktywnych z niepustym `explanation`; 1 363 z pustym.
5. 12 osiągnięć, 7 rang (0 … 120 000+ XP).
6. XP sesji: +5 / poprawna, +15 za serię ≥5, +20 za sesję ≥10 pytań.
7. FSRS v1: ts-fsrs 5.4.1, requestRetention 0.9, maximumInterval 365, bez fuzz.
8. mastery_score = 0.3·coverage + 0.3·accuracy + 0.4·retrievability.
9. OSCE na produkcji: 7 stacji, próg 60%, timer 15 min/stację (git HEAD; `kursnaldek.pl/osce` istnieje).
10. KNNP źródła: 5 482 own, 4 558 uczelnia, 846 tagged cem.
11. LDEW: 100% source=own (7 930).
12. Płatność jednorazowa; darmowy stoma rok 2; LDEW 30/180/365 dni; KNNP paid 45 dni od granted_at.
13. UI w 4 locale: pl, uk, ru, en.
14. Atlas OPG: 1 obraz, 30 struktur.
15. 7 rang i leaderboard 7/30/all, top 50.

---

## B. Czerwona lista

Marketingowi nie wolno komunikować:

- LDEK jako sprzedawany kurs / bank kliniczny LDEK (0 subjects; register `coursePreparing`; preview bypass).
- „Egzaminy CEM na czas” / 14 sesji CEM do rozwiązania (`is_published=false`, `total_questions=0`).
- Filtr CEM/uczelnia u studentów KNNP (`SOURCE_FILTER_LIVE` bez knnp).
- Flaga CEM jako na pewno włączona (`.env.example=false`; Vercel nieodczytany z repo).
- FSRS v2, plan dnia, adaptive feedback / concise-remedial jako zachowanie domyślne (wszystkie `active=false`, 0%).
- Daily challenges jako działający system.
- XP „za trudne”, „za aktywność dnia”, „za powtórkę na czas”.
- Ustrukturyzowane wyjaśnienia takeaway/dystraktory jako treść prod (`explanation_blocks = 0`).
- OSCE: ordering, hotspoty, conversion drill jako bank na prod (same `single_choice`; 1 OPG).
- 100% pytań z wyjaśnieniem (1 363 pustych; status i tak `reviewed`).
- Readiness oparte o CEM.
- Powiadomienia e-mail o powtórkach / tygodniowe.
- Dark/light mode.
- Lekarski rok 2 i 3.
- Subskrypcja.
- OSCE po deployu obecnego working tree (redirect + skasowane pliki).
- Mikrobiologia jamy ustnej jako kafel katalogu stoma (ukryta).
- Demo/test cookie.
- i18n treści pytań (tłumaczone jest menu, nie bank).
- Rezerwa CEM jako działająca na prod (brak opublikowanego arkusza → unlock).

---

## C. Pytania do prod DB / Vercel

```sql
-- Pytania per produkt / źródło / typ
SELECT s.product, q.source, q.question_type,
       COUNT(*) FILTER (WHERE q.is_active) AS active
FROM questions q
JOIN topics t ON t.id = q.topic_id
JOIN subjects s ON s.id = t.subject_id
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

-- Per przedmiot
SELECT s.product, s.track, s.year, s.id, s.name,
       COUNT(*) FILTER (WHERE q.is_active) AS active
FROM subjects s
LEFT JOIN topics t ON t.subject_id = s.id
LEFT JOIN questions q ON q.topic_id = t.id
GROUP BY s.product, s.track, s.year, s.id, s.name, s.display_order
ORDER BY s.product, s.track, s.year, s.display_order;

-- Puste wyjaśnienia vs status
SELECT explanation_status,
       COUNT(*) FILTER (WHERE is_active) AS active,
       COUNT(*) FILTER (WHERE is_active AND length(trim(explanation)) = 0) AS empty_expl,
       COUNT(*) FILTER (WHERE is_active AND explanation_blocks IS NOT NULL) AS with_blocks
FROM questions
GROUP BY 1;

-- CEM
SELECT product, is_published, COUNT(*) AS sessions, SUM(total_questions) AS qs
FROM cem_sessions
GROUP BY 1, 2;

SELECT COUNT(*) AS ldek_subjects FROM subjects WHERE product = 'ldek';

-- Tematy / inbox
SELECT s.product,
       COUNT(DISTINCT t.id) AS topics,
       COUNT(DISTINCT t.id) FILTER (WHERE COALESCE(t.is_inbox, false)) AS inbox
FROM topics t
JOIN subjects s ON s.id = t.subject_id
GROUP BY s.product;

-- Eksperymenty
SELECT experiment_key, active, rollout_percent, scheduler_version
FROM learning_experiment_configs;

-- Pamięć
SELECT COUNT(*) AS v1 FROM user_question_progress;
SELECT COUNT(*) AS v2 FROM user_question_memory_v2;

-- OPG / OSCE typy
SELECT (SELECT COUNT(*) FROM opg_atlas_images) AS opg_images,
       (SELECT COUNT(*) FROM opg_structures) AS opg_structures;

SELECT COUNT(*) FILTER (WHERE is_active AND hotspots IS NOT NULL
                         AND hotspots::text NOT IN ('null', '[]', '{}')) AS with_hotspots,
       COUNT(*) FILTER (WHERE is_active AND correct_order IS NOT NULL) AS with_correct_order,
       COUNT(*) FILTER (WHERE is_active AND drill_questions IS NOT NULL
                         AND drill_questions::text NOT IN ('null', '[]')) AS with_drill
FROM questions;
```

**Vercel / build (nie w DB):** `NEXT_PUBLIC_FEATURE_CEM_SOURCE` — true czy false.  
**Stripe:** czy `STRIPE_PRICE_LDEK_30/180/365` są ustawione (w `.env.example` zakomentowane).

---

## Sanity check (5 twierdzeń ponownie w źródle)

1. `mastery_score = coverage * 0.3 + accuracy * 0.3 + avgRetrievability * 0.4` — `features/session/lib/antares/recalculateTopicMastery.ts`.
2. XP naliczane: tylko `CORRECT_ANSWER` 5, `STREAK_5` 15, `SESSION_COMPLETE` 20 — `computeSessionXp.ts`; `CORRECT_HARD` / `DAILY_ACTIVITY` / `REVIEW_ON_TIME` poza tym plikiem.
3. `SOURCE_FILTER_LIVE = ["ldek", "ldew"]` — `lib/products.ts`; KNNP `isSourceFilterLive("knnp") === false`.
4. 18 885 aktywnych pytań — `execute_sql` na `unfcpipxraiyacyzqanh`, 2026-08-29.
5. OSCE na prod: `https://kursnaldek.pl/osce` zwraca logowanie, nie 404; working tree ma niezcommitowane `D` i redirect.
