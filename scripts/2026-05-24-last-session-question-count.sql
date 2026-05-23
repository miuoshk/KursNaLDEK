-- Ostatnia liczba pytań wybrana przy starcie sesji (10, 25, 37, …).
-- Używana przez „Rozpocznij kolejną sesję” i domyślne presety w konfiguratorze.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_session_question_count INT DEFAULT 25;

UPDATE profiles
SET last_session_question_count = COALESCE(default_question_count, 25)
WHERE last_session_question_count IS NULL;
