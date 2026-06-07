-- Audit log zgody konsumenta przed checkout Stripe.
CREATE TABLE IF NOT EXISTS public.consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_text TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_days INT NOT NULL DEFAULT 45 CHECK (access_days > 0),
  CONSTRAINT consent_log_text_not_blank CHECK (LENGTH(TRIM(consent_text)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_consent_log_user_accepted
  ON public.consent_log (user_id, accepted_at DESC);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users insert own consent" ON public.consent_log;
DROP POLICY IF EXISTS "Users read own consent" ON public.consent_log;
DROP POLICY IF EXISTS "Admin or moderator read consent" ON public.consent_log;

CREATE POLICY "Users insert own consent"
  ON public.consent_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own consent"
  ON public.consent_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin or moderator read consent"
  ON public.consent_log FOR SELECT
  USING (public.is_admin_or_moderator(auth.uid()));
