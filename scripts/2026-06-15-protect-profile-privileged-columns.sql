-- Blokuje eskalację uprawnień przez bezpośredni UPDATE na profiles (RLS pozwala
-- użytkownikowi edytować własny wiersz). Service role (webhook Stripe, panel admin)
-- omija restrykcję. Bezpieczne do powtórnego uruchomienia.

-- Pełna wersja w scripts/2026-06-15-cysec-hardening-p0-p1.sql (gamifikacja + search_path).
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  jwt_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.access_revoked_at := OLD.access_revoked_at;
  NEW.subscription_status := OLD.subscription_status;
  NEW.stripe_customer_id := OLD.stripe_customer_id;
  NEW.xp := OLD.xp;
  NEW.current_streak := OLD.current_streak;
  NEW.longest_streak := OLD.longest_streak;
  NEW.last_active_date := OLD.last_active_date;
  NEW.exam_readiness_score := OLD.exam_readiness_score;
  NEW.questions_answered_total := OLD.questions_answered_total;
  NEW.readiness_percentile := OLD.readiness_percentile;
  NEW.readiness_cohort_size := OLD.readiness_cohort_size;
  NEW.readiness_user_attempts := OLD.readiness_user_attempts;
  NEW.readiness_computed_at := OLD.readiness_computed_at;
  NEW.avg_session_hour := OLD.avg_session_hour;
  NEW.learning_velocity := OLD.learning_velocity;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_on_profiles ON public.profiles;

CREATE TRIGGER protect_profile_privileged_columns_on_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();
