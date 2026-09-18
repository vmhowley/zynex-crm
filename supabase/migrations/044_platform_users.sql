-- ============================================================
-- 044_platform_users.sql
-- Platform administration is intentionally separate from tenant roles.
-- `profiles.account_role` answers "what can this user do inside an account?"
-- while this table answers "what can this user do across the Zynex SaaS?".
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'support', 'billing')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE platform_users ENABLE ROW LEVEL SECURITY;

-- Deliberately no authenticated-user RLS policies. Platform authorization
-- is checked server-side using the service-role client after authenticating
-- the caller. This prevents tenant-scoped clients from enumerating staff.

CREATE INDEX IF NOT EXISTS idx_platform_users_active_role
  ON platform_users(role)
  WHERE is_active = true;

-- Preserve access for installations that used the previous hard-coded
-- super-admin email allowlist. This is a one-time bootstrap only; runtime
-- authorization no longer depends on email addresses.
INSERT INTO platform_users (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE lower(email) IN (
  'admin@digitbillrd.com',
  'admin@zynex.do',
  'soporte@zynex.do'
)
ON CONFLICT (user_id) DO NOTHING;
