-- UFO KROK 1 — down. Restores questions_explanation_blocks_chk from A.1.

DROP INDEX IF EXISTS public.questions_blocks_status_idx;

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_explanation_blocks_chk;

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_blocks_status_chk,
  DROP CONSTRAINT IF EXISTS questions_blocks_source_chk,
  DROP COLUMN IF EXISTS explanation_legacy,
  DROP COLUMN IF EXISTS blocks_status,
  DROP COLUMN IF EXISTS blocks_source,
  DROP COLUMN IF EXISTS blocks_updated_at;

DROP FUNCTION IF EXISTS public.explanation_blocks_valid(jsonb, jsonb, text);
DROP FUNCTION IF EXISTS public.explanation_blocks_text_allowed(text);

ALTER TABLE public.questions
  ADD CONSTRAINT questions_explanation_blocks_chk
  CHECK (
    (explanation_blocks IS NULL)
    OR (
      (jsonb_typeof(explanation_blocks) = 'object'::text)
      AND (
        (NOT (explanation_blocks ? 'takeaway'::text))
        OR (jsonb_typeof((explanation_blocks -> 'takeaway'::text)) = 'string'::text)
      )
      AND (
        (NOT (explanation_blocks ? 'correctReason'::text))
        OR (jsonb_typeof((explanation_blocks -> 'correctReason'::text)) = 'string'::text)
      )
      AND (
        (NOT (explanation_blocks ? 'distractors'::text))
        OR (jsonb_typeof((explanation_blocks -> 'distractors'::text)) = 'object'::text)
      )
    )
  );
