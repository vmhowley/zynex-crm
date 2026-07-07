"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Pipelines",
  subtitle: "Tableros Kanban para seguir tus tratos y proceso de ventas.",
  layoutTitle: "Layout",
  layoutRows: [
    ["Barra superior", "Selector de pipeline, botón Añadir trato."],
    ["Franja de analíticas", "Números rápidos: valor total del pipeline, deals por etapa, % ganados."],
    ["Tablero", "Una columna por etapa. Tarjetas de tratos apiladas dentro."],
  ],
  dataModelTitle: "El modelo de datos",
  dataModelIntro: "Pipelines contiene deals moviéndose a través de etapas — arrastra para reordenar, haz clic para editar, múltiples pipelines si tu negocio tiene embudos distintos.",
  dataModelItems: [
    { name: "Pipelines", desc: "Contenedor de nivel superior. Un usuario puede tener muchos." },
    { name: "Etapas", desc: "Columnas ordenadas dentro de un pipeline. Cada etapa tiene nombre, color y posición. Un nuevo pipeline sembrar cinco etapas por defecto: Nuevo Lead, Calificado, Propuesta Enviada, Negociación, Ganado." },
    { name: "Tratos", desc: "Las tarjetas. Pertenecen a un pipeline + etapa + opcionalmente un contacto y/u asignado." },
  ],
  dealFieldsTitle: "Campos de un trato",
  dealFields: [
    ["Título", "Nombre corto visible en la tarjeta."],
    ["Valor", "Numérico. Nuevos tratos usan la moneda por defecto de la cuenta."],
    ["Contacto", "El cliente de este trato. Anulable."],
    ["Conversación", "El hilo que originó el trato, cuando aplica."],
    ["Asignado", "El miembro del equipo responsable."],
    ["Fecha de cierre esperada", "Campo opcional de forecasting."],
    ["Notas", "Texto libre."],
    ["Estado", "open / won / lost. Independiente de la etapa."],
  ],
  statusVsStageTitle: "Estado vs Etapa",
  statusVsStage: "Etapa = dónde está el trato en el tablero. Estado = estado terminal del trato (open, won, lost). Ganado/Perdido se queda en el tablero pero se de-emphasiza visualmente.",
  workingTitle: "Trabajando con tratos",
  createItems: ["Añadir trato en la barra superior → formulario con etapa por defecto.", "+ en el encabezado de columna → formulario con esa columna pre-seleccionada.", "Desde la barra lateral del contacto en Bandeja de Entrada → crea un trato con el cliente y conversación ya adjuntos."],
  editDesc: "Haz clic en una tarjeta. El formulario se abre como sheet lateral.",
  moveDesc: "Arrastra una tarjeta de una columna a otra. La UI actualiza optimisticamente.",
  closeDesc: "En el formulario del trato, cambia Estado a won o lost.",
  deleteDesc: "Kebab en la tarjeta → Eliminar. Hard-delete. Sin archive.",
  multiTitle: "Múltiples pipelines",
  multiDesc: "Útil cuando tu negocio tiene embudos verdaderamente separados. Cada pipeline tiene su propia configuración de etapas.",
  manageDesc: "Gestionar pipelines abre un panel: renombrar etapas, reordenar, añadir, eliminar (solo si ningún trato la referencia), eliminar pipeline (solo si vacío).",
  contactDeleteTitle: "Comportamiento al eliminar contacto",
  contactDeleteDesc: "Si un contacto se elimina mientras tiene tratos abiertos: el contact_id del trato se pone en NULL — la fila sobrevive. La tarjeta se renderiza como 'Contacto desconocido'. Se puede re-adjuntar editando el trato.",
  analyticsTitle: "Analíticas",
  analyticsDesc: "La franja sobre el tablero muestra: Valor total (suma de valor de tratos open), Deals por etapa, % Ganado (ganado / (ganado + perdido) sobre 90 días). Totales formateados en la moneda por defecto de la cuenta.",
  limitsTitle: "Límites y notas",
  limitsItems: [
    "Sin probabilidad por trato o lógica de forecast.",
    "Drag-drop solo en desktop.",
    "Pipelines son scoped por cuenta via RLS. El primer acceso crea un 'Sales Pipeline' por defecto automáticamente.",
  ],
  prevLabel: "Atrás: Contactos",
  nextLabel: "Siguiente: Broadcasts",
};

const en = {
  title: "Pipelines",
  subtitle: "Kanban boards to track your deals and sales process.",
  layoutTitle: "Layout",
  layoutRows: [
    ["Top bar", "Pipeline selector dropdown, Add deal button."],
    ["Analytics strip", "Quick numbers: total pipeline value, count of deals per stage, won %."],
    ["Board", "One column per stage, left-to-right. Deal cards stack inside."],
  ],
  dataModelTitle: "The data model",
  dataModelIntro: "Pipelines is the sales side. A Kanban board of deals moving through stages — drag to reorder, click a card to edit, multiple pipelines if your business splits sales into distinct funnels.",
  dataModelItems: [
    { name: "Pipelines", desc: "Top-level container. A user can have many." },
    { name: "Stages", desc: "Ordered columns within a pipeline. Each stage has a name, colour, and position. A new pipeline seeds five default stages: New Lead, Qualified, Proposal Sent, Negotiation, Won." },
    { name: "Deals", desc: "The cards. Belong to a pipeline + stage + optionally a contact and/or assignee." },
  ],
  dealFieldsTitle: "Deal fields",
  dealFields: [
    ["Title", "Short name visible on the card."],
    ["Value", "Numeric. New deals default to your account's currency."],
    ["Contact", "The customer this deal is about. Nullable."],
    ["Conversation", "The thread that spawned the deal, when applicable."],
    ["Assignee", "The team member responsible."],
    ["Expected close date", "Optional forecasting field."],
    ["Notes", "Free-form."],
    ["Status", "open / won / lost. Independent of stage."],
  ],
  statusVsStageTitle: "Status vs stage",
  statusVsStage: "Stage = where the deal sits on the board. Status = the deal's terminal state (open, won, lost). Won/lost deals stay on the board but are visually de-emphasised.",
  workingTitle: "Working with deals",
  createItems: ["Add deal in the top bar → form with defaulted stage.", "+ in a column header → form with that column pre-picked.", "From the inbox contact sidebar → creates a deal with customer + conversation already attached."],
  editDesc: "Click a card. The deal form opens as a side sheet.",
  moveDesc: "Drag a card from one column to another. The UI updates optimistically.",
  closeDesc: "In the deal form, switch Status to won or lost.",
  deleteDesc: "Kebab on the card → Delete. Hard-delete. No archive.",
  multiTitle: "Multiple pipelines",
  multiDesc: "Useful when your business has truly separate funnels. Each pipeline has its own stage configuration.",
  manageDesc: "Manage pipelines opens a panel: rename, reorder stages, add, delete (only if no deals reference it), delete pipeline (only if empty).",
  contactDeleteTitle: "Contact deletion behaviour",
  contactDeleteDesc: "If a contact gets deleted while they have open deals: the deal's contact_id is set to NULL — the row survives. The card renders as 'Unknown contact'. Re-attach by editing the deal.",
  analyticsTitle: "Analytics",
  analyticsDesc: "The strip above the board shows: Total value (sum of value across open deals), Deals per stage, Won % (won / (won + lost) over trailing 90 days). Totals formatted in your account's default currency.",
  limitsTitle: "Limits & notes",
  limitsItems: [
    "No per-deal probability or forecast logic.",
    "Drag-drop only on desktop.",
    "Pipelines are account-scoped via RLS. First-visit seed creates a default 'Sales Pipeline' automatically.",
  ],
  prevLabel: "Back: Contacts",
  nextLabel: "Next: Broadcasts",
};

const s = { es, en };

export default function PipelinesDocPage() {
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Pane</th>
                    <th className="text-left py-2 px-3 font-medium">{locale === "en" ? "What it shows" : "Lo que muestra"}</th>
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
            <h2 className="text-xl font-semibold mb-3">{c.dataModelTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.dataModelIntro}</p>
            <div className="space-y-3">
              {c.dataModelItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-muted-foreground text-sm"> — {item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.dealFieldsTitle}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Field</th>
                    <th className="text-left py-2 px-3 font-medium">Use</th>
                  </tr>
                </thead>
                <tbody>
                  {c.dealFields.map((row, i) => (
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
            <h2 className="text-xl font-semibold mb-3">{c.statusVsStageTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.statusVsStage}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.workingTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{locale === "en" ? "Create:" : "Crear:"}</p>
            <ul className="space-y-2 mb-4">
              {c.createItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mb-1"><strong>{locale === "en" ? "Edit:" : "Editar:"}</strong> {c.editDesc}</p>
            <p className="text-sm text-muted-foreground mb-1"><strong>{locale === "en" ? "Move:" : "Mover:"}</strong> {c.moveDesc}</p>
            <p className="text-sm text-muted-foreground mb-1"><strong>{locale === "en" ? "Close:" : "Cerrar:"}</strong> {c.closeDesc}</p>
            <p className="text-sm text-muted-foreground"><strong>{locale === "en" ? "Delete:" : "Eliminar:"}</strong> {c.deleteDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.multiTitle}</h2>
            <p className="text-sm text-muted-foreground mb-2">{c.multiDesc}</p>
            <p className="text-sm text-muted-foreground">{c.manageDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.contactDeleteTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.contactDeleteDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.analyticsTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.analyticsDesc}</p>
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
          <Link href="/docs/contacts" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/broadcasts" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
