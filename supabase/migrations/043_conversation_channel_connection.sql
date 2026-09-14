-- ============================================================
-- 043_conversation_channel_connection.sql
-- Bind every conversation to the exact channel connection that owns it.
-- This is required once an account can connect more than one WhatsApp
-- number (or more than one Instagram/Messenger identity): outbound replies
-- must use the same Meta credential/number that received the conversation.
-- ============================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel_config_id UUID REFERENCES channel_configs(id) ON DELETE SET NULL;

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS channel_config_id UUID REFERENCES channel_configs(id) ON DELETE SET NULL;

UPDATE conversations c
SET channel_config_id = cc.id
FROM channel_configs cc
WHERE c.channel_config_id IS NULL
  AND cc.account_id = c.account_id
  AND cc.channel = c.channel
  AND cc.is_primary = true;

UPDATE messages m
SET channel_config_id = c.channel_config_id
FROM conversations c
WHERE m.channel_config_id IS NULL
  AND m.conversation_id = c.id
  AND c.channel_config_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_channel_config
  ON conversations(channel_config_id);

CREATE INDEX IF NOT EXISTS idx_messages_channel_config
  ON messages(channel_config_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_contact_connection_unique
  ON conversations(account_id, contact_id, channel_config_id)
  WHERE channel_config_id IS NOT NULL;
