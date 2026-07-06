/**
 * Channel utilities and helpers.
 * Provides functions for channel-specific operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChannelType, ChannelConfig } from '@/types/channel'
import { decrypt } from '../whatsapp/encryption'
import type { WebhookValue } from './router'

/** Convert a raw DB row to a ChannelConfig. */
function rowToConfig(data: Record<string, unknown>): ChannelConfig {
  return {
    id: data.id as string,
    account_id: data.account_id as string,
    user_id: data.user_id as string,
    channel: data.channel as ChannelType,
    channel_id: data.channel_id as string,
    waba_id: data.waba_id as string | undefined,
    ig_business_account_id: data.ig_business_account_id as string | undefined,
    access_token: decrypt(data.access_token as string),
    webhook_verify_token: data.webhook_verify_token as string | undefined,
    status: data.status as 'connected' | 'disconnected',
    connected_at: data.connected_at as string | undefined,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

/**
 * Resolve channel config from an inbound webhook value.
 *
 * Different Meta channels send different identifiers in their
 * webhook metadata. This function tries each strategy in order
 * so the correct channel_configs row is found even when the
 * same Facebook Page hosts both an Instagram business account
 * and a Messenger bot.
 *
 * Resolution order:
 *   1. ig_business_account_id → Instagram (precise match)
 *   2. page_id → Instagram (when ig_business_account_id isn't stored)
 *   3. page_id → Messenger
 *   4. phone_number_id → WhatsApp
 */
export async function resolveChannelConfigFromWebhook(
  db: SupabaseClient,
  value: WebhookValue,
): Promise<{ config: ChannelConfig; channel: ChannelType } | null> {
  // 1. ig_business_account_id present → Instagram
  if (value.metadata?.ig_business_account_id) {
    const { data, error } = await db
      .from('channel_configs')
      .select('*')
      .eq('ig_business_account_id', value.metadata.ig_business_account_id)
      .eq('channel', 'instagram')
      .maybeSingle()

    if (!error && data) {
      return { config: rowToConfig(data), channel: 'instagram' }
    }
    // Fall through to page_id-based resolution — the ig_business_account_id
    // column may not be populated for older configs.
  }

  // 2. page_id present → try Instagram first, then Messenger
  if (value.metadata?.page_id) {
    const { data: igData, error: igError } = await db
      .from('channel_configs')
      .select('*')
      .eq('channel_id', value.metadata.page_id)
      .eq('channel', 'instagram')
      .maybeSingle()

    if (!igError && igData) {
      return { config: rowToConfig(igData), channel: 'instagram' }
    }

    const { data: messengerData, error: messengerError } = await db
      .from('channel_configs')
      .select('*')
      .eq('channel_id', value.metadata.page_id)
      .eq('channel', 'messenger')
      .maybeSingle()

    if (!messengerError && messengerData) {
      return { config: rowToConfig(messengerData), channel: 'messenger' }
    }
  }

  // 3. phone_number_id present → WhatsApp
  if (value.metadata?.phone_number_id) {
    const { data, error } = await db
      .from('channel_configs')
      .select('*')
      .eq('channel_id', value.metadata.phone_number_id)
      .eq('channel', 'whatsapp')
      .maybeSingle()

    if (!error && data) {
      return { config: rowToConfig(data), channel: 'whatsapp' }
    }
  }

  return null
}

/**
 * Get channel configuration by channel ID.
 * This is used by webhooks to find the account configuration.
 */
export async function getChannelConfigByChannelId(
  db: SupabaseClient,
  channelId: string
): Promise<ChannelConfig | null> {
  const { data, error } = await db
    .from('channel_configs')
    .select('*')
    .eq('channel_id', channelId)
    .single()

  if (error || !data) {
    return null
  }

  return rowToConfig(data)
}

/**
 * Get channel configuration by account ID and channel type.
 */
export async function getChannelConfigByAccountAndChannel(
  db: SupabaseClient,
  accountId: string,
  channel: ChannelType
): Promise<ChannelConfig | null> {
  const { data, error } = await db
    .from('channel_configs')
    .select('*')
    .eq('account_id', accountId)
    .eq('channel', channel)
    .single()

  if (error || !data) {
    return null
  }

  return rowToConfig(data)
}

/**
 * Get all channel configurations for an account.
 */
export async function getChannelConfigsByAccount(
  db: SupabaseClient,
  accountId: string
): Promise<ChannelConfig[]> {
  const { data, error } = await db
    .from('channel_configs')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'connected')

  if (error || !data) {
    return []
  }

  return data.map((row) => rowToConfig(row))
}

/**
 * Validate channel identifier format.
 * Different channels have different ID formats.
 */
export function isValidChannelId(channel: ChannelType, channelId: string): boolean {
  if (!channelId) return false

  switch (channel) {
    case 'whatsapp':
      // WhatsApp phone number IDs are numeric strings
      return /^\d+$/.test(channelId)
    case 'instagram':
    case 'messenger':
      // Page IDs are also numeric strings
      return /^\d+$/.test(channelId)
    default:
      return false
  }
}

// Re-export types and utilities
export * from './client'
export * from './router'
export type { ChannelType } from '@/types/channel'
