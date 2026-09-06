-- UFO KROK 2 — render in the database, triggers, admin preview RPC.
-- Down: scripts/20260905214000_ufo_krok2_down.sql

CREATE OR REPLACE FUNCTION public.render_explanation_blocks(
  blocks jsonb,
  options jsonb,
  correct_option_id text
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $ufo$
DECLARE
  sections text[] := ARRAY[]::text[];
  verdict text;
  reason text;
  distractor_lines text[] := ARRAY[]::text[];
  opt jsonb;
  opt_id text;
  opt_text text;
  dist_text text;
  contrast_row jsonb;
  row_idx integer := 0;
  cells text[];
  table_lines text[] := ARRAY[]::text[];
  col_count integer;
  trap text;
  takeaway text;
  result text;
BEGIN
  IF blocks IS NULL OR jsonb_typeof(blocks) <> 'object' THEN
    RETURN '';
  END IF;

  IF jsonb_typeof(options) = 'array' THEN
    SELECT nullif(btrim(elem ->> 'text'), '')
    INTO verdict
    FROM jsonb_array_elements(options) AS elem
    WHERE elem ->> 'id' = correct_option_id
    LIMIT 1;
  END IF;

  IF verdict IS NOT NULL THEN
    sections := sections || ARRAY['**Poprawna odpowiedź:** ' || verdict];
  END IF;

  reason := nullif(btrim(coalesce(blocks ->> 'correctReason', '')), '');
  IF reason IS NOT NULL THEN
    sections := sections || ARRAY[reason];
  END IF;

  IF jsonb_typeof(options) = 'array'
     AND jsonb_typeof(blocks -> 'distractors') = 'object' THEN
    FOR opt IN
      SELECT e.value
      FROM jsonb_array_elements(options) WITH ORDINALITY AS e(value, ord)
      ORDER BY e.ord
    LOOP
      opt_id := opt ->> 'id';
      IF opt_id IS NULL OR opt_id = correct_option_id THEN
        CONTINUE;
      END IF;
      opt_text := nullif(btrim(coalesce(opt ->> 'text', '')), '');
      dist_text := nullif(
        btrim(coalesce((blocks -> 'distractors') ->> opt_id, '')),
        ''
      );
      IF opt_text IS NULL OR dist_text IS NULL THEN
        CONTINUE;
      END IF;
      distractor_lines := distractor_lines || ARRAY[
        '- *' || opt_text || '* — ' || dist_text
      ];
    END LOOP;
  END IF;

  IF coalesce(array_length(distractor_lines, 1), 0) > 0 THEN
    sections := sections || ARRAY[
      '**Dlaczego nie pozostałe?**'
      || chr(10) || chr(10)
      || array_to_string(distractor_lines, chr(10))
    ];
  END IF;

  IF jsonb_typeof(blocks -> 'contrast') = 'array' THEN
    FOR contrast_row IN
      SELECT e.value
      FROM jsonb_array_elements(blocks -> 'contrast')
        WITH ORDINALITY AS e(value, ord)
      ORDER BY e.ord
    LOOP
      IF jsonb_typeof(contrast_row) <> 'array' THEN
        CONTINUE;
      END IF;
      SELECT coalesce(array_agg(btrim(c.value #>> '{}') ORDER BY c.ord), ARRAY[]::text[])
      INTO cells
      FROM jsonb_array_elements(contrast_row)
        WITH ORDINALITY AS c(value, ord)
      WHERE jsonb_typeof(c.value) = 'string';

      IF coalesce(array_length(cells, 1), 0) = 0 THEN
        CONTINUE;
      END IF;

      row_idx := row_idx + 1;
      table_lines := table_lines || ARRAY[
        '| ' || array_to_string(cells, ' | ') || ' |'
      ];

      IF row_idx = 1 THEN
        col_count := array_length(cells, 1);
        table_lines := table_lines || ARRAY[
          '| ' || array_to_string(
            array_fill('---'::text, ARRAY[col_count]),
            ' | '
          ) || ' |'
        ];
      END IF;
    END LOOP;
  END IF;

  IF coalesce(array_length(table_lines, 1), 0) > 0 THEN
    sections := sections || ARRAY[array_to_string(table_lines, chr(10))];
  END IF;

  trap := nullif(btrim(coalesce(blocks ->> 'trap', '')), '');
  IF trap IS NOT NULL THEN
    sections := sections || ARRAY['> **Pułapka:** ' || trap];
  END IF;

  takeaway := nullif(btrim(coalesce(blocks ->> 'takeaway', '')), '');
  IF takeaway IS NOT NULL THEN
    sections := sections || ARRAY['> **Zasada:** ' || takeaway];
  END IF;

  IF coalesce(array_length(sections, 1), 0) = 0 THEN
    RETURN '';
  END IF;

  result := array_to_string(sections, chr(10) || chr(10));
  result := array_to_string(
    ARRAY(
      SELECT rtrim(line)
      FROM unnest(string_to_array(result, chr(10))) AS line
    ),
    chr(10)
  );
  RETURN rtrim(result, chr(10));
END;
$ufo$;

CREATE OR REPLACE FUNCTION public.trg_questions_render_explanation_blocks()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $ufo$
BEGIN
  IF NEW.explanation_blocks IS NOT NULL THEN
    IF NEW.explanation_legacy IS NULL
       AND (TG_OP = 'INSERT' OR OLD.explanation_blocks IS NULL) THEN
      NEW.explanation_legacy := CASE
        WHEN TG_OP = 'UPDATE' THEN coalesce(OLD.explanation, '')
        ELSE ''
      END;
    END IF;
    NEW.explanation := public.render_explanation_blocks(
      NEW.explanation_blocks,
      NEW.options,
      NEW.correct_option_id
    );
    NEW.blocks_updated_at := now();
    IF NEW.blocks_status = 'none' THEN
      NEW.blocks_status := 'draft';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.explanation_blocks IS NOT NULL THEN
    NEW.explanation := coalesce(NEW.explanation_legacy, OLD.explanation);
    NEW.blocks_status := 'none';
    NEW.blocks_source := NULL;
  END IF;
  RETURN NEW;
END;
$ufo$;

CREATE OR REPLACE FUNCTION public.trg_questions_rerender_explanation_on_options()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $ufo$
BEGIN
  IF NEW.explanation_blocks IS NOT NULL THEN
    NEW.explanation := public.render_explanation_blocks(
      NEW.explanation_blocks,
      NEW.options,
      NEW.correct_option_id
    );
  END IF;
  RETURN NEW;
END;
$ufo$;

DROP TRIGGER IF EXISTS questions_render_explanation_blocks ON public.questions;
CREATE TRIGGER questions_render_explanation_blocks
  BEFORE INSERT OR UPDATE OF explanation_blocks ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_questions_render_explanation_blocks();

DROP TRIGGER IF EXISTS questions_rerender_explanation_on_options ON public.questions;
CREATE TRIGGER questions_rerender_explanation_on_options
  BEFORE UPDATE OF options ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_questions_rerender_explanation_on_options();

CREATE OR REPLACE FUNCTION public.preview_explanation_blocks(
  blocks jsonb,
  question_id text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $ufo$
DECLARE
  q_options jsonb;
  q_key text;
BEGIN
  IF NOT private.is_admin_or_moderator((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'BŁĄD: brak uprawnień'
      USING ERRCODE = '42501';
  END IF;

  SELECT q.options, q.correct_option_id
  INTO q_options, q_key
  FROM public.questions q
  WHERE q.id = question_id;

  IF NOT FOUND THEN
    RETURN 'BŁĄD: nie znaleziono pytania';
  END IF;

  IF NOT public.explanation_blocks_valid(blocks, q_options, q_key) THEN
    RETURN 'BŁĄD: bloki nie spełniają kontraktu v2';
  END IF;

  RETURN public.render_explanation_blocks(blocks, q_options, q_key);
END;
$ufo$;

REVOKE ALL ON FUNCTION public.preview_explanation_blocks(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_explanation_blocks(jsonb, text)
  TO authenticated;

REVOKE ALL ON FUNCTION public.render_explanation_blocks(jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.render_explanation_blocks(jsonb, jsonb, text)
  TO postgres, service_role, authenticated;

REVOKE ALL ON FUNCTION public.trg_questions_render_explanation_blocks() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_questions_rerender_explanation_on_options() FROM PUBLIC;
