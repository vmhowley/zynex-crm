# Meta WhatsApp Cloud API — Setup & Troubleshooting

> Runbook for connecting Zynex CRM to the Meta WhatsApp Cloud API.
> Covers both the green-field setup and the most common failure modes
> discovered during the initial Zynex CRM rollout.

## TL;DR

Zynex CRM is **ready** for the WhatsApp Cloud API on the engineering
side. The webhook handler at `src/app/api/whatsapp/webhook/route.ts`
verifies HMAC signatures, handles inbound messages, media, reactions,
interactive replies, and re-dispatches outbound events to subscribers.

The blocker in practice is **Meta-side configuration** — portfolios,
WABA ownership, and business verification. The fix is always Meta
Business Manager, not the app.

---

## Architecture

```
Meta (WABA + phone number)
  │  POST /{phone_number_id}/register    (PIN, 2FA required)
  │  POST /{waba_id}/subscribed_apps     (subscribe WABA to app)
  ▼
Zynex CRM
  ├── Settings → WhatsApp  (UI, /settings)
  ├── POST /api/whatsapp/config           (saves + subscribes)
  ├── GET  /api/whatsapp/webhook          (Meta verification handshake)
  ├── POST /api/whatsapp/webhook          (inbound messages, HMAC-verified)
  └── GET  /api/whatsapp/config/verify-registration  (diagnostic)
```

| Surface | Owner | Purpose |
|---|---|---|
| `/api/v1/contacts` | Zynex CRM | Contact sync target (DigitBill pushes here) |
| `/api/v1/webhooks` | Zynex CRM | Outbound event subscribers (DigitBill subscribes here) |
| `whatsapp_config` table | Zynex CRM | Phone ID + WABA ID + encrypted access token + encrypted verify token |

## Required env vars (Vercel → Settings → Environment Variables)

```bash
META_APP_SECRET=<App Secret from Meta App Settings → Basic>
ENCRYPTION_KEY=<64-char hex; same as before, never rotate after launch>
```

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` already configured.

## Green-field setup (when you own the Meta app + WABA)

### Step 1 — Create the Meta app

1. https://developers.facebook.com/apps → **Create App**
2. Type: **Business**
3. Use case: **Connect with customers through WhatsApp**
4. Create or select a **Business Portfolio**

### Step 2 — Add a phone number to a WABA

1. App dashboard → **WhatsApp → API Setup**
2. **Add phone number** — register your DR number (`+1 809/829/849`)
3. Save the **Phone Number ID** and the **WABA ID** shown in API Setup

### Step 3 — System user + permanent token

1. https://business.facebook.com/latest/settings → **System users** → **Add+**
2. Type **Admin**, name `zynex-crm-prod`
3. **Assign Assets**:
   - App → **Full control**
   - WhatsApp account → **Manage WhatsApp Business accounts** + **Manage phone numbers**
4. **Generate token** with scopes:
   - `business_management`
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Store the token in your password manager — it's shown once

### Step 4 — Configure Zynex CRM

1. https://crm.zynex.do/settings → WhatsApp
2. Fill:
   - **Phone Number ID** (from Step 2)
   - **WABA ID** (from Step 2)
   - **Access Token** (from Step 3)
   - **Verify Token** (invent one, e.g. `zynex-verify-2026-prod`)
   - **PIN** (your 2FA PIN — see Step 5)
3. Click **Save**
4. Zynex CRM internally runs `POST /register` + `POST /subscribed_apps`

### Step 5 — Enable 2FA + PIN (required for `/register`)

1. App dashboard → WhatsApp → API Setup → **Two-step verification** → **Manage**
2. **Enable** → set a 6-digit PIN
3. Use that PIN in the Settings → WhatsApp form (Step 4)

### Step 6 — Configure the webhook in Meta

1. App dashboard → WhatsApp → **Configuration → Webhook → Edit**
2. **Callback URL**: `https://crm.zynex.do/api/whatsapp/webhook`
3. **Verify Token**: same string as in Step 4
4. **Webhook fields** (checkboxes):
   - ☑️ `messages` ← **CRITICAL. If unchecked, Meta discards messages silently.**
   - ☑️ `message_template_status_update`
   - ☑️ `account_update`

### Step 7 — Verify

```bash
# Reachability
curl -I "https://crm.zynex.do/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=INVALID&hub.challenge=test"
# Expect: 400 or 403, NOT 404 / 500 / timeout

# Verify registration diagnostic (login required)
curl "https://crm.zynex.do/api/whatsapp/config/verify-registration" \
  -H "Cookie: <your-session-cookie>"
# Expect: { "live": true, "checks": { "phone_info": {...}, "waba_subscription": {...}, "registered_at": "<iso>" } }
```

---

## Failure modes (encountered in production)

### Symptom 1: "URL couldn't be validated" / "Verify token mismatch"

Zynex CRM handshake (`GET /api/whatsapp/webhook`) returned 403.

- **Cause A**: Verify Token in Meta dashboard doesn't match the one saved in Zynex CRM `whatsapp_config.verify_token`. Compare them character by character.
- **Cause B**: Migrations not applied — `whatsapp_config.verify_token` column missing. Verify with `select * from whatsapp_config limit 1;` in Supabase.
- **Cause C**: Webhook URL not reachable. Check Vercel deploy log + DNS + HTTPS cert.

### Symptom 2: Zynex CRM says "Connected" but Meta dashboard says "Disconnected"

**This is the most common silent failure.** Zynex CRM sets `status='connected'` whenever `verifyPhoneNumber` (GET) succeeds — it does NOT require `/register` to have succeeded. If you saved the config without a PIN, registration was **skipped** (per `src/app/api/whatsapp/config/route.ts:299-311`) and the WABA was never actually subscribed for inbound webhooks.

**Fix**:
1. Enable 2FA in Meta (App → WhatsApp → API Setup → Two-step verification)
2. Re-save the config in Zynex CRM WITH the PIN
3. Zynex CRM now calls `POST /{phone_number_id}/register` → status flips to fully connected

### Symptom 3: "No tienes acceso a la cuenta de WhatsApp Business XXXXXX"

The WABA belongs to a **different Facebook user** than the one you're currently logged in as. Meta doesn't merge identities across Facebook users even when they share an email.

**Diagnostic**: https://accountscenter.facebook.com/ → look at "Cuentas que administras". If you see one DigitBill you can administer but another (the WABA) you can't, they belong to different Facebook users.

**Fix paths**:
- **A. You have access to the owner Facebook user** (most common): sign out, sign in with that user's credentials, configure 2FA, create system user, generate token.
- **B. The owner is a partner / agency / ex-employee**: ask them to add your Facebook user as Admin to the WABA (`Manage WhatsApp Business accounts`).
- **C. Lost access entirely**: open a Meta Business Help ticket — https://www.facebook.com/business/help — with the WABA ID, your RNC, and proof of business ownership (tax filings, domain, bank statement).

### Symptom 4: WABA in a portfolio you don't control

A WhatsApp Business Account lives in **exactly one Business Portfolio**. You cannot have the same phone number registered to two WBAs in two different portfolios.

If the WABA is in portfolio X and your app is in portfolio Y:
1. Either move the app to portfolio X (Settings → Basic → Business Portfolio)
2. Or add a cross-portfolio admin via Meta Business Help

### Symptom 5: Multi-portfolio confusion

Common with DigitBill-style stacks where there are separate portfolios per product. You can list them at https://business.facebook.com → top-left dropdown.

| Symptom | Cause |
|---|---|
| App in portfolio A, WABA in portfolio B, no admin overlap | Most common setup mistake. Move app to B. |
| Multiple portfolios with similar names | Accidentally created duplicate. Consolidate. |
| "Number is registered to another app" | Meta Cloud API limits a phone number to one app. Either remove from the other app, or contact Meta. |

### Symptom 6: 403 on inbound webhook (POST)

Vercel logs show `POST /api/whatsapp/webhook 403` after a message is sent.

- **Cause**: `META_APP_SECRET` is unset or doesn't match. `src/lib/whatsapp/webhook-signature.ts` does fail-closed HMAC verification.
- **Fix**: Vercel → Settings → Environment Variables → `META_APP_SECRET` = exact value from Meta App Settings → Basic → App Secret → Show.

### Symptom 7: "Profile not authorized" in Meta dashboard

Same root cause as Symptom 3 — you're not admin of the WABA. Meta hides certain UI actions (display name authorization, quality rating changes, messaging tier upgrades) from non-admins.

---

## Verification matrix

| Check | How |
|---|---|
| Webhook reachable | `curl -I https://crm.zynex.do/api/whatsapp/webhook` returns 400/403 (not 404/500) |
| Token valid | `curl -H "Authorization: Bearer $TOKEN" https://graph.facebook.com/v21.0/$WABA_ID` returns 200 |
| WABA lists phone numbers | `curl -H "Authorization: Bearer $TOKEN" https://graph.facebook.com/v21.0/$WABA_ID/phone_numbers` returns array with your number |
| App subscribed to WABA | `curl -H "Authorization: Bearer $TOKEN" https://graph.facebook.com/v21.0/$WABA_ID/subscribed_apps` returns non-empty array |
| Phone number registered | `curl -H "Authorization: Bearer $TOKEN" https://graph.facebook.com/v21.0/$PHONE_NUMBER_ID?fields=id,display_phone_number,quality_rating` returns 200 with `quality_rating` |
| Webhook fields active | Meta dashboard → WhatsApp → Configuration → Webhook → "Webhook fields" shows `messages` checked |
| End-to-end message | Send a WhatsApp message to your number → appears in Zynex CRM Inbox within 5s |

---

## Meta Support ticket template

Copy-paste and adapt for https://www.facebook.com/business/help:

```
Subject: Cannot access WhatsApp Business Account {WABA_ID} — 
         request ownership verification

Hi Meta Business Support,

I am the legal owner of the business entity DigitBill (RNC: {your_RNC})
and I need to recover admin access to the WhatsApp Business Account
WABA ID: {WABA_ID}.

Current situation: I am signed in to Meta Business Manager with my
personal Facebook account ({your_email}), but the WABA shows the
error: "No se puede acceder al administrador de WhatsApp con esta
cuenta. No tienes acceso a la cuenta de WhatsApp Business {WABA_ID}."

I do not know which Facebook user originally created the WABA. It was
set up during DigitBill's initial onboarding and I cannot identify
the Facebook user that owns it.

Business verification documents I can provide:
- Company registration (RNC certificate)
- Tax filings (DGII 606/607 reports mentioning this phone number)
- Business bank account statement
- Original WhatsApp Business phone number invoice from Meta
- Domain ownership (digitbill.do)

Please help me:
1. Identify the current admin of WABA {WABA_ID}
2. Transfer ownership to my Facebook account ({your_email})
   OR
3. Add me as a full admin so I can manage the WABA

Thank you,
{your_name}
{your_email}
{your_phone}
```

Expected response time: 3–7 business days.

---

## Status (as of 2026-07-03)

- ✅ Zynex CRM codebase rebranded + deployed to Vercel
- ✅ Webhook handler verified reachable (`400` on bare GET, `403` on invalid verify token)
- ❌ Meta WhatsApp Cloud API not yet connected — blocked on WABA ownership transfer via Meta Support
- ⏸ Inbound messages disabled until Meta Support grants admin access
- ✅ Outbound messages functional (subject to Meta token + scopes being correct)