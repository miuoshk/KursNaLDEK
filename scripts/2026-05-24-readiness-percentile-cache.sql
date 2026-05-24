-- Cache percentyla gotowości w profilu (P1 — /statystyki bez ciężkiego RPC przy każdym wejściu).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS readiness_percentile numeric,
  ADD COLUMN IF NOT EXISTS readiness_cohort_size int,
  ADD COLUMN IF NOT EXISTS readiness_user_attempts int,
  ADD COLUMN IF NOT EXISTS readiness_computed_at timestamptz;
