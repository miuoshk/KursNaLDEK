-- Automatyczna synchronizacja topics.question_count przy zmianie pytań
-- (is_active, topic_id, INSERT, DELETE). Liczy tylko is_active = true.

CREATE OR REPLACE FUNCTION public.refresh_topic_question_count(p_topic_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_topic_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.topics t
     SET question_count = (
       SELECT COUNT(*)::int
         FROM public.questions q
        WHERE q.topic_id = p_topic_id
          AND COALESCE(q.is_active, true) = true
     )
   WHERE t.id = p_topic_id;
END;
$$;

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

DROP TRIGGER IF EXISTS questions_refresh_topic_count ON public.questions;

CREATE TRIGGER questions_refresh_topic_count
  AFTER INSERT OR UPDATE OR DELETE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_questions_refresh_topic_count();

-- Jednorazowa synchronizacja istniejących liczników
UPDATE public.topics t
   SET question_count = sub.cnt
  FROM (
    SELECT topic_id, COUNT(*)::int AS cnt
      FROM public.questions
     WHERE COALESCE(is_active, true) = true
     GROUP BY topic_id
  ) sub
 WHERE t.id = sub.topic_id;

UPDATE public.topics t
   SET question_count = 0
 WHERE NOT EXISTS (
   SELECT 1 FROM public.questions q
    WHERE q.topic_id = t.id AND COALESCE(q.is_active, true) = true
 );
