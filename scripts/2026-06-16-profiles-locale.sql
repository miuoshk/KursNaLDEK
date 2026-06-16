-- Preferencja języka interfejsu użytkownika (pl / uk / ru / en)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'pl'
  CHECK (locale IN ('pl', 'uk', 'ru', 'en'));

COMMENT ON COLUMN profiles.locale IS 'UI locale preference: pl, uk, ru, en';
