-- One-time backfill: synchronizuje `user_question_progress` z faktycznymi
-- odpowiedziami w `session_answers`.
--
-- Tło: do dziś tryb "Nauka klasyczna" (przeglad) wysyłał odpowiedzi z
-- flagą `skipFsrs: true`, co całkowicie pomijało zapis do
-- `user_question_progress`. Skutek — karta przedmiotu pokazywała 0%
-- "Mistrzostwo" mimo zrobionych sesji, bo dashboard liczy odpowiedzi po
-- `times_answered > 0` z tej tabeli. Kod aplikacji już został poprawiony,
-- żeby zawsze bumpować licznik odpowiedzi (zachowując pominięcie FSRS dla
-- przeglądu). Ten skrypt łata istniejące dane.
--
-- Działanie:
--   1. Agreguje z `session_answers` realne liczby odpowiedzi/poprawnych
--      per (user, question).
--   2. Upsertuje wynik do `user_question_progress`. Dla istniejących
--      wierszy nadpisuje WYŁĄCZNIE liczniki + `last_answered_at`
--      (FSRS scheduling — `state`, `stability`, `reps`, `next_review`,
--      itd. — pozostaje nietknięty, żeby nie zepsuć harmonogramu Sesji
--      inteligentnej).
--   3. Dla nowych wierszy ustawia bezpieczne FSRS defaulty (state = 'new').
--
-- Idempotentne — bezpieczne do wielokrotnego uruchomienia.

WITH agg AS (
  SELECT
    ss.user_id,
    sa.question_id,
    COUNT(*)::INT                                       AS total_answered,
    COUNT(*) FILTER (WHERE sa.is_correct)::INT          AS total_correct,
    MAX(sa.answered_at)                                  AS last_answered_at,
    -- Ostatnia odpowiedź daje nam "ostatnie confidence" do zapisania.
    (ARRAY_AGG(sa.confidence ORDER BY sa.answered_at DESC NULLS LAST))[1]
                                                         AS last_confidence
  FROM public.session_answers sa
  JOIN public.study_sessions ss ON ss.id = sa.session_id
  GROUP BY ss.user_id, sa.question_id
)
INSERT INTO public.user_question_progress (
  user_id, question_id,
  times_answered, times_correct, last_answered_at, last_confidence,
  stability, difficulty_rating, elapsed_days, scheduled_days,
  reps, lapses, state, next_review
)
SELECT
  agg.user_id, agg.question_id,
  agg.total_answered, agg.total_correct, agg.last_answered_at, agg.last_confidence,
  0, 0.3, 0, 0,
  0, 0, 'new', NULL
FROM agg
ON CONFLICT (user_id, question_id) DO UPDATE
SET
  times_answered   = EXCLUDED.times_answered,
  times_correct    = EXCLUDED.times_correct,
  last_answered_at = GREATEST(
    public.user_question_progress.last_answered_at,
    EXCLUDED.last_answered_at
  ),
  last_confidence  = COALESCE(
    EXCLUDED.last_confidence,
    public.user_question_progress.last_confidence
  );
