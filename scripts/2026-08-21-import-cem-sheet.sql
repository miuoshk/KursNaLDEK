-- Importer arkusza CEM do poczekalni przedmiotu.
-- Wejscie: jsonb tablica {number, text, options:{a..e}, correct_option_id, explanation?}
-- Nie wstawia reserve_bucket (kolumna generowana).
-- Nie rusza is_active przy ON CONFLICT.

CREATE OR REPLACE FUNCTION public.import_cem_sheet(
  p_cem_session_id text,
  p_short_code text,
  p_subject_id text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inbox text := 'INBOX--' || p_subject_id;
  v_product text;
  v_track text;
  v_tracks text[];
  v_session_code text;
  v_item jsonb;
  v_num int;
  v_stem text;
  v_hash text;
  v_qid text;
  v_expl text;
  v_status text;
  v_opts jsonb;
  v_key text;
  v_hit_id text;
  v_hit_source public.question_source;
  v_new int := 0;
  v_repeats int := 0;
  v_collisions jsonb := '[]'::jsonb;
  v_seen_numbers int[] := '{}';
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items musi byc tablica JSON';
  END IF;

  SELECT s.product, s.track, ses.short_code
    INTO v_product, v_track, v_session_code
  FROM public.subjects s
  CROSS JOIN public.cem_sessions ses
  WHERE s.id = p_subject_id
    AND ses.id = p_cem_session_id;

  IF v_product IS NULL THEN
    RAISE EXCEPTION 'brak przedmiotu % albo sesji CEM %', p_subject_id, p_cem_session_id;
  END IF;
  IF v_session_code IS DISTINCT FROM p_short_code THEN
    RAISE EXCEPTION 'short_code % nie zgadza sie z sesja % (%)',
      p_short_code, p_cem_session_id, v_session_code;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.topics WHERE id = v_inbox AND is_inbox) THEN
    RAISE EXCEPTION 'brak poczekalni % — najpierw scripts/2026-08-21-cem-inbox-topics.sql', v_inbox;
  END IF;

  v_tracks := CASE
    WHEN v_product = 'ldew' THEN ARRAY['stomatologia']::text[]
    WHEN v_track IN ('stomatologia', 'lekarski') THEN ARRAY[v_track]
    ELSE NULL
  END;

  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_num := (v_item->>'number')::int;
    IF v_num IS NULL OR v_num < 1 THEN
      RAISE EXCEPTION 'pozycja arkusza bez poprawnego number';
    END IF;
    IF v_num = ANY (v_seen_numbers) THEN
      RAISE EXCEPTION 'zdublowany numer % w arkuszu', v_num;
    END IF;
    v_seen_numbers := v_seen_numbers || v_num;

    v_stem := v_item->>'text';
    IF v_stem IS NULL OR btrim(v_stem) = '' THEN
      RAISE EXCEPTION 'puste text przy numerze %', v_num;
    END IF;

    v_key := lower(v_item->>'correct_option_id');
    IF v_key IS NULL OR v_key NOT IN ('a', 'b', 'c', 'd', 'e') THEN
      RAISE EXCEPTION 'correct_option_id poza a–e przy numerze %', v_num;
    END IF;

    v_qid := 'cem-' || p_short_code || '-' || lpad(v_num::text, 3, '0');
    v_hash := md5(lower(regexp_replace(v_stem, '[^[:alnum:]]+', '', 'g')));
    v_expl := nullif(btrim(COALESCE(v_item->>'explanation', '')), '');
    v_status := CASE WHEN v_expl IS NULL THEN 'missing' ELSE 'draft' END;

    v_opts := v_item->'options';
    IF v_opts IS NULL OR jsonb_typeof(v_opts) = 'null' THEN
      RAISE EXCEPTION 'brak options przy numerze %', v_num;
    END IF;
    IF jsonb_typeof(v_opts) <> 'array' THEN
      v_opts := jsonb_build_array(
        jsonb_build_object('id', 'a', 'text', COALESCE(v_opts->>'a', '')),
        jsonb_build_object('id', 'b', 'text', COALESCE(v_opts->>'b', '')),
        jsonb_build_object('id', 'c', 'text', COALESCE(v_opts->>'c', '')),
        jsonb_build_object('id', 'd', 'text', COALESCE(v_opts->>'d', '')),
        jsonb_build_object('id', 'e', 'text', COALESCE(v_opts->>'e', ''))
      );
    END IF;

    v_hit_id := NULL;
    v_hit_source := NULL;
    SELECT q.id, q.source
      INTO v_hit_id, v_hit_source
    FROM public.questions q
    WHERE q.content_hash = v_hash
      AND q.is_active
    ORDER BY (q.source = 'cem') DESC, q.id
    LIMIT 1;

    IF v_hit_id IS NULL THEN
      INSERT INTO public.questions (
        id, topic_id, "text", options, correct_option_id, explanation,
        question_type, source, first_seen_session, explanation_status, tracks
      ) VALUES (
        v_qid, v_inbox, v_stem, v_opts, v_key, COALESCE(v_expl, ''),
        'single_choice', 'cem', p_cem_session_id, v_status, v_tracks
      )
      ON CONFLICT (id) DO UPDATE SET
        "text" = EXCLUDED."text",
        options = EXCLUDED.options,
        correct_option_id = EXCLUDED.correct_option_id,
        explanation = EXCLUDED.explanation,
        explanation_status = EXCLUDED.explanation_status,
        source = EXCLUDED.source,
        tracks = EXCLUDED.tracks;
      -- NIE rusza is_active ani topic_id (zmapowane pytanie zostaje).
      v_new := v_new + 1;
      INSERT INTO public.cem_question_occurrences (cem_session_id, question_id, question_number)
      VALUES (p_cem_session_id, v_qid, v_num)
      ON CONFLICT (cem_session_id, question_id) DO NOTHING;

    ELSIF v_hit_source = 'cem' THEN
      INSERT INTO public.cem_question_occurrences (cem_session_id, question_id, question_number)
      VALUES (p_cem_session_id, v_hit_id, v_num)
      ON CONFLICT (cem_session_id, question_id) DO NOTHING;
      v_repeats := v_repeats + 1;

    ELSE
      INSERT INTO public.questions (
        id, topic_id, "text", options, correct_option_id, explanation,
        question_type, source, first_seen_session, explanation_status, tracks
      ) VALUES (
        v_qid, v_inbox, v_stem, v_opts, v_key, COALESCE(v_expl, ''),
        'single_choice', 'cem', p_cem_session_id, v_status, v_tracks
      )
      ON CONFLICT (id) DO UPDATE SET
        "text" = EXCLUDED."text",
        options = EXCLUDED.options,
        correct_option_id = EXCLUDED.correct_option_id,
        explanation = EXCLUDED.explanation,
        explanation_status = EXCLUDED.explanation_status,
        source = EXCLUDED.source,
        tracks = EXCLUDED.tracks;
      v_new := v_new + 1;
      INSERT INTO public.cem_question_occurrences (cem_session_id, question_id, question_number)
      VALUES (p_cem_session_id, v_qid, v_num)
      ON CONFLICT (cem_session_id, question_id) DO NOTHING;
      v_collisions := v_collisions || jsonb_build_array(jsonb_build_object(
        'number', v_num,
        'cem_id', v_qid,
        'hit_id', v_hit_id,
        'hit_source', v_hit_source
      ));
    END IF;
  END LOOP;

  PERFORM public.refresh_topic_counts(ARRAY[v_inbox]);
  PERFORM public.refresh_cem_repeat_counts();

  RETURN jsonb_build_object(
    'new', v_new,
    'repeats', v_repeats,
    'collisions', v_collisions,
    'inbox_id', v_inbox
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_cem_sheet(text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_cem_sheet(text, text, text, jsonb) TO service_role;

COMMENT ON FUNCTION public.import_cem_sheet(text, text, text, jsonb) IS
  'Import arkusza CEM do INBOX--{subject_id}. Trzy przypadki content_hash: nowy / powtorzenie cem / kolizja own|uczelnia.';
