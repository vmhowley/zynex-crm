-- ============================================================
-- 034_contact_external_id.sql — External ID support for DigitBill
--
-- Adds external_id to contacts for DigitBill integration.
-- DigitBill uses this field to track contacts by their external
-- system ID (e.g., WhatsApp Business API phone number ID).
--
-- Allows multiple contacts without external_id (null) but enforces
-- uniqueness when external_id is present per account.
-- ============================================================

-- Add external_id column (nullable)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Unique partial index: allows multiple nulls but enforces uniqueness
-- when external_id is not null per account
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_account_external_id
  ON contacts(account_id, external_id)
  WHERE external_id IS NOT NULL;
