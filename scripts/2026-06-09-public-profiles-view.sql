-- Publiczne pola profilu widoczne dla zalogowanych (dyskusje, nicki).
-- Widok omija RLS na profiles, ale udostępnia wyłącznie bezpieczne kolumny.
-- Bezpieczne do powtórnego uruchomienia.

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id,
  display_name,
  nick,
  avatar_initials,
  avatar_emoji
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO authenticated;
