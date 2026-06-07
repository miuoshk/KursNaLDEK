-- Flaga odebrania dostępu (admin może zablokować konto bez pełnego bana).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS access_revoked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_access_revoked_at
  ON profiles (access_revoked_at)
  WHERE access_revoked_at IS NOT NULL;
