-- Insight po sesji + gotowość egzaminacyjna (profiles / study_sessions)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS exam_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS exam_readiness_score INT,
  ADD COLUMN IF NOT EXISTS questions_answered_total INT DEFAULT 0;

ALTER TABLE study_sessions
  ADD COLUMN IF NOT EXISTS session_insights JSONB;
