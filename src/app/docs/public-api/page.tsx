"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "API Pública",
  subtitle: "Controla Zynex CRM desde tus propios scripts y automatizaciones.",
  intro: "La REST API pública te permite manejar Zynex CRM desde tus propios scripts y automatizaciones — enviar mensajes, gestionar contactos, navegar conversaciones, lanzar broadcasts, y suscribirte a eventos — sin pasar por la UI del dashboard. Todo vive bajo /api/v1 en tu propio deploy.",
  authTitle: "Autenticación",
  authDesc: "Cada request se autentica con una clave API, enviada como bearer token:",
  authNote: "Las claves son scoped por cuenta: una clave actúa sobre exactamente una cuenta — la que fue creada. No hay acceso cross-account.",
  createKeyTitle: "Creando una clave",
  createKeySteps: [
    "En el dashboard: Configuración → Claves API → Nueva clave API.",
    "Nombra la clave según la integración que la usará.",
    "Otorga solo los scopes que necesita.",
    "Copia la clave. Se muestra exactamente una vez. Zynex CRM solo almacena un hash SHA-256.",
  ],
  revokeNote: "Revoca en Configuración → Claves API → Revocar; toma efecto en el siguiente request.",
  scopesTitle: "Scopes",
  scopesDesc: "Una clave puede hacer solo lo que sus scopes permitan. Otorga el mínimo.",
  scopesRows: [
    ["messages:send", "Enviar mensajes de WhatsApp"],
    ["messages:read", "Leer mensajes y estado de entrega"],
    ["contacts:read", "Listar y leer contactos"],
    ["contacts:write", "Crear y actualizar contactos"],
    ["conversations:read", "Listar y leer conversaciones"],
    ["broadcasts:send", "Lanzar campañas de broadcast"],
    ["webhooks:manage", "Registrar y gestionar webhooks salientes"],
  ],
  noScopeNote: "Una clave sin scopes aún se autentica y puede llamar GET /api/v1/me.",
  responseTitle: "Formato de respuesta",
  responseDesc: "Toda respuesta es una de dos formas:",
  responseCodes: "Codes: unauthorized (401), forbidden (403), rate_limited (429), bad_request (400), not_found (404), internal (500). Send endpoints add domain codes como whatsapp_not_configured y meta_error (502).",
  rateLimitDesc: "Requests rate-limited per key a 120/minute; 429 returns Retry-After y X-RateLimit-* headers.",
  paginationTitle: "Paginación",
  paginationDesc: "List endpoints return meta.next_cursor y toman ?limit= (default 50, max 100) y ?cursor=.",
  endpointsTitle: "Endpoints",
  endpoints: [
    { method: "GET", path: "/api/v1/me", desc: "Retorna la cuenta de una clave y sus scopes. No requiere scope." },
    { method: "POST", path: "/api/v1/messages", desc: "Envía mensaje a un número E.164. Find-or-creates contacto y conversación." },
    { method: "GET", path: "/api/v1/contacts", desc: "Lista contactos, newest first. Filtros: ?search=, ?tag=." },
    { method: "POST", path: "/api/v1/contacts", desc: "Crea por phone (E.164). Find-or-create: match existente retorna 200, nuevo retorna 201." },
    { method: "GET / PATCH", path: "/api/v1/contacts/{id}", desc: "Lee / actualiza. PATCH cambia solo los campos enviados." },
    { method: "GET", path: "/api/v1/conversations", desc: "Lista conversaciones. Filtros: ?status=, ?contact_id=." },
    { method: "GET", path: "/api/v1/conversations/{id}", desc: "Lee una." },
    { method: "GET", path: "/api/v1/conversations/{id}/messages", desc: "Mensajes del hilo, newest first." },
    { method: "POST", path: "/api/v1/broadcasts", desc: "Lanza un broadcast. Retorna 202 inmediatamente; poll GET /api/v1/broadcasts/{id}." },
  ],
  webhooksTitle: "Webhooks",
  webhooksDesc: "En lugar de polling, registra un endpoint HTTPS y Zynex CRM POSTea cuando pasan cosas.",
  events: "Events: message.received, message.status_updated, conversation.created.",
  webhookEndpoints: [
    { method: "POST", path: "/api/v1/webhooks", desc: "Registra {url, events}. Retorna signing secret exactamente una vez." },
    { method: "GET", path: "/api/v1/webhooks y /api/v1/webhooks/{id}", desc: "Lista / lee (nunca retorna el secret)." },
    { method: "PATCH", path: "/api/v1/webhooks/{id}", desc: "Actualiza url, events, o is_active." },
    { method: "DELETE", path: "/api/v1/webhooks/{id}", desc: "Remueve." },
  ],
  deliveryTitle: "Payload de entrega",
  deliveryDesc: "El payload incluye: id (único por entrega), event, occurred_at, account_id, data.",
  signatureTitle: "Verificando la firma",
  signatureDesc: "X-Wacrm-Signature: t=<unix_seconds>,v1=<hex> donde v1 = HMAC-SHA256(secret, '${t}.${rawBody}'). Recomputa sobre el raw request body, compara en tiempo constante, rechaza si t es muy antiguo (replay protection).",
  deliverySemanticsTitle: "Semánticas de entrega",
  deliverySemanticsDesc: "Best-effort: un intento por evento, no se siguen redirects. Proveedores re-envían y re-ordenan callbacks, así que no asumas orden. Fallos repetidos auto-deshabilitan un endpoint. Para durabilidad, reconcilia con los endpoints de lectura cuando importa.",
  securityNote: "Targets deben ser URLs https:// — requests a localhost, rangos privados, y direcciones link-local son refusadas.",
  prevLabel: "Atrás: Miembros",
  nextLabel: "Siguiente: Suscripción",
};

const en = {
  title: "Public API",
  subtitle: "Drive Zynex CRM from your own scripts and automations.",
  intro: "The public REST API lets you drive Zynex CRM from your own scripts and automations — send messages, manage contacts, browse conversations, launch broadcasts, and subscribe to events — without going through the dashboard UI. Everything lives under /api/v1 on your own deployment.",
  authTitle: "Authentication",
  authDesc: "Every request authenticates with an API key, sent as a bearer token:",
  authNote: "Keys are account-scoped: a key acts on exactly one account. There is no cross-account access.",
  createKeyTitle: "Creating a key",
  createKeySteps: [
    "In the dashboard: Settings → API keys → New API key (admins and owners only).",
    "Name the key after the integration that will use it.",
    "Grant only the scopes it needs.",
    "Copy the key. It's shown exactly once. Zynex CRM stores only a SHA-256 hash.",
  ],
  revokeNote: "Revoke under Settings → API keys → Revoke; revocation takes effect on the key's next request.",
  scopesTitle: "Scopes",
  scopesDesc: "A key can do only what its scopes allow. Grant the minimum.",
  scopesRows: [
    ["messages:send", "Send WhatsApp messages"],
    ["messages:read", "Read messages and delivery status"],
    ["contacts:read", "List and read contacts"],
    ["contacts:write", "Create and update contacts"],
    ["conversations:read", "List and read conversations"],
    ["broadcasts:send", "Launch broadcast campaigns"],
    ["webhooks:manage", "Register and manage outbound webhooks"],
  ],
  noScopeNote: "A key with no scopes still authenticates and can call GET /api/v1/me.",
  responseTitle: "Response format",
  responseDesc: "Every response is one of two shapes:",
  responseCodes: "Codes: unauthorized (401), forbidden (403), rate_limited (429), bad_request (400), not_found (404), internal (500). Send endpoints add domain codes like whatsapp_not_configured and meta_error (502).",
  rateLimitDesc: "Requests are rate-limited per key at 120/minute; a 429 returns Retry-After and X-RateLimit-* headers.",
  paginationTitle: "Pagination",
  paginationDesc: "List endpoints return meta.next_cursor and take ?limit= (default 50, max 100) and ?cursor=.",
  endpointsTitle: "Endpoints",
  endpoints: [
    { method: "GET", path: "/api/v1/me", desc: "Returns the account a key is bound to and its scopes. No scope required." },
    { method: "POST", path: "/api/v1/messages", desc: "Send message to E.164 number. Find-or-creates contact and conversation." },
    { method: "GET", path: "/api/v1/contacts", desc: "List, newest first. Filters: ?search=, ?tag=." },
    { method: "POST", path: "/api/v1/contacts", desc: "Create by phone (E.164). Find-or-create: existing match returns 200, new returns 201." },
    { method: "GET / PATCH", path: "/api/v1/contacts/{id}", desc: "Read / update. PATCH changes only the fields you send." },
    { method: "GET", path: "/api/v1/conversations", desc: "List conversations. Filters: ?status=, ?contact_id=." },
    { method: "GET", path: "/api/v1/conversations/{id}", desc: "Read one." },
    { method: "GET", path: "/api/v1/conversations/{id}/messages", desc: "The thread's messages, newest first." },
    { method: "POST", path: "/api/v1/broadcasts", desc: "Launch a broadcast. Returns 202 immediately; poll GET /api/v1/broadcasts/{id}." },
  ],
  webhooksTitle: "Webhooks",
  webhooksDesc: "Instead of polling, register an HTTPS endpoint and Zynex CRM POSTs to it when things happen.",
  events: "Events: message.received, message.status_updated, conversation.created.",
  webhookEndpoints: [
    { method: "POST", path: "/api/v1/webhooks", desc: "Register {url, events}. Response includes the signing secret exactly once." },
    { method: "GET", path: "/api/v1/webhooks and /api/v1/webhooks/{id}", desc: "List / read (never returns the secret)." },
    { method: "PATCH", path: "/api/v1/webhooks/{id}", desc: "Update url, events, or is_active." },
    { method: "DELETE", path: "/api/v1/webhooks/{id}", desc: "Remove." },
  ],
  deliveryTitle: "Delivery payload",
  deliveryDesc: "The payload includes: id (unique per delivery), event, occurred_at, account_id, data.",
  signatureTitle: "Verifying the signature",
  signatureDesc: "X-Wacrm-Signature: t=<unix_seconds>,v1=<hex> where v1 = HMAC-SHA256(secret, '${t}.${rawBody}'). Recompute it over the raw request body, compare in constant time, and reject a t more than a few minutes old.",
  deliverySemanticsTitle: "Delivery semantics",
  deliverySemanticsDesc: "Best-effort: one attempt per event, no redirects followed. Repeated failures auto-disable an endpoint. For durability, reconcile with the read endpoints when it matters.",
  securityNote: "Targets must be public https:// URLs — requests to localhost, private ranges, and link-local addresses are refused.",
  prevLabel: "Back: Members",
  nextLabel: "Next: Subscription",
};

const s = { es, en };

export default function PublicApiDocPage() {
  const { locale } = useTranslations();
  const c = s[locale] ?? s.en;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/docs" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Zynex CRM</span>
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {locale === "en" ? "Pricing" : "Precios"}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Documentation" : "Volver a Documentación"}
        </Link>

        <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{c.subtitle}</p>
        <p className="text-muted-foreground mb-8">{c.intro}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.authTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.authDesc}</p>
            <code className="block bg-muted rounded px-3 py-2 text-sm font-mono mb-3">
              Authorization: Bearer zynex_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            </code>
            <p className="text-sm text-muted-foreground italic">{c.authNote}</p>
            <h3 className="text-lg font-medium mt-4 mb-2">{c.createKeyTitle}</h3>
            <ol className="space-y-1">
              {c.createKeySteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground italic mt-3">{c.revokeNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.scopesTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.scopesDesc}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Scope</th>
                    <th className="text-left py-2 px-3 font-medium">{locale === "en" ? "Allows" : "Permite"}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.scopesRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 px-3"><code className="text-xs bg-muted px-1 rounded font-mono">{row[0]}</code></td>
                      <td className="py-2 px-3 text-muted-foreground">{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted-foreground italic mt-3">{c.noScopeNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.responseTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.responseDesc}</p>
            <code className="block bg-muted rounded px-3 py-2 text-sm font-mono mb-3 whitespace-pre-wrap">
{`// success
{ "data": { /* ... */ }
// failure
{ "error": { "code": "forbidden", "message": "…" } }`}
            </code>
            <p className="text-sm text-muted-foreground mb-2">{c.responseCodes}</p>
            <p className="text-sm text-muted-foreground">{c.rateLimitDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.paginationTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.paginationDesc}</p>
            <code className="block bg-muted rounded px-3 py-2 text-sm font-mono whitespace-pre-wrap">
{`GET /api/v1/contacts?limit=50
→ { "data": [ … ], "meta": { "next_cursor": "eyJ…" } }
GET /api/v1/contacts?cursor=eyJ…
→ { "data": [ … ], "meta": { "next_cursor": null } }`}
            </code>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.endpointsTitle}</h2>
            <div className="space-y-3">
              {c.endpoints.map((ep, i) => (
                <div key={i} className="flex items-start gap-3">
                  <code className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono shrink-0">{ep.method}</code>
                  <div>
                    <code className="text-sm font-mono">{ep.path}</code>
                    <p className="text-sm text-muted-foreground">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.webhooksTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.webhooksDesc}</p>
            <p className="text-sm text-muted-foreground italic mb-4">{c.events}</p>
            <div className="space-y-3 mb-4">
              {c.webhookEndpoints.map((ep, i) => (
                <div key={i} className="flex items-start gap-3">
                  <code className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono shrink-0">{ep.method}</code>
                  <div>
                    <code className="text-sm font-mono">{ep.path}</code>
                    <p className="text-sm text-muted-foreground">{ep.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-lg font-medium mb-2">{c.deliveryTitle}</h3>
            <p className="text-sm text-muted-foreground mb-3">{c.deliveryDesc}</p>
            <h3 className="text-lg font-medium mb-2">{c.signatureTitle}</h3>
            <p className="text-sm text-muted-foreground mb-3">{c.signatureDesc}</p>
            <h3 className="text-lg font-medium mb-2">{c.deliverySemanticsTitle}</h3>
            <p className="text-sm text-muted-foreground mb-2">{c.deliverySemanticsDesc}</p>
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">{c.securityNote}</p>
          </div>
        </div>

        <div className="mt-12 flex justify-between">
          <Link href="/docs/members" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/subscription" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
