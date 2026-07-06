"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function AutomationsDocPage() {
  const { t, locale } = useTranslations();

  const content = locale === 'en' ? {
    title: "Automations",
    subtitle: "Automate responses and workflows based on triggers and conditions.",
    sections: [
      { title: "Triggers", desc: "Start automations on new contacts, messages, or tags." },
      { title: "Conditions", desc: "Add filters like contact has tag, message contains text." },
      { title: "Actions", desc: "Send messages, add tags, assign to agent, or webhook." },
      { title: "Keyword Auto-reply", desc: "Respond automatically when contact sends specific keywords." },
      { title: "Time Delays", desc: "Add wait steps between actions for timing." },
    ],
    prev: "Back: Broadcasts",
    next: "Next: Flows"
  } : {
    title: "Automatizaciones",
    subtitle: "Automatiza respuestas y flujos basados en disparadores y condiciones.",
    sections: [
      { title: "Disparadores", desc: "Inicia automatizaciones con nuevos contactos, mensajes o etiquetas." },
      { title: "Condiciones", desc: "Añade filtros como contacto tiene etiqueta, mensaje contiene texto." },
      { title: "Acciones", desc: "Envía mensajes, añade etiquetas, asigna a agente, o webhook." },
      { title: "Auto-respuesta por Keywords", desc: "Responde automáticamente cuando el contacto envía palabras clave." },
      { title: "Retrasos de Tiempo", desc: "Añade pasos de espera entre acciones para temporización." },
    ],
    prev: "Atrás: Broadcasts",
    next: "Siguiente: Flujos"
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
          <Link href="/docs/broadcasts" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/flows" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
