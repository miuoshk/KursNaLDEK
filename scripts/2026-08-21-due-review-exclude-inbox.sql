-- Due review IDs: ta sama sygnatura, bez pytań z tematu-poczekalni.
-- JOIN topics … is_inbox = false; filtr w TypeScript tej funkcji nie dotyczy.

CREATE OR REPLACE FUNCTION public.due_review_question_ids(
  p_user_id uuid,
  p_topic_ids text[],
  p_track text,
  p_limit int default 50
)
RETURNS TABLE(question_id text)
LANGUAGE sql
STABLE
AS $$
  SELECT uqp.question_id
  FROM user_question_progress uqp
  JOIN questions q ON q.id = uqp.question_id
  JOIN topics t ON t.id = q.topic_id AND t.is_inbox = false
  WHERE uqp.user_id = p_user_id
    AND uqp.next_review IS NOT NULL
    AND uqp.next_review <= now()
    AND q.topic_id = ANY(p_topic_ids)
    AND q.is_active = true
    AND (q.tracks IS NULL OR q.tracks @> ARRAY[p_track])
  ORDER BY uqp.next_review ASC
  LIMIT GREATEST(COALESCE(p_limit, 50), 0);
$$;

GRANT EXECUTE ON FUNCTION public.due_review_question_ids(uuid, text[], text, int) TO authenticated;
