-- Osobisty plan dnia: budżet czasu jest niezależny od pomocniczego celu pytań.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_study_minutes integer NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS average_question_seconds real;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_daily_study_minutes_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_daily_study_minutes_chk
      CHECK (daily_study_minutes BETWEEN 5 AND 240);
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_average_question_seconds_chk'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_average_question_seconds_chk
      CHECK (
        average_question_seconds IS NULL
        OR average_question_seconds BETWEEN 5 AND 600
      );
  END IF;
END
$$;

COMMENT ON COLUMN public.profiles.daily_study_minutes IS
  'Dzienny budżet czasu dla osobistego planu nauki; nie jest liczbą pytań.';
COMMENT ON COLUMN public.profiles.average_question_seconds IS
  'Wygładzony rzeczywisty czas odpowiedzi używany do planowania budżetu.';

COMMIT;
