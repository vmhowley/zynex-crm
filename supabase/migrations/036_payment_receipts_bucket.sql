-- ============================================================
-- 036_payment_receipts_bucket.sql
--
-- Bucket de Storage para comprobantes de pago
--
-- ============================================================

-- Crear bucket para recibos de pago si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
VALUES (
  'payment-receipts',
  'payment-receipts',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Nota: Las políticas de RLS se configurarán desde la UI de Supabase
-- o pueden agregarse aquí si tienes permisos de owner
