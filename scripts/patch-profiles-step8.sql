-- Krok 8: preferencje nauki (uruchom w Supabase SQL Editor)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_session_mode TEXT DEFAULT 'nauka';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_question_count INT DEFAULT 25;

COMMENT ON COLUMN profiles.default_session_mode IS 'nauka | egzamin | powtorka';
COMMENT ON COLUMN profiles.default_question_count IS '10 | 25 | 50';
