-- ============================================================
-- 046_meta_oauth_pending_sessions.sql
-- Short-lived server-side state for Instagram/Messenger OAuth page picking.
-- Credentials must never travel in picker query strings.
-- ============================================================

CREATE TABLE IF NOT EXISTS meta_oauth_pending_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel channel_type NOT NULL CHECK (channel IN ('instagram', 'messenger')),
  encrypted_access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE meta_oauth_pending_sessions ENABLE ROW LEVEL SECURITY;

-- No browser RLS policies. The OAuth callback and picker API operate with
-- service_role after independently authenticating the caller.
CREATE INDEX IF NOT EXISTS idx_meta_oauth_pending_expiry
  ON meta_oauth_pending_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_meta_oauth_pending_owner
  ON meta_oauth_pending_sessions(account_id, user_id, channel);
