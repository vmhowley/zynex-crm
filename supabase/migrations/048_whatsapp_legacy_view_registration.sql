-- ============================================================
-- 048_whatsapp_legacy_view_registration.sql
-- Restore registration/diagnostic fields that existed on the original
-- whatsapp_config table before migration 032 converted it into a view.
-- Keep the primary-only compatibility behavior introduced by migration 041.
-- ============================================================

CREATE OR REPLACE VIEW whatsapp_config AS
SELECT
  id,
  account_id,
  user_id,
  channel_id,
  waba_id,
  access_token,
  webhook_verify_token AS verify_token,
  status,
  connected_at,
  created_at,
  updated_at,
  registered_at,
  subscribed_apps_at,
  last_registration_error,
  display_name,
  is_primary
FROM channel_configs
WHERE channel = 'whatsapp'
  AND is_primary = true;

GRANT SELECT ON whatsapp_config TO authenticated;
