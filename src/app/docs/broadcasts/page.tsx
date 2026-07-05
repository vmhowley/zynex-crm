"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function BroadcastsDocPage() {
  const { t } = useTranslations();
  const isEn = t("auth.login") !== "Iniciar Sesión";

  const content = isEn ? {
    title: "Broadcasts",
    subtitle: "Send bulk messages to your contact list using WhatsApp templates.",
    sections: [
      { title: "Create Campaign", desc: "Select a template, choose recipients and schedule." },
      { title: "Template Selection", desc: "Use only Meta-approved templates to avoid blocks." },
      { title: "Recipient Filters", desc: "Filter by tags, custom fields or contact segments." },
      { title: "Delivery Tracking", desc: "See sent, delivered, read and failed counts." },
      { title: "Scheduling", desc: "Send immediately or schedule for a specific time." },
    ],
    prev: "Back: Pipelines",
    next: "Next: Automations"
  } : {
    title: "Broadcasts",
    subtitle: "Envía mensajes masivos a tu lista de contactos usando plantillas de WhatsApp.",
    sections: [
      { title: "Crear Campaña", desc: "Selecciona una plantilla, elige receptores y programa." },
      { title: "Selección de Plantillas", desc: "Usa solo plantillas aprobadas por Meta para evitar bloques." },
      { title: "Filtros de Receptores", desc: "Filtra por etiquetas, campos personalizados o segmentos." },
      { title: "Seguimiento de Entrega", desc: "Ve enviados, entregados, leídos y fallidos." },
      { title: "Programación", desc: "Envía inmediatamente o programa para una hora específica." },
    ],
    prev: "Atrás: Pipelines",
    next: "Siguiente: Automatizaciones"
  };

  const c = content;

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
            {isEn ? "Pricing" : "Precios"}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {isEn ? "Back to Documentation" : "Volver a Documentación"}
        </Link>

        <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
        <p className="text-lg text-muted-foreground mb-12">{c.subtitle}</p>

        <div className="space-y-6">
          {c.sections.map((section, i) => (
            <div key={i} className="p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
              <p className="text-muted-foreground">{section.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-between">
          <Link href="/docs/pipelines" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/automations" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
