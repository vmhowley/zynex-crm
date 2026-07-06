# Zynex CRM — Instagram + Facebook Messenger Integration

**Slug**: `instagram-messenger-integration`
**Audience**: Engineering team (2-3 devs, 1 frontend, 1 backend, 1 part-time QA)
**Stack**: Next.js 16.2.6 (read `node_modules/next/dist/docs/` before any framework code), TypeScript, Supabase, Tailwind + zynex theme
**Brand rules (enforce every PR)**: Zynex CRM by Zynex SRL (Nexus Computing Solutions SRL); default locale `es-DO`; new strings Spanish first; default theme `zynex` indigo `oklch(0.52 0.24 258)`. Never touch DigitBill fiscal core (`xmlService.ts`, `dgiiService.ts`, `RDProvider.ts`, `pdf/*`, `fiscal/certification/automationService.ts`).

---

## 0. State of the world (verified)

| Asset | Status | Notes |
|---|---|---|
| `supabase/migrations/032_channel_support.sql` | Applied | Enum `channel_type`, table `channel_configs`, `channel` on conversations + messages, `whatsapp_config` is now a **view** filtered by `channel='whatsapp'` (backward compat). Old `whatsapp_config_phone_number_id_key` renamed to `channel_configs_channel_id_key` — still globally unique. |
| `src/types/channel.ts` | OK | `ChannelType`, `ChannelConfig`, `ChannelMessage`, `ChannelConversation`, `ChannelIdentifiers` defined. |
| `src/lib/channels/router.ts` | OK | `detectChannel`, `getChannelIdFromWebhook`, `routeWebhook` defined. |
| `src/lib/channels/index.ts` | OK | `getChannelConfigByChannelId`, `getChannelConfigByAccountAndChannel`, `getChannelConfigsByAccount`, `isValidChannelId` defined. |
| `src/lib/channels/client.ts` | **Broken** | `WhatsAppChannelClient` real. `InstagramChannelClient` and `MessengerChannelClient` are stubs that delegate to WhatsApp-only `sendTextMessage`/`sendMediaMessage` — would 400 against IG/FB. |
| `src/lib/whatsapp/meta-api.ts` | **Hardcoded** | `messaging_product: 'whatsapp'` hardcoded at 6 call sites: lines **134, 238, 305, 421, 692, 804, 936** (count is 7, not 6 — see T1.1). Also: WhatsApp-specific `/register` (line 127-156) and `WABA subscribed_apps` (line 167-179) are irrelevant for IG/FB. |
| `src/lib/whatsapp/send-message.ts` | **Partially migrated** | Lines 222-239 already read `channel_configs` and pick `config.channel_id`, but lines 308-344 call WhatsApp-only `sendTextMessage` / `sendMediaMessage` / `sendTemplateMessage` and pass `phoneNumberId: config.channel_id` (semantically wrong for IG/FB). The `phoneUtils.sanitizePhoneForMeta` path at 213-219 and 352-389 is WhatsApp-only. |
| `src/app/api/whatsapp/webhook/route.ts` | **Partially migrated** | Lines 254-307 already resolve by `channel_id` from `channel_configs`. But the disambiguation block at 273-284 ("Multiple configs found") is dead code given the global unique key. IG-specific `ig_business_account_id` is ignored (only `phone_number_id` / `page_id` are read at 250). The `findOrCreateContact` path (981-1039) writes `phone` only — IG/FB contacts have no phone. |
| `/api/whatsapp/send` and `/api/whatsapp/react` | **WhatsApp only** | Hardcoded `whatsapp_config` table (the view), pass `phoneNumberId: config.phone_number_id`. Both must move to `channel_configs` and become channel-agnostic. |
| `src/lib/api/v1/contacts.ts` (public API) | **Phone-only** | `findOrCreateContact` does phone-E.164 + last-8 fuzzy match. IG/FB contacts have no phone (IG user IDs look like `17841401234567890`). `resolveAuditUserId` reads `whatsapp_config` (the view) and falls back to account owner. Will need both an `external_id` path and a `channel_configs`-aware audit resolver. **Per `AGENTS.md`, this is a DigitBill-touching surface — coordinate any contract change with the DigitBill team first.** |
| `src/components/settings/{settings-rail,settings-sections,page}.tsx` | **No Channels section** | `SETTINGS_SECTIONS` is a closed union. Adding a section touches the union, the labels map (es + en), the rail grouping, and `page.tsx`'s `panel` Record. |
| Inbox / conversation UI | **WhatsApp only** | Phone-shaped everywhere. Multi-channel render is out of scope this iteration (see §6). |

---

## Phase 1 — IG send path (steps 1, 2, 3, 4)

**Goal**: A real `InstagramChannelClient` and `MessengerChannelClient` that can text + media + react over Meta's Graph API, reached through a renamed, channel-agnostic `/api/messages/send` and `/api/messages/react`. WhatsApp parity must not regress.

### T1.1 — Make `meta-api.ts` accept a `messagingProduct` parameter

**Files**
- `src/lib/whatsapp/meta-api.ts` — add `messagingProduct: 'whatsapp' | 'instagram'` (Messenger does NOT send `messaging_product` per Meta's spec) to every send-side `*Args` interface; replace hardcoded `messaging_product: 'whatsapp'` literals.
- `src/lib/whatsapp/meta-api.test.ts` — add coverage for the new param (one test per function asserting the body shape for `'whatsapp'` and `'instagram'`).
- `src/lib/whatsapp/registration.test.ts` — re-record the existing `POSTs to /{phone_number_id}/register` test to verify the new param is threaded (it's WhatsApp-only so default OK).

**Sites to change (exact line numbers from `meta-api.ts`)**
| Line | Function | Change |
|---|---|---|
| 134 | `registerPhoneNumber` | leave hardcoded `'whatsapp'` (this endpoint is WhatsApp-only — `/register` does not exist for IG/FB). Add a code comment. |
| 238 | `sendTextMessage` | new `messagingProduct` arg, default `'whatsapp'` for back-compat. |
| 305 | `sendMediaMessage` | same. |
| 421 | `sendTemplateMessage` | same (template is WhatsApp-only at send time, but the param shape needs to match — the channel client will never call this for IG/FB). |
| 692 | `sendReactionMessage` | new `messagingProduct` arg. IG supports reactions on `message_id`; Messenger does not (yet) — caller decides. |
| 804 | `sendInteractiveButtons` | new `messagingProduct` arg. WhatsApp only at send time; left here for shape consistency. |
| 936 | `sendInteractiveList` | same. |

**Acceptance criteria**
- `sendTextMessage({ ..., messagingProduct: 'instagram' })` issues a POST whose body has `messaging_product: 'instagram'` (asserted by a unit test with a captured fetch).
- `sendTextMessage({ ... })` with no param defaults to `'whatsapp'` (existing test passes unchanged).
- `sendReactionMessage({ ..., messagingProduct: 'instagram', emoji: '❤️' })` produces the IG-valid body shape (no `recipient_type`; no `interactive` wrapper — IG reaction is `{ recipient: { id }, message_id, type: 'reaction', reaction: { emoji } }` — see Meta docs **instagram_messenger_reactions**; verify the exact field names against `node_modules/next/dist/docs/` is not applicable here, but verify against Meta's published graph spec at code-review time).
- All 7 existing meta-api tests still pass; the resendable/media/resumable tests do not touch `messaging_product` directly so they're unaffected.

**Dependencies**: none.
**Estimate**: S (~3-4h).

### T1.2 — Add `external_id` (and channel-keyed dedupe) to contacts

**Files**
- `supabase/migrations/033_contact_external_id.sql` (new) — `ALTER TABLE contacts ADD COLUMN external_id TEXT;` plus a partial unique index `contacts_account_external_id_key (account_id, external_id) WHERE external_id IS NOT NULL`; relax the phone-only unique behavior so the existing `phone_normalized` index in migration 022 still enforces phone uniqueness but does not block IG/FB rows. Re-evaluate RLS — `is_account_member` is the gate, no change needed.
- `src/lib/contacts/dedupe.ts` — new `findExistingContactByExternalId(db, accountId, externalId)`.
- `src/lib/api/v1/contacts.ts` — `findOrCreateContact` becomes channel-aware. New `ContactInput` shape adds optional `externalId`; when present, find-or-create on `(account_id, external_id)`, NOT phone. When absent, keep current phone-based behavior. **This is a contract change for DigitBill** — `POST /api/v1/contacts` is the public surface they consume per `AGENTS.md`. Coordinate wording with DigitBill in the PR description; do NOT change the response shape, only accept an additional optional field.
- `src/lib/contacts/dedupe.test.ts` + `src/lib/api/v1/contacts.test.ts` — coverage.

**Acceptance criteria**
- A new migration applied against a fresh DB; existing WhatsApp contacts untouched (the new column is nullable, the new index is partial).
- `POST /api/v1/contacts` with `{ external_id: "17841401234567890" }` (no `phone`) returns 201, `created: true`, persists the row.
- `POST /api/v1/contacts` with `{ external_id: "1784...", phone: "+1809..." }` finds-or-creates by external_id first; falls back to phone only if the external_id is absent.
- The legacy phone-only find-or-create still behaves identically when `external_id` is absent (DigitBill regression: do not break it).
- The phone-required 400 stays: `findOrCreateContact` throws `ContactError` only when both `phone` and `externalId` are missing.

**Dependencies**: none.
**Estimate**: M (~6-8h incl. migration + DigitBill comms + tests).

### T1.3 — Real `InstagramChannelClient`

**File**: `src/lib/channels/client.ts` (replace lines 87-117).
**Public interface**: same as the stub — `ChannelClient.sendText/sendMedia/sendTemplate/sendReaction` — but `sendTemplate` throws `Error('Instagram does not support message templates in v1')` (intentional, see Phase 4).
**Internal**: implement with a small private `igGraphFetch(pageId, body, config)` helper that POSTs to `https://graph.facebook.com/v21.0/{pageId}/messages` with the IG-valid body shape:
- text → `{ recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' }` (no `messaging_product`; IG does not accept it)
- media → `{ recipient: { id }, message: { attachment: { type, payload: { url, is_reusable } } }, messaging_type: 'RESPONSE' }`
- reaction → `{ recipient: { id }, type: 'reaction', payload: { message_id, emoji } }`

**Acceptance criteria**
- Unit test (`src/lib/channels/client.test.ts` new) with a captured fetch asserts the body shapes above for text/media/reaction.
- Calling `getChannelClient({ channel: 'instagram', channelId: 'PAGE', accessToken: 'TOK' }).sendText({ recipientId: 'IGSID', text: 'hi' })` issues exactly one POST to `https://graph.facebook.com/v21.0/PAGE/messages` with the IG-valid body — no `messaging_product`, no `recipient_type: 'individual'`.
- No import from `@/lib/whatsapp/meta-api` — Instagram must be entirely independent of the WhatsApp module so a future IG-only regression cannot affect WhatsApp parity.

**Dependencies**: T1.1 (uses the IG-valid reaction helper, not the `messagingProduct` variant — IG and WA reactions have different body shapes).
**Estimate**: M (~5-6h).

### T1.4 — Real `MessengerChannelClient`

**File**: `src/lib/channels/client.ts` (replace lines 119-153).
**Internal**: same Graph API endpoint, Messenger-valid body shapes:
- text → `{ recipient: { id }, message: { text }, messaging_type: 'RESPONSE' }`
- media → `{ recipient: { id }, message: { attachment: { type, payload: { url, is_reusable } } }, messaging_type: 'RESPONSE' }`
- reaction → **Messenger does not support reactions** — `sendReaction` throws `Error('Messenger does not support message reactions in v1')`.
- `sendTemplate` throws `Error('Messenger structured templates not yet supported')` until Phase 4.

**Acceptance criteria**
- Unit test asserts the body shape for text and media; reaction test asserts the thrown error.
- No import from `@/lib/whatsapp/meta-api` for Messenger.

**Dependencies**: T1.1.
**Estimate**: S (~3-4h).

### T1.5 — Make `send-message.ts` channel-agnostic

**File**: `src/lib/whatsapp/send-message.ts`.
**Changes**
- Lines 213-220: drop the `sanitizePhoneForMeta` / `isValidE164` validation when `channel !== 'whatsapp'`. Replace with: pull a `recipientId` from `contact.external_id` (IG/FB user-scoped id) when channel is `instagram` or `messenger`.
- Lines 222-239: keep the `channel_configs` read; pull `access_token` decrypted as today.
- Lines 308-344 (`attempt`): dispatch through `getChannelClient(config)` from `src/lib/channels/client.ts`. The `attempt` function is parameterized by `(recipientId, payload)`. The recipientId resolution moves up — for WhatsApp it's `sanitizePhoneForMeta(contact.phone)`; for IG/Messenger it's `contact.external_id`.
- Lines 349-389 (variant retry + auto-correct): scope to WhatsApp only. IG/FB contacts have no phone to retry against.
- Lines 393-410 (persist): already writes `channel: channel` — no change.

**Acceptance criteria**
- `send-message.test.ts` continues to pass (current tests stub the DB at the `from()` call and exercise only pre-DB validation).
- New test: `sendMessageToConversation` with a contact that has `phone = null, external_id = 'IGSID'` and a channel = `instagram` config does NOT call `sanitizePhoneForMeta`, DOES call the Instagram client, and persists `channel: 'instagram'`.
- The WhatsApp happy path is byte-for-byte unchanged: same phone normalization, same variant retry, same `contacts.phone` auto-correct.

**Dependencies**: T1.2, T1.3, T1.4.
**Estimate**: M (~6-8h, plus test matrix).

### T1.6 — Rename `/api/whatsapp/send` → `/api/messages/send` and `/api/whatsapp/react` → `/api/messages/react`

**Files**
- `src/app/api/whatsapp/send/route.ts` → `src/app/api/messages/send/route.ts` (move file).
- `src/app/api/whatsapp/send/route.test.ts` → `src/app/api/messages/send/route.test.ts` (move + update import paths).
- `src/app/api/whatsapp/react/route.ts` → `src/app/api/messages/react/route.ts`.
- `src/app/api/whatsapp/send/route.ts` → keep as a thin deprecation shim: same handler, response adds `Deprecation: true` and a `Sunset` header pointing at the new path. Cloudflare/Vercel cache keys must NOT change. Mirror this for `/api/whatsapp/react`.
- Grep and update every client call site: `src/components/inbox/**`, `src/components/composer/**`, `src/hooks/**`, `src/lib/flows/**` (`dispatchSend` etc.).
- **Do NOT** rename `src/lib/whatsapp/**` library files — they are still reused by IG/FBMessenger if those channels adopt the WhatsApp flow shape. Only the *route handlers* rename.

**Acceptance criteria**
- `POST /api/messages/send` with a WhatsApp conversation → 200, `success: true`, same `message_id` / `whatsapp_message_id` response shape as today.
- `POST /api/messages/send` with an IG conversation → 200, `success: true`, `message_id` returned, no `whatsapp_message_id` field (or set to `null` — confirm at code review).
- `POST /api/whatsapp/send` still works (deprecation shim) but response includes `Deprecation: true` header.
- `pnpm test` (or `npm test`) passes; no test imports the old path.
- `src/app/api/v1/messages/route.ts` continues to use the shared `sendMessageToConversation` core unchanged — the v1 surface is not renamed.

**Dependencies**: T1.5.
**Estimate**: S (~3-4h) — most of the work is grep-and-update.

### T1.7 — Phase 1 verification

**Unit** (new): `src/lib/channels/client.test.ts` (T1.3, T1.4). Extend `src/lib/whatsapp/send-message.test.ts` with the IG happy path (T1.5).
**Integration smoke** (manual, against a real Meta dev app):
1. Connect a WhatsApp test number, send a text, verify delivery.
2. Connect a test Instagram business account, send a text, verify delivery on the IG side.
3. Connect a test Facebook Page, send a text, verify delivery on Messenger.
**Regression gate**: rerun the WhatsApp integration test suite from `src/app/api/whatsapp/send/route.test.ts` (now under the new path) and the public-API `send-message` tests.

---

## Phase 2 — Webhook inbound (step 5)

**Goal**: IG and Messenger webhooks land in the inbox as first-class messages; the right `channel_configs` row is resolved for an inbound `page_id` that may host both an IG business account and a Messenger bot.

> **✅ DONE** (T2.1 — Schema)

**File**: `supabase/migrations/034_channel_configs_dedupe.sql`.

**Change**: drop `channel_configs_channel_id_key` and `channel_configs_account_channel_key`. Add `(account_id, channel, channel_id)` unique constraint. Add `ig_business_account_id TEXT` column + partial unique index `(account_id, ig_business_account_id) WHERE ig_business_account_id IS NOT NULL`. `ChannelConfig` type updated with the field.

**Acceptance criteria**
- ✅ Migration applies idempotently (already applied).
- ✅ Two rows allowed: `(A, instagram, PAGE)`, `(A, messenger, PAGE)`.
- ✅ Cross-account uniqueness still holds.

> **✅ DONE** (T2.2 — Webhook type extension)

**File**: `src/app/api/whatsapp/webhook/route.ts`.

**Change**: `WhatsAppWebhookEntry` (aka `WebhookValue` in `router.ts`) already had `ig_business_account_id` in `metadata` from Step 1. The `object` field at the entry level was already accepted (`WebhookPayload.object`). Type compiled cleanly.

**Acceptance criteria**
- ✅ TypeScript compiles (0 typecheck errors).
- ✅ `ig_business_account_id` flows through metadata to the resolver without casts.

> **✅ DONE** (T2.3 — Channel resolver)

**Files**:
- `src/lib/channels/index.ts` — new `resolveChannelConfigFromWebhook()` at line 42. Three-way resolution: `ig_business_account_id` → Instagram, `page_id` → Instagram then Messenger, `phone_number_id` → WhatsApp. Also new `rowToConfig()` helper (standardizes DB→type conversion across all helpers in that file).
- `src/app/api/whatsapp/webhook/route.ts` — replaced the `detectChannelAndId()` + manual channel_configs query block with a single `resolveChannelConfigFromWebhook()` call.
- `src/types/channel.ts` — `ChannelConfig` type updated: added `ig_business_account_id?: string`, renamed `verify_token` → `webhook_verify_token` to match migration 032.

**Changes from the original design**:
- Resolver lives in `src/lib/channels/index.ts` (shared library) rather than inline in the webhook route — better testability.
- Uses `maybeSingle()` instead of `select('*').eq(...).eq(...)` + manual length check — simpler, and the unique constraint `(account_id, channel, channel_id)` guarantees at most one.

**Acceptance criteria**
- ✅ IG webhook with `{ page_id: 'P', ig_business_account_id: 'I' }` → Instagram row.
- ✅ Messenger webhook with `{ page_id: 'P' }` (no `ig_business_account_id`) → Messenger row when account has both.
- ✅ WhatsApp webhook with `{ phone_number_id: 'N' }` → WhatsApp row.
- ✅ No-matching-config → logged with full metadata and continues.
- ✅ Typecheck 0 errors. Tests 590/592 (2 pre-existing date-utils failures, unchanged).

**Dependencies**: T2.1, T2.2.
**Estimated**: S (~2h actual).

> **✅ DONE** (T2.4 — Channel-aware `findOrCreateContact`)

**File**: `src/app/api/whatsapp/webhook/route.ts` lines 977-1065.

**Change**: added explicit `channel` parameter (default `'whatsapp'`). WhatsApp path requires phone (rejects with logged error if missing). IG/FB path looks up by `recipient_id`. Insert/race paths unchanged per channel — phone set for WhatsApp, `recipient_id` set for IG/FB.

All three acceptance criteria already met by the existing `processMessage` caller (lines 565-577) which sets `senderPhone` for WA and `senderRecipientId` for IG/FB:
- ✅ Repeated IG message → find by `(account_id, recipient_id)` → same contact.
- ✅ First IG message → creates with `recipient_id`, `name`, `phone=null`.
- ✅ WhatsApp path → byte-for-byte unchanged (phone fuzzy match via `findExistingContact`).
- Typecheck 0 errors. Tests 590/592 (2 pre-existing).

> **✅ DONE** (T2.5 — Channel-aware `findOrCreateConversation`)

**File**: `src/app/api/whatsapp/webhook/route.ts` lines 1067-1084.

**Verification**: `findOrCreateConversation` already receives `channel` from `processMessage` and scopes the lookup with `.eq('channel', channel)` at line 1073. No code change needed.
- ✅ Channel column present (migration 032). Query correctly discriminates by channel.
- ✅ Verified at inspection: `eq('account_id', accountId).eq('contact_id', contactId).eq('channel', channel)`.

### T2.6 — Phase 2 verification

> **✅ DONE** (T2.6 — Phase 2 verified)

**Unit** (5 new tests in `src/lib/channels/index.test.ts`):
- `resolveChannelConfigFromWebhook` — Instagram via ig_business_account_id ✓
- Instagram via page_id fallback ✓
- Messenger via page_id ✓
- WhatsApp via phone_number_id ✓
- No matching config returns null ✓

**Full suite**: 597 tests, 595 passed (2 pre-existing date-utils). 0 regressions.

**Phase 2 summary**:
| Task | What was done |
|---|---|
| T2.1 | Migration 034: dropped global unique key, added `(account_id, channel, channel_id)` unique + `ig_business_account_id` column |
| T2.2 | Webhook type extended with `ig_business_account_id` in metadata (was already present from Step 1) |
| T2.3 | `resolveChannelConfigFromWebhook()` in `src/lib/channels/index.ts` — three-way resolver wired into webhook route |
| T2.4 | `findOrCreateContact` — added explicit `channel` param; WhatsApp requires phone, IG/FB uses `recipient_id` |
| T2.5 | `findOrCreateConversation` — verified channel-aware at inspection (already correct) |
| T2.6 | Unit tests + full suite verification |

---

## Phase 3 — Settings UI + Facebook OAuth (steps 6, 7)

**Goal**: An admin can click "Connect Instagram" / "Connect Messenger" in Settings, complete a Meta OAuth handshake, and end up with a connected `channel_configs` row + a working webhook.

### T3.1 — Add a Channels section to the settings rail

**Files**
- `src/components/settings/settings-sections.ts` — add `'channels'` to `SETTINGS_SECTIONS`, add `Channels` to both `labels.es` and `labels.en` (Spanish: "Canales"; English: "Channels"), pick an icon from `lucide-react` (`Cable` or `MessagesSquare`).
- `src/components/settings/settings-rail.tsx` — no change (the rail iterates `SETTINGS_SECTIONS`).
- `src/app/(dashboard)/settings/page.tsx` lines 55-68 — add `channels: <ChannelsPanel />` to the `panel` Record. Import the new component.

**Acceptance criteria**
- New "Canales" entry appears in the Spanish rail, "Channels" in the English rail.
- `?tab=channels` is a valid deep link.
- No visual regression to the rail: the new entry sits in the `workspace` group, after `whatsapp` and `templates`.

**Dependencies**: none.
**Estimate**: S (~1-2h).

### T3.2 — ChannelsPanel: overview + per-channel cards

**File**: `src/components/settings/channels-panel.tsx` (new).
**Layout** (Spanish-first):
- Header: "Canales" / "Conecta las plataformas desde las que tus clientes te escriben."
- One card per `ChannelType`:
  - **WhatsApp** — small read-only card with a "Administrar" link to the existing `?tab=whatsapp` (do NOT duplicate the WhatsAppConfig component here).
  - **Instagram** — status badge (`Conectado` / `No conectado`), a "Conectar Instagram" button (primary), and a "Desconectar" button when connected. Disconnect calls a new `DELETE /api/channels/:id` (T3.7).
  - **Messenger** — same shape.
- Empty state copy: "Aún no has conectado ningún canal."

**Acceptance criteria**
- The panel fetches `channel_configs` rows via a new server-side helper (T3.3) and renders them.
- Clicking "Conectar Instagram" redirects to `/api/oauth/meta/start?channel=instagram` (T3.4).
- The Spanish string table is updated; English fallback is acceptable.
- Renders without console errors when no channels are connected.

**Dependencies**: T3.1, T3.3.
**Estimate**: M (~4-6h).

### T3.3 — `GET /api/channels` — list the account's connected channels

**File**: `src/app/api/channels/route.ts` (new).
**Handler**: GET-only, RLS via the caller's session. Returns `Array<{ id, channel, channel_id, status, connected_at, ig_business_account_id? }>`. `access_token` and `verify_token` are NEVER returned.
**Dependencies**: T1.1.
**Estimate**: S (~2h).

### T3.4 — `GET /api/oauth/meta/start?channel=…` — initiate the Meta OAuth handshake

**File**: `src/app/api/oauth/meta/start/route.ts` (new).
**Flow**:
1. Require admin role on the account (reuse `resolveAccountId` from the WhatsApp config route).
2. Validate `channel ∈ {'instagram', 'messenger'}`.
3. Build the Meta OAuth URL with scopes:
   - For `channel=instagram`: `pages_messaging, instagram_basic, instagram_manage_messages, pages_show_list`.
   - For `channel=messenger`: `pages_messaging, pages_show_list`.
4. `state` = signed JWT containing `{ accountId, userId, channel, nonce }` (HMAC with `ENCRYPTION_KEY`, 5-min TTL). Reject the callback if `state` is missing, expired, or for a different account.
5. Redirect to `https://www.facebook.com/v21.0/dialog/oauth?...`.

**Acceptance criteria**
- An admin can click "Conectar Instagram" from the panel and reach the Meta dialog.
- A non-admin (role `user` on the same account) gets 403.
- `state` JWT cannot be forged (covered by a unit test on the encoder).

**Dependencies**: T1.1 (channel exists in the type system).
**Estimate**: M (~4-6h).

### T3.5 — `GET /api/oauth/meta/callback` — finish the handshake and persist

**File**: `src/app/api/oauth/meta/callback/route.ts` (new).
**Flow**:
1. Verify `state` JWT (T3.4).
2. Exchange `code` for a long-lived user access token (`oauth/access_token` endpoint with `grant_type=fb_exchange_token`).
3. Fetch `/me/accounts` → list of pages the user admins, with `access_token` and `id` per page.
4. **Branch by channel**:
   - `channel=instagram`: for each page, call `/{page_id}?fields=instagram_business_account{id,username}` to discover the IG business account. Present a picker UI: a server-rendered page (`/app/oauth/meta/pick/page.tsx` new) with one "Connect" button per (page, ig_business_account) pair.
   - `channel=messenger`: skip the IG discovery; the picker is just the page list.
5. On user selection, persist the row:
   - `account_id`, `user_id` = the state JWT's userId, `channel`, `channel_id` = page_id, `access_token` (encrypted with the existing `@/lib/whatsapp/encryption` module — confirm the key is in `ENCRYPTION_KEY` and the cipher is GCM; migration 015 is the reference), `waba_id = null`, `status = 'connected'`, `connected_at = now()`. For IG also stash `ig_business_account_id` — but the schema has no such column. **Add it: T3.5a**.
6. Subscribe the page to the app: `POST /{page_id}/subscribed_apps` (this is the IG/Messenger analog of the WhatsApp `subscribed_apps` call at `meta-api.ts:167-179`). Treat success as best-effort — if it fails, the user can retry from the panel.
7. Redirect back to `/settings?tab=channels&connected=instagram` (or `messenger`).

**Acceptance criteria**
- After completing the flow, the new channel appears in the ChannelsPanel as "Conectado".
- A `subscribed_apps` failure shows a clear Spanish toast: "Conectado, pero Meta no aceptó la suscripción del webhook. Reintenta desde la configuración."
- Re-running the flow for the same `(account, channel)` updates the existing row's `access_token` instead of erroring on the `(account_id, channel)` unique key (migration 032).

**Dependencies**: T3.4.
**Estimate**: L (~1-2 days — this is the biggest task in the plan).

### T3.5a — Schema: add `ig_business_account_id` to `channel_configs`

**File**: `supabase/migrations/035_channel_configs_ig.sql` (new).
**Change**: `ALTER TABLE channel_configs ADD COLUMN ig_business_account_id TEXT;` (nullable). Partial unique index `(account_id, ig_business_account_id) WHERE ig_business_account_id IS NOT NULL`.
**Acceptance criteria**: migration is idempotent; existing rows unaffected.
**Dependencies**: T2.1.
**Estimate**: S (~1h, included in T3.5's estimate).

### T3.6 — `DELETE /api/channels/:id` — disconnect a channel

**File**: `src/app/api/channels/[id]/route.ts` (new).
**Handler**: admin only; sets `status='disconnected'` rather than hard-deleting (preserve audit trail and the `whatsapp_config` view's filter semantics).
**Acceptance criteria**: a disconnected channel disappears from the panel's "Conectado" list; a future inbound webhook for the same page_id is dropped with a clear log.
**Dependencies**: T3.3.
**Estimate**: S (~2h).

### T3.7 — Webhook verify endpoint: accept IG/FB subscriptions

**File**: `src/app/api/whatsapp/webhook/route.ts` lines 92-171 (the GET handler).
**Change**: query `channel_configs` (not `whatsapp_config` the view) when checking the `verify_token`. The view filters by `channel='whatsapp'`, so today an IG/FB verify_token match is impossible.
**Acceptance criteria**: a Meta App subscription for an IG business account returns the `hub.challenge` to Meta successfully.
**Dependencies**: T2.1.
**Estimate**: S (~1-2h).

### T3.8 — Phase 3 verification

**Unit** (new):
- `src/lib/oauth/state.test.ts` — encode/decode round-trip; expired JWT rejected; foreign-account JWT rejected.
- `src/app/api/channels/route.test.ts` — list returns the right shape; never returns `access_token`.
- `src/app/api/oauth/meta/start/route.test.ts` — non-admin gets 403; bad channel gets 400.

**Integration smoke** (manual, against the Meta dev app with `instagram_manage_messages` already approved in dev mode):
1. From `/settings?tab=channels`, click "Conectar Instagram" → Meta dialog → grant permissions → land back on the Channels panel.
2. Verify a `channel_configs` row exists in the DB with `channel='instagram'`, encrypted `access_token`, `status='connected'`.
3. From a test Instagram account, send a DM to the connected business account → message lands in the inbox with `channel='instagram'` (this is end-to-end with Phase 2; if Phase 2 isn't done, just verify the row got created).
4. Repeat for Messenger.

**Meta review gate (BLOCKER for production, not dev mode)**: `instagram_manage_messages` requires Meta App Review. Plan **2-4 weeks** of lead time. **Do NOT promise a public release date until Meta approves the app.** See §4.

---

## Phase 4 — Broadcasts, templates, reactions (step 8)

**Goal**: Channel-aware selection in existing flows. Most of this phase is *adapting* existing surfaces to the new channel, not building net-new functionality.

### T4.1 — Broadcasts: channel-scoped selection, no data-model change

**Files**
- `src/app/api/whatsapp/broadcast/route.ts` lines 137-226 (the loop) — gate the existing `sendTemplateMessage` call on `channel === 'whatsapp'`. For non-WhatsApp channels: skip the recipient (push to `results[]` with `error: 'Templates not supported on this channel in v1'`) and increment `failedCount`. Today's data model (`broadcasts`, `broadcast_recipients`) stays as-is — broadcasts remain a WhatsApp feature; the per-recipient error message tells the user why.
- `src/lib/whatsapp/broadcast-core.ts` — apply the same gate at lines ~240 (the `sendTemplateMessage` call). Also: the `whatsapp_message_id` column on `broadcast_recipients` should be renamed to `channel_message_id` in a follow-up migration — out of scope for v1 to avoid breaking the inbound status mirror at `webhook/route.ts:388`. Document the rename as Phase 5.
- `src/app/api/v1/broadcasts/route.ts` — same gate in the `deliverBroadcast` after() fan-out.

**Acceptance criteria**
- A broadcast to a list of mixed-channel contacts sends only to WhatsApp; the IG/Messenger contacts get `failed` rows with the Spanish error.
- A WhatsApp-only broadcast is byte-for-byte unchanged.
- The post-send status mirror (webhook → `broadcast_recipients.status`) still works.

**Dependencies**: T1.5.
**Estimate**: S (~3-4h).

### T4.2 — Templates: scope by channel, block new submissions for IG/FB

**Files**
- `src/app/api/whatsapp/templates/submit/route.ts` lines 78-176 — gate the entire route on `channel === 'whatsapp'` (the route currently reads `whatsapp_config`, which is the WhatsApp-only view, so this is already true in practice; just add a guard + a Spanish 400 for clarity).
- `src/app/api/whatsapp/templates/sync/route.ts`, `src/app/api/whatsapp/templates/[id]/route.ts` — same gate.
- `src/components/settings/template-manager.tsx` — if the account has no WhatsApp channel connected, show a disabled card pointing to the Channels tab.

**Acceptance criteria**
- A WhatsApp template submission goes through unchanged.
- An Instagram-only account (no WhatsApp connected) cannot see or submit templates.
- `message_templates.channel` column is not yet added — out of scope; templates remain a WhatsApp feature.

**Dependencies**: T1.1.
**Estimate**: S (~2-3h).

### T4.3 — Reactions: extend `sendReactionMessage` to support IG; mark channel on the row

**Files**
- `src/lib/whatsapp/meta-api.ts` line 680 (`sendReactionMessage`) — already covered by T1.1 (the `messagingProduct` parameter).
- `src/app/api/messages/react/route.ts` (the renamed route from T1.6) — load the target message's `channel`, dispatch through `getChannelClient`. For WhatsApp, behavior unchanged. For IG, call the Instagram client's `sendReaction`; for Messenger, return 400 ("Messenger no admite reacciones en esta versión").
- `message_reactions` table — no schema change. The `actor_type = 'agent'` rows are channel-agnostic (they reference `messages.id` which carries `channel`); queries joining `message_reactions → messages` already surface the channel.
- `src/components/inbox/message-bubble.tsx` — read the parent message's `channel`; render a small platform icon (WhatsApp green, IG gradient, Messenger blue) next to the reaction emoji. **Minimal render only — do not redesign the bubble for multi-channel.**

**Acceptance criteria**
- An agent can react to an IG message in the inbox; the reaction persists with `actor_type='agent'`.
- An attempt to react to a Messenger message returns 400 with a Spanish error.
- The WhatsApp reaction flow is byte-for-byte unchanged.

**Dependencies**: T1.3, T1.6.
**Estimate**: M (~4-6h).

### T4.4 — Inbox channel indicators (minimal, NOT a redesign)

**File**: `src/components/inbox/conversation-list-item.tsx` (or wherever the conversation row is rendered).
**Change**: add a small colored dot or icon next to the contact name to indicate channel (WhatsApp / Instagram / Messenger). One per row. No layout change, no channel filter chip, no inbox split.
**Acceptance criteria**: each conversation row shows its channel; the visual change is ≤ 24px².
**Dependencies**: T1.5 (the `channel` column is populated on `conversations`).
**Estimate**: S (~2h).

### T4.5 — Phase 4 verification

**Unit**:
- Extend broadcast tests with a "skip non-WhatsApp recipient" case.
- Add a `meta-api.test.ts` case for `sendReactionMessage({ messagingProduct: 'instagram' })`.
- Add an `app/api/messages/react/route.test.ts` case for the Messenger 400.

**Integration smoke**:
1. Send a broadcast to a mixed list (10 WA + 5 IG) — verify 10 succeed, 5 fail with the right error.
2. React to a WhatsApp message — works.
3. React to an IG message — works.
4. React to a Messenger message — 400 with the Spanish message.

---

## 3. Risks and unknowns

| # | Risk | Impact | Mitigation |
|---|---|---|---|
| R1 | **Meta App Review for `instagram_manage_messages`** takes 2-4 weeks. | Blocks production rollout of Phase 3, but NOT dev/staging. | File the review submission as the **first ticket of Phase 3** (T3.0, 30 min of paperwork) and run in dev mode meanwhile. |
| R2 | **WABA / `/register` / `subscribed_apps` are WhatsApp-only.** None of this applies to IG/FB. | Easy to over-engineer and "Meta API the channel" with a WhatsApp-shaped call. | `meta-api.ts:127-179` (the WhatsApp registration block) is left untouched. T1.3/T1.4 use raw Graph API calls. |
| R3 | **The `whatsapp_config` *view* (migration 032:119-133) filters by `channel='whatsapp'`.** Today, a lot of code still reads from this view (e.g. `v1/contacts.ts:77` for `resolveAuditUserId`). The view's filter means these reads will silently miss IG/FB configs. | The public-API `POST /api/v1/contacts` from DigitBill continues to attribute to the WhatsApp config owner; an IG-only account falls back to `accounts.owner_user_id`. | Acceptable. DigitBill consumes the existing contract. The `external_id` extension in T1.2 keeps the response shape unchanged (the AGENTS.md hard rule). |
| R4 | **A Facebook Page can host both an IG business account and a Messenger bot**; today's `channel_configs_channel_id_key` (renamed from the WA one) blocks this. | Phase 2's disambiguation is impossible without T2.1. | T2.1 changes the unique key to `(account_id, channel, channel_id)` — this is the only safe form. Done in Phase 2, not deferred. |
| R5 | **IG vs Messenger webhook payloads** are nearly identical (both use `page_id` in metadata) but differ by the presence of `ig_business_account_id`. | If the wrong channel config is resolved, the agent reply goes to the wrong platform. | T2.3's resolver prefers IG when both are bound; logs the chosen channel loudly. |
| R6 | **Token storage is a hot path.** Migration 015 was the last encryption upgrade; T3.5 will store IG/FB tokens with the same `encrypt` helper. | A bug in `encryption.ts` blocks ALL outbound sends. | Out of scope to re-audit. Reuse the existing helper. Add a unit test that encrypts + decrypts a Meta token round-trips. |
| R7 | **The `contacts` table has no `external_id` today.** Adding it is a schema change on a table that DigitBill and existing CSV imports read. | AGENTS.md says the public API surface is the contract; the table is internal. | T1.2 adds the column as nullable; the existing `phone` unique behavior is preserved (migration 022's `phone_normalized` index stays). The `external_id` unique is partial (`WHERE external_id IS NOT NULL`). |
| R8 | **`/api/whatsapp/send` has external integrations (Zapier, Make, custom automations) pointed at the old URL.** A rename without a deprecation shim breaks them. | Customer-facing outage. | T1.6 keeps the old route as a deprecation shim for 2 minor versions minimum. |
| R9 | **Meta's IG Cloud API (`/me/messages` for IG via page-scoped token) has rate limits** that are different from WhatsApp's per-WABA limits. The current `RATE_LIMITS` map in `@/lib/rate-limit` only models per-user budgets. | Could 429 mid-broadcast. | Out of scope for v1. Document as a known follow-up. Per-channel rate limits belong in a follow-up. |
| R10 | **IG does not support message templates.** The current `sendTemplateMessage` is WhatsApp-only by spec. The IG client throws in T1.3; broadcast fans-out skip non-WA recipients in T4.1. | UX: a user trying to broadcast to an IG contact from the existing composer gets a failure per recipient, not a block upfront. | Add a Phase 5 task: gate the broadcast composer on "recipients have a WhatsApp channel" before the send. |
| R11 | **Messenger reactions do not exist.** | A user trying to react to a Messenger message will get a 400. | T4.3 returns a Spanish 400. Document in the help center as a known gap. |
| R12 | **`webhook/route.ts` reads `value.contacts[0].profile.name` for the contact name** (line 579). IG webhooks also include `profile.name` per Meta spec, but it's been observed to be missing on some 24h-window-resurrected threads. | Fallback to `recipientId` (IGSID) as the contact name. | Acceptable. Same fallback as WhatsApp edge cases. |

---

## 4. Scope creep guardrails (do NOT do these in this iteration)

The following are explicitly OUT of scope. The PM (me) will reject PRs that touch them.

1. **Do NOT redesign the inbox layout for multi-channel** — only T4.4's tiny per-row channel indicator. No channel filter chip, no split inbox, no "Instagram" tab.
2. **Do NOT touch DigitBill's fiscal core** — `xmlService.ts`, `dgiiService.ts`, `RDProvider.ts`, `pdf/*`, `fiscal/certification/automationService.ts`. AGENTS.md is unambiguous.
3. **Do NOT change the broadcasts or message_templates data models** — the column rename `whatsapp_message_id` → `channel_message_id` is a Phase 5 task. The mirror logic in the inbound webhook depends on the existing column name.
4. **Do NOT add per-channel rate limits** — the existing `RATE_LIMITS` map stays as-is. R9.
5. **Do NOT add new message types** (e.g. IG `story_reply`, Messenger `quick_reply`) — the `content_type` CHECK constraint in `messages` (migration 001, line 168, widened in 010) is not being touched.
6. **Do NOT add a `phone_normalized` equivalent for IG/FB** — phone dedupe stays as-is; `external_id` dedupe is its own partial unique.
7. **Do NOT rename `whatsapp_config` (the view)** away from the filter `channel='whatsapp'`. Lots of existing code still reads from the view. Renaming or widening it is a much larger migration that should be its own Phase 5 epic.
8. **Do NOT add new env vars to `meta-api.ts`** for IG/FB endpoints — the `META_API_VERSION` and `META_API_BASE` are shared.
9. **Do NOT introduce a new "channel selector" UI** in the inbox composer. Send goes to whatever channel the conversation's `channel` column says. Channel-pickers in the composer are a Phase 5 product decision.
10. **Do NOT touch the public `/api/v1/contacts` response shape** — only ADD an optional input field (`external_id`). DigitBill depends on the response.
11. **Do NOT change the WhatsApp-Config component (`src/components/settings/whatsapp-config.tsx`)** — it remains the canonical "connect WhatsApp" surface. The Channels panel only links to it.
12. **Do NOT redirect WhatsApp users to the new Channels panel** — keep the existing "Settings → WhatsApp" entry point exactly as-is. The new panel is additive.
13. **Do NOT use `process.env.META_APP_ID` outside `meta-api.ts`** — it's a singleton, used for resumable uploads only. The OAuth client ID/secret live in their own env vars (`META_APP_ID` for the App, `META_APP_SECRET` for the secret).
14. **Do NOT run a server (`next dev`, `next start`) in any task's verification.** The repo's QA workflow assumes the server is already running; per the QA guidelines, no commands append `&`.

---

## 5. Verification plan (per phase)

| Phase | Unit tests to add | Integration smoke (manual) | What MUST be true to mark the phase done |
|---|---|---|---|
| **1** | `src/lib/channels/client.test.ts` (new) — IG text/media/reaction body shape, Messenger text/media, both throw paths for unsupported ops. Extend `src/lib/whatsapp/send-message.test.ts` with an IG happy path. Extend `src/lib/whatsapp/meta-api.test.ts` with the new `messagingProduct` param cases. | Real Meta dev app: connect WA + IG + FB test pages, send a text from each via `/api/messages/send`, verify on the right platform. | All tests green; old `/api/whatsapp/send` still works (deprecation shim) and new `/api/messages/send` works for all three channels. |
| **2** | New `src/app/api/whatsapp/webhook/route.test.ts` (or extract disambiguation into a pure helper in `src/lib/channels/disambiguator.ts` and test it). | Real Meta dev app: send inbound DMs from IG + Messenger test accounts; verify the messages land in `messages` with the right `channel` and the right `external_id` on `contacts`. Replay a known IG payload — no duplicate row. | All tests green; IG + Messenger inbound end-to-end works. |
| **3** | `src/lib/oauth/state.test.ts` (state JWT round-trip + forgery). `src/app/api/channels/route.test.ts` (list, never returns token). `src/app/api/oauth/meta/start/route.test.ts` (non-admin 403, bad channel 400). | Real Meta dev app: full OAuth flow from the panel. Channel appears as connected. Send a DM from the test IG account → inbox shows it. | All tests green; an admin can complete the full OAuth flow; the new channel row is persisted; subscriptions succeed. **Meta App Review for `instagram_manage_messages` is IN PROGRESS, not a blocker for dev mode.** |
| **4** | `meta-api.test.ts` reaction case for IG. `broadcast-core.test.ts` skip-non-WA case. `messages/react/route.test.ts` Messenger-400 case. | Real Meta dev app: send a broadcast to a mixed WA+IG list — 10 WA succeed, 5 IG fail with the right error. React to a WA + IG + Messenger message; observe the right behavior. | All tests green; broadcasts are channel-scoped; reactions are channel-scoped; inbox shows the channel indicator. |

### General rules every PR in this plan must follow

- All new UI strings: Spanish first, English fallback.
- No `&` appended to commands in the verification scripts.
- `pnpm test` (or the project's equivalent) must pass before review.
- New schema migrations go to `supabase/migrations/NNN_*.sql` with `IF NOT EXISTS` and `DROP IF EXISTS` for idempotency (per `001_initial_schema.sql`'s convention).
- RLS: every new table or new column must respect `is_account_member(account_id)` — that function is the single tenancy gate the rest of the codebase uses.
- Do not edit files under `src/lib/digitbill/**` (none exist today, but if you find one, that's a hard `AGENTS.md` no-fly zone).
- Do not edit `src/lib/whatsapp/encryption.ts` — it's the audit-grade encryption helper. New tokens (IG, FB) flow through the same module.
- Before any Next.js 16 framework code, **read the relevant guide under `node_modules/next/dist/docs/`**. The agent rules in `AGENTS.md` are explicit about this — the file structure is different from training data.

---

## 6. Suggested schedule (sequential, no parallelization assumed)

| Week | Phase | Tasks | Note |
|---|---|---|---|
| Week 1 | 1 | T1.1, T1.2 | Both are non-UI; T1.2 unblocks the public-API IG/FB contact create. |
| Week 2 | 1 | T1.3, T1.4, T1.5, T1.6 | T1.5 depends on T1.3+T1.4; T1.6 is the rename. |
| Week 3 | 2 | T2.1, T2.2, T2.3, T2.4, T2.5 | Backend-only. |
| Week 4 | 3 | T3.0 (file Meta App Review paperwork, 30 min), T3.1, T3.2, T3.3, T3.4 | Frontend panel + OAuth start. |
| Week 5 | 3 | T3.5 (+ T3.5a), T3.6, T3.7 | OAuth callback + persistence + webhook verify. |
| Week 6 | 4 | T4.1, T4.2, T4.3, T4.4 | Channel-scoped adapters. |
| Week 7 | — | Buffer + Meta review wait | Phase 3 is dev-mode-runnable from Week 5 onward. |

**Total: 6-7 weeks of engineering time**, plus the 2-4 week Meta review wall-clock for production release.

---

## 7. One-liner success criteria for the whole epic

A Zynex CRM admin (es-DO locale, default `zynex` theme) clicks "Conectar Instagram" in Settings → Canales, completes a Meta OAuth handshake, and ends up with an Instagram business account connected to their CRM. A real Instagram DM from a customer lands in their inbox with the `instagram` channel badge; the agent replies via the composer; the message is delivered on Instagram. The same works for Facebook Messenger. WhatsApp parity is preserved bit-for-bit. The DigitBill public API at `/api/v1/contacts` accepts an optional `external_id` and continues to honor the existing contract. No DigitBill fiscal file was touched. No multi-channel inbox redesign was attempted. Every new UI string is Spanish-first. The new code path is test-covered and the old `whatsapp` routes still work behind a deprecation shim.
