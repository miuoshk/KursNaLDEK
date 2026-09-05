-- UFO KROK 4 — batch apply / rollback for explanation_blocks.
-- Down: scripts/20260905220000_ufo_krok4_down.sql

CREATE OR REPLACE FUNCTION public.apply_explanation_blocks(
  batch jsonb,
  p_source text,
  p_dry_run boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $ufo$
DECLARE
  v_item jsonb;
  v_id text;
  v_blocks jsonb;
  v_refs jsonb;
  v_options jsonb;
  v_key text;
  v_before jsonb;
  v_explanation text;
  v_render text;
  v_results jsonb := '[]'::jsonb;
BEGIN
  IF NOT COALESCE(public.is_service_role(), current_user = 'postgres') THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF p_source IS NULL
     OR p_source NOT IN ('parser', 'converter', 'writer', 'manual') THEN
    RAISE EXCEPTION 'p_source must be parser|converter|writer|manual';
  END IF;

  IF batch IS NULL OR jsonb_typeof(batch) <> 'array' THEN
    RAISE EXCEPTION 'batch must be a JSON array';
  END IF;

  IF jsonb_array_length(batch) > 50 THEN
    RAISE EXCEPTION 'batch exceeds 50 items; nothing written';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(batch) LOOP
    v_id := NULL;
    v_blocks := NULL;
    v_refs := '[]'::jsonb;
    v_options := NULL;
    v_key := NULL;
    v_before := NULL;
    v_explanation := NULL;
    v_render := NULL;

    IF jsonb_typeof(v_item) = 'object' THEN
      v_id := nullif(btrim(coalesce(v_item ->> 'id', '')), '');
      v_blocks := v_item -> 'blocks';
      IF jsonb_typeof(v_item -> 'refs') = 'array' THEN
        v_refs := v_item -> 'refs';
      END IF;
    END IF;

    IF v_id IS NULL THEN
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'id', NULL,
          'status', 'rejected',
          'reason', 'malformed'
        )
      );
      CONTINUE;
    END IF;

    SELECT q.options, q.correct_option_id, q.explanation_blocks
    INTO v_options, v_key, v_before
    FROM public.questions q
    WHERE q.id = v_id;

    IF NOT FOUND THEN
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'id', v_id,
          'status', 'rejected',
          'reason', 'not_found'
        )
      );
      CONTINUE;
    END IF;

    IF NOT public.explanation_blocks_valid(v_blocks, v_options, v_key) THEN
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'id', v_id,
          'status', 'rejected',
          'reason', 'invalid_blocks'
        )
      );
      CONTINUE;
    END IF;

    v_render := public.render_explanation_blocks(v_blocks, v_options, v_key);

    IF p_dry_run THEN
      v_results := v_results || jsonb_build_array(
        jsonb_build_object(
          'id', v_id,
          'status', 'preview',
          'reason', NULL,
          'render', v_render,
          'render_length', char_length(v_render)
        )
      );
      CONTINUE;
    END IF;

    UPDATE public.questions
    SET
      explanation_blocks = v_blocks,
      blocks_source = p_source,
      blocks_status = 'draft'
    WHERE id = v_id
    RETURNING explanation INTO v_explanation;

    INSERT INTO public.question_edits (
      question_id,
      editor_id,
      editor_role,
      report_id,
      changes
    ) VALUES (
      v_id,
      NULL,
      'batch',
      NULL,
      jsonb_build_object(
        'explanation_blocks', jsonb_build_object(
          'before', v_before,
          'after', v_blocks
        ),
        'refs', v_refs,
        'source', p_source
      )
    );

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'id', v_id,
        'status', 'applied',
        'reason', NULL,
        'render_length', char_length(v_explanation),
        'explanation_md5', md5(v_explanation)
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'dry_run', p_dry_run,
    'source', p_source,
    'results', v_results
  );
END;
$ufo$;

CREATE OR REPLACE FUNCTION public.rollback_explanation_blocks(ids text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $ufo$
DECLARE
  v_id text;
  v_legacy text;
  v_blocks jsonb;
  v_restored jsonb := '[]'::jsonb;
  v_skipped jsonb := '[]'::jsonb;
BEGIN
  IF NOT COALESCE(public.is_service_role(), current_user = 'postgres') THEN
    RAISE EXCEPTION 'Forbidden'
      USING ERRCODE = '42501';
  END IF;

  IF ids IS NULL THEN
    RETURN jsonb_build_object(
      'ok', true,
      'restored', v_restored,
      'skipped', v_skipped
    );
  END IF;

  FOREACH v_id IN ARRAY ids LOOP
    v_legacy := NULL;
    v_blocks := NULL;

    SELECT q.explanation_legacy, q.explanation_blocks
    INTO v_legacy, v_blocks
    FROM public.questions q
    WHERE q.id = v_id;

    IF NOT FOUND THEN
      v_skipped := v_skipped || jsonb_build_array(
        jsonb_build_object('id', v_id, 'reason', 'not_found')
      );
      CONTINUE;
    END IF;

    IF v_blocks IS NULL THEN
      v_skipped := v_skipped || jsonb_build_array(
        jsonb_build_object('id', v_id, 'reason', 'no_blocks')
      );
      CONTINUE;
    END IF;

    IF v_legacy IS NULL THEN
      v_skipped := v_skipped || jsonb_build_array(
        jsonb_build_object('id', v_id, 'reason', 'no_legacy')
      );
      CONTINUE;
    END IF;

    UPDATE public.questions
    SET
      explanation_blocks = NULL,
      blocks_status = 'none'
    WHERE id = v_id;

    INSERT INTO public.question_edits (
      question_id,
      editor_id,
      editor_role,
      report_id,
      changes
    ) VALUES (
      v_id,
      NULL,
      'batch',
      NULL,
      jsonb_build_object(
        'explanation_blocks', jsonb_build_object(
          'before', v_blocks,
          'after', NULL
        ),
        'rollback', true
      )
    );

    v_restored := v_restored || jsonb_build_array(to_jsonb(v_id));
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'restored', v_restored,
    'skipped', v_skipped
  );
END;
$ufo$;

REVOKE ALL ON FUNCTION public.apply_explanation_blocks(jsonb, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_explanation_blocks(jsonb, text, boolean)
  TO service_role;

REVOKE ALL ON FUNCTION public.rollback_explanation_blocks(text[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rollback_explanation_blocks(text[])
  TO service_role;
