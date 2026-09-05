-- UP: czas na pasku pewności (KROK 8). NULL w przeglądzie / starych wierszach.
ALTER TABLE public.session_answers
  ADD COLUMN IF NOT EXISTS confidence_latency_ms integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.session_answers'::regclass
      AND conname = 'session_answers_confidence_latency_ms_chk'
  ) THEN
    ALTER TABLE public.session_answers
      ADD CONSTRAINT session_answers_confidence_latency_ms_chk
      CHECK (confidence_latency_ms IS NULL OR confidence_latency_ms >= 0);
  END IF;
END
$$;

-- DOWN:
-- ALTER TABLE public.session_answers
--   DROP CONSTRAINT IF EXISTS session_answers_confidence_latency_ms_chk;
-- ALTER TABLE public.session_answers
--   DROP COLUMN IF EXISTS confidence_latency_ms;
