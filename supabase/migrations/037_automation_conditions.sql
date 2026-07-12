-- ============================================================
-- 037_automation_conditions.sql
--
-- Agrega columna de condiciones a automations
-- Permite ejecutar automations solo cuando se cumplen ciertas condiciones
--
-- ============================================================

-- Agregar columna conditions como JSONB (permite null por defecto)
ALTER TABLE automations 
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb;

-- Crear índice para mejorar performance en queries
CREATE INDEX IF NOT EXISTS idx_automations_conditions 
ON automations 
USING gin (conditions jsonb_path_ops);

-- Comentario para documentación
COMMENT ON COLUMN automations.conditions IS 
'Array de condiciones que deben cumplirse para ejecutar el automation.
Ejemplo: [{"type": "contact_has_not_tag", "value": "lead-nuevo"}]';
