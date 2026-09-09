-- UFO statement_set — render + explanation_blocks_valid.
-- Nie aplikować automatycznie na produkcję. SBA v2 zostaje bez zmian.
--
-- Kolejność w tym pliku (i na staging):
--   1. render_explanation_blocks — trigger nadpisze explanation dopiero
--      gdy umie renderować zestawienia;
--   2. explanation_blocks_valid — CHECK zaczyna przyjmować statement_set;
--   3. apply_explanation_blocks / admin — bez zmiany sygnatury, wołają
--      valid + trigger z renderem.
-- Trigger i apply_explanation_blocks nie wymagają osobnego REPLACE.

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
  question_type text;
  stmt jsonb;
  stmt_ord integer := 0;
  stmt_num integer;
  stmt_lines text[] := ARRAY[]::text[];
  stmt_block text;
  verdict_label text;
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

  question_type := blocks ->> 'questionType';
  IF question_type = 'statement_set' THEN
    takeaway := nullif(btrim(coalesce(blocks ->> 'takeaway', '')), '');
    IF takeaway IS NOT NULL THEN
      sections := sections || ARRAY['> **Zasada:** ' || takeaway];
    END IF;

    reason := nullif(btrim(coalesce(blocks ->> 'correctReason', '')), '');
    IF reason IS NOT NULL THEN
      sections := sections || ARRAY[reason];
    END IF;

    IF jsonb_typeof(blocks -> 'statements') = 'array' THEN
      FOR stmt IN
        SELECT e.value
        FROM jsonb_array_elements(blocks -> 'statements')
          WITH ORDINALITY AS e(value, ord)
        ORDER BY e.ord
      LOOP
        stmt_ord := stmt_ord + 1;
        IF jsonb_typeof(stmt -> 'number') = 'number' THEN
          stmt_num := (stmt ->> 'number')::integer;
        ELSE
          stmt_num := stmt_ord;
        END IF;
        IF (stmt -> 'isTrue') = 'true'::jsonb THEN
          verdict_label := 'Prawda';
        ELSE
          verdict_label := 'Fałsz';
        END IF;
        stmt_block := stmt_num::text || '. '
          || btrim(coalesce(stmt ->> 'text', ''))
          || ' — ' || verdict_label
          || chr(10)
          || btrim(coalesce(stmt ->> 'rationale', ''));
        IF stmt ? 'correction'
           AND nullif(btrim(coalesce(stmt ->> 'correction', '')), '') IS NOT NULL THEN
          stmt_block := stmt_block || chr(10)
            || btrim(stmt ->> 'correction');
        END IF;
        stmt_lines := stmt_lines || ARRAY[stmt_block];
      END LOOP;
    END IF;

    IF coalesce(array_length(stmt_lines, 1), 0) > 0 THEN
      sections := sections || ARRAY[
        '**Stwierdzenia**'
        || chr(10) || chr(10)
        || array_to_string(stmt_lines, chr(10) || chr(10))
      ];
    END IF;
  ELSE
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

  IF question_type IS DISTINCT FROM 'statement_set' THEN
    takeaway := nullif(btrim(coalesce(blocks ->> 'takeaway', '')), '');
    IF takeaway IS NOT NULL THEN
      sections := sections || ARRAY['> **Zasada:** ' || takeaway];
    END IF;
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
    'contrast',
    'questionType',
    'statements',
    'optionStatements'
  ];
  key text;
  raw text;
  opt_ids text[] := ARRAY[]::text[];
  contrast jsonb;
  contrast_row jsonb;
  cell jsonb;
  s text;
  question_type text;
  stmt jsonb;
  stmt_ids text[] := ARRAY[]::text[];
  stmt_nums integer[] := ARRAY[]::integer[];
  stmt_num integer;
  true_ids text[] := ARRAY[]::text[];
  mapped text[];
  matches text[] := ARRAY[]::text[];
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

  IF jsonb_typeof(options) = 'array' THEN
    SELECT coalesce(array_agg(elem ->> 'id'), ARRAY[]::text[])
    INTO opt_ids
    FROM jsonb_array_elements(options) AS elem;
  END IF;

  question_type := blocks ->> 'questionType';
  IF question_type IS NULL OR question_type = 'single_best_answer' THEN
    IF blocks ? 'statements' OR blocks ? 'optionStatements' THEN
      RETURN false;
    END IF;
    IF jsonb_typeof(blocks -> 'correctReason') <> 'string' THEN
      RETURN false;
    END IF;
    raw := blocks ->> 'correctReason';
    IF btrim(raw) = '' OR char_length(raw) > 900 THEN
      RETURN false;
    END IF;
  ELSIF question_type = 'statement_set' THEN
    IF blocks ? 'distractors' THEN
      RETURN false;
    END IF;
    IF jsonb_typeof(blocks -> 'statements') <> 'array'
       OR jsonb_typeof(blocks -> 'optionStatements') <> 'object' THEN
      RETURN false;
    END IF;
    IF jsonb_array_length(blocks -> 'statements') < 2
       OR jsonb_array_length(blocks -> 'statements') > 8 THEN
      RETURN false;
    END IF;

    FOR stmt IN SELECT value FROM jsonb_array_elements(blocks -> 'statements') LOOP
      IF jsonb_typeof(stmt) <> 'object' THEN
        RETURN false;
      END IF;
      IF jsonb_typeof(stmt -> 'id') <> 'string'
         OR jsonb_typeof(stmt -> 'text') <> 'string'
         OR jsonb_typeof(stmt -> 'isTrue') <> 'boolean'
         OR jsonb_typeof(stmt -> 'rationale') <> 'string' THEN
        RETURN false;
      END IF;
      IF btrim(stmt ->> 'id') = ''
         OR char_length(stmt ->> 'id') > 40
         OR (stmt ->> 'id') !~ '^[A-Za-z0-9][A-Za-z0-9_-]*$' THEN
        RETURN false;
      END IF;
      IF stmt ->> 'id' = ANY (stmt_ids) THEN
        RETURN false;
      END IF;
      stmt_ids := stmt_ids || (stmt ->> 'id');
      IF btrim(stmt ->> 'text') = '' OR char_length(stmt ->> 'text') > 200 THEN
        RETURN false;
      END IF;
      IF btrim(stmt ->> 'rationale') = ''
         OR char_length(stmt ->> 'rationale') > 350 THEN
        RETURN false;
      END IF;
      IF stmt ? 'number' THEN
        IF jsonb_typeof(stmt -> 'number') <> 'number'
           OR (stmt ->> 'number') ~ '\.' THEN
          RETURN false;
        END IF;
        stmt_num := (stmt ->> 'number')::integer;
        IF stmt_num < 1 OR stmt_num > 20 OR stmt_num = ANY (stmt_nums) THEN
          RETURN false;
        END IF;
        stmt_nums := stmt_nums || stmt_num;
      END IF;
      IF stmt ? 'correction'
         AND (stmt -> 'isTrue') IS DISTINCT FROM 'true'::jsonb
         AND char_length(stmt ->> 'correction') > 200 THEN
        RETURN false;
      END IF;
      IF (stmt -> 'isTrue') = 'true'::jsonb THEN
        true_ids := true_ids || (stmt ->> 'id');
      ELSIF stmt ? 'correction'
            AND (jsonb_typeof(stmt -> 'correction') <> 'string'
                 OR btrim(stmt ->> 'correction') = '') THEN
        RETURN false;
      END IF;
      IF (stmt -> 'isTrue') = 'true'::jsonb AND stmt ? 'correction' THEN
        RETURN false;
      END IF;
    END LOOP;

    FOR key IN SELECT jsonb_object_keys(blocks -> 'optionStatements') LOOP
      IF NOT (key = ANY (opt_ids)) THEN
        RETURN false;
      END IF;
      IF jsonb_typeof((blocks -> 'optionStatements') -> key) <> 'array'
         OR jsonb_array_length((blocks -> 'optionStatements') -> key) < 1 THEN
        RETURN false;
      END IF;
    END LOOP;

    IF array_length(opt_ids, 1) IS NULL THEN
      RETURN false;
    END IF;
    FOREACH key IN ARRAY opt_ids LOOP
      IF NOT ((blocks -> 'optionStatements') ? key) THEN
        RETURN false;
      END IF;
      SELECT coalesce(array_agg(value #>> '{}'), ARRAY[]::text[])
      INTO mapped
      FROM jsonb_array_elements((blocks -> 'optionStatements') -> key);
      IF mapped IS NULL OR array_length(mapped, 1) IS NULL THEN
        RETURN false;
      END IF;
      IF EXISTS (
        SELECT 1 FROM unnest(mapped) AS mid
        WHERE NOT (mid = ANY (stmt_ids))
      ) THEN
        RETURN false;
      END IF;
      IF (
        SELECT array_agg(x ORDER BY x) FROM unnest(mapped) AS x
      ) IS NOT DISTINCT FROM (
        SELECT array_agg(x ORDER BY x) FROM unnest(true_ids) AS x
      ) THEN
        matches := matches || key;
      END IF;
    END LOOP;

    IF array_length(matches, 1) IS DISTINCT FROM 1 THEN
      RETURN false;
    END IF;
    IF matches[1] IS DISTINCT FROM correct_option_id THEN
      RETURN false;
    END IF;
  ELSE
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

  IF question_type IS NULL OR question_type = 'single_best_answer' THEN
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
