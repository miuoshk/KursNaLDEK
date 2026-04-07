-- ============================================
-- KURS NA LDEK — DATABASE SCHEMA
-- Paste this into Supabase SQL Editor → Run
-- ============================================

-- ============================================
-- 1. PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_initials TEXT,
  current_year INT DEFAULT 1,
  current_track TEXT DEFAULT 'stomatologia',
  current_product TEXT DEFAULT 'knnp', -- knnp | ldek
  daily_goal INT DEFAULT 25,
  xp INT DEFAULT 0,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_active_date DATE,
  rank_tier TEXT DEFAULT 'praktykant',
  notifications_reviews BOOLEAN DEFAULT true,
  notifications_weekly BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_ends_at TIMESTAMPTZ,
  default_session_mode TEXT DEFAULT 'nauka',
  default_question_count INT DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), 1) ||
          LEFT(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email), ' ', 2), 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 2. CONTENT STRUCTURE
-- ============================================
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  icon_name TEXT DEFAULT 'book-open',
  year INT NOT NULL,
  track TEXT NOT NULL DEFAULT 'stomatologia',
  product TEXT NOT NULL DEFAULT 'knnp', -- knnp | ldek
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0,
  question_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_id TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT DEFAULT 'srednie',
  source_exam TEXT,
  source_code TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- ============================================
-- 3. USER PROGRESS & SPACED REPETITION
-- ============================================
CREATE TABLE user_question_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
  stability FLOAT DEFAULT 0,
  difficulty_rating FLOAT DEFAULT 0.3,
  elapsed_days INT DEFAULT 0,
  scheduled_days INT DEFAULT 0,
  reps INT DEFAULT 0,
  lapses INT DEFAULT 0,
  state TEXT DEFAULT 'new',
  next_review TIMESTAMPTZ,
  times_answered INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  last_answered_at TIMESTAMPTZ,
  last_confidence TEXT,
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_uqp_next_review ON user_question_progress(user_id, next_review);
CREATE INDEX idx_uqp_state ON user_question_progress(user_id, state);

-- ============================================
-- 4. SESSIONS
-- ============================================
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id),
  mode TEXT NOT NULL,
  total_questions INT NOT NULL,
  correct_answers INT DEFAULT 0,
  accuracy FLOAT,
  duration_seconds INT,
  xp_earned INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false
);

CREATE TABLE session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(id),
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  confidence TEXT,
  time_spent_seconds INT,
  question_order INT,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  is_first_exposure BOOLEAN DEFAULT true,
  UNIQUE (session_id, question_id)
);

CREATE INDEX idx_session_answers_session ON session_answers(session_id);

-- ============================================
-- 5. GAMIFICATION
-- ============================================
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT DEFAULT 'award',
  category TEXT,
  target_value INT DEFAULT 1,
  xp_reward INT DEFAULT 0
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id),
  progress INT DEFAULT 0,
  unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL,
  subject_id TEXT REFERENCES subjects(id),
  description TEXT NOT NULL,
  target_questions INT DEFAULT 15,
  target_accuracy FLOAT DEFAULT 0.7,
  xp_reward INT DEFAULT 50,
  challenge_type TEXT DEFAULT 'daily'
);

CREATE TABLE user_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES daily_challenges(id),
  questions_answered INT DEFAULT 0,
  accuracy FLOAT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_id)
);

-- ============================================
-- 6. DISCUSSIONS
-- ============================================
CREATE TABLE question_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false
);

-- ============================================
-- 7. ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_discussions ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Content: readable by all authenticated
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read subjects"
  ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read topics"
  ON topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read questions"
  ON questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read achievements"
  ON achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can read challenges"
  ON daily_challenges FOR SELECT TO authenticated USING (true);

-- User data: own data only
CREATE POLICY "Users own progress SELECT"
  ON user_question_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own progress INSERT"
  ON user_question_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own progress UPDATE"
  ON user_question_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users own sessions SELECT"
  ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own sessions INSERT"
  ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own sessions UPDATE"
  ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users own session_answers SELECT"
  ON session_answers FOR SELECT USING (
    session_id IN (SELECT id FROM study_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users own session_answers INSERT"
  ON session_answers FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM study_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users own session_answers UPDATE"
  ON session_answers FOR UPDATE USING (
    session_id IN (SELECT id FROM study_sessions WHERE user_id = auth.uid())
  );

CREATE POLICY "Users own achievements SELECT"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own achievements INSERT"
  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own achievements UPDATE"
  ON user_achievements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users own challenge_progress SELECT"
  ON user_challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own challenge_progress INSERT"
  ON user_challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own challenge_progress UPDATE"
  ON user_challenge_progress FOR UPDATE USING (auth.uid() = user_id);

-- Discussions: all authenticated can read, own can write
CREATE POLICY "Authenticated can read discussions"
  ON question_discussions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create discussions"
  ON question_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discussions"
  ON question_discussions FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 8. SEED DATA — KNNP SUBJECTS (Nauki Podstawowe)
-- ============================================
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('anatomia', 'Anatomia', 'Anatomia', 'bone', 1, 'stomatologia', 'knnp', 1),
  ('histologia', 'Histologia i embriologia', 'Histologia', 'microscope', 1, 'stomatologia', 'knnp', 2),
  ('biofizyka', 'Biofizyka', 'Biofizyka', 'zap', 1, 'stomatologia', 'knnp', 3),
  ('chemia', 'Chemia medyczna', 'Chemia', 'flask-conical', 1, 'stomatologia', 'knnp', 4),
  ('biochemia', 'Biochemia', 'Biochemia', 'dna', 2, 'stomatologia', 'knnp', 5),
  ('fizjologia', 'Fizjologia', 'Fizjologia', 'heart-pulse', 2, 'stomatologia', 'knnp', 6),
  ('mikrobiologia', 'Mikrobiologia i immunologia', 'Mikrobiologia', 'bug', 2, 'stomatologia', 'knnp', 7),
  ('farmakologia', 'Farmakologia', 'Farmakologia', 'pill', 3, 'stomatologia', 'knnp', 8),
  ('patofizjologia', 'Patofizjologia', 'Patofizjologia', 'activity', 3, 'stomatologia', 'knnp', 9),
  ('patologia', 'Patomorfologia', 'Patomorfologia', 'scan', 3, 'stomatologia', 'knnp', 10);

-- ============================================
-- OSCE: kolumny stacji (uruchom na istniejącej bazie)
-- ============================================
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_tasks TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_day INT;

-- ============================================
-- DONE! Schema ready.
-- ============================================
