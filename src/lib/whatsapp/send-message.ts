import type { SupabaseClient } from '@supabase/supabase-js';

import { decrypt, encrypt, isLegacyFormat } from '@/lib/whatsapp/encryption';
import { supabaseAdmin } from '@/lib/flows/admin-client';
import {
  isValidE164,
  phoneVariants,
  isRecipientNotAllowedError,
  sanitizePhoneForMeta,
} from '@/lib/whatsapp/phone-utils';
import { getChannelClient, type ChannelConfig as ChannelClientConfig } from '@/lib/channels';
import type { MessageTemplate } from '@/types';
import { isMessageTemplate } from '@/lib/whatsapp/template-row-guard';

function resolveRecipientIdForChannel(
  channel: string,
  contact: { phone: string | null; external_id: string | null; recipient_id: string | null }
): string {
  if (channel === 'whatsapp') {
    if (!contact.phone?.trim()) {
      throw new Error('WhatsApp contact must have a phone number');
    }
    return sanitizePhoneForMeta(contact.phone);
  }

  const externalId = contact.external_id?.trim();
  const recipientId = contact.recipient_id?.trim();

  if (externalId) return externalId;
  if (recipientId) return recipientId;

  throw new Error('Instagram/Messenger contact must have external_id or recipient_id');
}

export const MEDIA_KINDS = ['image', 'video', 'document', 'audio'] as const;
export const VALID_MESSAGE_TYPES = ['text', 'template', ...MEDIA_KINDS] as const;

export class SendMessageError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'SendMessageError';
    this.code = code;
    this.status = status;
  }
}

export interface SendMessageParams {
  conversationId: string;
  messageType: string;
  contentText?: string | null;
  mediaUrl?: string | null;
  filename?: string | null;
  templateName?: string | null;
  templateLanguage?: string | null;
  templateParams?: string[];
  templateMessageParams?: unknown;
  replyToMessageId?: string | null;
}

export interface SendMessageResult {
  messageId: string;
  whatsappMessageId: string;
}

export function validateSendMessageParams(params: {
  messageType: string;
  contentText?: string | null;
  mediaUrl?: string | null;
  templateName?: string | null;
}): void {
  const { messageType, contentText, mediaUrl, templateName } = params;

  if (!messageType) {
    throw new SendMessageError('bad_request', 'message_type is required', 400);
  }

  const isMediaKind = (MEDIA_KINDS as readonly string[]).includes(messageType);

  if (!(VALID_MESSAGE_TYPES as readonly string[]).includes(messageType)) {
    throw new SendMessageError(
      'bad_request',
      `Unsupported message_type "${messageType}"`,
      400
    );
  }

  if (messageType === 'text' && !contentText) {
    throw new SendMessageError(
      'bad_request',
      'content_text is required for text messages',
      400
    );
  }

  if (messageType === 'template' && !templateName) {
    throw new SendMessageError(
      'bad_request',
      'template_name is required for template messages',
      400
    );
  }

  if (isMediaKind && !mediaUrl) {
    throw new SendMessageError(
      'bad_request',
      `media_url is required for ${messageType} messages`,
      400
    );
  }

  if (
    isMediaKind &&
    messageType !== 'audio' &&
    typeof contentText === 'string' &&
    contentText.length > 1024
  ) {
    throw new SendMessageError(
      'bad_request',
      'Caption exceeds the 1024-character limit',
      400
    );
  }
}

export async function sendMessageToConversation(
  db: SupabaseClient,
  accountId: string,
  params: SendMessageParams
): Promise<SendMessageResult> {
  const {
    conversationId,
    messageType,
    contentText,
    mediaUrl,
    filename,
    templateName,
    templateLanguage,
    templateParams,
    templateMessageParams,
    replyToMessageId,
  } = params;

  if (!conversationId) {
    throw new SendMessageError('bad_request', 'conversation_id is required', 400);
  }

  validateSendMessageParams({ messageType, contentText, mediaUrl, templateName });
  const isMediaKind = (MEDIA_KINDS as readonly string[]).includes(messageType);

  const { data: conversation, error: convError } = await db
    .from('conversations')
    .select('*, contact:contacts(*)')
    .eq('id', conversationId)
    .eq('account_id', accountId)
    .single();

  if (convError || !conversation) {
    throw new SendMessageError('not_found', 'Conversation not found', 404);
  }

  const contact = conversation.contact;
  const channel = conversation.channel || 'whatsapp';

  if (channel === 'whatsapp' && contact.phone?.trim()) {
    const sanitizedPhone = sanitizePhoneForMeta(contact.phone);
    if (!isValidE164(sanitizedPhone)) {
      throw new SendMessageError('bad_request', 'Invalid phone number format', 400);
    }
  }

  const recipientId = resolveRecipientIdForChannel(channel, {
    phone: contact.phone ?? null,
    external_id: contact.external_id ?? null,
    recipient_id: contact.recipient_id ?? null,
  });

  // Multi-connection rule: an existing conversation belongs to one exact
  // channel_configs row. Legacy/unbound conversations fall back to the
  // account's primary connection, then are self-healed below.
  let configQuery = db
    .from('channel_configs')
    .select('*')
    .eq('account_id', accountId)
    .eq('channel', channel);

  if (conversation.channel_config_id) {
    configQuery = configQuery.eq('id', conversation.channel_config_id);
  } else {
    configQuery = configQuery.eq('is_primary', true);
  }

  const { data: config, error: configError } = await configQuery.maybeSingle();

  if (configError || !config) {
    throw new SendMessageError(
      'channel_not_configured',
      `${channel.charAt(0).toUpperCase() + channel.slice(1)} not configured. Please set up your ${channel} integration first.`,
      400
    );
  }

  if (!conversation.channel_config_id) {
    const { error: bindError } = await db
      .from('conversations')
      .update({ channel_config_id: config.id })
      .eq('id', conversationId)
      .eq('account_id', accountId);

    if (bindError) {
      console.warn('[send-message] failed to bind legacy conversation to channel config:', bindError.message);
    }
  }

  const rawToken = config.access_token;
  let accessToken: string;
  try {
    accessToken = decrypt(rawToken);
  } catch {
    accessToken = rawToken;
  }

  if (isLegacyFormat(config.access_token)) {
    void db
      .from('channel_configs')
      .update({ access_token: encrypt(accessToken) })
      .eq('id', config.id)
      .then(({ error }: { error: { message: string } | null }) => {
        if (error) {
          console.warn('[send-message] access_token GCM upgrade failed:', error.message);
        }
      });
  }

  let contextMessageId: string | undefined;
  if (replyToMessageId) {
    const { data: parent, error: parentError } = await db
      .from('messages')
      .select('message_id, conversation_id')
      .eq('id', replyToMessageId)
      .eq('conversation_id', conversationId)
      .maybeSingle();

    if (parentError || !parent) {
      throw new SendMessageError(
        'bad_request',
        'reply_to_message_id not found in this conversation',
        400
      );
    }

    if (!parent.message_id) {
      console.warn('[send-message] reply target has no Meta message_id; sending without context');
    } else {
      contextMessageId = parent.message_id;
    }
  }

  let templateRow: MessageTemplate | null = null;
  if (messageType === 'template' && templateName) {
    const { data } = await db
      .from('message_templates')
      .select('*')
      .eq('account_id', accountId)
      .eq('name', templateName)
      .eq('language', templateLanguage || 'en_US')
      .maybeSingle();

    if (data && !isMessageTemplate(data)) {
      throw new SendMessageError(
        'template_malformed',
        'Template row is malformed locally — run "Sync from Meta" in Settings to repair it.',
        500
      );
    }
    templateRow = data ?? null;
  }

  const channelClientConfig: ChannelClientConfig = {
    accountId: config.account_id,
    userId: config.user_id,
    channel: channel as 'whatsapp' | 'instagram' | 'messenger',
    channelId: config.channel_id,
    accessToken,
  };
  const channelClient = getChannelClient(channelClientConfig);

  const attempt = async (id: string): Promise<string> => {
    if (messageType === 'template') {
      const result = await channelClient.sendTemplate({
        recipientId: id,
        templateName: templateName!,
        language: templateLanguage || 'en_US',
        template: templateRow ?? undefined,
        messageParams: templateMessageParams ?? undefined,
        params: templateParams || [],
        contextMessageId,
      });
      return result.messageId;
    }

    if (isMediaKind) {
      const result = await channelClient.sendMedia({
        recipientId: id,
        kind: messageType as 'image' | 'video' | 'document' | 'audio',
        link: mediaUrl!,
        caption: contentText || undefined,
        filename: filename || undefined,
        contextMessageId,
      });
      return result.messageId;
    }

    const result = await channelClient.sendText({
      recipientId: id,
      text: contentText!,
      contextMessageId,
    });
    return result.messageId;
  };

  let waMessageId = '';
  let workingRecipientId = recipientId;

  if (channel === 'whatsapp') {
    try {
      const variants = phoneVariants(recipientId);
      let lastError: unknown = null;

      for (const variant of variants) {
        try {
          waMessageId = await attempt(variant);
          workingRecipientId = variant;
          lastError = null;
          break;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!isRecipientNotAllowedError(message)) throw err;
          lastError = err;
          console.warn(`[send-message] variant "${variant}" rejected by Meta, trying next…`);
        }
      }

      if (lastError) throw lastError;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Meta API error';
      console.error('[send-message] Meta send failed for all variants:', message);
      throw new SendMessageError('meta_error', `Meta API error: ${message}`, 502);
    }

    if (workingRecipientId !== recipientId) {
      console.log(`[send-message] Auto-corrected contact phone: ${recipientId} → ${workingRecipientId}`);
      await db.from('contacts').update({ phone: workingRecipientId }).eq('id', contact.id);
    }
  } else {
    try {
      waMessageId = await attempt(recipientId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown Meta API error';
      console.error('[send-message] Meta send failed:', message);
      throw new SendMessageError('meta_error', `Meta API error: ${message}`, 502);
    }
  }

  const { data: messageRecord, error: msgError } = await db
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_type: 'agent',
      content_type: messageType,
      content_text: contentText || null,
      media_url: mediaUrl || null,
      template_name: templateName || null,
      message_id: waMessageId,
      status: 'sent',
      reply_to_message_id: replyToMessageId || null,
      channel,
      channel_config_id: config.id,
    })
    .select()
    .single();

  if (msgError) {
    console.error('[send-message] error inserting sent message:', msgError);
    throw new SendMessageError(
      'db_error',
      `Message sent to Meta but failed to save to DB: ${msgError.message}`,
      500
    );
  }

  await db
    .from('conversations')
    .update({
      last_message_text: contentText || `[${messageType}]`,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);

  try {
    const { error: pauseErr } = await supabaseAdmin()
      .from('flow_runs')
      .update({
        status: 'paused_by_agent',
        ended_at: new Date().toISOString(),
        end_reason: 'agent_replied',
      })
      .eq('account_id', accountId)
      .eq('contact_id', contact.id)
      .eq('status', 'active');

    if (pauseErr) {
      console.error('[flows] pause-on-agent-send failed:', pauseErr.message);
    }
  } catch (err) {
    console.error(
      '[flows] pause-on-agent-send threw:',
      err instanceof Error ? err.message : err
    );
  }

  return { messageId: messageRecord.id, whatsappMessageId: waMessageId };
}
