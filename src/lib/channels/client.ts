/**
 * Channel API client abstraction.
 * Provides a unified interface for sending messages across different channels.
 */

import type { ChannelType } from '@/types/channel'
import { sendTextMessage, sendMediaMessage, sendTemplateMessage, type SendTextMessageArgs, type SendMediaMessageArgs, type SendTemplateMessageArgs, type MediaKind } from '../whatsapp/meta-api'

export interface ChannelClient {
  /** The channel type this client handles */
  readonly channel: ChannelType

  /** Send a text message */
  sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId'> & { recipientId: string }): Promise<{ messageId: string }>

  /** Send a media message */
  sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId'> & { recipientId: string; kind: MediaKind }): Promise<{ messageId: string }>

  /** Send a template message */
  sendTemplate(args: Omit<SendTemplateMessageArgs, 'phoneNumberId'> & { recipientId: string }): Promise<{ messageId: string }>
}

export interface ChannelConfig {
  accountId: string
  userId: string
  channel: ChannelType
  /** Platform-specific identifier (phone_number_id for WhatsApp, page_id for IG/FB) */
  channelId: string
  accessToken: string
}

/**
 * Factory function to get the appropriate channel client.
 * Currently returns WhatsApp client - Instagram/Messenger clients can be added.
 */
export function getChannelClient(config: ChannelConfig): ChannelClient {
  switch (config.channel) {
    case 'whatsapp':
      return new WhatsAppChannelClient(config)
    case 'instagram':
      return new InstagramChannelClient(config)
    case 'messenger':
      return new MessengerChannelClient(config)
    default:
      throw new Error(`Unsupported channel: ${config.channel}`)
  }
}

// ============================================================
// WhatsApp Channel Client
// ============================================================

class WhatsAppChannelClient implements ChannelClient {
  readonly channel: ChannelType = 'whatsapp'
  private config: ChannelConfig

  constructor(config: ChannelConfig) {
    this.config = config
  }

  async sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId'> & { recipientId: string }) {
    return sendTextMessage({
      ...args,
      phoneNumberId: this.config.channelId,
    })
  }

  async sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId'> & { recipientId: string; kind: MediaKind }) {
    return sendMediaMessage({
      ...args,
      phoneNumberId: this.config.channelId,
    })
  }

  async sendTemplate(args: Omit<SendTemplateMessageArgs, 'phoneNumberId'> & { recipientId: string }) {
    return sendTemplateMessage({
      ...args,
      phoneNumberId: this.config.channelId,
    })
  }
}

// ============================================================
// Instagram Channel Client
// ============================================================

class InstagramChannelClient implements ChannelClient {
  readonly channel: ChannelType = 'instagram'
  private config: ChannelConfig

  constructor(config: ChannelConfig) {
    this.config = config
  }

  async sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId'> & { recipientId: string }) {
    // Instagram uses the same Graph API as WhatsApp but with IG business account
    // The messaging_product is 'instagram' instead of 'whatsapp'
    // For now, we use the same API structure - can be extended for IG-specific features
    return sendTextMessage({
      ...args,
      phoneNumberId: this.config.channelId,
    })
  }

  async sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId'> & { recipientId: string; kind: MediaKind }) {
    return sendMediaMessage({
      ...args,
      phoneNumberId: this.config.channelId,
    })
  }

  async sendTemplate(args: Omit<SendTemplateMessageArgs, 'phoneNumberId'> & { recipientId: string }): Promise<{ messageId: string }> {
    // Instagram doesn't support templates in the same way as WhatsApp
    // This will need IG-specific implementation
    throw new Error('Template messages are not supported on Instagram')
  }
}

// ============================================================
// Messenger Channel Client
// ============================================================

class MessengerChannelClient implements ChannelClient {
  readonly channel: ChannelType = 'messenger'
  private config: ChannelConfig

  constructor(config: ChannelConfig) {
    this.config = config
  }

  async sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId'> & { recipientId: string }) {
    // Messenger uses page_id instead of phone_number_id
    // The API endpoint is different: /me/messages
    // For now, we use a similar structure - can be extended for Messenger-specific features
    return sendTextMessage({
      ...args,
      phoneNumberId: this.config.channelId,
    })
  }

  async sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId'> & { recipientId: string; kind: MediaKind }) {
    return sendMediaMessage({
      ...args,
      phoneNumberId: this.config.channelId,
    })
  }

  async sendTemplate(args: Omit<SendTemplateMessageArgs, 'phoneNumberId'> & { recipientId: string }): Promise<{ messageId: string }> {
    // Messenger uses message templates (structured messages) differently
    // This will need FB-specific implementation
    throw new Error('Template messages are not fully supported on Messenger yet')
  }
}
