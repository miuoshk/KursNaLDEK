-- Rejestracja: full_name jest obowiązkowe.
-- Nie podstawiamy nicka ani lokalnej części e-maila, gdy pole jest puste.
-- Przy okazji przywracamy zapis avatar_emoji (zgubiony w handle_new_user 2026-06-16).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  full_name_value TEXT;
  nick_value TEXT;
  email_local_part TEXT;
  year_value INT;
  track_value TEXT;
  product_value TEXT;
  emoji_value TEXT;
BEGIN
  email_local_part := SPLIT_PART(COALESCE(NEW.email, ''), '@', 1);

  full_name_value := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  IF full_name_value IS NULL OR CHAR_LENGTH(full_name_value) < 2 THEN
    RAISE EXCEPTION 'full_name jest wymagane.';
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
  product_value := CASE
    WHEN NEW.raw_user_meta_data->>'current_product' IN ('knnp', 'ldek', 'ldew')
      THEN NEW.raw_user_meta_data->>'current_product'
    ELSE 'knnp'
  END;

  emoji_value := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_emoji', '')), '');
  IF emoji_value IS NOT NULL AND CHAR_LENGTH(emoji_value) > 32 THEN
    emoji_value := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, full_name, nick, display_name, avatar_initials, avatar_emoji,
    current_track, current_year, current_product
  )
  VALUES (
    NEW.id,
    full_name_value,
    nick_value,
    nick_value,
    UPPER(LEFT(full_name_value, 1) ||
          LEFT(SPLIT_PART(full_name_value, ' ', 2), 1)),
    emoji_value,
    track_value,
    year_value,
    product_value
  );
  RETURN NEW;
END;
$function$;
