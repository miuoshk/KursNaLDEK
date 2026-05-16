-- Uprawnienia dostępu do konkretnych lat/kierunków (źródło prawdy do gate'ów i locków)
CREATE TABLE IF NOT EXISTS public.user_year_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  track TEXT NOT NULL CHECK (track IN ('stomatologia', 'lekarski')),
  year INT NOT NULL CHECK (year BETWEEN 1 AND 3),
  access_type TEXT NOT NULL CHECK (access_type IN ('free_test', 'paid')),
  active BOOLEAN NOT NULL DEFAULT true,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, track, year),
  UNIQUE (stripe_checkout_session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_year_entitlements_user_active
  ON public.user_year_entitlements (user_id, active);

ALTER TABLE public.user_year_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own entitlements SELECT"
  ON public.user_year_entitlements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_user_year_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_year_entitlements_updated_at ON public.user_year_entitlements;
CREATE TRIGGER trg_user_year_entitlements_updated_at
  BEFORE UPDATE ON public.user_year_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_year_entitlements_updated_at();
