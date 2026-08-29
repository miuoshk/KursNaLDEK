-- Product-scoped entitlements + optional duration (LDEW 30/180/365).
-- Applied remotely 2026-08-29 as entitlements_product_and_duration.

ALTER TABLE public.user_year_entitlements
  ADD COLUMN IF NOT EXISTS product TEXT NOT NULL DEFAULT 'knnp',
  ADD COLUMN IF NOT EXISTS offer_key TEXT,
  ADD COLUMN IF NOT EXISTS access_days INTEGER;

ALTER TABLE public.user_year_entitlements
  DROP CONSTRAINT IF EXISTS user_year_entitlements_product_check;

ALTER TABLE public.user_year_entitlements
  ADD CONSTRAINT user_year_entitlements_product_check
  CHECK (product IN ('knnp', 'ldek', 'ldew'));

UPDATE public.user_year_entitlements
SET product = 'knnp'
WHERE product IS NULL OR product NOT IN ('knnp', 'ldek', 'ldew');

ALTER TABLE public.user_year_entitlements
  DROP CONSTRAINT IF EXISTS user_year_entitlements_user_id_track_year_key;

ALTER TABLE public.user_year_entitlements
  DROP CONSTRAINT IF EXISTS user_year_entitlements_user_id_product_track_year_key;

ALTER TABLE public.user_year_entitlements
  ADD CONSTRAINT user_year_entitlements_user_id_product_track_year_key
  UNIQUE (user_id, product, track, year);

-- Kompatybilność ze starym webhookiem (onConflict user_id,track,year) do czasu deployu.
ALTER TABLE public.user_year_entitlements
  DROP CONSTRAINT IF EXISTS user_year_entitlements_user_id_track_year_key;

ALTER TABLE public.user_year_entitlements
  ADD CONSTRAINT user_year_entitlements_user_id_track_year_key
  UNIQUE (user_id, track, year);

CREATE INDEX IF NOT EXISTS idx_user_year_entitlements_user_product_active
  ON public.user_year_entitlements (user_id, product, active);
