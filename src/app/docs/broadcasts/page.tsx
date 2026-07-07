"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Broadcasts",
  subtitle: "Envía mensajes masivos a tu lista de contactos usando plantillas de WhatsApp.",
  intro: "Broadcasts envía una sola plantilla aprobada a un grupo grande de contactos. Úsalo para anuncios de productos, notificaciones de restock, horarios de festivos, nudges de carritos abandonados — lo que sea el mismo mensaje a muchas personas.",
  wizardTitle: "El wizard de 4 pasos",
  step1Title: "Paso 1 — Elegir plantilla",
  step1Desc: "Escoge la plantilla del cuerpo de WhatsApp a enviar. La lista muestra solo plantillas aprobadas — borradores y rechazadas se filtran.",
  step2Title: "Paso 2 — Seleccionar audiencia",
  step2Desc: "Cuatro formas de elegir receptores:",
  audiences: [
    { name: "Todos los contactos", desc: "Cada contacto en tu cuenta." },
    { name: "Por etiqueta(s)", desc: "Una o más etiquetas. Lógica AND — un contacto debe tener todas las etiquetas seleccionadas." },
    { name: "Por campo de contacto", desc: "Filtro en nombre / email / empresa con operadores es, no es, contiene." },
    { name: "Subida CSV", desc: "Archivo .csv con columna phone. Teléfonos no en tu cuenta se saltan." },
  ],
  step3Title: "Paso 3 — Personalizar",
  step3Desc: "Para cada placeholder {{1}}, {{2}}... en el cuerpo de la plantilla, elige cómo llenarlo:",
  personalization: [
    "Texto literal — mismo valor para cada receptor.",
    "Campo de contacto — {{name}} por receptor, etc.",
  ],
  step4Title: "Paso 4 — Programar y enviar",
  step4Desc: "Dos opciones: Enviar ahora (broadcast se mueve a 'sending' inmediatamente) o Programar (date + time picker; el broadcast se sienta en 'scheduled' hasta que el cron lo dispara).",
  cronNote: "Los broadcasts programados requieren el mismo /api/automations/cron que los Wait steps de Automatizaciones.",
  listTitle: "Página de lista",
  listDesc: "Muestra cada broadcast enviado o programado con columnas: Nombre, Plantilla, Receptores, Entrega (%), Leídos (%), Estado, Fecha.",
  statusesTitle: "Estados",
  statuses: [
    { name: "Draft", desc: "Guardado del wizard pero nunca enviado. Editable." },
    { name: "Scheduled", desc: "En cola para envío futuro." },
    { name: "Sending", desc: "Despachando activamente a receptores." },
    { name: "Sent", desc: "Todo receptor tiene estado terminal." },
    { name: "Failed", desc: "El broadcast mismo errorió (ej: plantilla revocada)." },
  ],
  detailTitle: "Vista de detalle",
  detailDesc: "Click en el nombre de un broadcast para ver: Tabla de receptores (cada contacto, estado de entrega, timestamps), Stats (recuento completo de aggregates), Filtro por estado.",
  deliveryTitle: "Cómo funciona el tracking de entrega",
  deliveryDesc: "Cuando un broadcast envía, el motor escribe una fila broadcast_recipients por receptor. Para cada uno, llama la Cloud API de Meta y guarda el message id. Luego, cuando los webhooks de Meta llegan (sent, delivered, read, reply), el handler matchea en message_id y actualiza la fila — y los contadores aggregate del broadcast en un UPDATE atómico.",
  contactDeleteNote: "Si eliminas un contacto que recibió un broadcast: broadcast_recipients.contact_id se pone en NULL. La fila sobrevive; la vista de detalle renderiza 'Contacto desconocido' con el teléfono original.",
  limitsTitle: "Límites y notas",
  limitsItems: [
    "Solo plantillas. Broadcasts deben usar una plantilla aprobada por Meta.",
    "El cap de rate de Meta es el techo práctico. Cloud API es 80 msg/sec por defecto.",
    "La subida CSV solo añade receptores, no contactos. Teléfonos no en tu cuenta se dropean.",
    "Sin A/B testing. Divide tu audiencia y envía dos broadcasts.",
    "No se soporta editar un broadcast en envío. Cancela y reenvía.",
    "Broadcasts a receptores desconectados pueden drag down tu quality rating en Meta.",
  ],
  prevLabel: "Atrás: Pipelines",
  nextLabel: "Siguiente: Automatizaciones",
};

const en = {
  title: "Broadcasts",
  subtitle: "Send bulk messages to your contact list using WhatsApp templates.",
  intro: "Broadcasts sends a single approved template message to a large group of contacts. Use it for product announcements, restock notifications, holiday hours, abandoned-cart nudges — anything that's the same message to many people.",
  wizardTitle: "The 4-step wizard",
  step1Title: "Step 1 — Choose template",
  step1Desc: "Picks the WhatsApp template body to send. The list shows approved templates only — drafts and rejected ones are filtered out.",
  step2Title: "Step 2 — Select audience",
  step2Desc: "Four ways to pick recipients:",
  audiences: [
    { name: "All contacts", desc: "Every contact in your tenant." },
    { name: "By tag(s)", desc: "One or more tags. AND logic — a contact must have all selected tags." },
    { name: "By contact field", desc: "Filter on name / email / company with operators is, is not, contains." },
    { name: "CSV upload", desc: ".csv file with a phone column. Phones not in your tenant are skipped." },
  ],
  step3Title: "Step 3 — Personalise",
  step3Desc: "For each {{1}}, {{2}}... placeholder in the template body, pick how to fill it:",
  personalization: [
    "Literal text — same value for every recipient.",
    "Contact field — {{name}} per recipient, etc.",
  ],
  step4Title: "Step 4 — Schedule & send",
  step4Desc: "Two radio options: Send now or Schedule (date + time picker). Scheduled sends require the same /api/automations/cron as Automation Waits.",
  cronNote: "Scheduled sends require the same /api/automations/cron drain as Automation Waits.",
  listTitle: "List page",
  listDesc: "Shows every broadcast sent or scheduled. Columns: Name, Template, Recipients, Delivery %, Read %, Status, Date.",
  statusesTitle: "Statuses",
  statuses: [
    { name: "Draft", desc: "Saved from the wizard but never sent. Editable." },
    { name: "Scheduled", desc: "Queued for a future send time." },
    { name: "Sending", desc: "Actively dispatching to recipients." },
    { name: "Sent", desc: "Every recipient has a terminal status." },
    { name: "Failed", desc: "The broadcast itself errored (e.g. template revoked)." },
  ],
  detailTitle: "Detail view",
  detailDesc: "Click a broadcast name to see: Recipient table (contact, delivery status, timestamps), Stats, Filter by status.",
  deliveryTitle: "How delivery tracking works",
  deliveryDesc: "When a broadcast sends, the engine writes a broadcast_recipients row per recipient. For each, it calls the Meta Cloud API and stores the message id. Then, as Meta sends webhook callbacks, the handler matches on message_id and updates the matching row — and the broadcast's aggregate counter columns in one atomic UPDATE.",
  contactDeleteNote: "If you delete a contact who received a broadcast: broadcast_recipients.contact_id is set to NULL. The row survives; the detail view renders 'Unknown contact' with the original phone.",
  limitsTitle: "Limits & notes",
  limitsItems: [
    "Templates only. Meta forbids free-form bulk sends.",
    "Meta's per-phone-number rate cap is the practical ceiling. Cloud API is 80 msg/sec out of the box.",
    "The wizard's CSV upload only adds recipients, not contacts. Phones not in your tenant are dropped.",
    "No A/B testing. Split your audience and send two broadcasts.",
    "Editing a sending broadcast isn't supported. Cancel and resend.",
    "Bulk broadcasts to disengaged recipients can drag down your phone number's quality rating.",
  ],
  prevLabel: "Back: Pipelines",
  nextLabel: "Next: Automations",
};

const s = { es, en };

export default function BroadcastsDocPage() {
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
            <h2 className="text-xl font-semibold mb-3">{c.wizardTitle}</h2>

            <h3 className="text-lg font-medium mb-2">{c.step1Title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{c.step1Desc}</p>

            <h3 className="text-lg font-medium mb-2">{c.step2Title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{c.step2Desc}</p>
            <div className="space-y-3 mb-4">
              {c.audiences.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{a.name}</span>
                    <span className="text-muted-foreground text-sm"> — {a.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-medium mb-2">{c.step3Title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{c.step3Desc}</p>
            <ul className="space-y-2 mb-4">
              {c.personalization.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <h3 className="text-lg font-medium mb-2">{c.step4Title}</h3>
            <p className="text-sm text-muted-foreground">{c.step4Desc}</p>
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3 mt-2">{c.cronNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.listTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.listDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.statusesTitle}</h2>
            <div className="space-y-2">
              {c.statuses.map((st, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{st.name}</span>
                    <span className="text-muted-foreground text-sm"> — {st.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.detailTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.detailDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.deliveryTitle}</h2>
            <p className="text-sm text-muted-foreground mb-2">{c.deliveryDesc}</p>
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">{c.contactDeleteNote}</p>
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
          <Link href="/docs/pipelines" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/automations" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
