-- ============================================================
-- 041_multi_channel_connections.sql
-- Allow multiple WhatsApp/Instagram/Messenger connections per account
-- while preserving one primary connection for legacy call sites.
-- ============================================================

ALTER TABLE channel_configs
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;

-- Existing schema allowed at most one row per (account_id, channel), so
-- every existing connection can safely become the primary connection.
UPDATE channel_configs
SET is_primary = true
WHERE is_primary = false;

ALTER TABLE channel_configs
  DROP CONSTRAINT IF EXISTS channel_configs_account_channel_key;

-- External Meta identifiers must remain globally unique so a webhook can
-- resolve to exactly one tenant/connection.
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_configs_channel_external_unique
  ON channel_configs(channel, channel_id);

-- An account may have many connections of the same channel, but only one
-- primary connection. Legacy settings/send paths can keep targeting it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_configs_one_primary_per_channel
  ON channel_configs(account_id, channel)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_channel_configs_account_channel
  ON channel_configs(account_id, channel);

-- Keep the backwards-compatibility view single-row-per-account by exposing
-- only the primary WhatsApp connection. New multi-number code must query
-- channel_configs directly.
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
  updated_at
FROM channel_configs
WHERE channel = 'whatsapp'
  AND is_primary = true;

GRANT SELECT ON whatsapp_config TO authenticated;
