-- Uruchom na istniejącej bazie (reset postępu całego przedmiotu).
-- Funkcja działa jako SECURITY DEFINER, bo tabele postępu mają RLS bez polityk DELETE.

CREATE OR REPLACE FUNCTION public.reset_subject_progress(p_subject_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika.';
  END IF;

  -- Kasowanie sesji usuwa też session_answers przez ON DELETE CASCADE.
  DELETE FROM study_sessions
  WHERE user_id = v_user_id
    AND subject_id = p_subject_id;

  DELETE FROM user_question_progress uqp
  USING questions q, topics t
  WHERE uqp.user_id = v_user_id
    AND uqp.question_id = q.id
    AND q.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM topic_mastery_cache tmc
  USING topics t
  WHERE tmc.user_id = v_user_id
    AND tmc.topic_id = t.id
    AND t.subject_id = p_subject_id;

  -- Czyścimy eventy używane do statystyk, jeśli payload zawiera subject.
  DELETE FROM learning_events le
  WHERE le.user_id = v_user_id
    AND (
      le.payload ->> 'subjectId' = p_subject_id
      OR le.payload ->> 'subject_id' = p_subject_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_subject_progress(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_subject_progress(TEXT) TO authenticated;
