import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/whatsapp/encryption', () => ({
  decrypt: vi.fn((token: string) => `decrypted-${token}`),
}))

import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveChannelConfigFromWebhook } from './index'
import type { WebhookValue } from './router'

function makeDbMock(row: Record<string, unknown> | null = null) {
  function makeChain(...eqs: string[]) {
    const calls: string[] = []
    const obj: Record<string, unknown> = {}
    obj.select = vi.fn(() => obj)
    obj.eq = vi.fn((col: string, _val: unknown) => {
      calls.push(col)
      return obj
    })
    obj.maybeSingle = vi.fn(() => ({
      then: (resolve: (v: unknown) => unknown) =>
        resolve({ data: row, error: row ? null : new Error('not found') }),
    }))
    return obj as unknown as ReturnType<SupabaseClient['from']>
  }
  return { from: vi.fn(() => makeChain()) } as unknown as SupabaseClient
}

function makeValue(overrides: Partial<WebhookValue> = {}): WebhookValue {
  return {
    messaging_product: '',
    metadata: {},
    contacts: [],
    messages: [],
    ...overrides,
  }
}

const IG_ROW = {
  id: 'cfg-1',
  account_id: 'acct-1',
  user_id: 'user-1',
  channel: 'instagram',
  channel_id: 'page-1',
  access_token: 'tok-ig',
  status: 'connected',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const MSGR_ROW = {
  id: 'cfg-2',
  account_id: 'acct-1',
  user_id: 'user-1',
  channel: 'messenger',
  channel_id: 'page-2',
  access_token: 'tok-msgr',
  status: 'connected',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const WA_ROW = {
  id: 'cfg-3',
  account_id: 'acct-1',
  user_id: 'user-1',
  channel: 'whatsapp',
  channel_id: 'wa-phone-1',
  access_token: 'tok-wa',
  status: 'connected',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

describe('resolveChannelConfigFromWebhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves Instagram via ig_business_account_id', async () => {
    const db = makeDbMock(IG_ROW)
    const value = makeValue({
      metadata: { page_id: 'page-1', ig_business_account_id: 'ig-acct-1' },
    })

    const result = await resolveChannelConfigFromWebhook(db, value)

    expect(result).not.toBeNull()
    expect(result!.channel).toBe('instagram')
    expect(result!.config.channel_id).toBe('page-1')
    expect(result!.config.access_token).toBe('decrypted-tok-ig')
  })

  it('resolves Instagram via page_id when ig_business_account_id is absent and instagram row exists', async () => {
    // No ig_business_account_id in metadata → resolver skips block 1.
    // First maybeSingle call is inside block 2's Instagram query → succeed.
    const chain: Record<string, unknown> = {}
    let idx = 0
    chain.select = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    chain.maybeSingle = vi.fn(() => ({
      then: (resolve: (v: unknown) => unknown) => {
        idx++
        // idx=1: Instagram (page_id + channel=instagram) → found
        return idx <= 1
          ? resolve({ data: IG_ROW, error: null })
          : resolve({ data: null, error: new Error('not found') })
      },
    }))
    const db = { from: vi.fn(() => chain) } as unknown as SupabaseClient
    const value = makeValue({
      metadata: { page_id: 'page-1' },
    })

    const result = await resolveChannelConfigFromWebhook(db, value)

    expect(result).not.toBeNull()
    expect(result!.channel).toBe('instagram')
  })

  it('resolves Messenger via page_id when neither ig nor instagram matches', async () => {
    // No ig_business_account_id in metadata → resolver skips block 1.
    // Block 2: first maybeSingle (Instagram) → null; second (Messenger) → found.
    const chain: Record<string, unknown> = {}
    let idx = 0
    chain.select = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    chain.maybeSingle = vi.fn(() => ({
      then: (resolve: (v: unknown) => unknown) => {
        idx++
        return idx <= 1
          ? resolve({ data: null, error: new Error('not found') })
          : resolve({ data: MSGR_ROW, error: null })
      },
    }))
    const db = { from: vi.fn(() => chain) } as unknown as SupabaseClient
    const value = makeValue({
      metadata: { page_id: 'page-2' },
    })

    const result = await resolveChannelConfigFromWebhook(db, value)

    expect(result).not.toBeNull()
    expect(result!.channel).toBe('messenger')
  })

  it('resolves WhatsApp via phone_number_id', async () => {
    const db = makeDbMock(WA_ROW)
    const value = makeValue({
      messaging_product: 'whatsapp',
      metadata: { phone_number_id: 'wa-phone-1' },
    })

    const result = await resolveChannelConfigFromWebhook(db, value)

    expect(result).not.toBeNull()
    expect(result!.channel).toBe('whatsapp')
    expect(result!.config.channel_id).toBe('wa-phone-1')
  })

  it('returns null when no config matches', async () => {
    const db = makeDbMock(null)
    const value = makeValue({
      metadata: { phone_number_id: 'nonexistent' },
    })

    const result = await resolveChannelConfigFromWebhook(db, value)

    expect(result).toBeNull()
  })
})
