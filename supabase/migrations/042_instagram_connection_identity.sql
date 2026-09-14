-- ============================================================
-- 042_instagram_connection_identity.sql
-- Persist the Instagram Business Account identifier used by OAuth
-- and inbound webhook routing. The application already referenced
-- this field, but no prior migration created it.
-- ============================================================

ALTER TABLE channel_configs
  ADD COLUMN IF NOT EXISTS ig_business_account_id TEXT;

-- A Meta Instagram Business Account must resolve to a single tenant
-- connection. NULLs are allowed for Messenger/WhatsApp and legacy rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_configs_ig_business_account_unique
  ON channel_configs(ig_business_account_id)
  WHERE ig_business_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channel_configs_instagram_identity
  ON channel_configs(channel, ig_business_account_id)
  WHERE channel = 'instagram';
