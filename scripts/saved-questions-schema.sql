-- Zapisane pytania (zakładki użytkownika)
CREATE TABLE IF NOT EXISTS saved_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_questions_user
  ON saved_questions (user_id, created_at DESC);

ALTER TABLE saved_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own saved_questions SELECT"
  ON saved_questions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own saved_questions INSERT"
  ON saved_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own saved_questions DELETE"
  ON saved_questions FOR DELETE USING (auth.uid() = user_id);
