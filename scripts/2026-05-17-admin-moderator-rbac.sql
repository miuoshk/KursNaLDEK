-- RBAC update: admin + moderator access for admin panel features
-- Safe to run multiple times (drops/recreates named policies).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- ---------- error_reports ----------
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read all reports" ON error_reports;
DROP POLICY IF EXISTS "Admin update reports" ON error_reports;
DROP POLICY IF EXISTS "Admin or moderator read all reports" ON error_reports;
DROP POLICY IF EXISTS "Admin or moderator update reports" ON error_reports;

CREATE POLICY "Admin or moderator read all reports"
  ON error_reports FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admin or moderator update reports"
  ON error_reports FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- ---------- question_discussions ----------
ALTER TABLE question_discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin or moderator delete discussions" ON question_discussions;

CREATE POLICY "Admin or moderator delete discussions"
  ON question_discussions FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- ---------- questions ----------
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access questions" ON questions;
DROP POLICY IF EXISTS "Admin or moderator full access questions" ON questions;

CREATE POLICY "Admin or moderator full access questions"
  ON questions FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- ---------- profiles ----------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin or moderator read all profiles" ON profiles;

CREATE POLICY "Admin or moderator read all profiles"
  ON profiles FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin', 'moderator')
    )
  );

-- ---------- study_sessions ----------
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read all sessions" ON study_sessions;
DROP POLICY IF EXISTS "Admin or moderator read all sessions" ON study_sessions;

CREATE POLICY "Admin or moderator read all sessions"
  ON study_sessions FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );
