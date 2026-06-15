-- Blokuje eskalację uprawnień przez bezpośredni UPDATE na profiles (RLS pozwala
-- użytkownikowi edytować własny wiersz). Service role (webhook Stripe, panel admin)
-- omija restrykcję. Bezpieczne do powtórnego uruchomienia.

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  -- Webhook Stripe, admin API, migracje — pełna swoboda.
  IF jwt_role = 'service_role' THEN
    RETURN NEW;
  END IF;

  NEW.role := OLD.role;
  NEW.access_revoked_at := OLD.access_revoked_at;
  NEW.subscription_status := OLD.subscription_status;
  NEW.stripe_customer_id := OLD.stripe_customer_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns_on_profiles ON public.profiles;

CREATE TRIGGER protect_profile_privileged_columns_on_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();
