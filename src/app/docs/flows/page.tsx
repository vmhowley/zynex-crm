"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function FlowsDocPage() {
  const { t, locale } = useTranslations();

  const content = locale === 'en' ? {
    title: "Flows",
    subtitle: "Create visual chatbots with buttons and branching conversations.",
    sections: [
      { title: "Visual Builder", desc: "Design flows with drag-and-drop nodes." },
      { title: "Buttons & Choices", desc: "Create interactive menus with buttons for contacts to choose." },
      { title: "Conditional Branching", desc: "Route conversations based on contact responses." },
      { title: "Human Handoff", desc: "Transfer to live agent when needed." },
      { title: "Templates", desc: "Use pre-built flow templates to get started quickly." },
    ],
    prev: "Back: Automations",
    next: "Next: Templates"
  } : {
    title: "Flujos",
    subtitle: "Crea chatbots visuales con botones y conversaciones ramificadas.",
    sections: [
      { title: "Constructor Visual", desc: "Diseña flujos con nodos de arrastrar y soltar." },
      { title: "Botones y Opciones", desc: "Crea menús interactivos con botones para que contactos elijan." },
      { title: "Ramificación Condicional", desc: "Dirige conversaciones basadas en respuestas del contacto." },
      { title: "Traslado a Agente", desc: "Transfiere a agente vivo cuando sea necesario." },
      { title: "Plantillas", desc: "Usa plantillas de flujo preconstruidas para comenzar rápido." },
    ],
    prev: "Atrás: Automatizaciones",
    next: "Siguiente: Plantillas"
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
            {locale === 'en' ? "Pricing" : "Precios"}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {locale === 'en' ? "Back to Documentation" : "Volver a Documentación"}
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
          <Link href="/docs/automations" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/templates" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
