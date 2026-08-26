BEGIN;

ALTER TABLE public.cem_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cem_question_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cem_sessions_read ON public.cem_sessions;
CREATE POLICY cem_sessions_read ON public.cem_sessions
  FOR SELECT TO authenticated USING (is_published = true);

DROP POLICY IF EXISTS cem_occ_read ON public.cem_question_occurrences;
CREATE POLICY cem_occ_read ON public.cem_question_occurrences
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.cem_sessions s
      WHERE s.id = cem_question_occurrences.cem_session_id
        AND s.is_published
    )
  );

COMMIT;
