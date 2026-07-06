-- ============================================================
-- 034_channel_configs_dedupe.sql — Allow same page_id for
-- Instagram + Messenger on the same account + IG account ref.
--
-- Changes:
--   1. Drop the old unique constraints that were too restrictive
--   2. Add (account_id, channel, channel_id) unique — allows
--      IG + Messenger on the same account with the same page_id
--   3. Add ig_business_account_id column — needed to resolve
--      inbound IG webhooks precisely (IG sends this ID, not
--      the page_id)
--   4. Partial unique index on (account_id, ig_business_account_id)
-- ============================================================

-- === 1 & 2 — Unique constraint changes ===

-- Drop the global unique on channel_id (prevents same page_id
-- across IG + Messenger on the same account).
ALTER TABLE channel_configs
  DROP CONSTRAINT IF EXISTS channel_configs_channel_id_key;

-- Drop the account+channel unique (prevents having IG + Messenger
-- on the same account at all — too restrictive).
ALTER TABLE channel_configs
  DROP CONSTRAINT IF EXISTS channel_configs_account_channel_key;

-- Replace with (account_id, channel, channel_id) which allows
-- the same channel_id across channels on the same account but
-- prevents duplicates within the same (account, channel).
ALTER TABLE channel_configs
  ADD CONSTRAINT channel_configs_account_channel_channel_id_key
  UNIQUE (account_id, channel, channel_id);

-- === 3 — ig_business_account_id column ===

ALTER TABLE channel_configs
  ADD COLUMN IF NOT EXISTS ig_business_account_id TEXT;

-- Partial unique index — each IG business account can only be
-- linked to one CRM account.
CREATE UNIQUE INDEX IF NOT EXISTS idx_channel_configs_ig_account
  ON channel_configs(account_id, ig_business_account_id)
  WHERE ig_business_account_id IS NOT NULL;
