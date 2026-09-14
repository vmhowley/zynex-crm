-- ============================================================
-- 047_pro_trial_signup.sql
-- A trial must demonstrate the paid product. Previously new accounts were
-- marked as a 14-day trial while pointing at the Free plan (0 WhatsApp
-- numbers), which made the onboarding experience internally contradictory.
-- Preserve the existing expiry policy; only correct which plan is trialed.
-- ============================================================

-- Correct still-active legacy trials that were accidentally created on Free.
UPDATE subscriptions s
SET plan_id = pro.id,
    updated_at = now()
FROM plans free_plan, plans pro
WHERE free_plan.plan_type = 'free'
  AND pro.plan_type = 'pro'
  AND s.plan_id = free_plan.id
  AND s.status = 'trial'
  AND s.trial_ends_at IS NOT NULL
  AND s.trial_ends_at > now();

UPDATE accounts a
SET plan_type = 'pro',
    updated_at = now()
FROM subscriptions s, plans p
WHERE s.account_id = a.id
  AND s.plan_id = p.id
  AND p.plan_type = 'pro'
  AND s.status = 'trial'
  AND s.trial_ends_at IS NOT NULL
  AND s.trial_ends_at > now();

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
  v_trial_days INTEGER;
  v_subscription_id UUID;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');

  INSERT INTO public.accounts (name, owner_user_id)
  VALUES (COALESCE(NULLIF(v_full_name, ''), NEW.email, 'Mi cuenta'), NEW.id)
  RETURNING id INTO v_account_id;

  INSERT INTO public.profiles (user_id, full_name, email, account_id, account_role)
  VALUES (NEW.id, v_full_name, NEW.email, v_account_id, 'owner');

  SELECT id, trial_days
  INTO v_plan_id, v_trial_days
  FROM plans
  WHERE plan_type = 'pro' AND is_active = true
  LIMIT 1;

  IF v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Active Pro plan not found';
  END IF;

  INSERT INTO subscriptions (
    account_id,
    plan_id,
    status,
    trial_started_at,
    trial_ends_at
  )
  VALUES (
    v_account_id,
    v_plan_id,
    'trial',
    NOW(),
    NOW() + make_interval(days => COALESCE(v_trial_days, 14))
  )
  RETURNING id INTO v_subscription_id;

  UPDATE accounts
  SET subscription_id = v_subscription_id,
      plan_type = 'pro'
  WHERE id = v_account_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to bootstrap account/profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
