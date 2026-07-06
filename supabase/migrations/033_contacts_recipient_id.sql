-- ============================================================
-- 033_contacts_recipient_id.sql — Multi-channel recipient support
--
-- Adds recipient_id to contacts so Instagram/Messenger contacts
-- (which have no phone number) can still be identified by their
-- platform-specific opaque user ID.
--
-- WhatsApp contacts: identified by (account_id, phone)
-- IG/Messenger contacts: identified by (account_id, recipient_id)
-- ============================================================

-- Add recipient_id column (nullable — WhatsApp contacts use phone)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS recipient_id TEXT;

-- Index for fast lookups by (account_id, recipient_id)
-- Used by the webhook's find-or-create for IG/FB contacts
CREATE INDEX IF NOT EXISTS idx_contacts_account_recipient
  ON contacts(account_id, recipient_id)
  WHERE recipient_id IS NOT NULL;
