-- Przywroc trigger wołajacy tylko refresh_topic_question_count (sam question_count).

CREATE OR REPLACE FUNCTION public.trg_questions_refresh_topic_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.refresh_topic_question_count(NEW.topic_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_topic_question_count(OLD.topic_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active IS DISTINCT FROM NEW.is_active
       OR OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
      IF OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
        PERFORM public.refresh_topic_question_count(OLD.topic_id);
      END IF;
      PERFORM public.refresh_topic_question_count(NEW.topic_id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$;
