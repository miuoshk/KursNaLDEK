-- Pula zapasowa pytań dla adaptacji w trakcie sesji inteligentnej (ANTARES).

ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS reserve_question_ids JSONB DEFAULT '[]'::jsonb;
