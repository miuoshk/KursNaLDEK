BEGIN;

ALTER TABLE public.questions DROP COLUMN reserve_bucket;

ALTER TABLE public.questions
  ADD COLUMN reserve_bucket smallint;

UPDATE public.questions
SET reserve_bucket = (abs(hashtext(id)::bigint) % 100)::smallint
WHERE reserve_bucket IS NULL;

ALTER TABLE public.questions ALTER COLUMN reserve_bucket SET NOT NULL;

COMMENT ON COLUMN public.questions.reserve_bucket IS NULL;

COMMIT;
