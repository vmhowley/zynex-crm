"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Contactos",
  subtitle: "Gestiona tu base de clientes con etiquetas, campos personalizados y notas.",
  layoutTitle: "Layout",
  layoutDesc: "Una tabla paginada — 25 contactos por página — con las columnas: Nombre (auto-llenado desde el perfil de WhatsApp), Teléfono en E.164, Email, Empresa, Etiquetas, Creado. Header con buscador y botón Añadir contacto.",
  addTitle: "Añadiendo contactos",
  addManually: "Añadir contacto → llena el formulario (teléfono es el único campo requerido) → Guardar. El contacto aparece en la cima de la lista.",
  addInbox: "Cada mensaje entrante de un número nuevo crea una fila de contacto automáticamente.",
  addCSV: "Importar abre un modal con selector de archivo. El CSV necesita columnas phone y name. Opcionales: email, company, tags (nombres separados por coma). Los teléfonos en formato E.164.",
  addCSVIp: "Tip: WhatsApp acepta E.164 sin espacios ni rayas. El importer normaliza formatos comunes pero rechaza filas sin prefijo de país.",
  tagsTitle: "Etiquetas",
  tagsDesc: "Las etiquetas viven en su propia tabla y son scoped por cuenta — cada miembro de tu cuenta ve la misma biblioteca de etiquetas. Cada etiqueta tiene nombre y color. Etiqueta un contacto desde la vista de detalle, la barra lateral de la bandeja, o desde un Flujo o Automatización.",
  tagManage: "Gestionar en Configuración → Etiquetas: crear, renombrar, re-colorear, eliminar.",
  filterTitle: "Filtrando por etiqueta",
  filterDesc: "La página de contactos no tiene filtro de etiquetas incorporado en 0.2.0. Alternativa: Bandeja de Entrada filtra conversaciones por etiqueta. Broadcasts pueden audience-targeting por etiqueta. Para listas ad-hoc, consulta Supabase directamente.",
  detailTitle: "Vista de detalle del contacto",
  detailDesc: "Haz clic en una fila de contacto → sheet lateral con: Header (nombre, teléfono, avatar, chips de etiqueta), Actividad (feed cronológico de cada conversación, movimiento de trato, cambio de etiqueta), Tratos activos, Conversaciones.",
  deleteTitle: "Eliminando un contacto",
  deleteDesc: "Kebab → Eliminar. Hard-deletes la fila. Por diseño — para cumplimiento GDPR — conversaciones y tratos NO se cascadedean. En su lugar: messages/conversations mantiene su contact_id pointer; deals.contact_id se pone en NULL; broadcast_recipients.contact_id se pone en NULL.",
  customFieldsTitle: "Campos personalizados",
  customFieldsDesc: "No en 0.2.0. contacts tiene un set de columnas fijo. Para campos ad-hoc, usa etiquetas.",
  limitsTitle: "Límites y notas",
  limitsItems: [
    "Un número de teléfono → una fila de contacto por cuenta.",
    "Sin compartir contactos multi-cuenta. Aislados via RLS.",
    "Sin UI de merger de contactos.",
    "Búsqueda es ilike full-table sin índice. Considera un índice trigram para más de ~10k contactos.",
  ],
  prevLabel: "Atrás: Bandeja de Entrada",
  nextLabel: "Siguiente: Pipelines",
};

const en = {
  title: "Contacts",
  subtitle: "Manage your customer database with tags, custom fields and notes.",
  layoutTitle: "Layout",
  layoutDesc: "A paginated table — 25 contacts per page — with columns: Name (auto-filled from WhatsApp profile), Phone in E.164, Email, Company, Tags, Created. Header with search box and Add contact button.",
  addTitle: "Adding contacts",
  addManually: "Add contact → fill the form (phone is the only required field) → Save. The contact appears at the top of the list.",
  addInbox: "Every inbound message from a new phone number creates a contact row automatically.",
  addCSV: "Import opens a modal with a file picker. The CSV needs phone and name columns. Optional: email, company, tags (comma-separated tag names). Phones must be E.164.",
  addCSVIp: "Tip: WhatsApp accepts E.164 with no spaces or dashes. The importer normalises common formats but rejects rows missing the country prefix.",
  tagsTitle: "Tags",
  tagsDesc: "Tags live in their own table and are account-scoped — every member of your tenant sees the same tag library. Each tag has a name and color. Tag a contact from the detail view, the inbox sidebar, or from a Flow or Automation.",
  tagManage: "Manage in Settings → Tags: create, rename, recolour, delete.",
  filterTitle: "Filtering by tag",
  filterDesc: "The contacts page doesn't have a built-in tag filter in 0.2.0. Workaround: Inbox filters conversations by tag. Broadcasts can audience-target by tag. For ad-hoc lists, query Supabase directly.",
  detailTitle: "Contact detail view",
  detailDesc: "Click a contact row → slide-in sheet with: Header (name, phone, avatar, tag chips), Activity (chronological feed), Active deals, Conversations.",
  deleteTitle: "Deleting a contact",
  deleteDesc: "Kebab menu → Delete. Hard-deletes the contacts row. By design — for GDPR compliance — conversations and deals are NOT cascaded. Instead: messages/conversations keep their contact_id pointer; deals.contact_id is set to NULL; broadcast_recipients.contact_id is set to NULL.",
  customFieldsTitle: "Custom fields",
  customFieldsDesc: "Not in 0.2.0. contacts has a fixed column set. For ad-hoc fields, use tags.",
  limitsTitle: "Limits & notes",
  limitsItems: [
    "One phone number → one contact row per tenant.",
    "No multi-tenant contact sharing. Isolated via RLS.",
    "No 'merge contacts' UI.",
    "Search is unindexed full-table ilike. Consider a trigram index for 10k+ contacts.",
  ],
  prevLabel: "Back: Inbox",
  nextLabel: "Next: Pipelines",
};

const s = { es, en };

export default function ContactsDocPage() {
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
        <p className="text-lg text-muted-foreground mb-12">{c.subtitle}</p>

        <div className="space-y-8">
          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.layoutTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.layoutDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.addTitle}</h2>
            <ul className="space-y-2 mb-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>{locale === "en" ? "Manually:" : "Manualmente:"}</strong> {c.addManually}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>{locale === "en" ? "From inbox:" : "Desde bandeja:"}</strong> {c.addInbox}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>CSV:</strong> {c.addCSV}</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground italic border-l-2 border-primary pl-3">{c.addCSVIp}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.tagsTitle}</h2>
            <p className="text-sm text-muted-foreground mb-2">{c.tagsDesc}</p>
            <p className="text-sm text-muted-foreground">{c.tagManage}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.filterTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.filterDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.detailTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.detailDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.deleteTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.deleteDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.customFieldsTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.customFieldsDesc}</p>
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
          <Link href="/docs/inbox" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/pipelines" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
