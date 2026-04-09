-- Uruchom na istniejącej bazie (dodaje topic_mastery_cache).

CREATE TABLE IF NOT EXISTS topic_mastery_cache (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  total_questions INT NOT NULL DEFAULT 0,
  seen INT NOT NULL DEFAULT 0,
  coverage REAL NOT NULL DEFAULT 0,
  total_answered INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0,
  avg_retrievability REAL NOT NULL DEFAULT 0,
  mastery_score REAL NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable',
  accuracy_last_7d REAL,
  leech_count INT NOT NULL DEFAULT 0,
  weakness_rank INT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_tmc_user ON topic_mastery_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_tmc_mastery ON topic_mastery_cache(user_id, mastery_score);

ALTER TABLE topic_mastery_cache ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'topic_mastery_cache' AND policyname = 'Users own topic_mastery_cache SELECT'
  ) THEN
    CREATE POLICY "Users own topic_mastery_cache SELECT"
      ON topic_mastery_cache FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'topic_mastery_cache' AND policyname = 'Users own topic_mastery_cache INSERT'
  ) THEN
    CREATE POLICY "Users own topic_mastery_cache INSERT"
      ON topic_mastery_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'topic_mastery_cache' AND policyname = 'Users own topic_mastery_cache UPDATE'
  ) THEN
    CREATE POLICY "Users own topic_mastery_cache UPDATE"
      ON topic_mastery_cache FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
