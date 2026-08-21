BEGIN;

ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_default_source_chk;

ALTER TABLE public.questions
  DROP CONSTRAINT questions_source_coherence_chk;

ALTER TABLE public.questions
  DROP CONSTRAINT questions_first_seen_fk;

ALTER TABLE public.questions
  DROP CONSTRAINT questions_explanation_status_chk;

DROP INDEX cem_occ_question_idx;
DROP INDEX cem_occ_session_number_idx;
DROP INDEX cem_sessions_product_ordinal_idx;
DROP INDEX questions_topic_source_active_idx;
DROP INDEX questions_content_hash_idx;

COMMENT ON COLUMN public.questions.source_exam IS NULL;
COMMENT ON COLUMN public.questions.source_code IS NULL;

ALTER TABLE public.study_sessions
  DROP COLUMN source_filter;

ALTER TABLE public.topic_mastery_cache
  DROP COLUMN cem_correct,
  DROP COLUMN cem_seen,
  DROP COLUMN cem_total;

ALTER TABLE public.profiles
  DROP COLUMN default_question_source,
  DROP COLUMN protect_cem_pool;

ALTER TABLE public.topics
  DROP COLUMN question_count_cem,
  DROP COLUMN is_inbox;

ALTER TABLE public.questions
  DROP COLUMN content_hash,
  DROP COLUMN explanation_status,
  DROP COLUMN reserve_bucket,
  DROP COLUMN repeat_count,
  DROP COLUMN first_seen_session,
  DROP COLUMN source;

DROP TABLE public.cem_question_occurrences;
DROP TABLE public.cem_sessions;

DROP TYPE public.question_source;

COMMIT;
