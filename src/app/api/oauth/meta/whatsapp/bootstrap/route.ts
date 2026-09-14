import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile || !['owner', 'admin'].includes(profile.account_role || '')) {
    return NextResponse.json(
      { error: 'Only account admins can connect WhatsApp' },
      { status: 403 },
    )
  }

  const appId = process.env.META_APP_ID
  const configId = process.env.META_WHATSAPP_CONFIG_ID

  if (!appId || !configId) {
    return NextResponse.json(
      {
        error:
          'WhatsApp Embedded Signup is not configured. Set META_APP_ID and META_WHATSAPP_CONFIG_ID.',
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    app_id: appId,
    config_id: configId,
    graph_version: process.env.META_GRAPH_API_VERSION || 'v21.0',
  })
}
