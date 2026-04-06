-- Admin setup: role column, error_reports table, RLS policies
-- Run this in Supabase SQL Editor

-- 1. Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- 2. Create error_reports table
CREATE TABLE IF NOT EXISTS error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT REFERENCES questions(id),
  user_id UUID REFERENCES profiles(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- 3. RLS for error_reports
CREATE POLICY "Users can create reports"
  ON error_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own reports"
  ON error_reports FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin read all reports"
  ON error_reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin update reports"
  ON error_reports FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Admin full access on questions
CREATE POLICY "Admin full access questions"
  ON questions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Admin can read all profiles
CREATE POLICY "Admin read all profiles"
  ON profiles FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Admin can read all study_sessions
CREATE POLICY "Admin read all sessions"
  ON study_sessions FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Set yourself as admin (replace with your user ID):
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID_HERE';
