-- ============================================================
-- 032_channel_support.sql — Multi-channel foundation
--
-- Adds channel support to conversations and messages while
-- maintaining backward compatibility with existing WhatsApp setup.
--
-- What this migration does:
--   1. Adds channel column to whatsapp_config (rename to channel_configs)
--   2. Adds channel column to conversations
--   3. Adds channel column to messages
--   4. Backfills existing rows with 'whatsapp' as default
--   5. Adds unique constraint on (account_id, channel)
-- ============================================================

-- ============================================================
-- CHANNEL TYPE
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'channel_type') THEN
    CREATE TYPE channel_type AS ENUM ('whatsapp', 'instagram', 'messenger');
  END IF;
END $$;

-- ============================================================
-- WHATSAPP_CONFIG → CHANNEL_CONFIGS
-- Rename and add channel column
-- ============================================================

-- Add channel column with default for existing rows
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS channel channel_type NOT NULL DEFAULT 'whatsapp';

-- Rename for consistency (keeps backward compat - old name still works)
ALTER TABLE whatsapp_config RENAME TO channel_configs;

-- Update unique constraint to include channel (allows multiple channels per account)
ALTER TABLE channel_configs DROP CONSTRAINT IF EXISTS whatsapp_config_account_id_key;
ALTER TABLE channel_configs ADD CONSTRAINT channel_configs_account_channel_key UNIQUE (account_id, channel);

-- Rename indexes for clarity
ALTER INDEX IF EXISTS idx_whatsapp_config_account RENAME TO idx_channel_configs_account;
ALTER INDEX IF EXISTS idx_whatsapp_config_phone_number_id RENAME TO idx_channel_configs_channel_id;

-- Rename verify_token column for generic use
ALTER TABLE channel_configs RENAME COLUMN verify_token TO webhook_verify_token;

-- ============================================================
-- CONVERSATIONS
-- ============================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel channel_type NOT NULL DEFAULT 'whatsapp';

-- Add index for channel-specific queries
CREATE INDEX IF NOT EXISTS idx_conversations_account_channel 
  ON conversations(account_id, channel);

-- ============================================================
-- MESSAGES
-- ============================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel channel_type NOT NULL DEFAULT 'whatsapp';

-- Add index for channel-specific queries
CREATE INDEX IF NOT EXISTS idx_messages_channel 
  ON messages(channel) 
  WHERE channel IS NOT NULL;

-- ============================================================
-- BACKFILL (ensure all existing data has channel = 'whatsapp')
-- ============================================================

UPDATE channel_configs SET channel = 'whatsapp' WHERE channel IS NULL;
UPDATE conversations SET channel = 'whatsapp' WHERE channel IS NULL;
UPDATE messages SET channel = 'whatsapp' WHERE channel IS NULL;

-- ============================================================
-- RLS UPDATES
-- ============================================================

-- channel_configs inherits whatsapp_config policies
-- Just rename the existing policy references
DROP POLICY IF EXISTS "Users can manage own config" ON channel_configs;
CREATE POLICY channel_configs_select ON channel_configs FOR SELECT USING (is_account_member(account_id));
CREATE POLICY channel_configs_insert ON channel_configs FOR INSERT WITH CHECK (is_account_member(account_id, 'admin'));
CREATE POLICY channel_configs_update ON channel_configs FOR UPDATE USING (is_account_member(account_id, 'admin'));
CREATE POLICY channel_configs_delete ON channel_configs FOR DELETE USING (is_account_member(account_id, 'admin'));

-- Update triggers (they reference the old table name)
DROP TRIGGER IF EXISTS set_updated_at ON channel_configs;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON channel_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VIEWS (optional - for backward compat)
-- ============================================================

-- Create whatsapp_config view for backward compatibility
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
WHERE channel = 'whatsapp';

-- Grant read access to the view
GRANT SELECT ON whatsapp_config TO authenticated;
