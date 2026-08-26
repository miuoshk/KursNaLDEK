# Personalizowana nauka — replay i bezpieczny rollout

Data przygotowania: 2026-08-25

## Stan wyjściowy

- Produkcja zawiera 2 562 103 odpowiedzi, 99 520 sesji i 1 130 172 stanów
  pytań użytkownika.
- Nowe tabele i kolumny pamięci v2 nie są jeszcze wdrożone w produkcji.
- Rollouty `memory-v2-rollout`, `adaptive-feedback-v1` i `daily-plan-v1`
  startują nieaktywne z wartością 0%.
- Shadow write pamięci v2 nie wpływa na wybór pytań. Odczyt z v2 uruchamia
  dopiero wariant `treatment`.

## Kolejność migracji

1. `scripts/2026-08-21-cem-rls.sql`
2. `scripts/2026-08-25-personalized-learning-events.sql`
3. `scripts/2026-08-25-daily-study-plan.sql`
4. `scripts/2026-08-25-backfill-average-question-seconds.sql` (osobny,
   monitorowany backfill)
5. `scripts/2026-08-25-fsrs-memory-v2.sql`
6. `scripts/2026-08-25-learning-concepts.sql`
7. `scripts/2026-08-25-memory-v2-experiment.sql`
8. `scripts/2026-08-25-learning-indexes-concurrently.sql` przez `psql`, poza
   transakcją (indeksy `CONCURRENTLY` i walidacja kluczy obcych).

Przed wdrożeniem uruchomić
`npm run learning:migrations:test`; test składa migracje w osadzonym PostgreSQL
i wykonuje atomowy zapis FSRS, finalizację odpowiedzi, zapis próby pojęcia
oraz telemetrykę czasu feedbacku wraz z testami idempotencji.

Migracje są rozszerzające. Pliki 2, 6 i 7 celowo nie mają jednej otaczającej
transakcji, aby nie utrzymywać blokad aktywnych tabel podczas backfillu i
definicji raportów; uruchamiać je przez `psql` z `ON_ERROR_STOP=1`. Najpierw
należy wdrożyć schemat, następnie kod aplikacji z rolloutem 0%. Nie należy
włączać treatment przed potwierdzeniem zapisu projekcji shadow.

## Replay offline

1. Uruchomić `scripts/2026-08-25-export-learning-replay.sql` w bezpiecznym
   środowisku analitycznym. Eksport nie zawiera treści ani danych kontaktowych,
   ale zawiera techniczne identyfikatory potrzebne do modelu per użytkownik;
   musi pozostać w chronionym środowisku. Jest posortowany po użytkowniku,
   pytaniu i czasie.
2. Odtworzyć raport bazowy:

   `npm run learning:replay -- --input history.jsonl --output baseline.md`

3. Wytrenować kandydata wyłącznie na części historycznej:

   `npm run learning:optimize -- --input history.jsonl --scope global --before 2026-07-01T00:00:00Z --output params.json`

4. Porównać v1 i v2 na późniejszym, niewidzianym wycinku, zachowując starsze
   próby wyłącznie jako rozgrzewkę stanu kart:

   `npm run learning:compare -- --input history.jsonl --v2-config params.json --after 2026-07-01T00:00:00Z --output comparison.json`

5. Bramka replayu wymaga minimum 100 prób z predykcją na model oraz braku
   pogorszenia Brier score i log loss o więcej niż 0,5%. Parametry kandydata
   muszą pochodzić z optimizera, nie z ręcznego strojenia na zbiorze
   walidacyjnym.

Po bramce:

1. `node scripts/activate-fsrs-parameters.mjs params.json` — dry-run.
2. Powtórzyć z `--apply` i zachować zwrócony identyfikator zestawu.
3. `node scripts/rebuild-fsrs-memory-v2.mjs --input history.jsonl --parameters params.json --parameter-set-id UUID --output memory-v2.jsonl`
4. `node scripts/import-fsrs-memory-v2.mjs memory-v2.jsonl` — dry-run.
5. Powtórzyć import z `--apply`.

Backfill kohorty lub użytkownika używa `scope` i `scopeKey` z pliku parametrów,
więc nadpisuje tylko właściwy wycinek po wcześniejszym imporcie globalnym.
Aktywacja i rollout odrzucają wektor inny niż dokładnie 21 wag. Rollout pamięci
nie wystartuje bez aktywnego globalnego zestawu zgodnego z wersją schedulera.
Raport replayu, aktywowany zestaw i każda kolejna bramka są spięte odciskiem
SHA-256 parametrów, więc nie można podmienić wag między walidacją a rolloutem.
Parametry są zamrożone przy rolloutach większych od 0%; ich zmiana wymaga
najpierw rollbacku do 0%, ponownego replayu i nowego preflightu.

## Shadow mode

Po wdrożeniu kodu utrzymać wszystkie trzy rollouty na 0%. Przez minimum
7 dni sprawdzać:

- odsetek odpowiedzi z projekcją `memory-v2/ts-fsrs-5.4.1`,
- zgodność odcisku parametrów shadow z kandydatem zaliczonym w replayu,
- pokrycie co najmniej 99% historycznych kart stanem memory v2,
- błędy dual-write i liczbę automatycznych fallbacków do `legacy-v1`,
- różnicę Brier score/log loss v1–v2,
- wzrost tabeli projekcji oraz czas zapisu odpowiedzi.

Brak projekcji w shadow nie może blokować odpowiedzi użytkownika. W treatment
powoduje mierzalny fallback całej sesji do v1. Stan v2 można odbudować z
niezmiennego `session_answers`.
Zapis v1 stosuje blokadę i kontrolę wersji w jednej funkcji bazodanowej, więc
przerwane żądanie wznawia próbę oznaczoną `fsrs_applied = false`, a równoległe
sesje nie nadpisują sobie stanu karty. Stan i projekcja v2 są zapisywane
atomowo i idempotentnie przez `apply_memory_v2_review`; funkcja blokuje kartę
i ponawia zapis po konflikcie.

Raport bramki shadow:

`npm run learning:shadow -- --days 7 --min-answers 1000 --output memory-v2-shadow.json`

## Etapy eksperymentu

Każdą zmianę testować osobno: najpierw pamięć v2, następnie adaptacyjny
feedback, a na końcu plan dnia.

1. Przed pierwszym canary wygenerować preflight. Dla pamięci v2 wymagany jest
   zaliczony replay:

   `npm run learning:preflight -- --experiment memory-v2-rollout --replay comparison.json --shadow memory-v2-shadow.json --output memory-v2-preflight.json`

2. Po decyzji `pass` włączyć 5%:

   `node scripts/set-learning-experiment-rollout.mjs --experiment memory-v2-rollout --percent 5 --report memory-v2-preflight.json --apply`

3. Po pełnym oknie pomiarowym wygenerować raport kohortowy. Skrypt automatycznie
   ucina okno do daty wejścia na bieżący procent i odrzuca niepełny etap:

   `npm run learning:evaluate -- --experiment memory-v2-rollout --days 14 --output memory-v2-guardrails.json`

4. Po decyzji `pass` przejść do 25%:

   `node scripts/set-learning-experiment-rollout.mjs --experiment memory-v2-rollout --percent 25 --report memory-v2-guardrails.json --apply`

5. Po kolejnym pełnym oknie wymusić dane diagnostyczne przed 100%:

   `npm run learning:evaluate -- --experiment memory-v2-rollout --days 30 --min-users 50 --require-cem true --output memory-v2-guardrails.json`

   Następnie użyć zaliczonego raportu do przejścia 25% → 100%.

6. Natychmiastowy rollback nowych sesji:

   `node scripts/set-learning-experiment-rollout.mjs --experiment memory-v2-rollout --percent 0 --apply`

Funkcja bazodanowa blokuje przeskakiwanie etapów oraz wzrost rolloutu bez
raportu `pass` z pustą listą naruszeń. Przypisanie użytkownika jest
deterministyczne.

## Metryki i guardraile

Metryki główne:

- poprawność przy kolejnej próbie po 7–30 dniach,
- liczba poprawnych odpowiedzi z chronionej rezerwy CEM na minutę.

Guardraile:

- czas na pytanie: wzrost najwyżej 10%,
- ukończenie sesji: spadek najwyżej 5 p.p.,
- aktywne dni: spadek najwyżej 10%,
- backlog: wzrost najwyżej 10%,
- zgłoszenia błędów treści na 1000 odpowiedzi: wzrost najwyżej 20%,
- Brier score i log loss: pogorszenie najwyżej 2% w ruchu online,
- fallback pamięci v2 do v1: najwyżej 1% sesji treatment,
- minimum 20 użytkowników (50 przed pełnym rolloutem) i 100 odroczonych prób
  na wariant; przed pełnym rolloutem także minimum 100 prób chronionej
  diagnostyki CEM na wariant.

Progi są bramkami bezpieczeństwa, nie deklarowanym celem poprawy. Docelową
minimalną poprawę produktu należy ustalić po zebraniu pierwszego pełnego
okna danych.
