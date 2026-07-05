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
 * - 'instagram' for Instagram
 */
export function detectChannel(payload: WebhookPayload): ChannelType {
  if (!payload.entry?.[0]?.changes?.[0]?.value?.messaging_product) {
    // Default to WhatsApp for backward compatibility
    return 'whatsapp'
  }

  const messagingProduct = payload.entry[0].changes[0].value.messaging_product

  switch (messagingProduct) {
    case 'whatsapp':
      return 'whatsapp'
    case 'instagram':
      return 'instagram'
    default:
      // Check for other indicators
      const metadata = payload.entry[0].changes[0].value.metadata
      if (metadata?.ig_business_account_id) {
        return 'instagram'
      }
      // Default to WhatsApp for backward compatibility
      return 'whatsapp'
  }
}

/**
 * Extract channel identifier from webhook metadata.
 * Different channels use different ID fields.
 */
export function getChannelIdFromWebhook(value: WebhookValue): string | null {
  // WhatsApp uses phone_number_id
  if (value.metadata?.phone_number_id) {
    return value.metadata.phone_number_id
  }

  // Instagram/Messenger use page_id
  if (value.metadata?.page_id) {
    return value.metadata.page_id
  }

  return null
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
