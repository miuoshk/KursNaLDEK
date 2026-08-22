BEGIN;

-- Zrodla REFERENCYJNE produktu: ZBIOR, nie pojedyncza wartosc.
-- knnp bierze i uczelniane, i te z arkuszy LDEK — dla studenta na roku
-- jedno i drugie to "pytania z prawdziwego egzaminu".
CREATE OR REPLACE FUNCTION public.reference_sources(p_product text)
RETURNS public.question_source[]
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_product
    WHEN 'ldek' THEN ARRAY['cem']::public.question_source[]
    WHEN 'ldew' THEN ARRAY['cem']::public.question_source[]
    WHEN 'knnp' THEN ARRAY['uczelnia','cem']::public.question_source[]
    ELSE ARRAY[]::public.question_source[]
  END;
$$;

ALTER TABLE public.topics RENAME COLUMN question_count_cem TO question_count_ref;
ALTER TABLE public.topic_mastery_cache RENAME COLUMN cem_total   TO ref_total;
ALTER TABLE public.topic_mastery_cache RENAME COLUMN cem_seen    TO ref_seen;
ALTER TABLE public.topic_mastery_cache RENAME COLUMN cem_correct TO ref_correct;

ALTER TABLE public.profiles DROP CONSTRAINT profiles_default_source_chk;
UPDATE public.profiles SET default_question_source = 'reference'
  WHERE default_question_source = 'cem';
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_source_chk
  CHECK (default_question_source IN ('all', 'reference', 'own'));

CREATE OR REPLACE FUNCTION public.refresh_topic_counts(p_topic_ids text[])
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.topics t
  SET question_count     = c.total,
      question_count_ref = c.ref
  FROM unnest(p_topic_ids) AS ids(topic_id)
  JOIN public.topics t2  ON t2.id = ids.topic_id
  JOIN public.subjects s ON s.id  = t2.subject_id
  CROSS JOIN LATERAL (
    SELECT COUNT(*) FILTER (WHERE q.is_active) AS total,
           COUNT(*) FILTER (WHERE q.is_active
                              AND q.source = ANY(public.reference_sources(s.product))) AS ref
    FROM public.questions q
    WHERE q.topic_id = ids.topic_id
  ) c
  WHERE t.id = ids.topic_id;
$$;

COMMENT ON COLUMN public.topics.question_count_ref IS
  'Liczba aktywnych pytan ze zrodel REFERENCYJNYCH produktu tego przedmiotu: {cem} dla ldek/ldew, {uczelnia,cem} dla knnp.';

COMMIT;
