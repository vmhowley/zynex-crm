"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Automatizaciones",
  subtitle: "Dispara cadenas de pasos en respuesta a eventos de WhatsApp.",
  intro: "Automatizaciones dispara una cadena de pasos en respuesta a un evento de WhatsApp. Úsalo para reacciones de fuego-y-olvida: auto-respuesta a keywords, etiquetar cada nuevo contacto, crear un trato cuando alguien responde 'sí'.",
  flowsNote: "Si necesitas una conversación de múltiples pasos donde el cliente selecciona opciones y el bot ramifica basándose en sus respuestas, usa Flujos en su lugar. Los dos coexisten — flujos tienen precedencia cuando ambos coincidirían.",
  cronNote: "Se requiere cron. Si tu automatización usa un paso de Espera, necesitas el cron de drain configurado.",
  triggersTitle: "El disparador",
  triggersIntro: "Cada automatización tiene exactamente un disparador. Elige cuándo crearla:",
  triggers: [
    { name: "Nuevo mensaje recibido", desc: "Dispara cuando cualquier texto entrante de un contacto." },
    { name: "Primer mensaje entrante", desc: "Dispara cuando el primer mensaje entrante del contacto." },
    { name: "Coincidencia de keyword", desc: "Dispara cuando el texto entrante coincide con una de N keywords. Contiene sin distinción de mayúsculas por defecto." },
    { name: "Nuevo contacto creado", desc: "Dispara cuando una fila de contacto fue añadida (manual, importación CSV, o primer entrante)." },
    { name: "Conversación asignada", desc: "Dispara cuando el assigned_agent_id de la conversación cambió." },
    { name: "Etiqueta añadida", desc: "Dispara cuando una etiqueta específica fue aplicada a un contacto." },
    { name: "Basado en tiempo", desc: "Dispara cuando una expresión cron o HH:mm diaria." },
  ],
  stepsTitle: "Tipos de pasos",
  stepsIntro: "Once tipos de pasos. Añade tantos como quieras; se ejecutan en orden.",
  steps: [
    { name: "Enviar mensaje", desc: "Texto libre. Solo válido dentro de la ventana de 24 horas." },
    { name: "Enviar plantilla", desc: "Plantilla aprobada por Meta con fills de variables. Funciona fuera de la ventana de 24h." },
    { name: "Añadir etiqueta", desc: "Añade una etiqueta al contacto que disparó." },
    { name: "Eliminar etiqueta", desc: "Elimina una etiqueta." },
    { name: "Asignar conversación", desc: "Establece assigned_agent_id. Un agente específico o round-robin." },
    { name: "Actualizar campo de contacto", desc: "Establece una columna de contactos (nombre / email / empresa)." },
    { name: "Crear trato", desc: "Hace un nuevo trato en un pipeline + etapa elegido." },
    { name: "Esperar", desc: "Pausa por N minutos / horas / días. Drena via cron." },
    { name: "Condición", desc: "Ramifica en subárbol sí / no. Ver abajo." },
    { name: "Enviar webhook", desc: "POST a una URL externa con el payload del evento que disparó." },
    { name: "Cerrar conversación", desc: "Establece status = closed en la conversación." },
  ],
  conditionTitle: "Condiciones",
  conditionDesc: "El único paso que ramifica. Una condición tiene:",
  conditionItems: [
    "Sujeto — qué probar: contact_field, tag_presence, message_content, o time_of_day.",
    "Operador — equals, contains, starts_with, is_present, is_absent.",
    "Valor — con qué comparar.",
  ],
  conditionNote: "Si es verdadero, el subárbol 'sí' corre. Si no, el subárbol 'no'. Ambos subárboles pueden tener sus propios pasos (incluyendo condiciones anidadas). A diferencia de Flujos, los pasos de automatización son una cadena lineal más subárboles de condiciones — no un grafo arbitrario.",
  buildTitle: "Construyendo una automatización",
  buildSteps: [
    "/automations → Nueva automatización.",
    "Nómbrala. Solo interno.",
    "Elige el disparador.",
    "Añade pasos. Cada paso elige un tipo, luego renderiza el formulario de configuración de ese tipo.",
    "Activa el toggle. La automatización está ahora en vivo.",
  ],
  waitTitle: "El paso Esperar",
  waitDesc: "La razón por la que se requiere un cron. Un paso Esperar pausa la ejecución y estaciona el run en automation_pending_executions con un timestamp due_at. El cron hace drain de las filas donde due_at <= now() y las reanuda desde el siguiente paso.",
  logsTitle: "La página de Logs",
  logsDesc: "Cada ejecución escribe una fila automation_logs:",
  logsItems: [
    "contact_id — quién la disparó.",
    "trigger_event — el payload que coincidió con el disparador.",
    "steps_executed — JSON array de {step_type, status, output?, error?} en orden de ejecución.",
    "status — success, partial, o failed.",
    "error_message — primer error, si hay.",
  ],
  flowsTitle: "Interacción con Flujos",
  flowsDesc: "El handler de webhook corre el Flujo primero, luego dispatchea automatizaciones. Si un Flujo consume el mensaje entrante, las automatizaciones keyeadas en new_message_received / keyword_match son suprimidas para ese entrante.",
  limitsTitle: "Límites y notas",
  limitsItems: [
    "Sin detección de ciclos. No hagas una cadena que haga loop forever.",
    "Enviar mensaje libre fuera de la ventana de 24h falla. Usa Enviar plantilla.",
    "Pasos webhook no tienen retry.",
    "update_contact_field solo funciona en el schema fijo.",
    "Sin rollback transaccional. Si el paso 3 error, los pasos 1 y 2 ya ocurrieron.",
  ],
  prevLabel: "Atrás: Broadcasts",
  nextLabel: "Siguiente: Flujos",
};

const en = {
  title: "Automations",
  subtitle: "Fire a chain of steps in response to a WhatsApp event.",
  intro: "Automations fires a chain of steps in response to a WhatsApp event. Use it for fire-and-forget reactions: auto-reply to a keyword, tag every new contact, create a deal when someone replies 'yes'.",
  flowsNote: "If you need a multi-step conversation where the customer picks options and the bot branches based on their replies, use Flows instead. The two coexist — flows take precedence when both would match.",
  cronNote: "Cron required. If your automation uses a Wait step, you need the drain cron set up.",
  triggersTitle: "The trigger",
  triggersIntro: "Every automation has exactly one trigger. Pick when you create:",
  triggers: [
    { name: "New message received", desc: "Fires when any inbound text from a contact." },
    { name: "First inbound message", desc: "Fires when the contact's first-ever inbound." },
    { name: "Keyword match", desc: "Fires when inbound text matches one of N keywords. Case-insensitive contains by default." },
    { name: "New contact created", desc: "Fires when a contact row was just added." },
    { name: "Conversation assigned", desc: "Fires when a conversation's assigned_agent_id changed." },
    { name: "Tag added", desc: "Fires when a specific tag was applied to a contact." },
    { name: "Time-based", desc: "Fires when a cron expression or daily HH:mm." },
  ],
  stepsTitle: "Step types",
  stepsIntro: "Eleven step types. Add as many as you want; they execute in order.",
  steps: [
    { name: "Send message", desc: "Free-form text. Only valid inside the 24-hour customer-service window." },
    { name: "Send template", desc: "Meta-approved template with variable fills. Works outside the 24h window." },
    { name: "Add tag", desc: "Add a tag to the triggering contact." },
    { name: "Remove tag", desc: "Remove a tag." },
    { name: "Assign conversation", desc: "Set assigned_agent_id. Either a specific agent OR round-robin." },
    { name: "Update contact field", desc: "Set a contacts column (name / email / company)." },
    { name: "Create deal", desc: "Make a new deal in a pipeline + stage you choose." },
    { name: "Wait", desc: "Pause for N minutes / hours / days. Drains via the cron." },
    { name: "Condition", desc: "Branch into a yes / no subtree. See below." },
    { name: "Send webhook", desc: "POST to an external URL with the triggering event payload." },
    { name: "Close conversation", desc: "Set status = closed on the conversation." },
  ],
  conditionTitle: "Conditions",
  conditionDesc: "The only step that branches. A condition has:",
  conditionItems: [
    "Subject — what to test: contact_field, tag_presence, message_content, or time_of_day.",
    "Operator — equals, contains, starts_with, is_present, is_absent.",
    "Value — what to compare to.",
  ],
  conditionNote: "If true, the 'yes' subtree runs. Else the 'no' subtree. Both subtrees can have their own steps (including nested conditions). Unlike Flows, automation steps are a linear chain plus condition subtrees — not an arbitrary graph.",
  buildTitle: "Building an automation",
  buildSteps: [
    "/automations → New automation.",
    "Name + describe it. Internal-only.",
    "Pick the trigger. Fill its config.",
    "Add steps. Each step picks a type, then renders that type's config form.",
    "Toggle Active. The automation is now live.",
  ],
  waitTitle: "The Wait step",
  waitDesc: "The reason a cron is required. A Wait step pauses execution and parks the run in automation_pending_executions with a due_at timestamp. The cron drains rows where due_at <= now() and resumes them from the next step.",
  logsTitle: "The Logs page",
  logsDesc: "Every execution writes an automation_logs row:",
  logsItems: [
    "contact_id — who triggered it.",
    "trigger_event — the payload that matched the trigger.",
    "steps_executed — JSON array of {step_type, status, output?, error?} in execution order.",
    "status — success, partial (some steps errored), or failed.",
    "error_message — first error, if any.",
  ],
  flowsTitle: "Interaction with Flows",
  flowsDesc: "The webhook handler runs the Flow runner first, then dispatches automations. If a Flow consumes the inbound, automations keyed on new_message_received / keyword_match are suppressed for that inbound.",
  limitsTitle: "Limits & notes",
  limitsItems: [
    "No cycle detection. Don't make one.",
    "Free-form Send message outside the 24h window fails. Use Send template.",
    "Webhook steps have no retry.",
    "update_contact_field only works on the fixed schema.",
    "No transactional rollback. If step 3 errors, steps 1 and 2 have already happened.",
  ],
  prevLabel: "Back: Broadcasts",
  nextLabel: "Next: Flows",
};

const s = { es, en };

export default function AutomationsDocPage() {
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
        <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3 mb-2">{c.flowsNote}</p>
        <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3 mb-8">{c.cronNote}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.triggersTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.triggersIntro}</p>
            <div className="space-y-3">
              {c.triggers.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{t.name}</span>
                    <span className="text-muted-foreground text-sm"> — {t.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.stepsTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.stepsIntro}</p>
            <div className="space-y-3">
              {c.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{step.name}</span>
                    <span className="text-muted-foreground text-sm"> — {step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.conditionTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.conditionDesc}</p>
            <ul className="space-y-2 mb-3">
              {c.conditionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground italic">{c.conditionNote}</p>
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
            <h2 className="text-xl font-semibold mb-3">{c.waitTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.waitDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.logsTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.logsDesc}</p>
            <ul className="space-y-2">
              {c.logsItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.flowsTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.flowsDesc}</p>
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
          <Link href="/docs/broadcasts" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/flows" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
