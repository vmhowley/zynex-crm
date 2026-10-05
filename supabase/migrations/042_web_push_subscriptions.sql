CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint TEXT PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS push_subscriptions_own ON push_subscriptions;
CREATE POLICY push_subscriptions_own ON push_subscriptions FOR ALL
  TO authenticated USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
CREATE OR REPLACE FUNCTION set_push_subscription_account()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT account_id INTO NEW.account_id FROM profiles WHERE user_id = NEW.user_id;
  NEW.updated_at := now();
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION set_push_subscription_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_push_subscription_account() TO authenticated, service_role;
DROP TRIGGER IF EXISTS push_subscription_account ON push_subscriptions;
CREATE TRIGGER push_subscription_account BEFORE INSERT OR UPDATE ON push_subscriptions
FOR EACH ROW EXECUTE FUNCTION set_push_subscription_account();
