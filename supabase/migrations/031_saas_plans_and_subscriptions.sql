-- ============================================================
-- 031_saas_plans_and_subscriptions.sql
--
-- Sistema de licencias SaaS para Zynex CRM:
-- - Planes (free, basic, pro, enterprise)
-- - Suscripciones por cuenta
-- - Tracking de uso
-- - Trial de 14 días
-- - Pagos manuales (transferencia)
--
-- ============================================================

-- ============================================================
-- PLAN TYPES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type_enum') THEN
    CREATE TYPE plan_type_enum AS ENUM ('free', 'basic', 'pro', 'enterprise');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM ('trial', 'active', 'suspended', 'cancelled');
  END IF;
END $$;

-- ============================================================
-- PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan_type plan_type_enum NOT NULL UNIQUE,
  price_rd numeric(10,2) NOT NULL DEFAULT 0,
  trial_days integer NOT NULL DEFAULT 14,
  max_contacts integer DEFAULT 50,
  max_team_members integer DEFAULT 1,
  max_whatsapp_numbers integer DEFAULT 0,
  broadcasts_enabled boolean NOT NULL DEFAULT false,
  automations_enabled boolean NOT NULL DEFAULT false,
  flows_enabled boolean NOT NULL DEFAULT false,
  api_access boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, plan_type, price_rd, trial_days, max_contacts, max_team_members, max_whatsapp_numbers, broadcasts_enabled, automations_enabled, flows_enabled, api_access) VALUES
  ('Gratis', 'free', 0, 0, 25, 1, 0, false, false, false, false),
  ('Básico', 'basic', 1500, 14, 500, 3, 1, true, false, false, false),
  ('Pro', 'pro', 3000, 14, 2000, 10, 3, true, true, true, false),
  ('Empresarial', 'enterprise', 6000, 14, -1, -1, -1, true, true, true, true)
ON CONFLICT (plan_type) DO UPDATE SET 
  max_contacts = EXCLUDED.max_contacts,
  max_team_members = EXCLUDED.max_team_members,
  max_whatsapp_numbers = EXCLUDED.max_whatsapp_numbers;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status subscription_status_enum NOT NULL DEFAULT 'trial',
  trial_started_at timestamptz NOT NULL DEFAULT NOW(),
  trial_ends_at timestamptz,
  started_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  payment_method text,
  payment_reference text,
  paid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(account_id)
);

-- ============================================================
-- PAYMENT REQUESTS (Manual payments)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'DOP',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  payment_method text,
  payment_reference text,
  proof_image_url text,
  notes text,
  requested_at timestamptz NOT NULL DEFAULT NOW(),
  processed_at timestamptz,
  processed_by UUID REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USAGE TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS account_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  usage_type text NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, usage_type, period_start)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_account ON subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_requests_account ON payment_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_usage_account ON account_usage(account_id);

-- ============================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at ON plans;
DROP TRIGGER IF EXISTS set_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS set_updated_at ON payment_requests;
DROP TRIGGER IF EXISTS set_updated_at ON account_usage;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view plans" ON plans;
CREATE POLICY "Anyone can view plans" ON plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Account members can view own subscription" ON subscriptions;
CREATE POLICY "Account members can view own subscription" ON subscriptions FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS "Account members can view own payment requests" ON payment_requests;
CREATE POLICY "Account members can view own payment requests" ON payment_requests FOR SELECT
  USING (is_account_member(account_id));

DROP POLICY IF EXISTS "Account members can view own usage" ON account_usage;
CREATE POLICY "Account members can view own usage" ON account_usage FOR SELECT
  USING (is_account_member(account_id));

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get current subscription for account
CREATE OR REPLACE FUNCTION get_account_subscription(target_account_id UUID)
RETURNS TABLE (
  id UUID,
  account_id UUID,
  plan_id UUID,
  plan_name TEXT,
  plan_type plan_type_enum,
  status subscription_status_enum,
  trial_ends_at timestamptz,
  started_at timestamptz,
  paid_until timestamptz
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.account_id,
    s.plan_id,
    p.name,
    p.plan_type,
    s.status,
    s.trial_ends_at,
    s.started_at,
    s.paid_until
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.account_id = target_account_id;
END;
$$;

ALTER FUNCTION get_account_subscription(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_account_subscription(UUID) TO authenticated, service_role;

-- Check if account can use feature
CREATE OR REPLACE FUNCTION can_use_feature(target_account_id UUID, feature_name TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan_type plan_type_enum;
  v_has_feature boolean := false;
BEGIN
  SELECT p.plan_type INTO v_plan_type
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.account_id = target_account_id AND s.status IN ('trial', 'active')
  ORDER BY 
    CASE p.plan_type 
      WHEN 'enterprise' THEN 1 
      WHEN 'pro' THEN 2 
      WHEN 'basic' THEN 3 
      WHEN 'free' THEN 4 
    END
  LIMIT 1;

  IF v_plan_type IS NULL THEN
    RETURN false;
  END IF;

  CASE feature_name
    WHEN 'broadcasts' THEN
      SELECT p.broadcasts_enabled INTO v_has_feature FROM plans p WHERE p.plan_type = v_plan_type;
    WHEN 'automations' THEN
      SELECT p.automations_enabled INTO v_has_feature FROM plans p WHERE p.plan_type = v_plan_type;
    WHEN 'flows' THEN
      SELECT p.flows_enabled INTO v_has_feature FROM plans p WHERE p.plan_type = v_plan_type;
    WHEN 'api' THEN
      SELECT p.api_access INTO v_has_feature FROM plans p WHERE p.plan_type = v_plan_type;
    WHEN 'whatsapp_multiple' THEN
      SELECT p.max_whatsapp_numbers > 1 INTO v_has_feature FROM plans p WHERE p.plan_type = v_plan_type;
    ELSE
      v_has_feature := true;
  END CASE;

  RETURN COALESCE(v_has_feature, false);
END;
$$;

ALTER FUNCTION can_use_feature(UUID, TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION can_use_feature(UUID, TEXT) TO authenticated, service_role;

-- Check if account is within limits
CREATE OR REPLACE FUNCTION is_within_limit(target_account_id UUID, limit_type TEXT, current_count INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max_value INTEGER;
BEGIN
  CASE limit_type
    WHEN 'contacts' THEN
      SELECT p.max_contacts INTO v_max_value
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.account_id = target_account_id AND s.status IN ('trial', 'active')
      ORDER BY 
        CASE p.plan_type 
          WHEN 'enterprise' THEN 1 
          WHEN 'pro' THEN 2 
          WHEN 'basic' THEN 3 
          WHEN 'free' THEN 4 
        END
      LIMIT 1;
    WHEN 'team_members' THEN
      SELECT p.max_team_members INTO v_max_value
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.account_id = target_account_id AND s.status IN ('trial', 'active')
      ORDER BY 
        CASE p.plan_type 
          WHEN 'enterprise' THEN 1 
          WHEN 'pro' THEN 2 
          WHEN 'basic' THEN 3 
          WHEN 'free' THEN 4 
        END
      LIMIT 1;
    WHEN 'whatsapp_numbers' THEN
      SELECT p.max_whatsapp_numbers INTO v_max_value
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.account_id = target_account_id AND s.status IN ('trial', 'active')
      ORDER BY 
        CASE p.plan_type 
          WHEN 'enterprise' THEN 1 
          WHEN 'pro' THEN 2 
          WHEN 'basic' THEN 3 
          WHEN 'free' THEN 4 
        END
      LIMIT 1;
    ELSE
      RETURN true;
  END CASE;

  IF v_max_value IS NULL OR v_max_value = -1 THEN
    RETURN true;
  END IF;

  RETURN current_count < v_max_value;
END;
$$;

ALTER FUNCTION is_within_limit(UUID, TEXT, INTEGER) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION is_within_limit(UUID, TEXT, INTEGER) TO authenticated, service_role;

-- ============================================================
-- ADD SUBSCRIPTION FIELDS TO ACCOUNTS
-- ============================================================
ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id),
  ADD COLUMN IF NOT EXISTS plan_type plan_type_enum;

-- ============================================================
-- UPDATE SIGNUP TRIGGER TO CREATE SUBSCRIPTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_account_id UUID;
  v_plan_id UUID;
  v_subscription_id UUID;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.accounts (name, owner_user_id)
  VALUES (COALESCE(NULLIF(v_full_name, ''), NEW.email, 'Mi cuenta'), NEW.id)
  RETURNING id INTO v_account_id;

  INSERT INTO public.profiles (user_id, full_name, email, account_id, account_role)
  VALUES (NEW.id, v_full_name, NEW.email, v_account_id, 'owner');

  -- Get the free plan
  SELECT id INTO v_plan_id FROM plans WHERE plan_type = 'free' LIMIT 1;

  -- Create subscription with trial
  INSERT INTO subscriptions (account_id, plan_id, status, trial_started_at, trial_ends_at)
  VALUES (v_account_id, v_plan_id, 'trial', NOW(), NOW() + INTERVAL '14 days')
  RETURNING id INTO v_subscription_id;

  -- Update account with subscription
  UPDATE accounts 
  SET subscription_id = v_subscription_id, plan_type = 'free'
  WHERE id = v_account_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to bootstrap account/profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- ============================================================
-- ENABLE REALTIME FOR SUBSCRIPTIONS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payment_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_requests;
  END IF;
END $$;
