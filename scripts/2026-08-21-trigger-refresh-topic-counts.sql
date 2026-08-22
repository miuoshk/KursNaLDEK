-- Trigger topics: jedno zrodlo prawdy = refresh_topic_counts (total + ref).
-- Stary refresh_topic_question_count ustawial tylko question_count.

CREATE OR REPLACE FUNCTION public.trg_questions_refresh_topic_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.topic_id IS NOT NULL THEN
      PERFORM public.refresh_topic_counts(ARRAY[NEW.topic_id]);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.topic_id IS NOT NULL THEN
      PERFORM public.refresh_topic_counts(ARRAY[OLD.topic_id]);
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.topic_id IS DISTINCT FROM NEW.topic_id
       OR OLD.source IS DISTINCT FROM NEW.source THEN
      IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
        PERFORM public.refresh_topic_counts(
          ARRAY_REMOVE(ARRAY[OLD.topic_id, NEW.topic_id], NULL)
        );
      ELSIF NEW.topic_id IS NOT NULL THEN
        PERFORM public.refresh_topic_counts(ARRAY[NEW.topic_id]);
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;
