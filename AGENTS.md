<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:zynex-brand -->
# Zynex CRM — brand and integration rules

This repo is **Zynex CRM**, the WhatsApp-first customer engagement
product of **Zynex SRL** (Nexus Computing Solutions SRL). It is a
fork of [wacrm](https://github.com/ArnasDon/wacrm) (MIT, © Arnas
Donauskas). Preserve MIT attribution in `LICENSE` and `README.md`.

## Brand surface

- Product name: **Zynex CRM** (no "By Zynex" suffix — Zynex is both
  the parent brand and the product name).
- Default theme: `zynex` (indigo `oklch(0.52 0.24 258)`). Other themes
  stay selectable in Settings → Appearance.
- Default locale: `es-DO`. Add new strings to the Spanish surface
  first; English fallback is acceptable.
- Parent company copy: "Zynex SRL (Nexus Computing Solutions SRL)".

## Integration boundary — Zynex CRM ↔ DigitBill

Zynex CRM integrates with [DigitBill](https://digitbill.do) for
Dominican e-CF invoicing. The integration surface is **Zynex CRM's
existing public REST API** at `/api/v1/*` and the **HMAC-signed
outbound webhooks** under migration `028_webhook_endpoints.sql`. Do
not invent a new API surface; reuse what is there.

- **DigitBill → Zynex CRM**: DigitBill holds an API key per tenant,
  uses `POST /api/v1/contacts` (find-or-create by phone) and
  `POST /api/v1/webhooks` (subscribe to events) to mirror clients
  into the CRM.
- **Zynex CRM → DigitBill**: Zynex CRM calls DigitBill's existing
  `/api/clients`, `/api/invoices`, etc. via a per-tenant service
  credential held in `digitbill_connections` (added in migration
  `030_digitbill_connections.sql`).

**Hard rule:** never touch DigitBill's fiscal core files
(`xmlService.ts`, `dgiiService.ts`, `RDProvider.ts`, `pdf/*`,
`fiscal/certification/automationService.ts`) from this repo. All
integration traffic goes through DigitBill's HTTP API.
<!-- END:zynex-brand -->
