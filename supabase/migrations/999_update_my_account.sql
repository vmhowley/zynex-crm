-- Actualizar al plan Empresarial (top)
UPDATE subscriptions
SET 
  plan_id = (SELECT id FROM plans WHERE plan_type = 'enterprise' LIMIT 1),
  status = 'active',
  updated_at = NOW()
WHERE account_id = '41eb35ac-737f-4298-b75a-a3c0e3e90d8a';

-- Verificar cambio
SELECT 
  s.status as subscription_status,
  pl.plan_type,
  pl.name as plan_name
FROM subscriptions s
JOIN plans pl ON pl.id = s.plan_id
WHERE s.account_id = '41eb35ac-737f-4298-b75a-a3c0e3e90d8a';
