from pathlib import Path

path = Path('src/app/api/whatsapp/webhook/route.ts')
text = path.read_text()


def replace_once(old: str, new: str, label: str):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 match, found {count}')
    text = text.replace(old, new, 1)


replace_once(
"""      // Handle status updates
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status)
        }
      }

      // Handle incoming messages
      if (!value.messages || !value.contacts) continue
""",
"""      // Resolve the exact connection for status/message events before
      // touching persisted rows. This keeps identical Meta message IDs on
      // different connected numbers isolated from each other.
      const resolvedForEvent =
        value.statuses || value.messages
          ? await resolveChannelConfigFromWebhook(
              supabaseAdmin(),
              value as import('@/lib/channels/router').WebhookValue
            )
          : null

      // Handle status updates, scoped to the connection that emitted them.
      if (value.statuses) {
        for (const status of value.statuses) {
          await handleStatusUpdate(status, resolvedForEvent?.config.id ?? null)
        }
      }

      // Handle incoming messages
      if (!value.messages || !value.contacts) continue
""",
'status resolver')

replace_once(
"""      const resolved = await resolveChannelConfigFromWebhook(
        supabaseAdmin(),
        value as import('@/lib/channels/router').WebhookValue
      )
""",
"""      const resolved =
        resolvedForEvent ??
        (await resolveChannelConfigFromWebhook(
          supabaseAdmin(),
          value as import('@/lib/channels/router').WebhookValue
        ))
""",
'message resolver reuse')

replace_once(
"""          config.user_id,
          accessToken,
          channel
""",
"""          config.user_id,
          accessToken,
          channel,
          config.id
""",
'processMessage call')

replace_once(
"""async function handleStatusUpdate(status: {
  id: string
  status: string
  timestamp: string
  recipient_id: string
}) {
""",
"""async function handleStatusUpdate(
  status: {
    id: string
    status: string
    timestamp: string
    recipient_id: string
  },
  channelConfigId: string | null
) {
""",
'status signature')

replace_once(
"""  const { error: msgErr } = await supabaseAdmin()
    .from('messages')
    .update({ status: status.status })
    .eq('message_id', status.id)

  if (msgErr) {
""",
"""  let statusUpdateQuery = supabaseAdmin()
    .from('messages')
    .update({ status: status.status })
    .eq('message_id', status.id)
  if (channelConfigId) {
    statusUpdateQuery = statusUpdateQuery.eq('channel_config_id', channelConfigId)
  }
  const { error: msgErr } = await statusUpdateQuery

  if (msgErr) {
""",
'status update scope')

replace_once(
"""  const { data: msgRow } = await supabaseAdmin()
    .from('messages')
    .select('conversation_id, conversations(account_id)')
    .eq('message_id', status.id)
    .limit(1)
    .maybeSingle()
""",
"""  let statusMessageQuery = supabaseAdmin()
    .from('messages')
    .select('conversation_id, channel_config_id, conversations(account_id)')
    .eq('message_id', status.id)
  if (channelConfigId) {
    statusMessageQuery = statusMessageQuery.eq('channel_config_id', channelConfigId)
  }
  const { data: msgRow } = await statusMessageQuery.limit(1).maybeSingle()
""",
'status event lookup scope')

replace_once(
"""          status: status.status,
        }
""",
"""          status: status.status,
          channel_config_id: msgRow.channel_config_id ?? channelConfigId,
        }
""",
'status webhook payload')

replace_once(
"""  accessToken: string,
  // Channel type: whatsapp, instagram, or messenger
  channel: string = 'whatsapp'
) {
""",
"""  accessToken: string,
  // Channel type: whatsapp, instagram, or messenger
  channel: string = 'whatsapp',
  // Exact tenant connection that received the event.
  channelConfigId: string
) {
""",
'processMessage signature')

replace_once(
"""    contactRecord.id,
    channel
  )
""",
"""    contactRecord.id,
    channel,
    channelConfigId
  )
""",
'find conversation call')

replace_once(
"""      contact_id: contactRecord.id,
    })
""",
"""      contact_id: contactRecord.id,
      channel_config_id: channelConfigId,
    })
""",
'conversation created webhook')

replace_once(
"""    // Channel type - added in migration 032
    channel: channel,
  })
""",
"""    // Channel type - added in migration 032
    channel: channel,
    // Exact connection - added in migration 043
    channel_config_id: channelConfigId,
  })
""",
'message insert connection')

replace_once(
"""async function findOrCreateConversation(
  accountId: string,
  configOwnerUserId: string,
  contactId: string,
  channel: string = 'whatsapp',
) {
  // Look for existing conversation in this account, scoped by channel
  const { data: existing, error: findError } = await supabaseAdmin()
    .from('conversations')
    .select('*')
    .eq('account_id', accountId)
    .eq('contact_id', contactId)
    .eq('channel', channel)
    .single()

  if (!findError && existing) {
    return { conversation: existing, created: false }
  }

  // Create new conversation. Same tenancy + audit split as
  // findOrCreateContact above.
  const { data: newConv, error: createError } = await supabaseAdmin()
    .from('conversations')
    .insert({
      account_id: accountId,
      user_id: configOwnerUserId,
      contact_id: contactId,
      channel: channel,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating conversation:', createError)
    return null
  }

  return { conversation: newConv, created: true }
}
""",
"""async function findOrCreateConversation(
  accountId: string,
  configOwnerUserId: string,
  contactId: string,
  channel: string = 'whatsapp',
  channelConfigId: string
) {
  // A contact may talk to several numbers/pages owned by the same tenant.
  // The exact connection is therefore part of conversation identity.
  const { data: existing, error: findError } = await supabaseAdmin()
    .from('conversations')
    .select('*')
    .eq('account_id', accountId)
    .eq('contact_id', contactId)
    .eq('channel_config_id', channelConfigId)
    .maybeSingle()

  if (!findError && existing) {
    return { conversation: existing, created: false }
  }

  const { data: newConv, error: createError } = await supabaseAdmin()
    .from('conversations')
    .insert({
      account_id: accountId,
      user_id: configOwnerUserId,
      contact_id: contactId,
      channel: channel,
      channel_config_id: channelConfigId,
    })
    .select()
    .single()

  if (createError) {
    // Concurrent deliveries may race the first insert. Re-resolve the
    // canonical connection-scoped conversation on a unique violation.
    if (isUniqueViolation(createError)) {
      const { data: raced } = await supabaseAdmin()
        .from('conversations')
        .select('*')
        .eq('account_id', accountId)
        .eq('contact_id', contactId)
        .eq('channel_config_id', channelConfigId)
        .maybeSingle()
      if (raced) return { conversation: raced, created: false }
    }
    console.error('Error creating conversation:', createError)
    return null
  }

  return { conversation: newConv, created: true }
}
""",
'findOrCreateConversation')

path.write_text(text)
