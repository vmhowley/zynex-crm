# Zynex CRM — Instagram + Facebook Messenger + Telegram Integration (v3)

**Slug**: `instagram-messenger-telegram-integration-v3`
**Revision**: v3 — ManyChat-style per-channel connection; existing WhatsApp preserved as-is; new WhatsApp "transfer" option as alternate method
**Audience**: Engineering team (2-3 devs, 1 frontend, 1 backend, 1 part-time QA)
**Stack**: Next.js 16.2.6 (read `node_modules/next/dist/docs/` before any framework code), TypeScript, Supabase, Tailwind + zynex theme
**Brand rules (enforce every PR)**: Zynex CRM by Zynex SRL (Nexus Computing Solutions SRL); default locale `es-DO`; new strings Spanish first; default theme `zynex` indigo `oklch(0.52 0.24 258)`. Never touch DigitBill fiscal core (`xmlService.ts`, `dgiiService.ts`, `RDProvider.ts`, `pdf/*`, `fiscal/certification/automationService.ts`).

---

## 0. Reference: How ManyChat connects each channel

| Canal | Método | Flujo |
|-------|--------|-------|
| **Instagram** | OAuth (3 opciones) | 1) "Via Meta" (recomendado): OAuth Meta → selecciona IG Business de lista. 2) "Connect Via Instagram": OAuth Instagram directo. 3) "Via Meta Business Suite": requiere Facebook Page linkeada. |
| **Facebook Messenger** | OAuth Facebook | OAuth Facebook → lista de páginas → selecciona una página → Connect |
| **WhatsApp** | Transferir número existente o comprar nuevo (ManyChat-style) | 1) "Connect your existing number" — desde WA Business App u otro BSP. 2) "Purchase a new number" — comprar a través de Manychat |
| **Telegram** | Bot Token | Usuario va a @BotFather → crea/obtiene bot token → pega en Manychat |

**Descubrimientos clave de la investigación:**
- WhatsApp NO se conecta por OAuth de Facebook Page — es un flujo separado vía WhatsApp Business Platform (BSP)
- Instagram y Messenger SÍ comparten infraestructura Meta pero son flujos OAuth separados
- Telegram es el más simple: solo bot token, sin OAuth, sin App Review
- ManyChat tiene 1 cuenta por página de Facebook (1:1 page:account)

---

## 1. State of the world (verified)

| Asset | Status | Notes |
|---|---|---|
| `supabase/migrations/032_channel_support.sql` | Applied | Enum `channel_type`, table `channel_configs`, `channel` on conversations + messages, `whatsapp_config` is a **view** filtered by `channel='whatsapp'`. |
| `supabase/migrations/034_channel_configs_dedupe.sql` | Applied | `(account_id, channel, channel_id)` unique + `ig_business_account_id`. |
| `src/types/channel.ts` | OK | `ChannelType`, `ChannelConfig`, etc. |
| `src/lib/channels/router.ts` | OK | `detectChannel`, `getChannelIdFromWebhook`, `routeWebhook`. |
| `src/lib/channels/index.ts` | OK | `resolveChannelConfigFromWebhook()`, helpers. |
| `src/lib/channels/client.ts` | **Broken** | `WhatsAppChannelClient` real. `InstagramChannelClient` y `MessengerChannelClient` son stubs. |
| `src/lib/whatsapp/meta-api.ts` | **Hardcoded** | `messaging_product: 'whatsapp'` hardcoded en 7 sitios. |
| `src/lib/whatsapp/send-message.ts` | **Partially migrated** | Lee `channel_configs` pero llama senders solo-WhatsApp. |
| `src/app/api/whatsapp/webhook/route.ts` | **Phase 2 done** | Channel resolver + `findOrCreateContact` channel-aware. |
| **Existing WhatsApp connection** | **PRESERVED** | `src/components/settings/whatsapp-config.tsx` + `src/app/api/whatsapp/**` — NO tocar. Es el método actual y funciona. |
| `src/components/settings/{settings-rail,settings-sections,page}.tsx` | **No Channels section** | `SETTINGS_SECTIONS` es unión cerrada. |

---

## 2. Design decision: backwards-compatible, additive only

**Principio rector**: existing WhatsApp connection stays 100% intact. This epic ADDS new channels and a new alternate WhatsApp connection method. It does NOT modify the existing WhatsApp config flow.

**What this means:**
- Existing `Settings → WhatsApp` tab works exactly as today
- New `Settings → Canales` panel offers alternative WhatsApp connection ("transfer from WhatsApp Business App") plus IG/Messenger/Telegram
- No existing route, component, or migration is modified
- If a feature in this epic conflicts with existing code, we add a new file, never edit the existing one

---

## Phase 1 — Channel Clients (send path)

**Goal**: Real `InstagramChannelClient` and `MessengerChannelClient` for outbound. WhatsApp parity preserved.

### T1.1 — Make `meta-api.ts` accept `messagingProduct` param

**Files**: `src/lib/whatsapp/meta-api.ts` — add `messagingProduct: 'whatsapp' | 'instagram'` to every send-side interface; replace hardcoded `messaging_product: 'whatsapp'`.

| Line | Function | Change |
|---|---|---|
| 134 | `registerPhoneNumber` | hardcoded `'whatsapp'` (WhatsApp-only). Add comment. |
| 238 | `sendTextMessage` | new arg `messagingProduct`, default `'whatsapp'`. |
| 305 | `sendMediaMessage` | same. |
| 421 | `sendTemplateMessage` | same. |
| 692 | `sendReactionMessage` | new arg `messagingProduct`. |
| 804 | `sendInteractiveButtons` | new arg `messagingProduct`. |
| 936 | `sendInteractiveList` | same. |

**Acceptance**: `sendTextMessage({ messagingProduct: 'instagram' })` posts with `messaging_product: 'instagram'`. Default unchanged. All 7 existing tests pass.

**Dependencies**: none.
**Estimate**: S (~3-4h).

### T1.2 — Add `external_id` to contacts

**Files**:
- `supabase/migrations/033_contact_external_id.sql` — add `external_id TEXT` + partial unique index `(account_id, external_id) WHERE external_id IS NOT NULL`.
- `src/lib/contacts/dedupe.ts` — `findExistingContactByExternalId(db, accountId, externalId)`.
- `src/lib/api/v1/contacts.ts` — `findOrCreateContact` channel-aware. **Coordinate with DigitBill** per `AGENTS.md`. Only ADD optional field; response shape unchanged.

**Acceptance**: `POST /api/v1/contacts` with `{ external_id: "IGSID" }` (no phone) returns 201. Phone-only behavior unchanged when `external_id` absent.

**Dependencies**: none.
**Estimate**: M (~6-8h).

### T1.3 — Real `InstagramChannelClient`

**File**: `src/lib/channels/client.ts` (replace stub section).
**Internal**: `igGraphFetch(pageId, body, config)` → POST `https://graph.facebook.com/v21.0/{pageId}/messages`:
- text → `{ recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' }`
- media → `{ recipient: { id }, message: { attachment: { type, payload: { url, is_reusable } } } }`
- reaction → `{ recipient: { id }, type: 'reaction', payload: { message_id, emoji } }`
- `sendTemplate` → throws `Error('Instagram does not support message templates')`.

**Acceptance**: Unit test for text/media/reaction body shapes. No import from `@/lib/whatsapp/meta-api`.

**Dependencies**: T1.1.
**Estimate**: M (~5-6h).

### T1.4 — Real `MessengerChannelClient`

**File**: `src/lib/channels/client.ts` (replace stub section).
**Internal**: same Graph API endpoint:
- text → `{ recipient: { id }, message: { text }, messaging_type: 'RESPONSE' }`
- media → same shape
- reaction → throws `Error('Messenger does not support reactions')`
- `sendTemplate` → throws `Error('Messenger does not support templates')`

**Acceptance**: Unit test for text/media; reaction asserts thrown error. No import from WhatsApp module.

**Dependencies**: T1.1.
**Estimate**: S (~3-4h).

### T1.5 — Make `send-message.ts` channel-agnostic

**File**: `src/lib/whatsapp/send-message.ts`.
- WhatsApp path: unchanged (phone normalization, variant retry).
- IG/FB path: use `contact.external_id` as `recipientId`; skip phone sanitization.
- Dispatch through `getChannelClient(config)` for all channels.

**Acceptance**: Existing tests pass. New test: IG contact (`phone=null, external_id='IGSID'`) uses Instagram client, persists `channel: 'instagram'`.

**Dependencies**: T1.2, T1.3, T1.4.
**Estimate**: M (~6-8h).

### T1.6 — Rename `/api/whatsapp/send` → `/api/messages/send` and `/api/whatsapp/react` → `/api/messages/react`

**Files**: Move route files; keep old paths as deprecation shims with `Deprecation: true` header. Update all call sites.

**Acceptance**: New paths work for all 3 channels. Old paths still work as shims. No test imports old path.

**Dependencies**: T1.5.
**Estimate**: S (~3-4h).

### T1.7 — Phase 1 verification

**Unit**: `src/lib/channels/client.test.ts` (IG/Messenger body shapes). Extend `send-message.test.ts` with IG path.
**Integration**: Send from WA + IG + FB via `/api/messages/send`; verify delivery.

---

## Phase 2 — Webhook inbound ✅ DONE

| Task | Status | Notes |
|---|---|---|
| T2.1 (Schema) | ✅ | Migration 034 applied. |
| T2.2 (Webhook types) | ✅ | `ig_business_account_id` in metadata. |
| T2.3 (Channel resolver) | ✅ | `resolveChannelConfigFromWebhook()` works. |
| T2.4 (findOrCreateContact) | ✅ | IG/FB use `recipient_id`. |
| T2.5 (findOrCreateConversation) | ✅ | Channel-scoped query. |
| T2.6 (Verification) | ✅ | 595/597 tests pass. |

---

## Phase 3 — Settings: per-channel panels

**Goal**: Settings → Canales panel with one button per channel (ManyChat-style). Each channel connects independently using its native method. **Existing WhatsApp tab is NOT modified.**

### T3.1 — Add "Canales" section to settings rail

**Files**:
- `src/components/settings/settings-sections.ts` — add `'channels'` to `SETTINGS_SECTIONS`; labels: Spanish "Canales", English "Channels"; icon `Cable` or `MessagesSquare`.
- `src/app/(dashboard)/settings/page.tsx` — add `channels: <ChannelsPanel />` to `panel` Record.

**Acceptance**: "Canales" appears in settings rail; `?tab=channels` is a valid deep link.

**Dependencies**: none.
**Estimate**: S (~1-2h).

### T3.2 — ChannelsPanel: per-channel cards

**File**: `src/components/settings/channels-panel.tsx` (new).
**Layout** (Spanish-first):

```
Canales
Conecta las plataformas desde las que tus clientes te escriben.

[WhatsApp]       — Card con "Conectar" + status. Click → muestra sub-opciones:
                    a) "Usar método actual" → link a ?tab=whatsapp (EXISTING, no changes)
                    b) "Transferir desde WhatsApp Business App" → nuevo flujo T3.10

[Instagram]      — "Conectar Instagram" → OAuth (T3.4)
[Facebook]       — "Conectar Messenger" → OAuth (T3.5)
[Telegram]       — "Conectar Telegram" → Bot Token (T3.6)
```

Cada canal conectado muestra: nombre/username + status badge + "Desconectar".

**WhatsApp note**: Card muestra "Metodo actual" y "Transferir" como dos opciones. El método actual lleva directo a `?tab=whatsapp` que no se toca.

**Acceptance**: Panel renders connected channels from `channel_configs`. All 4 connect buttons route to correct handlers.

**Dependencies**: T3.1, T3.3.
**Estimate**: M (~4-6h).

### T3.3 — `GET /api/channels` — list connected channels

**File**: `src/app/api/channels/route.ts` (new).
**Handler**: GET-only, RLS via session. Returns `Array<{ id, channel, channel_id, status, connected_at, ig_business_account_id?, phone_number_id?, waba_id? }>`. `access_token` and `verify_token` NEVER returned.

**Dependencies**: none.
**Estimate**: S (~2h).

### T3.4 — Instagram OAuth (`/api/oauth/instagram/start` + callback)

**File**: `src/app/api/oauth/instagram/start/route.ts` (new) + `src/app/api/oauth/instagram/callback/route.ts` (new).

**ManyChat tiene 3 métodos — implementamos los 2 principales:**

#### Option A: "Connect Via Instagram" (más simple)
1. OAuth Instagram direct: `https://api.instagram.com/oauth/authorize?client_id=...&redirect_uri=...&scope=instagram_basic,instagram_manage_messages&response_type=code`
2. Exchange code for access token via `https://api.instagram.com/oauth/access_token`
3. Get IG Business Account ID: `GET /me?fields=id,business_discovery.username_{username}&access_token=...`
4. Persist: `channel='instagram'`, `channel_id=page_id` (o el ID del IG account), `ig_business_account_id`, encrypted access_token.

#### Option B: "Via Meta" (recomendado, full features)
1. Meta OAuth: `https://www.facebook.com/v21.0/dialog/oauth?client_id=...&redirect_uri=...&scope=pages_messaging,instagram_basic,instagram_manage_messages,pages_show_list&response_type=code`
2. Exchange code → long-lived token
3. `GET /me/accounts` → list pages
4. For each page: `GET /{page_id}?fields=instagram_business_account{id,username,name}`
5. Show picker if multiple IG accounts found
6. Persist selected

**Acceptance**: User clicks "Conectar Instagram" → chooses method → completes OAuth → IG account connected. Re-running updates existing row.

**Dependencies**: T3.2.
**Estimate**: M (~6-8h for both options).

### T3.5 — Facebook Messenger OAuth

**File**: `src/app/api/oauth/facebook/start/route.ts` (new) + `src/app/api/oauth/facebook/callback/route.ts` (new).

**Flow** (ManyChat-style):
1. OAuth Facebook: `https://www.facebook.com/v21.0/dialog/oauth?client_id=...&redirect_uri=...&scope=pages_messaging,pages_show_list&response_type=code`
2. Exchange code → long-lived page access token via `/oauth/access_token`
3. `GET /me/accounts` → list of pages user admins
4. If multiple pages: show picker (radio buttons, one selection — **1 page per Manychat account** per ManyChat's rule)
5. Persist: `channel='messenger'`, `channel_id=page_id`, encrypted access_token.

**ManyChat rule**: Each account connects ONE Facebook page. If user wants another page, they need a separate Manychat account. We mirror this: `channel_configs` has unique constraint `(account_id, channel)` — first connect wins; second connect to same channel on same account returns 409 with message "Ya tienes un Messenger conectado. Cada cuenta solo puede tener un Messenger."

**Acceptance**: OAuth → page picker → connect. 1:1 page:channel enforced at DB level.

**Dependencies**: T3.2.
**Estimate**: M (~5-6h).

### T3.6 — Telegram Bot Token

**File**: `src/app/api/telegram/connect/route.ts` (new).

**Flow** (simplest of all — no OAuth):
1. User goes to Settings → Canales → Telegram → "Conectar Telegram"
2. Dialog: "Ingresa el token de tu bot de Telegram" + input field + "Conectar" button
3. User gets token from @BotFather (open `https://t.me/BotFather` in their Telegram app)
4. Validate token: `GET https://api.telegram.org/bot{token}/getMe` — if 200 and response has `result.is_bot: true`, token is valid
5. Set webhook: `POST https://api.telegram.org/bot{token}/setWebhook?url={OUR_WEBHOOK_URL}?chat_id={account_id}` (Telegram needs its own webhook URL — see T3.7)
6. Persist: `channel='telegram'`, `channel_id=bot_username_or_id`, `access_token=bot_token` (encrypted).

**Telegram webhook note**: Telegram uses `GET https://api.telegram.org/bot{token}/setWebhook` to register our endpoint. We need a separate Telegram webhook route: `src/app/api/telegram/webhook/route.ts` (T3.7).

**Acceptance**: User pastes bot token → click "Conectar" → bot connected → appears in ChannelsPanel as "Conectado".

**Dependencies**: T3.2, T3.7.
**Estimate**: S (~3-4h).

### T3.7 — Telegram webhook endpoint

**File**: `src/app/api/telegram/webhook/route.ts` (new) + `src/lib/telegram/index.ts` (new).

**Handler** (GET for webhook verification, POST for updates):
- GET: verify `hub.challenge` like WhatsApp webhook
- POST: parse Telegram update payload; create/find contact by Telegram user ID (`update.message.from.id` or `update.callback_query.from.id`); find or create conversation; persist message.

**Telegram payload shape**:
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": { "id": 123456789, "is_bot": false, "first_name": "Juan" },
    "chat": { "id": 123456789, "type": "private" },
    "text": "Hola"
  }
}
```

**Acceptance**: Telegram bot receives message → lands in inbox with `channel='telegram'`. `?tab=channels` shows Telegram as connected channel.

**Dependencies**: T3.6 (for the webhook URL pattern).
**Estimate**: M (~4-5h).

### T3.8 — `DELETE /api/channels/:id` — disconnect any channel

**File**: `src/app/api/channels/[id]/route.ts` (new).
**Handler**: admin only; sets `status='disconnected'`. For Telegram: also call `POST https://api.telegram.org/bot{token}/deleteWebhook` to clean up.
**Acceptance**: Disconnected channel disappears from panel. Future inbound dropped with log.

**Dependencies**: T3.3.
**Estimate**: S (~2h).

### T3.9 — Webhook verify: accept IG/FB subscriptions on same WA endpoint

**File**: `src/app/api/whatsapp/webhook/route.ts` (GET handler only — no changes to POST).
**Change**: when checking `verify_token`, query `channel_configs` (not `whatsapp_config` view) so IG/FB tokens are found. WA verify still works via the view filter.
**Acceptance**: Meta App subscription for IG or Messenger returns `hub.challenge` successfully.

**Dependencies**: T3.4, T3.5.
**Estimate**: S (~1-2h).

### T3.10 — New WhatsApp connection: "Transfer from WhatsApp Business App" (ManyChat-style alternate)

**File**: `src/components/settings/whatsapp-transfer-dialog.tsx` (new).

ManyChat ofrece dos opciones para WhatsApp:
1. **Existing number** — transfer from WhatsApp Business App or another BSP
2. **Purchase new number** — buy through Manychat (out of scope for v1 — requires billing integration with a telco)

**We implement Option 1 only:**

**Flow**:
1. User clicks "Transferir desde WhatsApp Business App" in ChannelsPanel
2. Dialog explains: "Conecta tu número existente de WhatsApp Business. Necesitas tener el número en la WhatsApp Business App o en otro BSP."
3. **Two sub-options**:
   - **From WhatsApp Business App**: User enters phone number + verifies with PIN (same flow as current WhatsApp config, but in a dialog instead of the existing settings page)
   - **From another BSP**: User provides WABA ID + phone number ID + access token (manual entry, like the existing WhatsApp config but accessible from ChannelsPanel)
4. After verify + save: persist in `channel_configs` with `channel='whatsapp'`, `phone_number_id`, `waba_id`, encrypted `access_token`.

**Note**: The existing `Settings → WhatsApp` tab (T3.11) remains unchanged. This is purely additive — a new way to connect WhatsApp from the Channels panel.

**UI placement**: In ChannelsPanel, WhatsApp card has two buttons:
- "Usar método actual" → `<Link href="/settings?tab=whatsapp">` (existing, unchanged)
- "Transferir número" → opens `WhatsAppTransferDialog`

**Acceptance**: User can connect WhatsApp from the Channels panel via the transfer flow, in addition to the existing Settings → WhatsApp tab. Both methods work simultaneously.

**Dependencies**: T3.2, T1.1 (for the `messagingProduct` param in send path).
**Estimate**: M (~6-8h).

### T3.11 — Phase 3 verification

**Unit**: `src/app/api/channels/route.test.ts`; `src/app/api/oauth/instagram/start.test.ts`; `src/app/api/oauth/facebook/start.test.ts`; `src/app/api/telegram/connect.test.ts` (mock `api.telegram.org`).

**Integration smoke**:
1. Settings → Canales → "Conectar Instagram" → OAuth flow → connected
2. Settings → Canales → "Conectar Messenger" → OAuth flow → connected
3. Settings → Canales → "Conectar Telegram" → paste bot token → connected
4. Settings → Canales → "Transferir WhatsApp" → phone + verify → connected
5. All 4 channels: send inbound message → lands in inbox with correct `channel`
6. All 4 channels: send outbound from composer → delivered on platform
7. Disconnect any channel → disappears from panel; inbound dropped

**Meta review gate**: `instagram_manage_messages` requires App Review (2-4 weeks). Dev mode works without it.

---

## Phase 4 — Broadcasts, templates, reactions

### T4.1 — Broadcasts: channel-scoped (WA templates only; IG/FB/Telegram skip)

Gate `sendTemplateMessage` on `channel === 'whatsapp'`. IG/FB/Telegram recipients get error: `Templates not supported on this channel in v1`.

**Dependencies**: T1.5.
**Estimate**: S (~3-4h).

### T4.2 — Templates: scope by channel, block non-WA submissions

Gate routes on `channel === 'whatsapp'`. Show disabled card in template manager if no WA connected.

**Dependencies**: T1.1.
**Estimate**: S (~2-3h).

### T4.3 — Reactions: support IG; error on Messenger; Telegram has native reactions

- IG: works via `sendReactionMessage({ messagingProduct: 'instagram' })`.
- Messenger: 400 Spanish "Messenger no admite reacciones en esta versión".
- Telegram: Telegram has native emoji reactions (not the same as WhatsApp). Out of scope for v1; document as Phase 5.

**Dependencies**: T1.3, T1.6.
**Estimate**: M (~4-6h).

### T4.4 — Inbox channel indicator (minimal, per-row)

Add small channel icon/dot next to contact name in conversation list (≤24px²). WhatsApp=green, IG=gradient, Messenger=blue, Telegram=blue (#0088cc).

**Dependencies**: T1.5.
**Estimate**: S (~2h).

### T4.5 — Phase 4 verification

Extend broadcast tests; add Messenger 400 case for reactions.

---

## 3. Risks and unknowns

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Meta App Review** for `instagram_manage_messages` (2-4 weeks) | IG can't send in production | File review submission early (T3.0); dev mode works without it. |
| R2 | **Telegram bot token** is sensitive (full bot control) | If leaked, attacker can read all messages | Store encrypted (same `encrypt` helper as Meta tokens). Never log. |
| R3 | **Telegram has no "app" concept** — just bot token | No per-conversation access control like WhatsApp | Telegram bots are "public" by design; accept this limitation for v1. |
| R4 | **WhatsApp transfer flow** (T3.10) overlaps with existing WhatsApp config | User could have two WA channels connected (one per method) | `phone_number_id` is unique per account — second attempt returns 409. |
| R5 | **1:1 page:Messenger** constraint (ManyChat rule) | User can't connect multiple FB pages to one account | Enforce at DB level with unique constraint `(account_id, channel)` for `channel='messenger'`. |
| R6 | **`/api/whatsapp/send` external integrations** (Zapier, Make) | Rename breaks them | T1.6 keeps deprecation shim. |
| R7 | **IG/Messenger rate limits** differ from WA | Could 429 mid-broadcast | Out of scope for v1. |
| R8 | **Telegram webhook** needs its own route separate from WhatsApp | WhatsApp and Telegram have different webhook payloads | `src/app/api/telegram/webhook/route.ts` handles only Telegram updates. |

---

## 4. Scope creep guardrails

1. **Do NOT modify existing WhatsApp config** (`whatsapp-config.tsx`, `?tab=whatsapp`). It stays exactly as-is.
2. **Do NOT redesign the inbox layout** — only T4.4's per-row channel indicator.
3. **Do NOT touch DigitBill fiscal core.**
4. **Do NOT add per-channel rate limits.**
5. **Do NOT touch public `/api/v1/contacts` response shape** — only ADD optional `external_id`.
6. **Do NOT add Telegram native reactions** — out of scope for v1.
7. **Do NOT add "Purchase new WhatsApp number"** (requires telco billing integration — Phase 5).
8. **Do NOT run a server** in any task's verification.
9. **Do NOT add TikTok** — no article was fetched for TikTok; add as separate epic.

---

## 5. Updated schedule

| Week | Phase | Tasks | Note |
|---|---|---|---|
| Week 1 | 1 | T1.1, T1.2 | Non-UI; T1.2 unblocks public API IG/FB contact. |
| Week 2 | 1 | T1.3, T1.4, T1.5, T1.6 | Channel clients + send-message migration. |
| Week 3 | 2 | T2.1-T2.6 | **Already done** — verify + move on. |
| Week 4 | 3 | T3.0 (file Meta App Review, 30 min), T3.1, T3.2, T3.3 | Settings panel + channels API. |
| Week 5 | 3 | T3.4 (Instagram OAuth), T3.5 (Messenger OAuth) | Both OAuth flows. |
| Week 6 | 3 | T3.6 (Telegram), T3.7 (Telegram webhook), T3.8 (disconnect), T3.9 (webhook verify) | Telegram + cleanup. |
| Week 7 | 3 | T3.10 (WhatsApp transfer alternate) | New WA connection method. |
| Week 8 | 4 | T4.1, T4.2, T4.3, T4.4 | Broadcasts/reactions channel-scoped. |
| Week 9 | — | Buffer + Meta App Review wait | Dev mode runs from Week 6. |

**Total: 8-9 weeks of engineering time**, plus 2-4 week Meta App Review wall-clock for IG in production.

---

## 6. Verification plan

| Phase | Tests | Smoke |
|---|---|---|
| **1** | `client.test.ts` (IG/Messenger shapes); extend `send-message.test.ts` (IG path) | Send from WA + IG + FB via `/api/messages/send`; verify delivery |
| **2** | Already verified (595/597 tests) | Already verified |
| **3** | `channels/route.test.ts`; `oauth/instagram/start.test.ts`; `oauth/facebook/start.test.ts`; `telegram/connect.test.ts` | Full OAuth for IG + FB; bot token for Telegram; WhatsApp transfer; inbound on all 4 channels; disconnect |
| **4** | Broadcast skip-non-WA; Messenger 400 for reactions | Mixed broadcast; react on WA + IG |

---

## 7. One-liner success criteria (updated)

A Zynex CRM admin goes to Settings → Canales and sees four channel cards (WhatsApp, Instagram, Facebook Messenger, Telegram). Existing WhatsApp connection via `?tab=whatsapp` works unchanged. A new "Transferir número" button offers the ManyChat-style WhatsApp connection. Instagram connects via OAuth Meta, Messenger via OAuth Facebook, and Telegram via bot token pasted from @BotFather. All four channels receive and send messages correctly with the channel badge shown in the inbox. The DigitBill public API accepts optional `external_id` without response shape change. No DigitBill fiscal file touched. No existing WhatsApp code modified.
