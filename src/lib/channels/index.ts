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
  const rawToken = data.access_token as string
  let access_token: string
  try {
    access_token = decrypt(rawToken)
  } catch {
    access_token = rawToken
  }
  return {
    id: data.id as string,
    account_id: data.account_id as string,
    user_id: data.user_id as string,
    channel: data.channel as ChannelType,
    display_name: data.display_name as string | undefined,
    is_primary: Boolean(data.is_primary),
    channel_id: data.channel_id as string,
    waba_id: data.waba_id as string | undefined,
    ig_business_account_id: data.ig_business_account_id as string | undefined,
    access_token,
    webhook_verify_token: data.webhook_verify_token as string | undefined,
    status: data.status as 'connected' | 'disconnected',
    connected_at: data.connected_at as string | undefined,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

/**
 * Resolve channel config from an inbound webhook value.
 * External channel identifiers are globally unique, so this remains
 * deterministic even when a tenant owns several connections of a type.
 */
export async function resolveChannelConfigFromWebhook(
  db: SupabaseClient,
  value: WebhookValue,
): Promise<{ config: ChannelConfig; channel: ChannelType } | null> {
  if (value.metadata?.ig_business_account_id) {
    const { data, error } = await db
      .from('channel_configs')
      .select('*')
      .eq('ig_business_account_id', value.metadata.ig_business_account_id)
      .eq('channel', 'instagram')
      .maybeSingle()

    if (!error && data) return { config: rowToConfig(data), channel: 'instagram' }
  }

  if (value.metadata?.page_id) {
    const { data: igData, error: igError } = await db
      .from('channel_configs')
      .select('*')
      .eq('channel_id', value.metadata.page_id)
      .eq('channel', 'instagram')
      .maybeSingle()

    if (!igError && igData) return { config: rowToConfig(igData), channel: 'instagram' }

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

  if (value.metadata?.phone_number_id) {
    const { data, error } = await db
      .from('channel_configs')
      .select('*')
      .eq('channel_id', value.metadata.phone_number_id)
      .eq('channel', 'whatsapp')
      .maybeSingle()

    if (!error && data) return { config: rowToConfig(data), channel: 'whatsapp' }
  }

  return null
}

export async function getChannelConfigByChannelId(
  db: SupabaseClient,
  channelId: string
): Promise<ChannelConfig | null> {
  const { data, error } = await db
    .from('channel_configs')
    .select('*')
    .eq('channel_id', channelId)
    .single()

  if (error || !data) return null
  return rowToConfig(data)
}

/** Legacy helper: return the primary connection for a channel. */
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
    .eq('is_primary', true)
    .maybeSingle()

  if (error || !data) return null
  return rowToConfig(data)
}

export async function getChannelConfigsByAccount(
  db: SupabaseClient,
  accountId: string
): Promise<ChannelConfig[]> {
  const { data, error } = await db
    .from('channel_configs')
    .select('*')
    .eq('account_id', accountId)
    .eq('status', 'connected')
    .order('channel')
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data.map((row) => rowToConfig(row))
}

export function isValidChannelId(channel: ChannelType, channelId: string): boolean {
  if (!channelId) return false
  switch (channel) {
    case 'whatsapp':
    case 'instagram':
    case 'messenger':
      return /^\d+$/.test(channelId)
    default:
      return false
  }
}

export * from './client'
export * from './router'
export type { ChannelType } from '@/types/channel'
