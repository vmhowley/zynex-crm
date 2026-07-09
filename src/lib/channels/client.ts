/**
 * Channel API client abstraction.
 * Provides a unified interface for sending messages across different channels.
 */

import type { ChannelType } from '@/types/channel'
import {
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
  sendReactionMessage,
  type SendTextMessageArgs,
  type SendMediaMessageArgs,
  type SendTemplateMessageArgs,
} from '../whatsapp/meta-api'

// Media kinds supported by Instagram
type MediaKind = 'image' | 'video' | 'document' | 'audio'

export interface ChannelClient {
  /** The channel type this client handles */
  readonly channel: ChannelType

  /** Send a text message */
  sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId' | 'channelId' | 'accessToken' | 'to'> & { recipientId: string }): Promise<{ messageId: string }>

  /** Send a media message */
  sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId' | 'channelId' | 'accessToken' | 'to'> & { recipientId: string; kind: MediaKind }): Promise<{ messageId: string }>

  /** Send a template message */
  sendTemplate(args: Omit<SendTemplateMessageArgs, 'phoneNumberId' | 'channelId' | 'accessToken' | 'to'> & { recipientId: string }): Promise<{ messageId: string }>

  /** Send a reaction to a message */
  sendReaction(args: { recipientId: string; messageId: string; emoji: string }): Promise<{ messageId: string }>
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

  async sendReaction(args: { recipientId: string; messageId: string; emoji: string }) {
    return sendReactionMessage({
      channelId: this.config.channelId,
      accessToken: this.config.accessToken,
      to: args.recipientId,
      targetMessageId: args.messageId,
      emoji: args.emoji,
      messagingProduct: 'whatsapp',
    })
  }
}

// ============================================================
// Instagram Channel Client
// ============================================================

/**
 * Instagram Graph API endpoint base URL
 */
const INSTAGRAM_GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

class InstagramChannelClient implements ChannelClient {
  readonly channel: ChannelType = 'instagram'
  private config: ChannelConfig

  constructor(config: ChannelConfig) {
    this.config = config
  }

  /**
   * Private helper to make requests to Instagram Graph API
   */
  private async instagramGraphFetch<T>(body: object): Promise<T> {
    const endpoint = `${INSTAGRAM_GRAPH_API_BASE}/${this.config.channelId}/messages`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `Instagram API error: ${response.status} ${response.statusText}${
          error.error?.message ? ` - ${error.error.message}` : ''
        }`,
      )
    }

    return response.json()
  }

  async sendText(args: Omit<SendTextMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string }) {
    // Instagram uses Graph API with different body structure
    // No messaging_product or recipient_type - just recipient.id and message.text
    const body = {
      recipient: {
        id: args.recipientId,
      },
      message: {
        text: args.text,
      },
      messaging_type: 'RESPONSE',
    }

    const response = await this.instagramGraphFetch<{ messaging_id: string }>(body)
    return { messageId: response.messaging_id }
  }

  async sendMedia(args: Omit<SendMediaMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string; kind: MediaKind }) {
    // Instagram media message structure
    const body = {
      recipient: {
        id: args.recipientId,
      },
      message: {
        attachment: {
          type: args.kind,
          payload: {
            url: args.link,
            is_reusable: true,
          },
        },
      },
      messaging_type: 'RESPONSE',
    }

    const response = await this.instagramGraphFetch<{ messaging_id: string }>(body)
    return { messageId: response.messaging_id }
  }

  async sendTemplate(_args: Omit<SendTemplateMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & { recipientId: string }): Promise<{ messageId: string }> {
    throw new Error('Instagram does not support message templates in v1')
  }

  /**
   * Send a reaction to an Instagram message
   */
  async sendReaction(args: { recipientId: string; messageId: string; emoji: string }): Promise<{ messageId: string }> {
    const body = {
      recipient: {
        id: args.recipientId,
      },
      type: 'reaction',
      payload: {
        message_id: args.messageId,
        emoji: args.emoji,
      },
    }

    const response = await this.instagramGraphFetch<{ messaging_id: string }>(body)
    return { messageId: response.messaging_id }
  }
}

// ============================================================
// Messenger Channel Client
// ============================================================

/**
 * Facebook Messenger Graph API endpoint base URL
 * Uses the same v21.0 API version as Instagram
 */
const MESSENGER_GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

class MessengerChannelClient implements ChannelClient {
  readonly channel: ChannelType = 'messenger'
  private config: ChannelConfig

  constructor(config: ChannelConfig) {
    this.config = config
  }

  /**
   * Private helper to make requests to Messenger Graph API
   * Messenger uses the same API structure as Instagram but is a separate channel
   */
  private async messengerGraphFetch<T>(body: object): Promise<T> {
    const endpoint = `${MESSENGER_GRAPH_API_BASE}/${this.config.channelId}/messages`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        `Messenger API error: ${response.status} ${response.statusText}${
          error.error?.message ? ` - ${error.error.message}` : ''
        }`,
      )
    }

    return response.json()
  }

  async sendText(
    args: Omit<SendTextMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & {
      recipientId: string
    },
  ): Promise<{ messageId: string }> {
    // Messenger uses Graph API with body shape:
    // { recipient: { id: "FB_USER_ID" }, message: { text: "Hello" }, messaging_type: "RESPONSE" }
    const body = {
      recipient: {
        id: args.recipientId,
      },
      message: {
        text: args.text,
      },
      messaging_type: 'RESPONSE',
    }

    const response = await this.messengerGraphFetch<{ messaging_id: string }>(body)
    return { messageId: response.messaging_id }
  }

  async sendMedia(
    args: Omit<SendMediaMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & {
      recipientId: string
      kind: MediaKind
    },
  ): Promise<{ messageId: string }> {
    // Messenger media message structure:
    // { recipient: { id }, message: { attachment: { type, payload: { url, is_reusable } } }, messaging_type: 'RESPONSE' }
    const body = {
      recipient: {
        id: args.recipientId,
      },
      message: {
        attachment: {
          type: args.kind,
          payload: {
            url: args.link,
            is_reusable: true,
          },
        },
      },
      messaging_type: 'RESPONSE',
    }

    const response = await this.messengerGraphFetch<{ messaging_id: string }>(body)
    return { messageId: response.messaging_id }
  }

  async sendTemplate(
    _args: Omit<SendTemplateMessageArgs, 'phoneNumberId' | 'messagingProduct' | 'channelId'> & {
      recipientId: string
    },
  ): Promise<{ messageId: string }> {
    throw new Error('Messenger does not support structured templates in v1')
  }

  async sendReaction(_args: { recipientId: string; messageId: string; emoji: string }): Promise<{ messageId: string }> {
    throw new Error('Messenger does not support message reactions in v1')
  }
}
