-- ============================================
-- KURS NA LDEK — DATABASE SCHEMA
-- Paste this into Supabase SQL Editor → Run
-- ============================================

-- ============================================
-- 1. PROFILES (extends Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  nick TEXT NOT NULL,
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
  exam_date TIMESTAMPTZ,
  exam_readiness_score INT,
  questions_answered_total INT DEFAULT 0,
  avg_session_hour DOUBLE PRECISION,
  learning_velocity DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX profiles_nick_lower_unique ON profiles ((LOWER(nick)));
ALTER TABLE profiles
  ADD CONSTRAINT profiles_full_name_not_blank CHECK (LENGTH(TRIM(full_name)) > 0),
  ADD CONSTRAINT profiles_nick_not_blank CHECK (LENGTH(TRIM(nick)) > 0);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name_value TEXT;
  nick_value TEXT;
  email_local_part TEXT;
  year_value INT;
  track_value TEXT;
BEGIN
  email_local_part := SPLIT_PART(COALESCE(NEW.email, ''), '@', 1);
  full_name_value := NULLIF(
    TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', '')),
    ''
  );
  IF full_name_value IS NULL THEN
    full_name_value := email_local_part;
  END IF;

  nick_value := NULLIF(
    TRIM(COALESCE(NEW.raw_user_meta_data->>'nick', NEW.raw_user_meta_data->>'display_name', email_local_part)),
    ''
  );
  IF nick_value IS NULL THEN
    nick_value := CONCAT('user_', LEFT(NEW.id::TEXT, 8));
  END IF;

  IF (NEW.raw_user_meta_data->>'current_year') ~ '^[1-3]$' THEN
    year_value := (NEW.raw_user_meta_data->>'current_year')::INT;
  ELSE
    year_value := 1;
  END IF;
  track_value := CASE
    WHEN NEW.raw_user_meta_data->>'current_track' IN ('stomatologia', 'lekarski')
      THEN NEW.raw_user_meta_data->>'current_track'
    ELSE 'stomatologia'
  END;

  INSERT INTO public.profiles (id, full_name, nick, display_name, avatar_initials, current_track, current_year)
  VALUES (
    NEW.id,
    full_name_value,
    nick_value,
    nick_value,
    UPPER(LEFT(full_name_value, 1) ||
          LEFT(SPLIT_PART(full_name_value, ' ', 2), 1)),
    track_value,
    year_value
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION prevent_full_name_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    RAISE EXCEPTION 'full_name nie może być zmienione po rejestracji.';
  END IF;
  IF NEW.full_name IS NULL OR LENGTH(TRIM(NEW.full_name)) = 0 THEN
    RAISE EXCEPTION 'full_name jest wymagane.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_full_name_mutation_on_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_full_name_mutation();

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
  knowledge_card TEXT,
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
  question_type TEXT NOT NULL DEFAULT 'single_choice',
  timer_seconds INTEGER,
  correct_order JSONB,
  learning_outcome TEXT,
  hotspots JSONB,
  drill_questions JSONB,
  identify_mode TEXT,
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
  correct_streak INT DEFAULT 0,
  wrong_streak INT DEFAULT 0,
  is_leech BOOLEAN DEFAULT false,
  leech_count INT DEFAULT 0,
  avg_time_seconds FLOAT,
  last_rating TEXT,
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
  is_completed BOOLEAN DEFAULT false,
  session_insights JSONB
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

-- Log zdarzeń uczenia (ANTARES: odpowiedzi, leech, itd.)
CREATE TABLE learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_events_user ON learning_events(user_id);
CREATE INDEX idx_learning_events_type ON learning_events(event_type);

-- Cache opanowania tematów (ANTARES — przeliczany po sesji)
CREATE TABLE topic_mastery_cache (
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

CREATE INDEX idx_tmc_user ON topic_mastery_cache(user_id);
CREATE INDEX idx_tmc_mastery ON topic_mastery_cache(user_id, mastery_score);

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
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_mastery_cache ENABLE ROW LEVEL SECURITY;
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

CREATE POLICY "Users own learning_events SELECT"
  ON learning_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own learning_events INSERT"
  ON learning_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own topic_mastery_cache SELECT"
  ON topic_mastery_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own topic_mastery_cache INSERT"
  ON topic_mastery_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users own topic_mastery_cache UPDATE"
  ON topic_mastery_cache FOR UPDATE USING (auth.uid() = user_id);

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
-- STOMATOLOGIA (track = 'stomatologia', product = 'knnp')

-- Rok 1
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('stoma-anatomia',     'Anatomia',                  'Anatomia',      'bone',           1, 'stomatologia', 'knnp', 1),
  ('stoma-angielski',    'Język angielski medyczny',   'Angielski',     'languages',      1, 'stomatologia', 'knnp', 2),
  ('stoma-histologia',   'Histologia i embriologia',  'Histologia',    'microscope',     1, 'stomatologia', 'knnp', 3),
  ('stoma-biofizyka',    'Biofizyka',                 'Biofizyka',     'zap',            1, 'stomatologia', 'knnp', 4),
  ('stoma-biologia',     'Biologia z genetyką',       'Biologia',      'dna',            1, 'stomatologia', 'knnp', 5),
  ('stoma-chemia',       'Chemia medyczna',           'Chemia',        'flask-conical',  1, 'stomatologia', 'knnp', 6);

-- Rok 2
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('stoma-patologia',    'Patomorfologia',            'Patologia',     'scan',           2, 'stomatologia', 'knnp', 7),
  ('stoma-osce',         'OSCE',                      'OSCE',          'clipboard-check', 2, 'stomatologia', 'knnp', 8),
  ('stoma-biochemia',    'Biochemia',                 'Biochemia',     'flask-round',    2, 'stomatologia', 'knnp', 9),
  ('stoma-fizjologia',   'Fizjologia',                'Fizjologia',    'heart-pulse',    2, 'stomatologia', 'knnp', 10),
  ('stoma-mikrobio',     'Mikrobiologia',             'Mikrobiologia', 'bug',            2, 'stomatologia', 'knnp', 11),
  ('stoma-mikrobio-ju',  'Mikrobiologia jamy ustnej', 'Mikro JU',      'microscope',     2, 'stomatologia', 'knnp', 12);

-- Rok 3
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('stoma-pediatria',    'Pediatria',                 'Pediatria',     'baby',           3, 'stomatologia', 'knnp', 13),
  ('stoma-chirurgia',    'Chirurgia',                 'Chirurgia',     'scissors',       3, 'stomatologia', 'knnp', 14),
  ('stoma-farmakologia', 'Farmakologia',              'Farmakologia',  'pill',           3, 'stomatologia', 'knnp', 15);

-- LEKARSKI (track = 'lekarski', product = 'knnp')

-- Rok 1
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('lek-anatomia',       'Anatomia',                  'Anatomia',      'bone',           1, 'lekarski', 'knnp', 1),
  ('lek-biofizyka',      'Biofizyka',                 'Biofizyka',     'zap',            1, 'lekarski', 'knnp', 2),
  ('lek-histologia',     'Histologia i embriologia',  'Histologia',    'microscope',     1, 'lekarski', 'knnp', 3),
  ('lek-biologia-mol',   'Biologia molekularna',      'Bio. mol.',     'dna',            1, 'lekarski', 'knnp', 4);

-- Rok 2
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('lek-biochemia',      'Biochemia',                 'Biochemia',     'flask-round',    2, 'lekarski', 'knnp', 5),
  ('lek-fizjologia',     'Fizjologia',                'Fizjologia',    'heart-pulse',    2, 'lekarski', 'knnp', 6),
  ('lek-angielski',      'Język angielski medyczny',  'Angielski',     'languages',      2, 'lekarski', 'knnp', 7),
  ('lek-immunologia',    'Immunologia',               'Immunologia',   'shield',         2, 'lekarski', 'knnp', 8);

-- Rok 3
INSERT INTO subjects (id, name, short_name, icon_name, year, track, product, display_order) VALUES
  ('lek-patofizjologia', 'Patofizjologia',            'Patofizjo.',    'activity',       3, 'lekarski', 'knnp', 9),
  ('lek-farmakologia',   'Farmakologia',              'Farmakologia',  'pill',           3, 'lekarski', 'knnp', 10),
  ('lek-mikrobio',       'Mikrobiologia',             'Mikrobiologia', 'bug',            3, 'lekarski', 'knnp', 11);

-- ============================================
-- OSCE: kolumny stacji (uruchom na istniejącej bazie)
-- ============================================
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_tasks JSONB;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS exam_day INT;

-- ============================================
-- OSCE: symulacja egzaminu (osce_simulations + osce_station_results)
-- Pełna definicja także w scripts/osce-simulation-schema.sql (RLS)
-- ============================================
CREATE TABLE IF NOT EXISTS osce_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exam_day INT NOT NULL CHECK (exam_day IN (1, 2)),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  passed_overall BOOLEAN NOT NULL,
  overall_percent REAL NOT NULL,
  station_count INT NOT NULL
);

CREATE TABLE IF NOT EXISTS osce_station_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES osce_simulations(id) ON DELETE CASCADE,
  station_id TEXT NOT NULL REFERENCES subjects(id),
  station_order INT NOT NULL,
  correct_count INT NOT NULL,
  total_questions INT NOT NULL,
  percent REAL NOT NULL,
  passed BOOLEAN NOT NULL,
  duration_seconds INT NOT NULL DEFAULT 0,
  UNIQUE (simulation_id, station_id)
);

ALTER TABLE osce_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE osce_station_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own osce_simulations SELECT"
  ON osce_simulations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users own osce_simulations INSERT"
  ON osce_simulations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users own osce_station_results SELECT"
  ON osce_station_results FOR SELECT USING (
    simulation_id IN (SELECT id FROM osce_simulations WHERE user_id = auth.uid())
  );
CREATE POLICY "Users own osce_station_results INSERT"
  ON osce_station_results FOR INSERT WITH CHECK (
    simulation_id IN (SELECT id FROM osce_simulations WHERE user_id = auth.uid())
  );

-- ============================================
-- SAVED QUESTIONS (zakładki użytkownika)
-- ============================================
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

-- ============================================
-- FUNKCJE POMOCNICZE
-- ============================================
CREATE OR REPLACE FUNCTION public.reset_subject_progress(p_subject_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika.';
  END IF;

  DELETE FROM study_sessions
  WHERE user_id = v_user_id
    AND subject_id = p_subject_id;

  DELETE FROM user_question_progress uqp
  USING questions q, topics t
  WHERE uqp.user_id = v_user_id
    AND uqp.question_id = q.id
    AND q.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM topic_mastery_cache tmc
  USING topics t
  WHERE tmc.user_id = v_user_id
    AND tmc.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM learning_events le
  WHERE le.user_id = v_user_id
    AND (
      le.payload ->> 'subjectId' = p_subject_id
      OR le.payload ->> 'subject_id' = p_subject_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_subject_progress(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_subject_progress(TEXT) TO authenticated;

-- ============================================
-- DONE! Schema ready.
-- ============================================
