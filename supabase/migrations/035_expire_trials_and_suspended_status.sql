-- ============================================================
-- 035_expire_trials_and_suspended_status.sql
--
-- Job de expiración de trials y gestión de cuentas suspendidas
--
-- ============================================================

-- Función para expirar trials que ya pasaron su fecha de expiración
-- Esta función debe ejecutarse como un cron job (ej. cada hora)
CREATE OR REPLACE FUNCTION expire_trials_and_suspend()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired_trial subscriptions%ROWTYPE;
  v_account_id UUID;
  v_account_name TEXT;
BEGIN
  -- Cursor para procesar todos los trials expirados
  FOR v_expired_trial IN
    SELECT *
    FROM subscriptions
    WHERE status = 'trial'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < NOW()
  LOOP
    -- Actualizar status a suspended
    UPDATE subscriptions
    SET status = 'suspended',
        updated_at = NOW()
    WHERE id = v_expired_trial.id;

    -- Obtener información de la cuenta para logging
    SELECT a.id, a.name
    INTO v_account_id, v_account_name
    FROM accounts a
    WHERE a.id = v_expired_trial.account_id;

    -- Log de la operación (opcional: crear tabla de logs si es necesario)
    RAISE NOTICE 'Trial expirado para cuenta % (ID: %). Cambiando status a suspended.',
      v_account_name, v_account_id;
  END LOOP;

  RAISE NOTICE 'Proceso de expiración completado.';
END;
$$;

ALTER FUNCTION expire_trials_and_suspend() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION expire_trials_and_suspend() TO service_role;

-- Función helper para verificar si una cuenta está suspendida
CREATE OR REPLACE FUNCTION is_account_suspended(target_account_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status subscription_status_enum;
BEGIN
  SELECT s.status INTO v_status
  FROM subscriptions s
  WHERE s.account_id = target_account_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN v_status = 'suspended';
END;
$$;

ALTER FUNCTION is_account_suspended(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION is_account_suspended(UUID) TO authenticated, service_role;

-- Función para obtener el estado de suscripción con información de suspensión
CREATE OR REPLACE FUNCTION get_subscription_status(target_account_id UUID)
RETURNS TABLE (
  status subscription_status_enum,
  is_suspended BOOLEAN,
  is_trial_expired BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  days_remaining INTEGER,
  plan_name TEXT,
  plan_type plan_type_enum
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
  v_plan_name TEXT;
  v_plan_type plan_type_enum;
  v_days_remaining INTEGER;
BEGIN
  -- Obtener la suscripción actual
  SELECT s.* INTO v_subscription
  FROM subscriptions s
  WHERE s.account_id = target_account_id
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Obtener información del plan
  SELECT p.name, p.plan_type INTO v_plan_name, v_plan_type
  FROM plans p WHERE p.id = v_subscription.plan_id;

  -- Calcular días restantes del trial
  IF v_subscription.status = 'trial' AND v_subscription.trial_ends_at IS NOT NULL THEN
    v_days_remaining := EXTRACT(DAY FROM v_subscription.trial_ends_at - NOW())::INTEGER;
  ELSE
    v_days_remaining := NULL;
  END IF;

  RETURN QUERY SELECT
    v_subscription.status,
    v_subscription.status = 'suspended',
    CASE
      WHEN v_subscription.status = 'trial'
        AND v_subscription.trial_ends_at IS NOT NULL
        AND v_subscription.trial_ends_at < NOW()
      THEN true
      ELSE false
    END,
    v_subscription.trial_ends_at,
    v_days_remaining,
    v_plan_name,
    v_plan_type;
END;
$$;

ALTER FUNCTION get_subscription_status(UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION get_subscription_status(UUID) TO authenticated, service_role;

-- Función para reactivar una cuenta suspendida (solo admins)
CREATE OR REPLACE FUNCTION reactivate_subscription(target_account_id UUID, new_plan_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- Obtener suscripción actual
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE account_id = target_account_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró suscripción para esta cuenta';
  END IF;

  -- Actualizar suscripción
  UPDATE subscriptions
  SET
    status = 'active',
    plan_id = new_plan_id,
    started_at = NOW(),
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 month',
    updated_at = NOW()
  WHERE id = v_subscription.id;

  RETURN true;
END;
$$;

ALTER FUNCTION reactivate_subscription(UUID, UUID) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION reactivate_subscription(UUID, UUID) TO service_role;

-- Agregar índice para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends ON subscriptions(trial_ends_at) WHERE status = 'trial';

COMMENT ON FUNCTION expire_trials_and_suspend() IS 'Expira trials y cambia status a suspended. Ejecutar como cron job cada hora.';
COMMENT ON FUNCTION is_account_suspended(UUID) IS 'Verifica si una cuenta está suspendida';
COMMENT ON FUNCTION get_subscription_status(UUID) IS 'Obtiene el estado detallado de suscripción';
COMMENT ON FUNCTION reactivate_subscription(UUID, UUID) IS 'Reactiva una cuenta suspendida con un nuevo plan';
