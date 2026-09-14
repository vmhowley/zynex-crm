import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { encrypt } from '@/lib/whatsapp/encryption'
import {
  registerPhoneNumber,
  subscribeWabaToApp,
  verifyPhoneNumber,
} from '@/lib/whatsapp/meta-api'
import { checkLimit } from '@/lib/subscription/enforce'

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`

type MetaTokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: { message?: string; code?: number }
}

type MetaPhoneRow = {
  id: string
  display_phone_number?: string
  verified_name?: string
  quality_rating?: string
}

async function exchangeEmbeddedSignupCode(code: string): Promise<string> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('META_APP_ID / META_APP_SECRET are not configured')
  }

  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    code,
  })

  // Login for Business v4 normally exchanges the JS-SDK code without a
  // redirect_uri. Keep an explicit escape hatch for Meta configurations
  // that were created with a fixed redirect URI.
  const redirectUri = process.env.META_EMBEDDED_SIGNUP_REDIRECT_URI
  if (redirectUri) params.set('redirect_uri', redirectUri)

  const response = await fetch(`${GRAPH_BASE}/oauth/access_token?${params}`, {
    method: 'GET',
    cache: 'no-store',
  })
  const body = (await response.json()) as MetaTokenResponse

  if (!response.ok || body.error || !body.access_token) {
    throw new Error(body.error?.message || 'Meta token exchange failed')
  }

  return body.access_token
}

async function getWabaPhoneNumbers(
  wabaId: string,
  accessToken: string,
): Promise<MetaPhoneRow[]> {
  const response = await fetch(
    `${GRAPH_BASE}/${encodeURIComponent(wabaId)}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  )
  const body = await response.json()
  if (!response.ok || body.error) {
    throw new Error(body.error?.message || 'Could not read WhatsApp phone numbers')
  }
  return Array.isArray(body.data) ? body.data : []
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, account_role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    if (!['owner', 'admin'].includes(profile.account_role || '')) {
      return NextResponse.json(
        { error: 'Only account admins can connect WhatsApp' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const wabaId = typeof body.waba_id === 'string' ? body.waba_id.trim() : ''
    const hintedPhoneId =
      typeof body.phone_number_id === 'string' ? body.phone_number_id.trim() : ''
    const pin = typeof body.pin === 'string' ? body.pin.trim() : ''
    const requestedName =
      typeof body.display_name === 'string' ? body.display_name.trim() : ''

    if (!code || !wabaId) {
      return NextResponse.json(
        { error: 'Embedded Signup did not return the required Meta IDs' },
        { status: 400 },
      )
    }
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Create a 6-digit PIN to protect this WhatsApp number' },
        { status: 400 },
      )
    }

    const accessToken = await exchangeEmbeddedSignupCode(code)
    const phones = await getWabaPhoneNumbers(wabaId, accessToken)

    let phoneNumberId = hintedPhoneId
    if (phoneNumberId) {
      const belongsToWaba = phones.some((phone) => phone.id === phoneNumberId)
      if (!belongsToWaba) {
        return NextResponse.json(
          { error: 'The selected phone number does not belong to the selected WhatsApp Business Account' },
          { status: 400 },
        )
      }
    } else if (phones.length === 1) {
      phoneNumberId = phones[0].id
    } else {
      return NextResponse.json(
        {
          error:
            'Meta did not identify the selected phone number. Reopen Embedded Signup and select a specific number.',
        },
        { status: 400 },
      )
    }

    const admin = supabaseAdmin()
    const { data: claimed, error: claimedError } = await admin
      .from('channel_configs')
      .select('id, account_id, is_primary')
      .eq('channel', 'whatsapp')
      .eq('channel_id', phoneNumberId)
      .maybeSingle()

    if (claimedError) {
      console.error('[embedded-signup] ownership lookup failed:', claimedError)
      return NextResponse.json({ error: 'Could not validate the WhatsApp number' }, { status: 500 })
    }
    if (claimed && claimed.account_id !== profile.account_id) {
      return NextResponse.json(
        { error: 'This WhatsApp number is already connected to another Zynex CRM account' },
        { status: 409 },
      )
    }

    if (!claimed) {
      const limit = await checkLimit(profile.account_id, 'whatsapp_numbers', 1)
      if (!limit.allowed) {
        return NextResponse.json(
          { error: limit.error || 'Your plan does not allow another WhatsApp number' },
          { status: 403 },
        )
      }
    }

    const phoneInfo = await verifyPhoneNumber({
      phoneNumberId,
      accessToken,
    })

    // Both operations are part of making Embedded Signup usable for Cloud
    // API. Meta requires phone registration within the signup window; WABA
    // subscription makes webhook delivery deterministic for this app.
    await subscribeWabaToApp({ wabaId, accessToken })
    await registerPhoneNumber({
      channelId: phoneNumberId,
      messagingProduct: 'whatsapp',
      accessToken,
      pin,
    })

    let isPrimary = Boolean(claimed?.is_primary)
    if (!claimed) {
      const { data: primary } = await admin
        .from('channel_configs')
        .select('id')
        .eq('account_id', profile.account_id)
        .eq('channel', 'whatsapp')
        .eq('is_primary', true)
        .maybeSingle()
      isPrimary = !primary
    }

    const now = new Date().toISOString()
    const row = {
      account_id: profile.account_id,
      user_id: user.id,
      channel: 'whatsapp',
      channel_id: phoneNumberId,
      waba_id: wabaId,
      display_name:
        requestedName || phoneInfo.verified_name || phoneInfo.display_phone_number || 'WhatsApp',
      access_token: encrypt(accessToken),
      status: 'connected',
      connected_at: now,
      registered_at: now,
      subscribed_apps_at: now,
      last_registration_error: null,
      is_primary: isPrimary,
      updated_at: now,
    }

    let saveError
    if (claimed) {
      const result = await admin
        .from('channel_configs')
        .update(row)
        .eq('id', claimed.id)
        .eq('account_id', profile.account_id)
      saveError = result.error
    } else {
      const result = await admin.from('channel_configs').insert(row)
      saveError = result.error
    }

    if (saveError) {
      console.error('[embedded-signup] save failed:', saveError)
      return NextResponse.json(
        { error: 'WhatsApp was connected at Meta but could not be saved in Zynex CRM' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      connection: {
        channel_id: phoneNumberId,
        waba_id: wabaId,
        display_name: row.display_name,
        display_phone_number: phoneInfo.display_phone_number,
        verified_name: phoneInfo.verified_name || null,
        is_primary: isPrimary,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Embedded Signup error'
    console.error('[embedded-signup] completion failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
