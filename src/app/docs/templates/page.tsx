"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

const es = {
  title: "Plantillas",
  subtitle: "Crea y gestiona plantillas de mensajes de WhatsApp.",
  intro: "Plantillas son los mensajes pre-aprobados que WhatsApp te permite enviar fuera de la ventana de 24 horas. Zynex CRM las construye, envía a Meta para aprobación, rastrea su estado en tiempo real, y las envía — todo sin salir de la app.",
  builderTitle: "El constructor",
  builderDesc: "Nuevo Template abre un diálogo que mapea 1:1 a la estructura de Meta.",
  nameDesc: "Nombre — solo letras minúsculas, dígitos y guiones bajos. Bloqueado una vez que la plantilla existe en Meta.",
  categoryDesc: "Categoría — Marketing o Utility. Authentication no soportada todavía en el constructor.",
  languageDesc: "Idioma — código de locale (en_US, pt_BR...). Nota que en y en_US son plantillas diferentes para Meta.",
  formatTitle: "Formato del header",
  formats: [
    { name: "Ninguno", desc: "Sin header." },
    { name: "Texto", desc: "Encabezado corto (≤ 60 chars). Puede contener un {{1}}." },
    { name: "Imagen", desc: "Sube JPEG/PNG (≤ 5 MB) o pega una URL HTTPS pública." },
    { name: "Video / Documento", desc: "URL HTTPS pública a un asset." },
  ],
  bodyTitle: "Cuerpo",
  bodyDesc: "El mensaje mismo (≤ 1024 chars). Usa {{1}}, {{2}}, … para variables — deben ser contiguas empezando en {{1}}. Muestra un input de sample value por cada variable detectada.",
  footerDesc: "Línea corta bajo el cuerpo (≤ 60 chars). Sin variables permitidas.",
  buttonsTitle: "Botones (opcional)",
  buttons: [
    { name: "Quick Reply", desc: "Envía una canned reply cuando se toca." },
    { name: "URL", desc: "Abre un link. Puede terminar en {{1}} para un sufijo por mensaje." },
    { name: "Phone", desc: "Marca un número." },
    { name: "Copy Code", desc: "Copia un código al clipboard." },
  ],
  buttonsNote: "El constructor enforce las reglas de botones de Meta: quick replies primero, caps por tipo, ejemplos requeridos.",
  submitTitle: "Enviando y aprobación",
  submitDesc: "Submit for Approval envía la plantilla a Meta. Llega a Pendiente mientras revisa — típicamente dentro de 24 horas. Si algo está mal con la sumisión, la plantilla se guarda localmente con el error adjunto para que puedas arreglarlo y reenviar.",
  statusTitle: "Estados",
  statuses: [
    { name: "Draft", desc: "Guardada localmente, nunca enviada (o la sumisión falló)." },
    { name: "Pending", desc: "Enviada, esperando revisión de Meta." },
    { name: "Approved", desc: "En vivo — usable en bandeja, broadcasts, automatizaciones." },
    { name: "Rejected", desc: "Meta la declinó. La razón se muestra." },
    { name: "Paused", desc: "Meta la pausó por baja calidad. Recuperable." },
    { name: "Disabled", desc: "Meta la deshabilitó. Solo elimina." },
    { name: "In Appeal", desc: "Una apelación está en proceso." },
    { name: "Pending Deletion", desc: "En cola para remoción." },
  ],
  qualityNote: "Plantillas aprobadas muestran un chip de quality score — verde, amarillo, o rojo.",
  actionsTitle: "Acciones de lifecycle",
  actionsDesc: "Edit (Approved) — guarda y re-envía a Meta para nueva revisión. Resubmit (Rejected/Paused) — arregla lo que Meta flaggó y re-envía. Delete — remueve de Meta y localmente.",
  realtimeTitle: "Estado en tiempo real",
  realtimeDesc: "Una vez que tu webhook está configurado, los cambios de estado de plantilla llegan sin hacer clic en Sync from Meta. Zynex CRM escucha tres campos de webhook de Meta.",
  webhookEvents: [
    "message_template_status_update — Approved/Rejected/Paused/etc.",
    "message_template_quality_update — green/yellow/red quality score.",
    "message_template_components_update — Meta auto-modificó la plantilla.",
  ],
  sendTitle: "Enviando una plantilla",
  sendSurfaces: ["Bandeja — el picker de plantillas en el compositor.", "Broadcasts — paso 1 del wizard.", "Automatizaciones — el paso send-template."],
  whyApprovedTitle: "Por qué solo aprobadas en pickers",
  whyApprovedDesc: "El picker de bandeja y el wizard de broadcasts filtran a status = APPROVED. Borradores y rechazadas se ocultan porque Meta las rechaza al enviar.",
  limitsTitle: "Límites y notas",
  limitsItems: [
    "Authentication templates no son construidas en-app todavía. Créalas en Meta WhatsApp Manager y syncea.",
    "Headers de imagen suportan upload directo (JPEG/PNG, ≤ 5 MB) o URL pública.",
    "Nombre + idioma son inmutables después de sumisión.",
    "Editar una plantilla aprobada costs una nueva aprobación.",
    "Una plantilla deshabilitada tiene su nombre reservado por ~30 días.",
  ],
  prevLabel: "Atrás: Flujos",
  nextLabel: "Siguiente: Asistente de IA",
};

const en = {
  title: "Templates",
  subtitle: "Create and manage WhatsApp message templates.",
  intro: "Templates are the pre-approved messages WhatsApp lets you send outside the 24-hour customer-service window. Zynex CRM builds them, submits them to Meta for approval, tracks their status in real time, and sends them — all without leaving the app.",
  builderTitle: "The builder",
  builderDesc: "New Template opens a single dialog that maps 1:1 to Meta's template structure.",
  nameDesc: "Name — lowercase letters, digits and underscores only. Locked once the template exists on Meta.",
  categoryDesc: "Category — Marketing or Utility. Authentication not yet supported in the builder.",
  languageDesc: "Language — locale code (en_US, pt_BR...). Note en and en_US are different templates to Meta.",
  formatTitle: "Header format",
  formats: [
    { name: "None", desc: "No header." },
    { name: "Text", desc: "Short heading (≤ 60 chars). May contain one {{1}}." },
    { name: "Image", desc: "Upload JPEG/PNG (≤ 5 MB) or paste a public HTTPS URL." },
    { name: "Video / Document", desc: "Public HTTPS URL to a sample asset." },
  ],
  bodyTitle: "Body",
  bodyDesc: "The message itself (≤ 1024 chars). Use {{1}}, {{2}}, … for variables — must be contiguous starting at {{1}}. Shows a sample value input for each detected variable.",
  footerDesc: "Short line under the body (≤ 60 chars). No variables allowed.",
  buttonsTitle: "Buttons (optional)",
  buttons: [
    { name: "Quick Reply", desc: "Sends a canned reply back to you when tapped." },
    { name: "URL", desc: "Opens a link. May end in {{1}} for a per-message suffix." },
    { name: "Phone", desc: "Dials a number." },
    { name: "Copy Code", desc: "Copies a code to the clipboard." },
  ],
  buttonsNote: "The builder enforces Meta's button rules as you go — quick-reply buttons grouped first, per-type caps, required examples.",
  submitTitle: "Submitting & approval",
  submitDesc: "Submit for Approval sends the template to Meta. It lands in Pending while Meta reviews — typically within 24 hours. If something is wrong with the submission, the template is still saved locally with the error attached so you can fix it and resubmit.",
  statusTitle: "Statuses",
  statuses: [
    { name: "Draft", desc: "Saved locally, never submitted (or a submission failed)." },
    { name: "Pending", desc: "Submitted, awaiting Meta's review." },
    { name: "Approved", desc: "Live — usable in inbox, broadcasts, automations." },
    { name: "Rejected", desc: "Meta declined it. The reason is shown." },
    { name: "Paused", desc: "Meta paused it for poor quality. Recoverable." },
    { name: "Disabled", desc: "Meta disabled it. Delete it." },
    { name: "In Appeal", desc: "An appeal is in progress on Meta's side." },
    { name: "Pending Deletion", desc: "Queued for removal." },
  ],
  qualityNote: "Approved templates also show a quality score chip — green, yellow, or red — reflecting how recipients have engaged.",
  actionsTitle: "Lifecycle actions",
  actionsDesc: "Edit (Approved) — saves and resubmits to Meta for another review. Resubmit (Rejected/Paused) — fix what Meta flagged and resubmit. Delete — removes from Meta and locally.",
  realtimeTitle: "Real-time status",
  realtimeDesc: "Once your webhook is wired up, template status changes arrive without clicking Sync from Meta. Zynex CRM listens for three Meta webhook fields.",
  webhookEvents: [
    "message_template_status_update — Approved/Rejected/Paused/etc.",
    "message_template_quality_update — green/yellow/red quality score.",
    "message_template_components_update — Meta auto-modified the template.",
  ],
  sendTitle: "Sending a template",
  sendSurfaces: ["Inbox — the composer's template picker.", "Broadcasts — step 1 of the wizard.", "Automations — the send-template step."],
  whyApprovedTitle: "Why only approved templates appear in pickers",
  whyApprovedDesc: "Drafts, pending, and rejected templates are hidden because Meta refuses them at send time.",
  limitsTitle: "Limits & notes",
  limitsItems: [
    "Authentication templates aren't built in-app yet. Create them in Meta WhatsApp Manager and Sync from Meta.",
    "Image headers support direct upload (JPEG/PNG, ≤ 5 MB) or public URL.",
    "Name + language are immutable after submission.",
    "Editing an approved template costs an approval cycle.",
    "A disabled template's name is reserved by Meta for ~30 days.",
  ],
  prevLabel: "Back: Flows",
  nextLabel: "Next: AI Assistant",
};

const s = { es, en };

export default function TemplatesDocPage() {
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
            <h2 className="text-xl font-semibold mb-3">{c.builderTitle}</h2>
            <p className="text-sm text-muted-foreground mb-4">{c.builderDesc}</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>{locale === "en" ? "Name:" : "Nombre:"}</strong> {c.nameDesc}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>{locale === "en" ? "Category:" : "Categoría:"}</strong> {c.categoryDesc}</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                <span><strong>{locale === "en" ? "Language:" : "Idioma:"}</strong> {c.languageDesc}</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.formatTitle}</h2>
            <div className="space-y-3">
              {c.formats.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{f.name}</span>
                    <span className="text-muted-foreground text-sm"> — {f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.bodyTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.bodyDesc}</p>
            <p className="text-sm text-muted-foreground"><strong>{locale === "en" ? "Footer:" : "Footer:"}</strong> {c.footerDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.buttonsTitle}</h2>
            <div className="space-y-3 mb-3">
              {c.buttons.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{b.name}</span>
                    <span className="text-muted-foreground text-sm"> — {b.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground italic">{c.buttonsNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.submitTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.submitDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.statusTitle}</h2>
            <div className="space-y-2">
              {c.statuses.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <div>
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-muted-foreground text-sm"> — {s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground italic border-l-2 border-primary pl-3">{c.qualityNote}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.actionsTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.actionsDesc}</p>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.realtimeTitle}</h2>
            <p className="text-sm text-muted-foreground mb-3">{c.realtimeDesc}</p>
            <ul className="space-y-2">
              {c.webhookEvents.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <code className="text-xs bg-muted px-1 rounded font-mono">{e}</code>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.sendTitle}</h2>
            <ul className="space-y-2">
              {c.sendSurfaces.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">{c.whyApprovedTitle}</h2>
            <p className="text-sm text-muted-foreground">{c.whyApprovedDesc}</p>
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
          <Link href="/docs/flows" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            {c.prevLabel}
          </Link>
          <Link href="/docs/ai-assistant" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.nextLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
