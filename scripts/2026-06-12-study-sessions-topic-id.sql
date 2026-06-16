-- study_sessions: zapamiętaj wybrany temat (z kafelka / URL)
ALTER TABLE public.study_sessions
  ADD COLUMN IF NOT EXISTS topic_id TEXT REFERENCES public.topics(id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_topic_id
  ON public.study_sessions (topic_id)
  WHERE topic_id IS NOT NULL;
