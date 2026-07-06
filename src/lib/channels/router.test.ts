import { describe, it, expect } from 'vitest'
import {
  detectChannel,
  getChannelIdFromWebhook,
  detectChannelAndId,
  type WebhookPayload,
} from './router'

function waPayload(overrides?: Partial<WebhookPayload>): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: { phone_number_id: 'wa-phone-id' },
              contacts: [{ profile: { name: 'A' }, wa_id: '1' }],
              messages: [],
            },
          },
        ],
      },
    ],
    ...overrides,
  }
}

function igPayload(overrides?: Partial<WebhookPayload>): WebhookPayload {
  return {
    object: 'instagram',
    entry: [
      {
        id: 'ig-page-1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'instagram',
              metadata: {
                page_id: 'ig-page-id',
                ig_business_account_id: 'ig-acct-id',
              },
              contacts: [{ profile: { name: 'B' }, wa_id: '2' }],
              messages: [],
            },
          },
        ],
      },
    ],
    ...overrides,
  }
}

function messengerPayload(overrides?: Partial<WebhookPayload>): WebhookPayload {
  return {
    object: 'page',
    entry: [
      {
        id: 'fb-page-1',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: '',
              metadata: { page_id: 'fb-page-id' },
              contacts: [{ profile: { name: 'C' }, wa_id: '3' }],
              messages: [],
            },
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('detectChannel', () => {
  it('detects whatsapp from messaging_product', () => {
    expect(detectChannel(waPayload())).toBe('whatsapp')
  })

  it('detects instagram from messaging_product', () => {
    expect(detectChannel(igPayload())).toBe('instagram')
  })

  it('detects instagram from ig_business_account_id when messaging_product absent', () => {
    const payload = igPayload()
    payload.entry![0].changes[0].value.messaging_product = ''
    expect(detectChannel(payload)).toBe('instagram')
  })

  it('detects messenger from object === "page"', () => {
    expect(detectChannel(messengerPayload())).toBe('messenger')
  })

  it('defaults to whatsapp when nothing matches', () => {
    const payload = waPayload()
    payload.entry![0].changes[0].value.messaging_product = ''
    delete payload.entry![0].changes[0].value.metadata
    ;(payload as { object?: string }).object = 'unknown'
    expect(detectChannel(payload)).toBe('whatsapp')
  })

  it('defaults to whatsapp when value is missing', () => {
    const payload = { object: 'page', entry: [] }
    expect(detectChannel(payload)).toBe('whatsapp')
  })
})

describe('getChannelIdFromWebhook', () => {
  it('returns phone_number_id for whatsapp', () => {
    const value = waPayload().entry![0].changes[0].value
    expect(getChannelIdFromWebhook(value, 'whatsapp')).toBe('wa-phone-id')
  })

  it('returns ig_business_account_id for instagram (preferred over page_id)', () => {
    const value = igPayload().entry![0].changes[0].value
    expect(getChannelIdFromWebhook(value, 'instagram')).toBe('ig-acct-id')
  })

  it('falls back to page_id for instagram when ig_business_account_id missing', () => {
    const value = igPayload().entry![0].changes[0].value
    delete value.metadata!.ig_business_account_id
    expect(getChannelIdFromWebhook(value, 'instagram')).toBe('ig-page-id')
  })

  it('returns page_id for messenger', () => {
    const value = messengerPayload().entry![0].changes[0].value
    expect(getChannelIdFromWebhook(value, 'messenger')).toBe('fb-page-id')
  })

  it('returns null for unknown channel', () => {
    const value = waPayload().entry![0].changes[0].value
    // Cast to a ChannelType that has no metadata match — no phone_number_id in page-only payload
    const noMetaValue = { ...value, metadata: { page_id: 'fb-page-id' } }
    expect(getChannelIdFromWebhook(noMetaValue, 'whatsapp')).toBeNull()
  })

  it('returns null when metadata is missing', () => {
    const value = waPayload().entry![0].changes[0].value
    delete value.metadata
    expect(getChannelIdFromWebhook(value, 'whatsapp')).toBeNull()
  })
})

describe('detectChannelAndId', () => {
  it('returns channel + id for whatsapp', () => {
    const { channel, channelId } = detectChannelAndId(waPayload())
    expect(channel).toBe('whatsapp')
    expect(channelId).toBe('wa-phone-id')
  })

  it('returns channel + id for instagram', () => {
    const { channel, channelId } = detectChannelAndId(igPayload())
    expect(channel).toBe('instagram')
    expect(channelId).toBe('ig-acct-id')
  })

  it('returns channel + id for messenger', () => {
    const { channel, channelId } = detectChannelAndId(messengerPayload())
    expect(channel).toBe('messenger')
    expect(channelId).toBe('fb-page-id')
  })
})
