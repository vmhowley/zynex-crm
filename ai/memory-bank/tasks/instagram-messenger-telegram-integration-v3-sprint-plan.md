# Zynex CRM — Instagram + Facebook Messenger + Telegram Integration

## Sprint Plan: Completing Phases 1 & 3

**Date**: July 13, 2026
**Focus**: Complete Phase 1 (send path foundation) and advance Phase 3 (Settings UI)

---

## Current State Summary

### Phase 1 — Channel Clients (send path) ✅ ALMOST DONE

| Task | Status | Notes |
|------|--------|-------|
| T1.1 (messagingProduct param) | ✅ DONE | Already in meta-api.ts |
| T1.2 (external_id on contacts) | ✅ DONE | Migration + API done |
| T1.3 (InstagramChannelClient) | ✅ DONE | Full implementation |
| T1.4 (MessengerChannelClient) | ✅ DONE | Full implementation |
| T1.5 (send-message.ts channel-agnostic) | ✅ DONE | Uses getChannelClient |
| T1.6 (API route rename) | ✅ DONE | /api/messages/* exists |
| T1.7 (Phase 1 verification) | ⚠️ PENDING | Unit tests needed |

### Phase 3 — Settings Panels (IN PROGRESS)

| Task | Status | Notes |
|------|--------|-------|
| T3.1 (Canales section in rail) | ✅ DONE | In settings-sections.ts |
| T3.2 (ChannelsPanel) | ✅ DONE | channels-panel.tsx exists |
| T3.3 (GET /api/channels) | ✅ DONE | route.ts exists |
| T3.4 (Instagram OAuth) | ❌ PENDING | Needs implementation |
| T3.5 (Messenger OAuth) | ❌ PENDING | Needs implementation |
| T3.6 (Telegram Bot Token) | ❌ PENDING | Needs implementation |
| T3.7 (Telegram Webhook) | ❌ PENDING | Needs implementation |
| T3.8 (DELETE /api/channels/:id) | ⚠️ PARTIAL | Route exists, needs disconnect logic |
| T3.9 (Webhook verify) | ⚠️ NEEDS CHECK | May need verification |
| T3.10 (WhatsApp transfer) | ❌ PENDING | Needs implementation |
| T3.11 (Phase 3 verification) | ❌ PENDING | Full integration testing |

---

## Next Sprint Tasks (Week 1-2)

### Priority 1: Complete Phase 1 Verification (T1.7)

#### Task 1.7.1: Unit Tests for Channel Clients
**Files**: `src/lib/channels/client.test.ts`
**Actions**:
- Add tests for InstagramChannelClient.sendText body shape
- Add tests for InstagramChannelClient.sendMedia body shape
- Add tests for InstagramChannelClient.sendReaction body shape
- Add tests for MessengerChannelClient.sendText body shape
- Add tests for MessengerChannelClient.sendMedia body shape
- Verify Messenger throws on sendTemplate and sendReaction
**Estimate**: 3-4 hours

#### Task 1.7.2: Integration Test for IG Path
**Files**: Extend `src/lib/whatsapp/send-message.test.ts` (or create new)
**Actions**:
- Create mock contact with `phone=null, external_id='IGSID'`
- Call sendMessageToConversation with channel='instagram'
- Verify uses InstagramChannelClient
- Verify persists channel: 'instagram'
**Estimate**: 2-3 hours

---

### Priority 2: Implement OAuth Flows (T3.4, T3.5)

#### Task 3.4: Instagram OAuth
**Files to create**:
- `src/app/api/oauth/instagram/start/route.ts` — initiates OAuth
- `src/app/api/oauth/instagram/callback/route.ts` — handles callback

**Flow** (implement Option A: "Connect Via Instagram" first):
1. `GET /api/oauth/instagram/start` → redirects to `https://api.instagram.com/oauth/authorize?client_id=...&redirect_uri=...&scope=instagram_basic,instagram_manage_messages&response_type=code`
2. Callback exchanges code → access token → IG Business Account ID
3. Persist: `channel='instagram'`, `channel_id=page_id`, `ig_business_account_id`, encrypted access_token

**Acceptance**: User clicks "Conectar Instagram" in ChannelsPanel → OAuth → connected
**Estimate**: 6-8 hours

#### Task 3.5: Facebook Messenger OAuth
**Files to create**:
- `src/app/api/oauth/facebook/start/route.ts`
- `src/app/api/oauth/facebook/callback/route.ts`

**Flow**:
1. `GET /api/oauth/facebook/start` → redirects to `https://www.facebook.com/v21.0/dialog/oauth?...`
2. Callback: exchange code → long-lived page token → GET /me/accounts → list pages
3. If multiple pages: return picker UI (T3.2 should handle this)
4. Persist: `channel='messenger'`, `channel_id=page_id`, encrypted access_token

**Note**: Enforce 1:1 page:channel constraint
**Estimate**: 5-6 hours

---

### Priority 3: Telegram Integration (T3.6, T3.7)

#### Task 3.6: Telegram Bot Token Connection
**Files to create**: `src/app/api/telegram/connect/route.ts`
**Flow**:
1. User enters bot token in ChannelsPanel dialog
2. Validate: `GET https://api.telegram.org/bot{token}/getMe`
3. Set webhook: `POST https://api.telegram.org/bot{token}/setWebhook?url={OUR_WEBHOOK_URL}`
4. Persist: `channel='telegram'`, `channel_id=bot_username`, encrypted token

**Acceptance**: Token validated → bot connected → appears as "Conectado"
**Estimate**: 3-4 hours

#### Task 3.7: Telegram Webhook
**Files to create**:
- `src/app/api/telegram/webhook/route.ts`
- `src/lib/telegram/index.ts` (helpers)

**Handler**:
- GET: verify hub.challenge (like WhatsApp)
- POST: parse update payload → findOrCreate contact by `from.id` → findOrCreate conversation → persist message

**Payload shape**:
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": { "id": 123456789, "first_name": "Juan" },
    "chat": { "id": 123456789, "type": "private" },
    "text": "Hola"
  }
}
```

**Estimate**: 4-5 hours

---

### Priority 4: Channel Disconnect (T3.8)

#### Task 3.8: DELETE /api/channels/:id
**Files**: `src/app/api/channels/[id]/route.ts` (update existing)
**Actions**:
- Add DELETE handler
- For Telegram: call `POST https://api.telegram.org/bot{token}/deleteWebhook`
- Set `status='disconnected'` (soft delete)
- Verify belongs to user's account

**Estimate**: 2 hours

---

### Priority 5: WhatsApp Transfer (T3.10)

#### Task 3.10: WhatsApp Transfer Dialog
**Files to create**:
- `src/components/settings/whatsapp-transfer-dialog.tsx`

**Flow**:
1. User clicks "Transferir número" in ChannelsPanel
2. Dialog with two options:
   - "Desde WhatsApp Business App" — phone + PIN verification
   - "Desde otro BSP" — WABA ID + phone number ID + access token (manual)
3. After verify: persist to `channel_configs` with `channel='whatsapp'`

**Note**: Link "Usar método actual" to `?tab=whatsapp` (existing, unchanged)
**Estimate**: 6-8 hours

---

## Dependencies & Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Meta App Review for IG (instagram_manage_messages) | IG can't send in production | File early; dev mode works without |
| OAuth redirect URIs must be configured | Can't test OAuth | Get Meta developer app ready |
| Telegram webhook URL needs public URL | Can't test Telegram locally | Use ngrok or production |

---

## Technical Notes

### Key Files Already in Place
- `src/lib/channels/client.ts` — Instagram/Messenger clients implemented
- `src/lib/whatsapp/send-message.ts` — channel-agnostic
- `src/app/api/messages/send/route.ts` — unified send endpoint
- `src/components/settings/channels-panel.tsx` — UI exists
- `src/components/settings/settings-sections.ts` — 'channels' added

### Brand Requirements (per AGENTS.md)
- Default locale: `es-DO` (Spanish first)
- Default theme: `zynex` indigo `oklch(0.52 0.24 258)`
- Product: "Zynex CRM by Zynex SRL"
- Never touch DigitBill fiscal core files

---

## Timeline Estimate

| Week | Focus | Deliverables |
|------|-------|--------------|
| Week 1 | T1.7 + T3.4 | Unit tests + Instagram OAuth |
| Week 2 | T3.5 + T3.6 | Messenger OAuth + Telegram connect |
| Week 3 | T3.7 + T3.8 | Telegram webhook + disconnect |
| Week 4 | T3.10 | WhatsApp transfer dialog |
| Week 5 | T3.9 + T3.11 | Webhook verify + full integration |

---

## Next Action Items

1. **Today**: Run existing tests to verify Phase 1 doesn't break
2. **This week**: Complete T1.7 (verification)
3. **Next**: Start T3.4 (Instagram OAuth)
