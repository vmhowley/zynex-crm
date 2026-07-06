/**
 * Channel types for multi-channel support.
 * Currently supports WhatsApp, Instagram, and Messenger via Meta's APIs.
 */

export type ChannelType = 'whatsapp' | 'instagram' | 'messenger'

export const CHANNEL_TYPES = ['whatsapp', 'instagram', 'messenger'] as const

export type ChannelConfig = {
  id: string
  account_id: string
  user_id: string
  channel: ChannelType
  /** Platform-specific identifier (phone_number_id for WhatsApp, page_id for IG/FB) */
  channel_id: string
  /** WhatsApp Business Account ID (WhatsApp only) */
  waba_id?: string
  /** Instagram Business Account ID (Instagram only) */
  ig_business_account_id?: string
  access_token: string
  webhook_verify_token?: string
  status: 'connected' | 'disconnected'
  connected_at?: string
  created_at: string
  updated_at: string
}

export type ChannelMessage = {
  id: string
  conversation_id: string
  sender_type: 'customer' | 'agent' | 'bot'
  sender_id?: string
  content_type: string
  content_text?: string
  media_url?: string
  template_name?: string
  message_id?: string
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  channel: ChannelType
  created_at: string
}

export type ChannelConversation = {
  id: string
  account_id: string
  user_id: string
  contact_id: string
  channel: ChannelType
  status: 'open' | 'pending' | 'closed'
  assigned_agent_id?: string
  last_message_text?: string
  last_message_at?: string
  unread_count: number
  created_at: string
  updated_at: string
}

/**
 * Platform-specific identifiers for each channel
 */
export interface ChannelIdentifiers {
  whatsapp: {
    phoneNumberId: string
    wabaId?: string
  }
  instagram: {
    pageId: string
    igBusinessAccountId?: string
  }
  messenger: {
    pageId: string
  }
}
