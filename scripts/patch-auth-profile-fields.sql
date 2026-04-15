-- Rejestracja: wymagane full_name + nick + poprawne ustawienie kierunku/roku.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS nick TEXT;

UPDATE public.profiles p
SET full_name = COALESCE(
  NULLIF(TRIM(p.full_name), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'display_name'), ''),
  NULLIF(TRIM(p.display_name), ''),
  SPLIT_PART(COALESCE(u.email, ''), '@', 1),
  CONCAT('Użytkownik ', LEFT(p.id::TEXT, 8))
)
FROM auth.users u
WHERE u.id = p.id;

UPDATE public.profiles p
SET nick = COALESCE(
  NULLIF(TRIM(p.nick), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'nick'), ''),
  NULLIF(TRIM(u.raw_user_meta_data->>'display_name'), ''),
  NULLIF(TRIM(p.display_name), ''),
  SPLIT_PART(COALESCE(u.email, ''), '@', 1),
  CONCAT('user_', LEFT(p.id::TEXT, 8))
)
FROM auth.users u
WHERE u.id = p.id;

WITH ranked AS (
  SELECT
    id,
    nick,
    ROW_NUMBER() OVER (PARTITION BY LOWER(nick) ORDER BY created_at NULLS LAST, id) AS duplicate_rank
  FROM public.profiles
)
UPDATE public.profiles p
SET nick = CONCAT(r.nick, '_', r.duplicate_rank - 1)
FROM ranked r
WHERE p.id = r.id
  AND r.duplicate_rank > 1;

UPDATE public.profiles
SET display_name = nick
WHERE display_name IS DISTINCT FROM nick;

ALTER TABLE public.profiles
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN nick SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_full_name_not_blank'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_full_name_not_blank CHECK (LENGTH(TRIM(full_name)) > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_nick_not_blank'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_nick_not_blank CHECK (LENGTH(TRIM(nick)) > 0);
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nick_lower_unique
  ON public.profiles ((LOWER(nick)));

CREATE OR REPLACE FUNCTION public.prevent_full_name_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    RAISE EXCEPTION 'full_name nie może być zmienione po rejestracji.';
  END IF;
  IF NEW.full_name IS NULL OR LENGTH(TRIM(NEW.full_name)) = 0 THEN
    RAISE EXCEPTION 'full_name jest wymagane.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_full_name_mutation_on_profiles ON public.profiles;
CREATE TRIGGER prevent_full_name_mutation_on_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_full_name_mutation();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  INSERT INTO public.profiles (
    id,
    full_name,
    nick,
    display_name,
    avatar_initials,
    current_track,
    current_year
  )
  VALUES (
    NEW.id,
    full_name_value,
    nick_value,
    nick_value,
    UPPER(LEFT(full_name_value, 1) || LEFT(SPLIT_PART(full_name_value, ' ', 2), 1)),
    track_value,
    year_value
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
