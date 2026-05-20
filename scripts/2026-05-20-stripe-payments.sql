-- ============================================================
-- Lokalna replika danych płatności Stripe — pozwala szybko liczyć
-- statystyki finansowe w panelu /admin bez iteracji po API Stripe.
--
-- Tabela jest aktualizowana:
--   1) z webhooka Stripe (`charge.succeeded`, `charge.updated`,
--      `charge.refunded`, `checkout.session.completed`),
--   2) endpointem backfillu /api/admin/stripe-backfill (POST),
--      uruchamianym jednorazowo po migracji oraz w razie potrzeby
--      ręcznej resynchronizacji.
--
-- Bezpieczne do wielokrotnego uruchamiania (CREATE TABLE IF NOT EXISTS
-- + DROP/CREATE POLICY).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.stripe_payments (
  id TEXT PRIMARY KEY,                       -- Stripe charge id (ch_...)
  customer_id TEXT,
  payment_intent_id TEXT,
  checkout_session_id TEXT,
  amount INTEGER NOT NULL,                   -- brutto w najmniejszej jednostce waluty
  amount_refunded INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,                      -- succeeded | failed | pending
  refunded BOOLEAN NOT NULL DEFAULT FALSE,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  track TEXT,
  year INT,
  metadata JSONB,
  stripe_created_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_created
  ON public.stripe_payments (stripe_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_succeeded_created
  ON public.stripe_payments (stripe_created_at DESC)
  WHERE status = 'succeeded';

CREATE INDEX IF NOT EXISTS idx_stripe_payments_customer
  ON public.stripe_payments (customer_id);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_user
  ON public.stripe_payments (user_id);

-- Trigger: bump synced_at on update.
CREATE OR REPLACE FUNCTION public.set_stripe_payments_synced_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.synced_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stripe_payments_synced_at ON public.stripe_payments;
CREATE TRIGGER trg_stripe_payments_synced_at
  BEFORE UPDATE ON public.stripe_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_stripe_payments_synced_at();

ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- Tylko admin/moderator może czytać; zapis tylko service-role (brak policy = denied).
DROP POLICY IF EXISTS "Admin or moderator read stripe_payments" ON public.stripe_payments;
CREATE POLICY "Admin or moderator read stripe_payments"
  ON public.stripe_payments
  FOR SELECT
  USING (public.is_admin_or_moderator(auth.uid()));

COMMENT ON TABLE public.stripe_payments IS
  'Lokalna replika chargeów Stripe — używana przez panel admina (loadAdminFinance) do liczenia statystyk w O(rows) zamiast iterowania po API Stripe.';
