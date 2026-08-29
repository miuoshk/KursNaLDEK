# Handover — domknięcie cyklu shadow FSRS v2

Dla operatora w oknie **2 września 2026, nie wcześniej niż 04:23 CEST**.
Nie podnosić `memory-v2-rollout` przed tą godziną i przed zaliczonym preflightem.

Runbook źródłowy: `exports/personalized-learning-rollout-runbook-2026-08-25.md`.
Cutover z nocy 26 sierpnia (`exports/personalized-learning-cutover-2026-08-26.md`) jest **historyczny** — RLS write już zdjęte, smoke przeszedł, ten plik jest stanem aktualnym.

## Co jest na produkcji (26 sierpnia 2026, ~04:35 CEST)

Due i postęp użytkownika nadal biorą się z **FSRS v1** (`user_question_progress`). Pamięć v2 stoi obok, w shadow. Treatment = 0%.

| Rzecz | Wartość |
| --- | --- |
| Eksperymenty | `memory-v2-rollout`, `adaptive-feedback-v1`, `daily-plan-v1` — **0%, `active=false`** |
| `session_answers` | 2 580 239 (nie ruszane) |
| `user_question_progress` (v1) | 1 136 441 (nie ruszane) |
| `user_question_memory_v2` | 1 136 492 (1 116 634 `replay` + 19 858 `seed-v1`) |
| Backfill v1→v2 | **100%** kart z `last_answered_at` |
| Zestaw wag | `0592e942-4de5-4760-9dfb-3e08f67f1127` global, `active=true` |
| Odcisk SHA-256 | `571a6814c5a8a150589993a36c7f1546a96c5d3de1ee6de909ff9c97d51ea046` |
| `optimized_at` = start zegara shadow | **2026-08-26 02:23:04 UTC** (04:23 CEST) |
| Replay offline | `pass` — `exports/fsrs-v1-v2-replay-comparison.json` |

Holdout po 2026-07-01 (117 490 prób z predykcją):

- Brier v1 0.1618 → v2 0.1602
- Log loss v1 1.1899 → v2 1.1768
- Średni `scheduled_days` v1 **20.5** → v2 **4.47** — kalibracja lepsza, interwały krótsze. W treatment kolejka due zgęstnieje. To nie jest naruszenie bramki replay (ta patrzy tylko na Brier/log loss).

Kod: `main` (personalizacja + hotfix JWT `is_service_role()`). Write ścieżka nauki: service role RPC, nie client INSERT.

## Twarde zakazy

1. Nie `set-learning-experiment-rollout` z `--percent` innym niż 0, dopóki preflight `memory-v2-rollout` nie ma `decision: pass`.
2. Nie skakać 0% → 25%. Jedyna legalna pierwsza zmiana to **0 → 5**, i tylko `memory-v2-rollout`. Adaptive feedback i plan dnia zostają na 0%.
3. Nie tworzyć unique `(session_id, question_order)` — na produkcji jest 1006 sesji z duplikatami. Unique `(session_id, question_id)` już jest.
4. Nie DELETE / TRUNCATE `session_answers` ani `user_question_progress`. Import v2 wolno powtórzyć; v1 jest źródłem due.
5. Nie aktywować nowego zestawu wag przy rollout > 0%. Nowa aktywacja **zeruje zegar 7 dni** (`parameter_activated_at` = `optimized_at` aktywnego zestawu).
6. Nie committować `exports/learning-replay-history.jsonl` ani `exports/fsrs-memory-v2-rebuild.jsonl` — zawierają UUID użytkowników (~764 MB). Są w `.gitignore`.

## Pliki na dysku (to okno)

Zostawić lokalnie, nie wrzucać jsonl do gita:

- `exports/learning-replay-history.jsonl` — 2 580 239 wierszy, posortowane **porównaniem JS** (`user_id`, `question_id`, `answered_at`). Postgres locale sortuje `eng` przed `HIST`; skrypty tego nie łykają.
- `exports/fsrs-memory-v2-rebuild.jsonl` — 1 116 634 kart replay.
- `exports/fsrs-parameters.json` — wagi + odcisk (można commitować).
- `exports/fsrs-v1-v2-replay-comparison.json` — bramka `pass` z 26 sierpnia. **Przed preflightem 2 września trzeba go wygenerować od nowa** (raport replay i shadow muszą mieć `evaluatedAt` z ostatnich 72 h).
- `exports/learning-replay-baseline.md` — v1 na całej historii.

RPC `export_learning_replay_page` jest **zdjęte** z produkcji. Recreate: `scripts/2026-08-26-export-learning-replay-page.sql`, dump: `npm run learning:export -- exports/learning-replay-history.jsonl`, potem natychmiast `scripts/2026-08-26-export-learning-replay-page-down.sql`. PostgREST obcina stronę do 1000 wierszy. Po eksporcie posortować jak JS albo `ORDER BY question_id COLLATE "C"`.

## Procedura 2 września (kolejność)

Pracować z `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Skrypty activate / import / shadow / evaluate / rollout ładują ten plik same.

### 0. Smoke, że zegar i odcisk żyją

Jedna nowa sesja inteligentna. W bazie:

- `study_sessions.engine_variant = 'shadow'`
- `experiment_key = 'memory-v2-rollout'`
- `experiment_rollout_percent = 0`
- `memory_parameter_set_id = '0592e942-4de5-4760-9dfb-3e08f67f1127'`
- odpowiedzi: `fsrs_applied = true`, projekcja `session_answer_memory_projections` z tym samym `parameter_set_id`

Snapshot shadow **liczy tylko sesje z tym UUID zestawu**. Sesje z nocy przed aktywacją wag (inne/puste `memory_parameter_set_id`) nie wchodzą do bramki.

Nie startować poniżej, jeśli jest wcześniej niż **2026-09-02 02:23:04 UTC**. Skrypt i tak zwróci hold: „Aktywny zestaw parametrów musi zbierać shadow przez pełne 7 dni.”

### 1. Odśwież replay (ten sam jsonl i wagi)

Nie trenować wag od nowa. Ten sam `exports/fsrs-parameters.json`, ten sam odcisk.

```bash
npm run learning:compare -- \
  --input exports/learning-replay-history.jsonl \
  --v2-config exports/fsrs-parameters.json \
  --after 2026-07-01T00:00:00Z \
  --output exports/fsrs-v1-v2-replay-comparison.json
```

Wymagane: `decision: pass`, `parameterFingerprint` = `571a6814c5a8a150589993a36c7f1546a96c5d3de1ee6de909ff9c97d51ea046`.
Jeśli jsonl zniknął: odtworzyć eksport (wyżej), posortować JS-owo, dopiero compare. Nie odpalać `learning:optimize` bez potrzeby — nowy trening to nowy odcisk i nowy zegar 7 dni.

### 2. Raport shadow

```bash
npm run learning:shadow -- --days 7 --min-answers 1000 --output exports/memory-v2-shadow.json
```

`pass` wymaga m.in.:

- ≥1000 odpowiedzi w oknie i ≥100 z predykcją obu modeli
- pokrycie projekcji ≥99%
- backfill kart v2 ≥99% (dziś 100%; nowe karty v1 bez v2 mogą to zepsuć — wtedy dograć seed jak `scripts/2026-08-26-seed-fsrs-memory-v2-from-v1.sql`, **tylko przy 0%**)
- Brier/log loss shadow nie gorsze o >2% vs v1
- odcisk z snapshotu = odcisk z comparison.json
- zestaw wag aktywny od pełnych 7 dni

Brak projekcji w shadow **nie może** blokować zapisu odpowiedzi. W treatment blokuje i robi fallback sesji do v1.

### 3. Preflight (tylko jeśli 1 i 2 to pass)

```bash
npm run learning:preflight -- \
  --experiment memory-v2-rollout \
  --replay exports/fsrs-v1-v2-replay-comparison.json \
  --shadow exports/memory-v2-shadow.json \
  --output exports/memory-v2-preflight.json
```

To odpala `tsc`, `npm test` i `npm run learning:migrations:test`. Musi być `decision: pass`.

### 4. Canary 5% — tylko po pass, tylko pamięć v2

Najpierw dry-run, potem apply:

```bash
node scripts/set-learning-experiment-rollout.mjs \
  --experiment memory-v2-rollout --percent 5 \
  --report exports/memory-v2-preflight.json

node scripts/set-learning-experiment-rollout.mjs \
  --experiment memory-v2-rollout --percent 5 \
  --report exports/memory-v2-preflight.json --apply
```

Natychmiastowy rollback nowych sesji:

```bash
node scripts/set-learning-experiment-rollout.mjs \
  --experiment memory-v2-rollout --percent 0 --apply
```

Po 5% nie ruszać adaptive-feedback ani daily-plan. Kolejne progi (25%, 100%) są w runbooku i wymagają `learning:evaluate` na pełnym oknie (14 d / 30 d + CEM przed 100%).

## Jeśli shadow albo preflight = hold

Zostawić 0%. Nie „przepychać” percent. Typowe przyczyny:

- za wcześnie względem `optimized_at`
- `memory_parameter_set_id` na sesjach ≠ aktywny zestaw (hotfix JWT już jest; jeśli `fsrs_applied=false`, patrzeć logi `Forbidden`)
- comparison/shadow starsze niż 72 h
- pokrycie projekcji <99% albo dual-write pada
- backfill <99% (nowe karty v1 bez v2)

v2 zawsze można odbudować z `session_answers`. v1 due zostaje.

## Świadomy dług (nie blokuje 2 września)

- UI „Siła zapamiętania +100%” przy 0% poprawnych na nowych kartach (`retrievabilityGain` z R≈0→1). Kosmetyka: `SummaryHero` / `sessionInsights.ts`.
- Optimizer pomija prefiksy, których **ostatni** `delta_t` wynosi 0 (powtórki tego samego dnia). Inaczej native `evaluateWithTimeSeriesSplits` zwraca `InvalidInput`. Timeout native: 3600 s.
- 19 858 kart `seed-v1` to postęp v1 **bez** `session_answers` (osierocone). Nie są w jsonl replay.

## Rollback awaryjny

- Treatment: `--percent 0` jak wyżej. Due wraca w 100% na v1 dla nowych sesji.
- Apka: revert deploy na `main`. Nie cofać `ADD COLUMN`.
- Wagi: nie deaktywować zestawu w panice, jeśli 0% — shadow wtedy traci odcisk. Zmiana wag = nowy replay + nowe 7 dni.
