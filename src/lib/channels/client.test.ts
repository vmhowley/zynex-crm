import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getChannelClient, type ChannelConfig } from './client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const BASE_CONFIG: ChannelConfig = {
  accountId: 'acct-1',
  userId: 'user-1',
  channel: 'instagram',
  channelId: 'page-123',
  accessToken: 'ig-token',
}

describe('InstagramChannelClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendText', () => {
    it('sends text with correct Instagram Graph API body shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messaging_id: 'msg-123' }),
      })

      const client = getChannelClient(BASE_CONFIG)
      const result = await client.sendText({
        recipientId: 'IG_USER_ID',
        text: 'Hello',
      })

      expect(result.messageId).toBe('msg-123')

      // Verify the fetch was called with correct body shape
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-123/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ig-token',
          },
          body: JSON.stringify({
            recipient: {
              id: 'IG_USER_ID',
            },
            message: {
              text: 'Hello',
            },
            messaging_type: 'RESPONSE',
          }),
        }),
      )
    })
  })

  describe('sendMedia', () => {
    it('sends image with correct Instagram Graph API body shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messaging_id: 'media-123' }),
      })

      const client = getChannelClient(BASE_CONFIG)
      const result = await client.sendMedia({
        recipientId: 'IG_USER_ID',
        kind: 'image',
        link: 'https://example.com/image.jpg',
      })

      expect(result.messageId).toBe('media-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-123/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ig-token',
          },
          body: JSON.stringify({
            recipient: {
              id: 'IG_USER_ID',
            },
            message: {
              attachment: {
                type: 'image',
                payload: {
                  url: 'https://example.com/image.jpg',
                  is_reusable: true,
                },
              },
            },
            messaging_type: 'RESPONSE',
          }),
        }),
      )
    })

    it('sends video with correct body shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messaging_id: 'video-456' }),
      })

      const client = getChannelClient(BASE_CONFIG)
      await client.sendMedia({
        recipientId: 'IG_USER_ID',
        kind: 'video',
        link: 'https://example.com/video.mp4',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-123/messages',
        expect.objectContaining({
          body: JSON.stringify({
            recipient: {
              id: 'IG_USER_ID',
            },
            message: {
              attachment: {
                type: 'video',
                payload: {
                  url: 'https://example.com/video.mp4',
                  is_reusable: true,
                },
              },
            },
            messaging_type: 'RESPONSE',
          }),
        }),
      )
    })
  })

  describe('sendTemplate', () => {
    it('throws clear error that Instagram does not support templates', async () => {
      const client = getChannelClient(BASE_CONFIG)

      await expect(
        client.sendTemplate({
          recipientId: 'IG_USER_ID',
          templateName: 'hello_world',
          language: 'en_US',
        }),
      ).rejects.toThrow('Instagram does not support message templates in v1')
    })
  })

  describe('sendReaction', () => {
    it('sends reaction with correct Instagram Graph API body shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messaging_id: 'reaction-123' }),
      })

      const client = getChannelClient(BASE_CONFIG)
      const result = await client.sendReaction({
        recipientId: 'IG_USER_ID',
        messageId: 'ORIGINAL_MSG_ID',
        emoji: '👍',
      })

      expect(result.messageId).toBe('reaction-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-123/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ig-token',
          },
          body: JSON.stringify({
            recipient: {
              id: 'IG_USER_ID',
            },
            type: 'reaction',
            payload: {
              message_id: 'ORIGINAL_MSG_ID',
              emoji: '👍',
            },
          }),
        }),
      )
    })
  })
})

describe('MessengerChannelClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendText', () => {
    it('sends text with correct Messenger Graph API body shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messaging_id: 'msg-123' }),
      })

      const messengerConfig: ChannelConfig = {
        ...BASE_CONFIG,
        channel: 'messenger',
        channelId: 'page-456',
        accessToken: 'fb-token',
      }

      const client = getChannelClient(messengerConfig)
      const result = await client.sendText({
        recipientId: 'FB_USER_ID',
        text: 'hi',
      })

      expect(result.messageId).toBe('msg-123')

      // Verify the fetch was called with correct body shape
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-456/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer fb-token',
          },
          body: JSON.stringify({
            recipient: {
              id: 'FB_USER_ID',
            },
            message: {
              text: 'hi',
            },
            messaging_type: 'RESPONSE',
          }),
        }),
      )
    })
  })

  describe('sendMedia', () => {
    it('sends image with correct Messenger Graph API body shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messaging_id: 'media-123' }),
      })

      const messengerConfig: ChannelConfig = {
        ...BASE_CONFIG,
        channel: 'messenger',
        channelId: 'page-456',
        accessToken: 'fb-token',
      }

      const client = getChannelClient(messengerConfig)
      const result = await client.sendMedia({
        recipientId: 'FB_USER_ID',
        kind: 'image',
        link: 'https://example.com/image.jpg',
      })

      expect(result.messageId).toBe('media-123')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-456/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer fb-token',
          },
          body: JSON.stringify({
            recipient: {
              id: 'FB_USER_ID',
            },
            message: {
              attachment: {
                type: 'image',
                payload: {
                  url: 'https://example.com/image.jpg',
                  is_reusable: true,
                },
              },
            },
            messaging_type: 'RESPONSE',
          }),
        }),
      )
    })

    it('sends video with correct body shape', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messaging_id: 'video-456' }),
      })

      const messengerConfig: ChannelConfig = {
        ...BASE_CONFIG,
        channel: 'messenger',
        channelId: 'page-456',
        accessToken: 'fb-token',
      }

      const client = getChannelClient(messengerConfig)
      await client.sendMedia({
        recipientId: 'FB_USER_ID',
        kind: 'video',
        link: 'https://example.com/video.mp4',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/page-456/messages',
        expect.objectContaining({
          body: JSON.stringify({
            recipient: {
              id: 'FB_USER_ID',
            },
            message: {
              attachment: {
                type: 'video',
                payload: {
                  url: 'https://example.com/video.mp4',
                  is_reusable: true,
                },
              },
            },
            messaging_type: 'RESPONSE',
          }),
        }),
      )
    })
  })

  describe('sendTemplate', () => {
    it('throws clear error that Messenger does not support templates', async () => {
      const messengerConfig: ChannelConfig = {
        ...BASE_CONFIG,
        channel: 'messenger',
        channelId: 'page-456',
        accessToken: 'fb-token',
      }

      const client = getChannelClient(messengerConfig)

      await expect(
        client.sendTemplate({
          recipientId: 'FB_USER_ID',
          templateName: 'hello_world',
          language: 'en_US',
        }),
      ).rejects.toThrow('Messenger does not support structured templates in v1')
    })
  })

  describe('sendReaction', () => {
    it('throws clear error that Messenger does not support reactions', async () => {
      const messengerConfig: ChannelConfig = {
        ...BASE_CONFIG,
        channel: 'messenger',
        channelId: 'page-456',
        accessToken: 'fb-token',
      }

      const client = getChannelClient(messengerConfig)

      await expect(
        client.sendReaction({
          recipientId: 'FB_USER_ID',
          messageId: 'ORIGINAL_MSG_ID',
          emoji: '👍',
        }),
      ).rejects.toThrow('Messenger does not support message reactions in v1')
    })
  })
})

describe('WhatsAppChannelClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('still works with WhatsApp (not using Instagram Graph API)', async () => {
    // This is a sanity check that WhatsApp still uses the original meta-api
    const waConfig: ChannelConfig = {
      ...BASE_CONFIG,
      channel: 'whatsapp',
      channelId: 'phone-123',
    }

    // We can't fully test WhatsApp without mocking the full meta-api chain,
    // but we verify it creates a different client type
    const client = getChannelClient(waConfig)
    expect(client.channel).toBe('whatsapp')
  })
})
