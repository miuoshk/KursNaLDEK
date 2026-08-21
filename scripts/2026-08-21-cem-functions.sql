CREATE OR REPLACE FUNCTION public.refresh_topic_counts(p_topic_ids text[])
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.topics t
  SET question_count     = c.total,
      question_count_cem = c.cem
  FROM unnest(p_topic_ids) AS ids(topic_id)
  CROSS JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE q.is_active)                      AS total,
           COUNT(*) FILTER (WHERE q.is_active AND q.source = 'cem') AS cem
    FROM public.questions q
    WHERE q.topic_id = ids.topic_id
  ) c
  WHERE t.id = ids.topic_id;
$$;

CREATE OR REPLACE FUNCTION public.refresh_cem_repeat_counts()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.questions q
  SET repeat_count = COALESCE(o.n, 0)
  FROM (SELECT question_id, COUNT(*)::smallint AS n
        FROM public.cem_question_occurrences GROUP BY question_id) o
  WHERE q.id = o.question_id AND q.repeat_count IS DISTINCT FROM o.n;
$$;
