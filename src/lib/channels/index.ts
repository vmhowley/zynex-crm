/**
 * Channel utilities and helpers.
 * Provides functions for channel-specific operations.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChannelType, ChannelConfig } from '@/types/channel'
import { decrypt } from '../whatsapp/encryption'

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

  return {
    id: data.id,
    account_id: data.account_id,
    user_id: data.user_id,
    channel: data.channel as ChannelType,
    channel_id: data.channel_id,
    access_token: decrypt(data.access_token),
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
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

  return {
    id: data.id,
    account_id: data.account_id,
    user_id: data.user_id,
    channel: data.channel as ChannelType,
    channel_id: data.channel_id,
    access_token: decrypt(data.access_token),
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
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

  return data.map((row) => ({
    id: row.id,
    account_id: row.account_id,
    user_id: row.user_id,
    channel: row.channel as ChannelType,
    channel_id: row.channel_id,
    access_token: decrypt(row.access_token),
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))
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
