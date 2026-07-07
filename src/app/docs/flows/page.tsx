"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Flujos",
  subtitle: "Crea chatbots visuales con botones y conversaciones ramificadas de WhatsApp.",
  intro: "Flujos es el segundo de dos módulos de automatización. Donde Automatizaciones reacciona a eventos únicos ('cuando llega un mensaje, haz X'), Flujos te permite construir conversaciones de WhatsApp con botones — menús IVR que el cliente navega tocando botones interactivos o filas de lista.",
  example: "Un cliente messaging tu número con 'soporte'. El Flujo envía un menú: '¿Qué necesitas? [Rastrear pedido] [Devolución] [Hablar con alguien]'. Toca Devolución. El Flujo pide su número de orden, lo captura, y responde con detalles de política o transfiere a un agente humano.",
  flowsVsAuto: "Usa Flujos cuando necesites conversaciones de múltiples pasos con botones. Usa Automatizaciones para reacciones de fuego-y-olvida a eventos.",
  coreTitle: "Conceptos básicos",
  nodeTitle: "Nodos",
  nodesIntro: "Nueve tipos de nodos:",
  nodes: [
    { type: "start", desc: "Marca el punto de entrada. Avanza a su next_node_key." },
    { type: "send_message", desc: "Envía un mensaje de texto plano, luego avanza automáticamente." },
    { type: "send_buttons", desc: "Envía un menú de botones (1–3 botones), luego suspende." },
    { type: "send_list", desc: "Envía un menú de lista (1–10 filas), luego suspende." },
    { type: "collect_input", desc: "Envía un prompt, captura la siguiente respuesta de texto en una variable." },
    { type: "condition", desc: "Ramifica basándose en una variable capturada, tag de contacto, o campo." },
    { type: "set_tag", desc: "Añade o elimina una etiqueta en el contacto." },
    { type: "handoff", desc: "Marca la conversación como pendiente para que un humano la recoja." },
    { type: "end", desc: "Termina el run limpiamente." },
  ],
  nodesNote: "Nodos auto-avanzantes (start, send_message, condition, set_tag) corren inline sin esperar input. Nodos suspendientes (send_buttons, send_list, collect_input) estacionan el run hasta que el cliente responde. Nodos terminales (handoff, end) terminan el run.",
  triggerTitle: "Disparador",
  triggers: [
    "Keyword — cualquier texto entrante que contenga una de las keywords configuradas.",
    "First inbound message — el primer mensaje entrante del contacto.",
    "Manual — nunca auto-inicia. Reservado para v2.",
  ],
  varsTitle: "Variables",
  varsDesc: "El nodo collect_input escribe la respuesta del cliente en flow_runs.vars[<var_key>]. Nodos posteriores interpolan vía sintaxis {{vars.email}}:",
  varsExample: "send_message: 'Gracias {{vars.name}}, cuál es tu email?' collect_input (var_key=email): 'Pon tu email abajo' send_message: 'Confirmado — mandando a {{vars.email}}.'",
  varsNote: "Variables faltantes se renderizan como string vacío. La interpolación es no-recursiva: un cliente no puede contrabandear {{vars.X}} a través de collect_input.",
  fallbackTitle: "Política de fallback",
  fallbackDesc: "Qué pasa cuando un cliente escribe algo inesperado en un nodo suspendiente. Por defecto: re-envía el prompt hasta 2 veces, luego transfiere a un agente. Configurable por flujo.",
  buildTitle: "Construyendo un flujo",
  buildSteps: [
    "Abre el constructor — Sidebar → Flujos → Nuevo flujo.",
    "Elige un disparador. Para tu primer flujo, usa Keyword y configura una palabra distintiva.",
    "Construye el grafo de nodos. Añade nodos, conéctalos con Advances to.",
    "El validador al fondo de la página verifica config faltante, nodos inalcanzables, etc.",
    "Activa. El validador corre server-side de nuevo; si hay errores se devuelven.",
  ],
  templatesTitle: "Plantillas",
  templatesDesc: "Tres plantillas incluidas: Menú de bienvenida (4 nodos), Bot FAQ (7 nodos), Captura de leads (6 nodos). Clona cualquiera, edita copy, apunta los botones/handoffs a tus propias etiquetas o agentes.",
  runTitle: "Historial de runs",
  runDesc: "/flows/[id]/runs muestra los 50 runs más recientes. Cada fila expande a timeline de eventos: started, node_entered, message_sent, reply_received, fallback_fired, handoff, timeout, completed, error.",
  runtimeTitle: "El runtime",
  runtimeDesc: "Cada webhook entrante llama al runner antes del dispatch de automatizaciones. El flujo: busca el run activo del contacto, si hay uno idempotency-check el message id contra eventos past, avanza el nodo suspendiente actual basándose en la respuesta. Si no hay run activo, busca un flujo activo cuyo trigger coincida. Persiste current_node_key via UPDATE optimista.",
  sweepTitle: "Sweep de stale-run cron",
  sweepDesc: "Sin un sweep, un cliente que abandona un flujo a mitad de conversación mantiene su slot para siempre, bloqueando nuevos triggers. El cron hace drain de runs marcados como timed_out después de 24h de inactividad.",
  sweepEndpoint: "GET /api/flows/cron con header x-cron-secret: <AUTOMATION_CRON_SECRET>",
  limitsTitle: "Límites y restricciones conocidas",
  limitsItems: [
    "Un run activo por contacto. Forzado por un índice único parcial.",
    "Máximo 3 botones por send_buttons / 10 filas por send_list — los caps de WhatsApp.",
    "El validador corre solo al activar. Un flujo con punteros rotos fallará pero no se flaggeará mientras editas.",
    "El runner tiene un cap de seguridad de 64 pasos por dispatch.",
    "Mid-edit reads: guardar un flujo hace delete-then-insert en sus filas de nodos. No transaccional.",
  ],
  prevLabel: "Atrás: Automatizaciones",
  nextLabel: "Siguiente: Plantillas",
};

const en = {
  title: "Flows",
  subtitle: "Create visual chatbots with buttons and branching WhatsApp conversations.",
  intro: "Flows is the second of two automation modules. Where Automations react to single events ('when a new message arrives, do X'), Flows lets you build branching, button-driven WhatsApp conversations — IVR-style menus your customer navigates by tapping interactive buttons or list rows.",
  example: "A customer messages your number with 'support'. The Flow auto-sends a menu: 'What do you need? [Track order] [Refund] [Talk to someone]'. They tap Refund. The Flow asks for their order number, captures it, and either replies with policy details or hands off to a human agent.",
  flowsVsAuto: "Use Flows for multi-step conversations. Use Automations for fire-and-forget event reactions.",
  coreTitle: "Core concepts",
  nodeTitle: "Nodes",
  nodesIntro: "Nine node types:",
  nodes: [
    { type: "start", desc: "Marks the entry point. Advances to its next_node_key." },
    { type: "send_message", desc: "Sends plain text message, then auto-advances." },
    { type: "send_buttons", desc: "Sends a button menu (1–3 buttons), then suspends." },
    { type: "send_list", desc: "Sends a list menu (1–10 rows), then suspends." },
    { type: "collect_input", desc: "Sends a prompt, captures the next text reply into a variable." },
    { type: "condition", desc: "Branches on a captured var, contact tag, or contact field." },
    { type: "set_tag", desc: "Adds or removes a tag on the contact." },
    { type: "handoff", desc: "Marks the conversation pending so a human picks it up." },
    { type: "end", desc: "Terminates the run cleanly." },
  ],
  nodesNote: "Auto-advancing nodes (start, send_message, condition, set_tag) run inline without waiting. Suspending nodes (send_buttons, send_list, collect_input) park the run until the customer replies. Terminal nodes (handoff, end) end the run.",
  triggerTitle: "Trigger",
  triggers: [
    "Keyword — any inbound text containing one of the configured keywords.",
    "First inbound message — the contact's first-ever inbound.",
    "Manual — never auto-starts. Reserved for v2.",
  ],
  varsTitle: "Variables",
  varsDesc: "The collect_input node writes the customer's reply into flow_runs.vars[<var_key>]. Downstream nodes interpolate via {{vars.email}} syntax:",
  varsExample: "send_message: 'Thanks {{vars.name}}, what's your email?' collect_input (var_key=email): 'Drop your email below' send_message: 'Got it — confirming your order to {{vars.email}}.'",
  varsNote: "Missing vars render as empty string. Interpolation is non-recursive.",
  fallbackTitle: "Fallback policy",
  fallbackDesc: "What happens when a customer types something unexpected on a suspending node. Default: re-send the prompt up to 2 times, then hand off to an agent. Configurable per flow.",
  buildTitle: "Building a flow",
  buildSteps: [
    "Open the builder — Sidebar → Flows → New flow.",
    "Pick a trigger. For your first flow, pick Keyword with one distinctive word.",
    "Build the node graph. Add nodes, connect them with Advances to.",
    "The validator at the bottom checks for missing config, unreachable nodes, dangling pointers.",
    "Activate. The validator runs server-side again; if there are errors the API returns them.",
  ],
  templatesTitle: "Templates",
  templatesDesc: "Three first-party templates ship with the module: Welcome menu (4 nodes), FAQ bot (7 nodes), Lead capture (6 nodes). Clone any, edit copy, point buttons/handoffs at your own tags or agents.",
  runTitle: "Run history",
  runDesc: "/flows/[id]/runs shows the 50 most recent runs. Each row expands to event timeline: started, node_entered, message_sent, reply_received, fallback_fired, handoff, timeout, completed, error.",
  runtimeTitle: "The runtime",
  runtimeDesc: "Every inbound webhook calls the runner before automations dispatch. The flow: looks up the contact's active run, idempotency-checks the Meta message id, advances the current suspending node. If no active run: scans for a matching trigger, creates a new run and walks the entry node.",
  sweepTitle: "Stale-run sweep cron",
  sweepDesc: "Without a sweep, a customer who abandons a flow mid-conversation keeps their slot forever, blocking new triggers. The cron drains runs marked as timed_out after 24h of inactivity.",
  sweepEndpoint: "GET /api/flows/cron with header x-cron-secret: <AUTOMATION_CRON_SECRET>",
  limitsTitle: "Limits & known constraints",
  limitsItems: [
    "One active run per contact. Enforced by a partial unique index.",
    "Max 3 buttons per send_buttons / 10 rows per send_list — WhatsApp's caps.",
    "Validator runs at activate time only.",
    "The runner has a hard 64-step safety cap per dispatch.",
    "Mid-edit reads: saving a flow does delete-then-insert on its node rows. Not transactional.",
  ],
  prevLabel: "Back: Automations",
  nextLabel: "Next: Templates",
};

const s = { es, en };

export default function FlowsDocPage() {
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
        <p className="text-lg text-muted-foreground mb-6">{c.subtitle}</p>
        <p className="text-muted-foreground mb-2">{c.intro}</p>
        <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3 mb-8">{c.flowsVsAuto}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.nodeTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.nodesIntro}</p>
            <div className="space-y-3">
              {c.nodes.map((n, i) => (
                <div key={i} className="flex items-start gap-3">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded shrink-0 font-mono text-primary">{n.type}</code>
                  <span className="text-sm text-muted-foreground">{n.desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground italic">{c.nodesNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.triggerTitle}</h2>
            <ul className="space-y-2">
              {c.triggers.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.varsTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.varsDesc}</p>
            <div className="bg-muted rounded-lg p-3 font-mono text-xs text-muted-foreground mb-3 whitespace-pre-wrap">{c.varsExample}</div>
            <p className="text-sm text-muted-foreground italic">{c.varsNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.fallbackTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.fallbackDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.buildTitle}</h2>
            <ol className="space-y-2">
              {c.buildSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.templatesTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.templatesDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.runTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.runDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.runtimeTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.runtimeDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.sweepTitle}</h2>
            <p className="text-sm text-muted-foreground mb-2">{c.sweepDesc}</p>
            <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{c.sweepEndpoint}</code>
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
          <Link href="/docs/automations" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/templates" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
