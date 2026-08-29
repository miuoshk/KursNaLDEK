# Cutover personalizacji — 26 sierpnia 2026, noc

> **Stan aktualny i okno 2 września:** `exports/personalized-learning-handover-2026-09-02.md`.
> Ten plik jest logiem nocy przed replayem. Write RLS już zdjęte, smoke przeszedł, wagi v2 są aktywne przy 0%.

Cel na dziś: schemat + apka na produkcji, rollouty **0%**.
Nie dziś: treatment 5%, replay 2,6 mln, trening wag.

## Stan (03:15 CEST)

- Kod: `d2e1cc1` na `main`, Vercel production Ready, aliasy `kursnaldek.pl`.
- SQL addytywny wgrany. RPC potrzebne do `submitAnswer` istnieją.
- Eksperymenty: `memory-v2-rollout`, `adaptive-feedback-v1`, `daily-plan-v1` — **0%, active=false**.
- Pojęcia: 3353 concepts, 20772 question_concepts.
- Write RLS **nadal żyje** (INSERT/UPDATE na sesjach, odpowiedziach, progress). Celowo: otwarte karty starego klienta nadal zapisują.
- Po deployu: 0 sesji z `experiment_key` / `engine_variant=shadow`, 0 odpowiedzi z `fsrs_applied`. Ruch idzie jeszcze starym INSERT-em.
- Unique `(session_id, question_order)` **nie tworzyć** — 1006 duplikatów.
- Unique `(session_id, question_id)` już jest.

## Zrobione

1. Commit wycinka personalizacji (bez CEM inbox / handoverów LDEK) i push na `main`.
2. SQL addytywny **bez** pętli `DROP POLICY`.
3. CEM RLS na `cem_sessions` / `cem_question_occurrences`.
4. RPC: `apply_user_question_review`, `apply_memory_v2_review`, `finalize_learning_answer`, `record_concept_attempt`, `record_feedback_consumption`, `due_review_count_v2`, `set_learning_experiment_rollout`.
5. `reset_subject_progress_for_user` rozszerzony o memory v2 i concept state. Starego `reset_subject_progress(text)` nie ruszamy, aż smoke przejdzie.

## Zostało (kolejność)

1. Smoke: twardy reload, jedna inteligentna sesja, zapis odpowiedzi bez toastu.
   Potwierdzenie w bazie: `engine_variant='shadow'`, `experiment_key` nie-null, `fsrs_applied=true`, `processing_completed_at` nie-null.
2. Dopiero wtedy DROP write RLS + SELECT-only z `2026-08-25-personalized-learning-events.sql` (linie 184–242). Nie wcześniej — obetnie zapis starym klientom w otwartej sesji.
3. `2026-08-25-learning-indexes-concurrently.sql` przez `psql` poza transakcją. MCP tego nie zrobi.
4. Backfill `average_question_seconds` i `session_kind` — rano, poza szczytem.
5. Evaluate/metric snapshot SQL — ops, nie bloker 0%.

## Rollback

- Apka: revert deploy na `main`.
- SQL: nie cofamy `ADD COLUMN`. Jeśli nowa apka padnie, zostawić INSERT/UPDATE (nie DROP-ować).
- Treatment nie jest włączony — nie ma rollbacku v2 due.

## Jutro / crunch — nie ruszać

- `learning:replay` / `optimize` / import memory v2
- `set-learning-experiment-rollout` cokolwiek > 0
- Unique na `question_order`
