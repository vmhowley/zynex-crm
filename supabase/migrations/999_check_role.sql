-- Verificar el rol de Victor en la cuenta
SELECT 
  p.user_id,
  p.full_name,
  p.email,
  p.account_id,
  p.account_role
FROM profiles p
WHERE p.email = 'admin@digitbillrd.com';
