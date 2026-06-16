-- 2026-06-16 — Rozszerzenie pojęcia "kurs" (current_product) o LDEW
-- Kontekst: rejestracja zyskała nadrzędny wybór kursu: Nauki Podstawowe (knnp),
-- LDEK (ldek), LDEW (ldew). Na razie tylko knnp jest dostępny przy rejestracji
-- (LDEK/LDEW = "w przygotowaniu"), ale handle_new_user czyta już current_product
-- z metadanych, by była gotowa pod przyszłe włączenie.

COMMENT ON COLUMN public.profiles.current_product IS 'knnp | ldek | ldew';

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  full_name_value TEXT;
  nick_value TEXT;
  email_local_part TEXT;
  year_value INT;
  track_value TEXT;
  product_value TEXT;
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
  product_value := CASE
    WHEN NEW.raw_user_meta_data->>'current_product' IN ('knnp', 'ldek', 'ldew')
      THEN NEW.raw_user_meta_data->>'current_product'
    ELSE 'knnp'
  END;

  INSERT INTO public.profiles (id, full_name, nick, display_name, avatar_initials, current_track, current_year, current_product)
  VALUES (
    NEW.id,
    full_name_value,
    nick_value,
    nick_value,
    UPPER(LEFT(full_name_value, 1) ||
          LEFT(SPLIT_PART(full_name_value, ' ', 2), 1)),
    track_value,
    year_value,
    product_value
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
