-- Preferencje wyświetlania podczas nauki (panel Ustawienia → Nauka)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS show_session_timer BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_session_topics BOOLEAN NOT NULL DEFAULT true;
