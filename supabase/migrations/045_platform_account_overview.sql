-- ============================================================
-- 045_platform_account_overview.sql
-- Compact cross-tenant overview for the Zynex platform console.
-- Only service_role may execute it; authenticated tenant clients cannot.
-- ============================================================

CREATE OR REPLACE FUNCTION platform_account_overview()
RETURNS TABLE (
  account_id UUID,
  account_name TEXT,
  owner_user_id UUID,
  owner_name TEXT,
  owner_email TEXT,
  account_created_at TIMESTAMPTZ,
  plan_name TEXT,
  plan_type plan_type_enum,
  subscription_status subscription_status_enum,
  trial_ends_at TIMESTAMPTZ,
  paid_until TIMESTAMPTZ,
  contacts_count BIGINT,
  team_members_count BIGINT,
  whatsapp_numbers_count BIGINT,
  pending_payments_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    a.id AS account_id,
    a.name AS account_name,
    a.owner_user_id,
    owner_profile.full_name AS owner_name,
    owner_profile.email AS owner_email,
    a.created_at AS account_created_at,
    pl.name AS plan_name,
    pl.plan_type,
    s.status AS subscription_status,
    s.trial_ends_at,
    s.paid_until,
    (SELECT count(*) FROM contacts c WHERE c.account_id = a.id) AS contacts_count,
    (SELECT count(*) FROM profiles p WHERE p.account_id = a.id) AS team_members_count,
    (
      SELECT count(*)
      FROM channel_configs cc
      WHERE cc.account_id = a.id
        AND cc.channel = 'whatsapp'
        AND cc.status = 'connected'
    ) AS whatsapp_numbers_count,
    (
      SELECT count(*)
      FROM payment_requests pr
      WHERE pr.account_id = a.id
        AND pr.status = 'pending'
    ) AS pending_payments_count
  FROM accounts a
  LEFT JOIN profiles owner_profile
    ON owner_profile.user_id = a.owner_user_id
  LEFT JOIN subscriptions s
    ON s.account_id = a.id
  LEFT JOIN plans pl
    ON pl.id = s.plan_id
  ORDER BY a.created_at DESC;
$$;

ALTER FUNCTION platform_account_overview() OWNER TO postgres;
REVOKE ALL ON FUNCTION platform_account_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION platform_account_overview() FROM authenticated;
GRANT EXECUTE ON FUNCTION platform_account_overview() TO service_role;
