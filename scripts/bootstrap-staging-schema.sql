-- UFO KROK 5 — minimal schema for the ufo-staging branch.
-- Branching did not clone prod (repo has no supabase/migrations).
-- This creates only the tables needed to seed a subset and run apply/rollback.
-- After this file: apply scripts/20260905214000_ufo_krok2.sql
-- and scripts/20260905220000_ufo_krok4.sql.

CREATE SCHEMA IF NOT EXISTS private;

DO $ufo$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_source') THEN
    CREATE TYPE public.question_source AS ENUM ('own', 'cem', 'uczelnia');
  END IF;
END;
$ufo$;

CREATE TABLE IF NOT EXISTS public.subjects (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  icon_name text DEFAULT 'book-open',
  year integer NOT NULL,
  track text NOT NULL DEFAULT 'stomatologia',
  product text NOT NULL DEFAULT 'knnp',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.topics (
  id text PRIMARY KEY,
  subject_id text REFERENCES public.subjects(id),
  name text NOT NULL,
  display_order integer DEFAULT 0,
  question_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  knowledge_card text,
  tracks text[],
  is_inbox boolean NOT NULL DEFAULT false,
  question_count_ref integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.questions (
  id text PRIMARY KEY,
  topic_id text REFERENCES public.topics(id),
  text text NOT NULL,
  options jsonb NOT NULL,
  correct_option_id text NOT NULL,
  explanation text NOT NULL,
  source_exam text,
  source_code text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  question_type text DEFAULT 'single_choice',
  timer_seconds integer,
  learning_outcome text,
  correct_order jsonb,
  hotspots jsonb,
  drill_questions jsonb,
  identify_mode text,
  theme_label text,
  subtheme_label text,
  batch_label text,
  disable_option_shuffle boolean NOT NULL DEFAULT false,
  tracks text[],
  source public.question_source NOT NULL DEFAULT 'own',
  first_seen_session text,
  repeat_count smallint NOT NULL DEFAULT 0,
  explanation_status text NOT NULL DEFAULT 'reviewed',
  content_hash text,
  reserve_bucket smallint,
  explanation_blocks jsonb,
  explanation_legacy text,
  blocks_status text NOT NULL DEFAULT 'none',
  blocks_source text,
  blocks_updated_at timestamptz,
  CONSTRAINT questions_blocks_status_chk
    CHECK (blocks_status IN ('none', 'draft', 'reviewed')),
  CONSTRAINT questions_blocks_source_chk
    CHECK (
      blocks_source IS NULL
      OR blocks_source IN ('parser', 'converter', 'writer', 'manual')
    )
);

CREATE TABLE IF NOT EXISTS public.concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id text NOT NULL,
  topic_id text,
  parent_id uuid,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  source text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.question_concepts (
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  concept_id uuid NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  relation text NOT NULL DEFAULT 'primary',
  weight real NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'manual',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, concept_id)
);

CREATE TABLE IF NOT EXISTS public.question_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  editor_id uuid,
  editor_role text NOT NULL,
  report_id uuid,
  changes jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learning_experiment_configs (
  experiment_key text PRIMARY KEY,
  scheduler_version text NOT NULL,
  rollout_percent integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT false,
  guardrails jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL,
  full_name text NOT NULL,
  nick text NOT NULL,
  role text DEFAULT 'student',
  current_product text DEFAULT 'ldew',
  locale text NOT NULL DEFAULT 'pl',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $ufo$
  SELECT
    COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    OR COALESCE(
      NULLIF(current_setting('request.jwt.claims', true), ''),
      '{}'
    )::jsonb ->> 'role' = 'service_role'
    OR auth.role() = 'service_role';
$ufo$;

REVOKE ALL ON FUNCTION public.is_service_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO service_role;

CREATE OR REPLACE FUNCTION private.is_admin_or_moderator(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $ufo$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid AND p.role IN ('admin', 'moderator')
  );
$ufo$;

CREATE OR REPLACE FUNCTION public.explanation_blocks_text_allowed(p_text text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $ufo$
DECLARE
  i integer;
  cp integer;
BEGIN
  IF p_text IS NULL THEN
    RETURN false;
  END IF;
  IF p_text ~ '(odpowied[źz]|opcj[aięe]|wariant)\s*[A-F]\y' THEN
    RETURN false;
  END IF;
  IF p_text ~ ('(^|' || chr(10) || ')#{1,6}\s') THEN
    RETURN false;
  END IF;
  FOR i IN 1..char_length(p_text) LOOP
    cp := ascii(substr(p_text, i, 1));
    IF (cp >= 9728 AND cp <= 10175) OR (cp >= 127744 AND cp <= 129279) THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$ufo$;

CREATE OR REPLACE FUNCTION public.explanation_blocks_valid(
  blocks jsonb,
  options jsonb,
  correct_option_id text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $ufo$
DECLARE
  allowed_keys text[] := ARRAY[
    'version', 'correctReason', 'takeaway', 'distractors', 'trap', 'contrast'
  ];
  key text;
  raw text;
  opt_ids text[] := ARRAY[]::text[];
  contrast jsonb;
  contrast_row jsonb;
  cell jsonb;
  s text;
BEGIN
  IF blocks IS NULL OR jsonb_typeof(blocks) <> 'object' THEN
    RETURN false;
  END IF;
  FOR key IN SELECT jsonb_object_keys(blocks) LOOP
    IF NOT (key = ANY (allowed_keys)) THEN
      RETURN false;
    END IF;
  END LOOP;
  IF (blocks -> 'version') IS DISTINCT FROM '2'::jsonb THEN
    RETURN false;
  END IF;
  IF jsonb_typeof(blocks -> 'correctReason') <> 'string' THEN
    RETURN false;
  END IF;
  raw := blocks ->> 'correctReason';
  IF btrim(raw) = '' OR char_length(raw) > 900 THEN
    RETURN false;
  END IF;
  IF blocks ? 'takeaway' THEN
    IF jsonb_typeof(blocks -> 'takeaway') <> 'string' THEN
      RETURN false;
    END IF;
    raw := blocks ->> 'takeaway';
    IF btrim(raw) = '' OR char_length(raw) > 200 THEN
      RETURN false;
    END IF;
  END IF;
  IF blocks ? 'trap' THEN
    IF jsonb_typeof(blocks -> 'trap') <> 'string' THEN
      RETURN false;
    END IF;
    raw := blocks ->> 'trap';
    IF btrim(raw) = '' OR char_length(raw) > 350 THEN
      RETURN false;
    END IF;
  END IF;
  IF jsonb_typeof(options) = 'array' THEN
    SELECT coalesce(array_agg(elem ->> 'id'), ARRAY[]::text[])
    INTO opt_ids
    FROM jsonb_array_elements(options) AS elem;
  END IF;
  IF blocks ? 'distractors' THEN
    IF jsonb_typeof(blocks -> 'distractors') <> 'object' THEN
      RETURN false;
    END IF;
    FOR key IN SELECT jsonb_object_keys(blocks -> 'distractors') LOOP
      IF jsonb_typeof((blocks -> 'distractors') -> key) <> 'string' THEN
        RETURN false;
      END IF;
      IF key = correct_option_id OR NOT (key = ANY (opt_ids)) THEN
        RETURN false;
      END IF;
      raw := (blocks -> 'distractors') ->> key;
      IF btrim(raw) = '' OR char_length(raw) > 350 THEN
        RETURN false;
      END IF;
    END LOOP;
  END IF;
  IF blocks ? 'contrast' THEN
    contrast := blocks -> 'contrast';
    IF jsonb_typeof(contrast) <> 'array' THEN
      RETURN false;
    END IF;
    IF jsonb_array_length(contrast) < 1 OR jsonb_array_length(contrast) > 5 THEN
      RETURN false;
    END IF;
    FOR contrast_row IN SELECT value FROM jsonb_array_elements(contrast) LOOP
      IF jsonb_typeof(contrast_row) <> 'array' THEN
        RETURN false;
      END IF;
      IF jsonb_array_length(contrast_row) < 1
         OR jsonb_array_length(contrast_row) > 3 THEN
        RETURN false;
      END IF;
      FOR cell IN SELECT value FROM jsonb_array_elements(contrast_row) LOOP
        IF jsonb_typeof(cell) <> 'string' THEN
          RETURN false;
        END IF;
        raw := cell #>> '{}';
        IF btrim(raw) = '' OR char_length(raw) > 80 THEN
          RETURN false;
        END IF;
      END LOOP;
    END LOOP;
  END IF;
  FOR s IN
    SELECT jsonb_array_elements_text(
      jsonb_path_query_array(blocks, 'strict $.** ? (@.type() == "string")')
    )
  LOOP
    IF NOT public.explanation_blocks_text_allowed(s) THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$ufo$;

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_explanation_blocks_chk;

ALTER TABLE public.questions
  ADD CONSTRAINT questions_explanation_blocks_chk
  CHECK (
    explanation_blocks IS NULL
    OR public.explanation_blocks_valid(
      explanation_blocks,
      options,
      correct_option_id
    )
  );
