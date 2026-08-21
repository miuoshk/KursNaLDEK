DROP POLICY IF EXISTS cem_occ_read ON public.cem_question_occurrences;
DROP POLICY IF EXISTS cem_sessions_read ON public.cem_sessions;

ALTER TABLE public.cem_question_occurrences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cem_sessions DISABLE ROW LEVEL SECURITY;
