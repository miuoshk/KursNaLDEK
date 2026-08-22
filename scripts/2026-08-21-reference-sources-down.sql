BEGIN;

DROP FUNCTION IF EXISTS public.refresh_topic_counts(text[]);
DROP FUNCTION IF EXISTS public.reference_sources(text);

ALTER TABLE public.topics RENAME COLUMN question_count_ref TO question_count_cem;
ALTER TABLE public.topic_mastery_cache RENAME COLUMN ref_total   TO cem_total;
ALTER TABLE public.topic_mastery_cache RENAME COLUMN ref_seen    TO cem_seen;
ALTER TABLE public.topic_mastery_cache RENAME COLUMN ref_correct TO cem_correct;

ALTER TABLE public.profiles DROP CONSTRAINT profiles_default_source_chk;
UPDATE public.profiles SET default_question_source = 'cem'
  WHERE default_question_source = 'reference';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_source_chk
  CHECK (default_question_source IN ('all', 'cem', 'own'));

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

COMMENT ON COLUMN public.topics.question_count_cem IS NULL;

COMMIT;
