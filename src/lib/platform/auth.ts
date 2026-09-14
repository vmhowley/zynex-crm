import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/flows/admin-client'

export type PlatformRole = 'super_admin' | 'support' | 'billing'

export interface PlatformAuthContext {
  userId: string
  email: string | null
  role: PlatformRole
}

export async function getPlatformAuthContext(): Promise<PlatformAuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: platformUser, error: platformError } = await supabaseAdmin()
    .from('platform_users')
    .select('role, is_active')
    .eq('user_id', user.id)
    .maybeSingle()

  if (platformError || !platformUser?.is_active) return null

  const role = platformUser.role as PlatformRole
  if (!['super_admin', 'support', 'billing'].includes(role)) return null

  return {
    userId: user.id,
    email: user.email ?? null,
    role,
  }
}

export async function requirePlatformRole(
  allowed: PlatformRole[],
): Promise<PlatformAuthContext | null> {
  const context = await getPlatformAuthContext()
  if (!context || !allowed.includes(context.role)) return null
  return context
}
