"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Asistente de IA",
  subtitle: "Genera respuestas automáticas usando inteligencia artificial con tu propia API key.",
  setupTitle: "Configuración",
  setupItems: [
    "Ve a Configuración → Asistente de IA (admin o dueño only).",
    "Elige un proveedor — OpenAI o Anthropic — y un modelo. El campo es texto libre.",
    "Pega tu clave API.",
    "Haz clic en Probar clave — Zynex CRM hace una llamada pequeña y te dice si funciona.",
    "Opcionalmente añade contexto de negocio e instrucciones (ver abajo).",
    "Opcionalmente añade una clave de embeddings para búsqueda semántica (ver base de conocimiento).",
    "Activa Habilitar asistente de IA. Este es el interruptor maestro.",
    "Guarda.",
    "Opcionalmente abre la tarjeta Base de Conocimiento y añade documentos.",
  ],
  setupNote: "Requiere migraciones 029 y 030. Aplícalas antes de usar la función.",
  businessTitle: "Contexto de negocio e instrucciones",
  businessDesc: "El prompt de texto libre es donde le cuentas al modelo sobre tu negocio — quién eres, tu tono, qué puede y no puede decir. Se añade antes de cada borrador y cada auto-respuesta.",
  businessItems: [
    "Qué hace el negocio y el tono a usar ('cálido y conciso').",
    "Hechos que el modelo puede stating (horarios, ventana de devolución, regiones de envío).",
    "Límites duros ('nunca cites precios o fechas de entrega — transfiere a un humano').",
  ],
  draftTitle: "Borrador de respuestas",
  draftDesc: "El compositor muestra un botón ✨ junto a las plantillas y botones de envío. Haz clic y Zynex CRM:",
  draftItems: [
    "Lee los mensajes recientes del hilo.",
    "Los envía, más tu contexto de negocio, a tu proveedor.",
    "Coloca la respuesta sugerida directamente en el compositor.",
  ],
  draftNote: "El borrador es solo una sugerencia — nada se envía hasta que el agente revisa, edita si es necesario, y pulsa Enviar.",
  autoTitle: "Bot de auto-respuesta",
  autoDesc: "Cuando Auto-respuesta está activado, Zynex CRM responde a mensajes entrantes que califican automáticamente. Para cada mensaje entrante verifica, en orden, y se retira silenciosamente a menos que todas las condiciones se cumplan:",
  autoItems: [
    "El asistente de IA y auto-respuesta están ambos habilitados para la cuenta.",
    "Ningún Flujo consumió el mensaje, y la cuenta no tiene Automación activa de mensaje ('new_message_received' / 'keyword_match').",
    "Ningún agente está asignado a la conversación.",
    "Auto-respuesta no ha sido desactivada para esta conversación específica.",
    "La conversación está bajo su límite de respuestas (ver abajo).",
  ],
  handoffTitle: "Traslado a humano",
  handoffDesc: "Si el modelo decide que no puede ayudar con confianza — el cliente pide una persona, está molesto, o la solicitud necesita información que no tiene — transfiere en lugar de inventar. Zynex CRM entonces deja de auto-responder en esa conversación y deja el mensaje sin responder para que un humano lo recoja. El traslado es persistente: una vez que un hilo se transfiere, el bot permanece silencioso hasta que un admin lo reactiva.",
  capTitle: "Límite por conversación",
  capDesc: "Máximo de auto-respuestas por conversación (por defecto 3) limita cuántas veces el bot responderá a un hilo antes de callarse. Evita que un cliente conversador o un loop de respuestas haga crecer tu factura del proveedor.",
  kbTitle: "Base de conocimiento",
  kbDesc: "La base de conocimiento es donde le das al asistente tu propio contenido — FAQs, políticas de devolución/envío, detalles de productos, horarios. Al redactar o auto-responder, Zynex CRM recupera las piezas más relevantes y las pone diante del modelo, para que responda desde tus hechos en lugar de inventar o transferir.",
  hybridTitle: "Recuperación híbrida",
  hybridItems: [
    "Búsqueda por palabras clave (siempre activa). Postgres full-text search sobre tus documentos. Funciona para toda cuenta sin credenciales extra.",
    "Búsqueda semántica (opcional). Cuando estableces una clave de embeddings, Zynex CRM embebe tus documentos y la pregunta entrante y hace match por significado.",
  ],
  reindexTitle: "Añadir una clave más tarde, y Reindexar",
  reindexDesc: "Los documentos se embeben cuando guardas si hay una clave de embeddings establecida. Si añades documentos primero y la clave después, haz clic en Reindexar para embeber todo lo que se almacenó solo por palabras clave. Reindexar también recupera cualquier documento cuyo embedding falló.",
  precedenceTitle: "Precedencia: Flujos → Automatizaciones → IA",
  precedenceDesc: "Zynex CRM ejecuta lógica determinista y explícitamente configurada primero y trata la IA como el respaldo:",
  precedenceItems: [
    "Orden 1: Flujos — Gana porque: Una conversación impulsada por botones que diseñaste. Si un Flujo consume el mensaje, nada más responde.",
    "Orden 2: Automatizaciones — Gana porque: Reglas keyword/event que escribiste. Si existe una automatización activa de mensaje, el bot de IA se retira.",
    "Orden 3: Auto-respuesta IA — Gana porque: El catch-all para todo lo que tus Flujos y Automatizaciones no cubren.",
  ],
  draftNote2: "Los borradores de respuesta están fuera de esto por completo — son iniciados por el agente y nunca envían por sí solos.",
  providersTitle: "Proveedores, modelos y costo",
  providersItems: [
    "OpenAI (Chat Completions API) y Anthropic (Messages API) son soportados.",
    "El modelo es tuyo para elegir; los valores por defecto son un modelo rápido y de bajo costo por proveedor.",
    "Pagas al proveedor directamente por cada borrador y auto-respuesta, medido por tu propia cuenta. Zynex CRM no añade nada.",
    "La búsqueda semántica añade costo de embeddings: cada documento se embebe una vez al guardar/reindexar, y cada pregunta se embebe al recuperar.",
  ],
  privacyTitle: "Nota de privacidad",
  privacyDesc: "Como traes tu propia clave, el texto de la conversación — y cualquier contenido de la base de conocimiento usado para una respuesta — se envía a tu cuenta de OpenAI o Anthropic, no a Zynex CRM ni a ningún tercero.",
  limitsTitle: "Límites",
  limitsItems: [
    "Media, mensajes de plantilla e interactivos no se envían al modelo — solo texto se usa como contexto.",
    "Más allá de la ventana de mensajes recientes de la conversación actual y tu base de conocimiento, el asistente no tiene memoria.",
    "La base de conocimiento es texto que pegas; no hay subida de archivos ni importación por URL todavía.",
    "Auto-respuesta solo dispara dentro de la ventana de 24 horas de servicio al cliente de WhatsApp.",
  ],
  prevLabel: "Atrás: Plantillas",
  nextLabel: "Siguiente: Miembros",
};

const en = {
  title: "AI Assistant",
  subtitle: "Generate automatic responses using artificial intelligence with your own API key.",
  setupTitle: "Setup",
  setupItems: [
    "Go to Settings → AI Assistant (admin or owner only).",
    "Pick a provider — OpenAI or Anthropic — and a model. The model field is free text.",
    "Paste your API key.",
    "Click Test key — Zynex CRM makes one tiny call and tells you immediately whether it works.",
    "Optionally add business context & instructions (see below).",
    "Optionally add an embeddings key for semantic search (see knowledge base).",
    "Toggle Enable AI assistant on. This is the master switch.",
    "Save.",
    "Optionally open the Knowledge base card and add documents.",
  ],
  setupNote: "Requires migrations 029 and 030. Apply them before using the feature.",
  businessTitle: "Business context & instructions",
  businessDesc: "The free-text prompt is where you tell the model about your business — who you are, your tone, what it may and may not say. It is prepended to every draft and every auto-reply.",
  businessItems: [
    "What the business does and the voice to use ('warm and concise').",
    "Facts the model may state (hours, return window, shipping regions).",
    "Hard limits ('never quote prices or delivery dates — hand off to a human for those').",
  ],
  draftTitle: "Draft replies",
  draftDesc: "In any conversation, the composer shows a ✨ button next to the templates and send buttons. Click it and Zynex CRM:",
  draftItems: [
    "Reads the recent messages of the thread.",
    "Sends them, plus your business context, to your provider.",
    "Drops the suggested reply straight into the composer.",
  ],
  draftNote: "The draft is only a suggestion — nothing is sent until the agent reviews, edits if needed, and hits Send.",
  autoTitle: "Auto-reply bot",
  autoDesc: "When Auto-reply is on, Zynex CRM answers qualifying inbound messages by itself. For each inbound message it checks, in order, and stands down silently unless every condition holds:",
  autoItems: [
    "The AI assistant and auto-reply are both enabled for the account.",
    "No Flow consumed the message, and the account has no active message-level Automation ('new_message_received' / 'keyword_match').",
    "No agent is assigned to the conversation.",
    "Auto-reply hasn't been switched off for this specific conversation.",
    "The conversation is under its reply cap (see below).",
  ],
  handoffTitle: "Handoff to a human",
  handoffDesc: "If the model decides it can't confidently help, it hands off instead of guessing. Zynex CRM then stops auto-replying on that conversation and leaves the message unanswered so it surfaces in the inbox for a human to pick up. Handoff is sticky: once a thread is handed off, the bot stays quiet on it until an admin re-enables it.",
  capTitle: "Per-conversation cap",
  capDesc: "Max auto-replies per conversation (default 3) limits how many times the bot will answer one thread before going quiet. This prevents a chatty customer from running up your provider bill.",
  kbTitle: "Knowledge base",
  kbDesc: "The knowledge base is where you give the assistant your own content — FAQs, return/shipping policies, product details, opening hours. When drafting or auto-replying, Zynex CRM retrieves the most relevant pieces and puts them in front of the model.",
  hybridTitle: "Hybrid retrieval",
  hybridItems: [
    "Keyword search (always on). Postgres full-text search over your documents. Language-neutral, no extra credentials.",
    "Semantic search (optional). When you set an embeddings key, Zynex CRM embeds your documents and the incoming question and matches by meaning.",
  ],
  reindexTitle: "Adding a key later, and Reindex",
  reindexDesc: "Documents are embedded when you save if an embeddings key is set. If you add documents first and the key later, click Reindex to embed everything that was stored keyword-only. Reindex also recovers any document whose embedding failed at save time.",
  precedenceTitle: "Precedence: Flows → Automations → AI",
  precedenceDesc: "Zynex CRM runs deterministic, explicitly-configured logic first and treats the AI as the fallback:",
  precedenceItems: [
    "Order 1: Flows — Wins because: A button-driven conversation you designed. If a Flow consumes the message, nothing else replies.",
    "Order 2: Automations — Wins because: Keyword/event rules you wrote. If an active automation exists, the AI bot stands down.",
    "Order 3: AI auto-reply — Wins because: The catch-all for everything your Flows and Automations don't cover.",
  ],
  draftNote2: "Draft replies sit outside this entirely — they're agent-initiated and never send on their own.",
  providersTitle: "Providers, models & cost",
  providersItems: [
    "OpenAI (Chat Completions API) and Anthropic (Messages API) are supported.",
    "The model is yours to choose; defaults are a fast, low-cost model per provider.",
    "You pay the provider directly for every draft and auto-reply, metered by your own account. Zynex CRM adds nothing.",
    "Semantic search adds embeddings cost: each document is embedded once at save/reindex, and each question is embedded at retrieval.",
  ],
  privacyTitle: "Privacy note",
  privacyDesc: "Because you bring your own key, conversation text — and any knowledge-base content used for a reply — is sent to your OpenAI or Anthropic account, not to Zynex CRM or any third party.",
  limitsTitle: "Limits",
  limitsItems: [
    "Media, template, and interactive messages aren't sent to the model — only text is used as context.",
    "Beyond the recent-message window of the current conversation and your knowledge base, the assistant has no memory.",
    "The knowledge base is text you paste in; there's no file upload or URL import yet.",
    "Auto-reply only fires inside WhatsApp's 24-hour customer service window.",
  ],
  prevLabel: "Back: Templates",
  nextLabel: "Next: Members",
};

const s = { es, en };

export default function AIAssistantDocPage() {
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
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {locale === "en" ? "Pricing" : "Precios"}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "en" ? "Back to Documentation" : "Volver a Documentación"}
        </Link>

        <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
        <p className="text-lg text-muted-foreground mb-12">{c.subtitle}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">{c.setupTitle}</h2>
            <ul className="space-y-2">
              {c.setupItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
              {c.setupNote}
            </p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.businessTitle}</h2>
            <p className="text-muted-foreground mb-3">{c.businessDesc}</p>
            <ul className="space-y-2">
              {c.businessItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.draftTitle}</h2>
            <p className="text-muted-foreground mb-3">{c.draftDesc}</p>
            <ul className="space-y-2">
              {c.draftItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
              {c.draftNote}
            </p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.autoTitle}</h2>
            <p className="text-muted-foreground mb-3">{c.autoDesc}</p>
            <ul className="space-y-2">
              {c.autoItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.handoffTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.handoffDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.capTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.capDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.kbTitle}</h2>
            <p className="text-muted-foreground mb-3">{c.kbDesc}</p>
            <h3 className="text-lg font-medium mb-2">{c.hybridTitle}</h3>
            <ul className="space-y-2">
              {c.hybridItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
              {c.reindexDesc}
            </p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.precedenceTitle}</h2>
            <p className="text-muted-foreground mb-3">{c.precedenceDesc}</p>
            <ul className="space-y-2">
              {c.precedenceItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic border-l-2 border-primary pl-3">
              {c.draftNote2}
            </p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.providersTitle}</h2>
            <ul className="space-y-2">
              {c.providersItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.privacyTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.privacyDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.limitsTitle}</h2>
            <ul className="space-y-2">
              {c.limitsItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex justify-between">
          <Link
            href="/docs/templates"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link
            href="/docs/members"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
