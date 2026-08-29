-- Podpowiedzi tematu dla poczekalni CEM: ts_rank na FTS (v1 bez wektorow).
-- Wektor na questions."text", zapytanie z topics.name + knowledge_card.

CREATE OR REPLACE FUNCTION public.cem_inbox_topic_suggestions(
  p_question_id text,
  p_subject_id text,
  p_limit int DEFAULT 3
)
RETURNS TABLE(topic_id text, name text, score real)
LANGUAGE sql
STABLE
AS $$
  SELECT t.id,
         t.name,
         ts_rank(
           to_tsvector('simple', q."text"),
           plainto_tsquery(
             'simple',
             left(
               trim(both from coalesce(t.name, '') || ' ' || coalesce(t.knowledge_card, '')),
               256
             )
           )
         )::real AS score
  FROM public.questions q
  JOIN public.topics t
    ON t.subject_id = p_subject_id
   AND t.is_inbox = false
  WHERE q.id = p_question_id
  ORDER BY score DESC, t.display_order ASC, t.id
  LIMIT GREATEST(COALESCE(p_limit, 3), 0);
$$;

REVOKE ALL ON FUNCTION public.cem_inbox_topic_suggestions(text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cem_inbox_topic_suggestions(text, text, int) TO service_role;
