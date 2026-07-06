/**
 * Channel API client abstraction.
 * Provides a unified interface for sending messages across different channels.
 */

import type { ChannelType } from '@/types/channel'
import {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  UnsupportedChannelError,
  type SendTextMessageArgs,
  type SendMediaMessageArgs,
  type SendTemplateMessageArgs,
  type MediaKind,
} from '../whatsapp/meta-api'

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

  async sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string }) {
    return sendTextMessage({
      ...args,
      channelId: this.config.channelId,
      messagingProduct: 'whatsapp',
    })
  }

  async sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string; kind: MediaKind }) {
    return sendMediaMessage({
      ...args,
      channelId: this.config.channelId,
      messagingProduct: 'whatsapp',
    })
  }

  async sendTemplate(args: Omit<SendTemplateMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string }) {
    return sendTemplateMessage({
      ...args,
      channelId: this.config.channelId,
      messagingProduct: 'whatsapp',
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

  async sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string }) {
    // Instagram uses the same Graph API as WhatsApp but with IG business account
    // The messaging_product is 'instagram' instead of 'whatsapp'
    // For now, we use the same API structure - can be extended for IG-specific features
    return sendTextMessage({
      ...args,
      channelId: this.config.channelId,
      messagingProduct: 'instagram',
    })
  }

  async sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string; kind: MediaKind }) {
    return sendMediaMessage({
      ...args,
      channelId: this.config.channelId,
      messagingProduct: 'instagram',
    })
  }

  async sendTemplate(args: Omit<SendTemplateMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string }): Promise<{ messageId: string }> {
    // The helper itself throws UnsupportedChannelError when given
    // messagingProduct='instagram' — the route layer surfaces that as
    // a 422 to the UI. Going through the helper (rather than throwing
    // here) keeps the unsupported-operation rules defined in ONE place.
    return sendTemplateMessage({
      ...args,
      channelId: this.config.channelId,
      messagingProduct: 'instagram',
    })
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

  async sendText(
    args: Omit<SendTextMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & {
      recipientId: string
    },
  ): Promise<{ messageId: string }> {
    // Messenger uses page_id instead of phone_number_id and the API
    // endpoint is /me/messages — a separate outbound path that lands
    // in Step 2 of the multi-channel rollout. Until then, surface the
    // missing implementation via the channel-op error contract so the
    // route layer can return a clean 422 instead of a misleading 502.
    throw new UnsupportedChannelError(
      'messenger',
      'text',
      `Meta's Messenger API is not yet wired into the outbound send path (recipientId=${args.recipientId}).`,
    )
  }

  async sendMedia(
    args: Omit<SendMediaMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & {
      recipientId: string
      kind: MediaKind
    },
  ): Promise<{ messageId: string }> {
    throw new UnsupportedChannelError(
      'messenger',
      'media',
      `Meta's Messenger API is not yet wired into the outbound send path (recipientId=${args.recipientId}, kind=${args.kind}).`,
    )
  }

  async sendTemplate(
    args: Omit<SendTemplateMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & {
      recipientId: string
    },
  ): Promise<{ messageId: string }> {
    throw new UnsupportedChannelError(
      'messenger',
      'template',
      `Meta's Messenger API is not yet wired into the outbound send path (recipientId=${args.recipientId}).`,
    )
  }
}
