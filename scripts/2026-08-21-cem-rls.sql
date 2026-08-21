ALTER TABLE public.cem_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cem_question_occurrences  ENABLE ROW LEVEL SECURITY;

CREATE POLICY cem_sessions_read ON public.cem_sessions
  FOR SELECT TO authenticated USING (is_published = true);

CREATE POLICY cem_occ_read ON public.cem_question_occurrences
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.cem_sessions s
            WHERE s.id = cem_session_id AND s.is_published)
  );
