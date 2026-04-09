-- Średnia godzina rozpoczęcia/zakończenia nauki (EMA) — temporal pattern

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avg_session_hour DOUBLE PRECISION;

COMMENT ON COLUMN profiles.avg_session_hour IS 'Średnia godzina dnia (0–24, np. 14.5 = 14:30), EMA po zakończeniach sesji';
