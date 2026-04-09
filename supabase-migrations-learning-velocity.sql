-- Stosunek liczby odpowiedzi (answer) z ostatnich 7 dni do poprzednich 7 dni

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS learning_velocity DOUBLE PRECISION;

COMMENT ON COLUMN profiles.learning_velocity IS 'thisWeekAnswers / max(lastWeekAnswers, 1) — tempo nauki względem poprzedniego tygodnia';
