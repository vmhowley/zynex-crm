# SaaS hardening — preview setup

This document tracks the database/environment changes introduced by PR #12 after the already-applied migrations `041` and `042`.

## Database migrations

Apply these migrations in numeric order to the Supabase project used by the preview:

1. `043_conversation_channel_connection.sql`
   - binds conversations/messages to the exact WhatsApp/Instagram/Messenger connection;
   - backfills legacy conversations to the primary connection.
2. `044_platform_users.sql`
   - creates platform-level roles (`super_admin`, `support`, `billing`), separate from tenant roles.
3. `045_platform_account_overview.sql`
   - adds the service-role-only tenant overview used by `/platform`.
4. `046_meta_oauth_pending_sessions.sql`
   - stores short-lived Instagram/Messenger OAuth picker state server-side so credentials never travel in URLs.
5. `047_pro_trial_signup.sql`
   - makes new 14-day trials use the Pro plan instead of Free;
   - preserves the existing trial-expiry/suspension policy until the commercial downgrade policy is explicitly chosen.
6. `048_whatsapp_legacy_view_registration.sql`
   - restores WhatsApp registration/diagnostic fields on the primary-only legacy view used by advanced settings.

Do not merge the PR solely because these migrations apply successfully. The integrated Vercel preview must still pass the regression checklist before merge.

## Meta / WhatsApp Embedded Signup

The existing `META_APP_ID` and `META_APP_SECRET` remain the application credentials.

Add:

```env
META_WHATSAPP_CONFIG_ID=<Login for Business Embedded Signup configuration ID>
```

Optional:

```env
META_GRAPH_API_VERSION=v21.0
META_EMBEDDED_SIGNUP_REDIRECT_URI=<only when the Meta configuration explicitly requires an exact redirect URI>
```

The customer-facing Embedded Signup flow never asks customers for WABA IDs, Phone Number IDs, access tokens, or webhook verify tokens. The customer supplies only a friendly connection name and a six-digit registration PIN; Meta provides the business/phone selection and Zynex CRM stores the resulting credential encrypted server-side.

## Preview testing order

After migrations and environment configuration:

1. Open Settings → Channels and confirm existing channel connections load.
2. Open Settings → WhatsApp and confirm Embedded Signup is the primary UI while manual configuration is under the advanced section.
3. Connect a WhatsApp number and confirm it appears in Channels.
4. Send an inbound message to that number and confirm a conversation is created.
5. Reply from the CRM and confirm the reply leaves from the same WhatsApp number.
6. When the plan allows it, connect a second number, send inbound messages to both, and verify the conversations remain bound to their respective connections.
7. Promote the secondary connection to Primary and confirm existing conversations still reply through their original connection.
8. For a platform user, open `/platform` and confirm tenant/subscription/usage totals load.
9. Verify there is no AI Assistant entry in Settings and inbound messages do not trigger AI auto-replies.
