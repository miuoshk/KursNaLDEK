-- Czarna lista kont: e-mail (+ opcjonalnie IP). Admin zarządza z panelu.
-- Uruchom w Supabase SQL Editor.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login_ip TEXT;

CREATE TABLE IF NOT EXISTS account_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  banned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT account_bans_email_not_blank CHECK (LENGTH(TRIM(email)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_account_bans_active_email
  ON account_bans (LOWER(email))
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_account_bans_active_ip
  ON account_bans (ip_address)
  WHERE revoked_at IS NULL AND ip_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_account_bans_user_id
  ON account_bans (user_id)
  WHERE revoked_at IS NULL;

ALTER TABLE account_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manage account bans" ON account_bans;
DROP POLICY IF EXISTS "Admin or moderator read account bans" ON account_bans;

CREATE POLICY "Admin or moderator read account bans"
  ON account_bans FOR SELECT
  USING (public.is_admin_or_moderator(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_account_blocked(p_email text, p_ip text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_bans b
    WHERE b.revoked_at IS NULL
      AND (
        (p_email IS NOT NULL AND LOWER(b.email) = LOWER(TRIM(p_email)))
        OR (
          p_ip IS NOT NULL
          AND b.ip_address IS NOT NULL
          AND b.ip_address = TRIM(p_ip)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.is_account_blocked(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_account_blocked(text, text) TO anon, authenticated;
