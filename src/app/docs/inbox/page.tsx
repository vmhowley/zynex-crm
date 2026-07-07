"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Bandeja de Entrada",
  subtitle: "Espacio de trabajo compartido para conversaciones de WhatsApp con tu equipo.",
  layoutTitle: "Layout",
  layoutDesc: "Tres paneles en desktop:",
  layoutRows: [
    ["Izquierda — Lista de conversaciones", "Todas las conversaciones,reply más reciente primero. Buscador, filtro de estado (Abierta/Pendiente/Cerrada), badges de no-leídos."],
    ["Centro — Hilo de mensajes", "Mensajes de la conversación seleccionada, más antiguo arriba. Compositor abajo."],
    ["Derecha — Barra lateral del contacto", "Teléfono, etiquetas, notas, tarjetas de trato, historial de conversación reciente. Campos editables inline."],
  ],
  deepLink: "Deep-links funcionan: /inbox?c=<conversation_id> abre directo a un hilo específico.",
  statusTitle: "Estados de conversación",
  statusRows: [
    ["Abierta", "Conversación activa. Default para cualquier entrante.", "Punto verde"],
    ["Pendiente", "Cliente espera por ti / transferido a un agente.", "Punto ámbar"],
    ["Cerrada", "Resuelta. Oculta del filtro por defecto; aún buscable.", "Punto gris"],
  ],
  sendTitle: "Enviando un mensaje",
  sendDesc: "El compositor soporta cinco tipos de mensaje:",
  sendTypes: [
    ["Texto plano", "Escribe y presiona Enter (Shift+Enter para newline)."],
    ["Plantilla pre-aprobada", "Haz clic en el picker de plantillas, busca por nombre o categoría, llena variables, prevista, envía."],
    ["Medios", "Foto, video, documento o nota de voz. Click en el clip, pick tipo, envía."],
    ["Reply-to-quote", "Hover o long-press un mensaje, pick icono de reply. El compositor muestra la quote preview."],
    ["Reacción", "Hover o long-press, pick emoji. Se reenvía a WhatsApp y round-trips."],
  ],
  windowNote: "Dentro de la ventana de 24 horas WhatsApp acepta texto libre y medios. Fuera de esa ventana solo plantillas aprobadas.",
  mediaTitle: "Enviando medios",
  mediaDesc: "El archivo se sube a Supabase Storage y WhatsApp lo descarga de ahí. Límites: Foto (PNG/JPEG/WebP, 5MB), Video (MP4/3GP, 16MB), Documento (PDF/Word/Excel/PPTX/TXT, 16MB), Nota de voz (grabada in-app, 16MB).",
  realTimeTitle: "Tiempo real",
  realTimeDesc: "Dos suscripciones Supabase realtime: messages (nuevos INSERTs aparecen sin refresh) y conversations (cambios de status, contadores, updates).",
  bubblesTitle: "Burbujas de mensaje",
  bubblesDesc: "Cada burbuja muestra: texto, timestamp, e icono de estado de entrega en mensajes salientes:",
  bubbleStatuses: [
    ["◦", "Enviando — request en cola"],
    ["✓", "Enviado — Meta aceptó"],
    ["✓✓", "Entregado — teléfono confirmó recibo"],
    ["✓✓ (filled)", "Leído — cliente abrió el chat"],
    ["!", "Fallido — tooltip de error; tap para reintentar"],
  ],
  contactSidebarTitle: "Barra lateral del contacto",
  contactSidebarDesc: "Campos editables inline: nombre, email, empresa, etiquetas, notas. Muestra trato activo con links a pipelines, y las últimas 5 conversaciones.",
  searchTitle: "Búsqueda",
  searchDesc: "El buscador al inicio de la lista corre ilike a través del nombre del contacto, teléfono, y preview del último mensaje. NO busca el cuerpo de todos los mensajes — eso se hace en SQL contra messages.content_text.",
  limitsTitle: "Límites y notas",
  limitsItems: [
    "Lista de conversaciones paginada server-side. Primera página = 50 filas.",
    "Hilo de mensajes carga 50 mensajes por fetch.",
    "Los recibos de lectura dependen de la configuración de privacidad del cliente.",
    "Medios entrantes se descargan on-demand la primera vez que se renderizan.",
    "La ventana de 24 horas: una vez que el cliente te envía, tienes 24 horas de respuestas libres. Después solo plantillas aprobadas.",
  ],
  prevLabel: "Atrás: Primeros Pasos",
  nextLabel: "Siguiente: Contactos",
};

const en = {
  title: "Inbox",
  subtitle: "Shared workspace for WhatsApp conversations with your team.",
  layoutTitle: "Layout",
  layoutDesc: "Three panes on desktop:",
  layoutRows: [
    ["Left — Conversation list", "All conversations, newest reply first. Search, status filter (Open/Pending/Closed), unread badges."],
    ["Middle — Message thread", "Selected conversation's messages, oldest at top. Composer at the bottom."],
    ["Right — Contact sidebar", "Phone, tags, notes, deal cards, recent conversation history. Inline-editable fields."],
  ],
  deepLink: "Deep-links work: /inbox?c=<conversation_id> opens straight to a specific thread.",
  statusTitle: "Conversation statuses",
  statusRows: [
    ["Open", "Active back-and-forth. Default for any new inbound.", "Green dot"],
    ["Pending", "Customer waiting on you / handed off to an agent.", "Amber dot"],
    ["Closed", "Resolved. Hidden from the default filter; still searchable.", "Slate dot"],
  ],
  sendTitle: "Sending a message",
  sendDesc: "The composer supports five kinds of outbound:",
  sendTypes: [
    ["Plain text", "Type and hit Enter (Shift+Enter for newline)."],
    ["Pre-approved template", "Click the template picker, fill variables, preview, send."],
    ["Media", "Photo, video, document, or voice note. Click the paperclip, pick a type."],
    ["Reply-to-quote", "Hover or long-press a message, pick reply icon. Composer shows quoted preview above the text field."],
    ["Reaction", "Hover or long-press, tap an emoji. Reactions also forward to WhatsApp and round-trip."],
  ],
  windowNote: "Within the 24-hour customer-service window WhatsApp accepts free-form text and media. Outside that window Meta enforces template-only sends.",
  mediaTitle: "Sending media",
  mediaDesc: "The file uploads to Supabase Storage and WhatsApp fetches it from there when the message sends. Limits: Photo (PNG/JPEG/WebP, 5MB), Video (MP4/3GP, 16MB), Document (PDF/Word/Excel/PPTX/TXT, 16MB), Voice note (recorded in-app, 16MB).",
  realTimeTitle: "Real time",
  realTimeDesc: "Two Supabase realtime subscriptions: messages (new INSERTs from the webhook appear without refresh) and conversations (status changes, unread counter bumps, last-message updates).",
  bubblesTitle: "Message bubbles",
  bubblesDesc: "Each bubble shows text, timestamp, and a delivery status icon on outbound messages:",
  bubbleStatuses: [
    ["◦", "Sending — request queued, no Meta ack yet"],
    ["✓", "Sent — Meta accepted the message"],
    ["✓✓", "Delivered — phone confirmed receipt"],
    ["✓✓ (filled)", "Read — customer opened the chat"],
    ["!", "Failed — see error tooltip; tap to retry"],
  ],
  contactSidebarTitle: "Contact sidebar",
  contactSidebarDesc: "Inline-editable fields: name, email, company, tags, notes. Shows active deals with links to pipelines, and the last 5 threads with this contact.",
  searchTitle: "Search",
  searchDesc: "Top-of-list search runs ilike across the contact's name, phone, and the last message preview. It does NOT full-text search every message body — that's intentional to keep the inbox snappy. For message-body search use a Supabase SQL query against messages.content_text.",
  limitsTitle: "Limits & notes",
  limitsItems: [
    "Conversation list is paginated server-side. First page = 50 rows.",
    "Message thread loads 50 messages per fetch.",
    "WhatsApp delivery receipts depend on the customer's privacy settings.",
    "Media in messages: inbound downloads on demand, then caches in Supabase Storage.",
    "24-hour window: once the customer messages you, you have 24 hours of free-form replies. After that, only approved templates send.",
  ],
  prevLabel: "Back: Getting Started",
  nextLabel: "Next: Contacts",
};

const s = { es, en };

export default function InboxDocPage() {
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
        <p className="text-sm text-muted-foreground mb-8 italic border-l-2 border-primary pl-3">{c.deepLink}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.layoutTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.layoutDesc}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Pane</th>
                    <th className="text-left py-2 px-3 font-medium">{locale === "en" ? "What's in it" : "Lo que tiene"}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.layoutRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">{row[0]}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.statusTitle}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">{locale === "en" ? "When to use" : "Cuándo usar"}</th>
                    <th className="text-left py-2 px-3 font-medium">{locale === "en" ? "Badge" : "Badge"}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.statusRows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 px-3 font-medium">{row[0]}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row[1]}</td>
                      <td className="py-2 px-3 text-muted-foreground">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.sendTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.sendDesc}</p>
            <div className="space-y-2">
              {c.sendTypes.map((type, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{type[0]}</span>
                    <span className="text-muted-foreground text-sm"> — {type[1]}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground italic border-l-2 border-primary pl-3">{c.windowNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.mediaTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.mediaDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.realTimeTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.realTimeDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.bubblesTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.bubblesDesc}</p>
            <div className="space-y-1">
              {c.bubbleStatuses.map((status, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <code className="w-8 font-mono text-primary">{status[0]}</code>
                  <span className="text-muted-foreground">{status[1]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.contactSidebarTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.contactSidebarDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.searchTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.searchDesc}</p>
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
          <Link href="/docs/getting-started" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/contacts" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
