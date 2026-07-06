/**
 * Webhook router for multi-channel support.
 * Routes incoming webhooks to the appropriate channel handler.
 */

import type { ChannelType } from '@/types/channel'

export interface WebhookPayload {
  object: string
  entry: WebhookEntry[]
}

export interface WebhookEntry {
  id: string
  changes: WebhookChange[]
}

export interface WebhookChange {
  value: WebhookValue
  field: string
}

export interface WebhookValue {
  messaging_product: string
  metadata?: {
    display_phone_number?: string
    phone_number_id?: string
    page_id?: string
    ig_business_account_id?: string
  }
  contacts?: Array<{
    profile: { name: string }
    wa_id: string
  }>
  messages?: unknown[]
  statuses?: unknown[]
}

/**
 * Detect channel from webhook payload.
 * Meta sends different messaging_product values:
 * - 'whatsapp' for WhatsApp
 * - 'instagram' for Instagram (when present)
 *
 * Messenger webhooks NEVER send messaging_product — we detect
 * them by payload.object === 'page' as a fallback.
 */
export function detectChannel(payload: WebhookPayload): ChannelType {
  const value = payload.entry?.[0]?.changes?.[0]?.value
  if (!value) return 'whatsapp'

  if (value.messaging_product === 'whatsapp') return 'whatsapp'
  if (value.messaging_product === 'instagram') return 'instagram'
  if (value.metadata?.ig_business_account_id) return 'instagram'
  if (payload.object === 'page') return 'messenger'
  return 'whatsapp'
}

/**
 * Extract channel identifier from webhook metadata.
 * Different channels use different ID fields.
 *
 * - whatsapp   → metadata.phone_number_id
 * - instagram  → metadata.ig_business_account_id ?? metadata.page_id
 * - messenger  → metadata.page_id
 *
 * @param value The webhook change value
 * @param channel The detected channel type (from detectChannel)
 */
export function getChannelIdFromWebhook(
  value: WebhookValue,
  channel: ChannelType,
): string | null {
  switch (channel) {
    case 'whatsapp':
      return value.metadata?.phone_number_id ?? null
    case 'instagram':
      return value.metadata?.ig_business_account_id ?? value.metadata?.page_id ?? null
    case 'messenger':
      return value.metadata?.page_id ?? null
    default:
      return null
  }
}

/**
 * Detect channel from webhook payload and return both the channel
 * type and the corresponding channel ID in one call.
 */
export function detectChannelAndId(
  payload: WebhookPayload,
): { channel: ChannelType; channelId: string | null } {
  const channel = detectChannel(payload)
  const value = payload.entry?.[0]?.changes?.[0]?.value
  const channelId = value ? getChannelIdFromWebhook(value, channel) : null
  return { channel, channelId }
}

/**
 * Route webhook to the appropriate handler based on channel.
 */
export async function routeWebhook(
  payload: WebhookPayload,
  handlers: Partial<Record<ChannelType, (payload: WebhookPayload) => Promise<void>>>
): Promise<void> {
  const channel = detectChannel(payload)
  const handler = handlers[channel]

  if (handler) {
    await handler(payload)
  } else {
    console.warn(`[webhook] No handler for channel: ${channel}`)
  }
}
