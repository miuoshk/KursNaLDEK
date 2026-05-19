-- Dodanie kolumny last_seen_at do profiles dla wskaźnika "online".
-- Uzupełniana heartbeatem z dashboardu (server-side, throttled ~60 s).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at
  ON profiles (last_seen_at DESC)
  WHERE last_seen_at IS NOT NULL;

-- Backfill: zainicjuj last_seen_at na podstawie najświeższej sesji usera.
UPDATE profiles p
SET last_seen_at = sub.last_session_at
FROM (
  SELECT user_id, MAX(COALESCE(completed_at, started_at)) AS last_session_at
  FROM study_sessions
  GROUP BY user_id
) AS sub
WHERE p.id = sub.user_id
  AND p.last_seen_at IS NULL;
