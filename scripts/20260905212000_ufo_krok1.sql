-- UFO KROK 1 — schema v2 for explanation_blocks
-- Up: columns, validator, constraint swap, partial index.
-- Down: scripts/20260905212000_ufo_krok1_down.sql

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

  -- Protocol regex uses \b (word boundary). In PostgreSQL POSIX/ARE, \b is
  -- backspace; \y is the word-boundary atom. Confirmed on prod: 'opcja B'
  -- matches \y and does not match \b.
  IF p_text ~ '(odpowied[źz]|opcj[aięe]|wariant)\s*[A-F]\y' THEN
    RETURN false;
  END IF;

  IF p_text ~ ('(^|' || chr(10) || ')#{1,6}\s') THEN
    RETURN false;
  END IF;

  -- U+2600–U+27BF and U+1F300–U+1FAFF via code points (chr() ranges in
  -- POSIX classes are unreliable on the supplementary plane).
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
    'version',
    'correctReason',
    'takeaway',
    'distractors',
    'trap',
    'contrast'
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
  ADD COLUMN explanation_legacy text,
  ADD COLUMN blocks_status text NOT NULL DEFAULT 'none',
  ADD COLUMN blocks_source text,
  ADD COLUMN blocks_updated_at timestamptz,
  ADD CONSTRAINT questions_blocks_status_chk
    CHECK (blocks_status IN ('none', 'draft', 'reviewed')),
  ADD CONSTRAINT questions_blocks_source_chk
    CHECK (
      blocks_source IS NULL
      OR blocks_source IN ('parser', 'converter', 'writer', 'manual')
    );

DO $ufo$
DECLARE
  n integer;
BEGIN
  SELECT count(*) INTO n
  FROM public.questions
  WHERE explanation_blocks IS NOT NULL;

  IF n <> 0 THEN
    RAISE EXCEPTION
      'explanation_blocks is not empty (% rows); refusing constraint swap',
      n;
  END IF;
END;
$ufo$;

ALTER TABLE public.questions
  DROP CONSTRAINT questions_explanation_blocks_chk;

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

CREATE INDEX questions_blocks_status_idx
  ON public.questions (blocks_status)
  WHERE blocks_status <> 'none';
