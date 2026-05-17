-- Pre-live hotfix: dosynchronizowuje produkcję ze schematem repo i hardenuje
-- definicje funkcji wskazane przez Supabase advisors.
-- Bezpieczne do powtórnego uruchomienia.

-- ---------- 1. Brakujące kolumny w profiles ----------
-- Kod używa tych kolumn; brak powoduje 500-tki w /ustawienia oraz
-- cichą porażkę aktualizacji exam-readiness po sesji.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_session_mode TEXT DEFAULT 'nauka';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_question_count INT DEFAULT 25;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS questions_answered_total INT DEFAULT 0;

COMMENT ON COLUMN public.profiles.default_session_mode IS 'nauka | egzamin | powtorka';
COMMENT ON COLUMN public.profiles.default_question_count IS '10 | 25 | 50';
COMMENT ON COLUMN public.profiles.questions_answered_total IS 'Licznik łącznej liczby odpowiedzi (do exam readiness).';

-- Backfill dla istniejących wierszy (DEFAULT nie wypełnia istniejących rekordów po ALTER ADD COLUMN
-- w niektórych przypadkach — robimy to ręcznie, żeby NULL nie psuł obliczeń).
UPDATE public.profiles SET default_session_mode = 'nauka' WHERE default_session_mode IS NULL;
UPDATE public.profiles SET default_question_count = 25 WHERE default_question_count IS NULL;
UPDATE public.profiles SET questions_answered_total = 0 WHERE questions_answered_total IS NULL;

-- ---------- 2. Funkcje: ustaw stabilny search_path ----------
-- Advisor 0011: search_path mutable w SECURITY DEFINER / triggerach.
-- Definiujemy od nowa z `SET search_path = public`, zachowując ciało.

CREATE OR REPLACE FUNCTION public.set_user_year_entitlements_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_full_name_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.full_name IS NULL OR LENGTH(TRIM(NEW.full_name)) = 0 THEN
    RAISE EXCEPTION 'full_name jest wymagane.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  INSERT INTO public.profiles (id, full_name, nick, display_name, avatar_initials, current_track, current_year)
  VALUES (
    NEW.id,
    full_name_value,
    nick_value,
    nick_value,
    UPPER(LEFT(full_name_value, 1) ||
          LEFT(SPLIT_PART(full_name_value, ' ', 2), 1)),
    track_value,
    year_value
  );
  RETURN NEW;
END;
$$;

-- handle_new_user jest triggerem na auth.users — nigdy nie wołane bezpośrednio przez REST.
-- Odbieramy EXECUTE od ról API, żeby zniknął advisor 0028/0029.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ---------- 3. Sprzątanie: usuń osieroconą 2-arg wersję reset_subject_progress ----------
-- App używa tylko `reset_subject_progress(p_subject_id TEXT)`. Dwie wersje
-- powodują, że PostgREST może zwrócić błąd disambiguacji.
DROP FUNCTION IF EXISTS public.reset_subject_progress(p_user_id UUID, p_subject_id TEXT);

-- Pozostała funkcja: dorzucamy stabilny search_path (advisor 0011).
CREATE OR REPLACE FUNCTION public.reset_subject_progress(p_subject_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Brak zalogowanego użytkownika.';
  END IF;

  DELETE FROM public.study_sessions
  WHERE user_id = v_user_id
    AND subject_id = p_subject_id;

  DELETE FROM public.user_question_progress uqp
  USING public.questions q, public.topics t
  WHERE uqp.user_id = v_user_id
    AND uqp.question_id = q.id
    AND q.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM public.topic_mastery_cache tmc
  USING public.topics t
  WHERE tmc.user_id = v_user_id
    AND tmc.topic_id = t.id
    AND t.subject_id = p_subject_id;

  DELETE FROM public.learning_events le
  WHERE le.user_id = v_user_id
    AND (
      le.payload ->> 'subjectId' = p_subject_id
      OR le.payload ->> 'subject_id' = p_subject_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reset_subject_progress(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reset_subject_progress(TEXT) TO authenticated;
