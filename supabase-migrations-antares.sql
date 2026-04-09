-- Uruchom na istniejącej bazie (dodaje kolumny ANTARES + tabelę learning_events).
-- Świeże instalacje: wystarczy pełny supabase-schema.sql.

ALTER TABLE user_question_progress
  ADD COLUMN IF NOT EXISTS correct_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wrong_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_leech BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS leech_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_time_seconds FLOAT,
  ADD COLUMN IF NOT EXISTS last_rating TEXT;

CREATE TABLE IF NOT EXISTS learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_events_user ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events(event_type);

ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_events' AND policyname = 'Users own learning_events SELECT'
  ) THEN
    CREATE POLICY "Users own learning_events SELECT"
      ON learning_events FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'learning_events' AND policyname = 'Users own learning_events INSERT'
  ) THEN
    CREATE POLICY "Users own learning_events INSERT"
      ON learning_events FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
