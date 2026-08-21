BEGIN;

CREATE TYPE public.question_source AS ENUM ('own', 'cem', 'uczelnia');

ALTER TABLE public.questions
  ADD COLUMN source              public.question_source NOT NULL DEFAULT 'own',
  ADD COLUMN first_seen_session  text,
  ADD COLUMN repeat_count        smallint NOT NULL DEFAULT 0,
  ADD COLUMN reserve_bucket      smallint,
  ADD COLUMN explanation_status  text NOT NULL DEFAULT 'reviewed';

ALTER TABLE public.questions
  ADD CONSTRAINT questions_explanation_status_chk
  CHECK (explanation_status IN ('missing', 'draft', 'reviewed'));

UPDATE public.questions
SET reserve_bucket = (abs(hashtext(id)::bigint) % 100)::smallint
WHERE reserve_bucket IS NULL;

ALTER TABLE public.questions ALTER COLUMN reserve_bucket SET NOT NULL;

-- kolumna nazywa sie "text" (nie question_text) — cudzyslowy sa obowiazkowe
ALTER TABLE public.questions
  ADD COLUMN content_hash text
  GENERATED ALWAYS AS (
    md5(lower(regexp_replace("text", '[^[:alnum:]]+', '', 'g')))
  ) STORED;

CREATE INDEX questions_content_hash_idx ON public.questions (content_hash);
CREATE INDEX questions_topic_source_active_idx
  ON public.questions (topic_id, source, is_active);

CREATE TABLE public.cem_sessions (
  id              text PRIMARY KEY,
  product         text    NOT NULL,
  short_code      text    NOT NULL UNIQUE,
  label           text    NOT NULL,
  ordinal         integer,
  held_on         date,
  total_questions integer NOT NULL DEFAULT 0,
  is_published    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX cem_sessions_product_ordinal_idx
  ON public.cem_sessions (product, ordinal) WHERE ordinal IS NOT NULL;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_first_seen_fk
  FOREIGN KEY (first_seen_session) REFERENCES public.cem_sessions(id);

ALTER TABLE public.questions
  ADD CONSTRAINT questions_source_coherence_chk
  CHECK (source = 'cem' OR first_seen_session IS NULL);

CREATE TABLE public.cem_question_occurrences (
  cem_session_id  text    NOT NULL REFERENCES public.cem_sessions(id) ON DELETE CASCADE,
  question_id     text    NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_number integer,
  PRIMARY KEY (cem_session_id, question_id)
);

CREATE UNIQUE INDEX cem_occ_session_number_idx
  ON public.cem_question_occurrences (cem_session_id, question_number)
  WHERE question_number IS NOT NULL;

CREATE INDEX cem_occ_question_idx ON public.cem_question_occurrences (question_id);

ALTER TABLE public.topics
  ADD COLUMN is_inbox           boolean NOT NULL DEFAULT false,
  ADD COLUMN question_count_cem integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN protect_cem_pool        boolean NOT NULL DEFAULT true,
  ADD COLUMN default_question_source text    NOT NULL DEFAULT 'all';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_source_chk
  CHECK (default_question_source IN ('all', 'cem', 'own'));

ALTER TABLE public.topic_mastery_cache
  ADD COLUMN cem_total   integer NOT NULL DEFAULT 0,
  ADD COLUMN cem_seen    integer NOT NULL DEFAULT 0,
  ADD COLUMN cem_correct integer NOT NULL DEFAULT 0;

ALTER TABLE public.study_sessions
  ADD COLUMN source_filter text NOT NULL DEFAULT 'all';

COMMENT ON COLUMN public.questions.source IS
  'Rodzaj pochodzenia: own (fabryka) | cem (oficjalny arkusz) | uczelnia (kolokwium). Zrodlo prawdy dla filtrow i statystyk.';
COMMENT ON COLUMN public.questions.source_exam IS
  'Historyczna etykieta zrodla, wolny tekst. Zostaje jako slad audytowy i dla pytan uczelnianych. Dla source = cem miarodajne jest first_seen_session -> cem_sessions.';
COMMENT ON COLUMN public.questions.source_code IS
  'Kod/licznik w zrodle. NIE jest numerem pytania w arkuszu - nie parsuj z niego cem_question_occurrences.question_number.';

COMMIT;
