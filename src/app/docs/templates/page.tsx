"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function TemplatesDocPage() {
  const { t, locale } = useTranslations();

  const content = locale === 'en' ? {
    title: "Templates",
    subtitle: "Create and manage WhatsApp message templates.",
    sections: [
      { title: "Create Template", desc: "Build templates with variables like {{name}} for personalization." },
      { title: "Meta Approval", desc: "Templates are sent to Meta for approval." },
      { title: "Status Tracking", desc: "Monitor approval status: Pending, Approved, or Rejected." },
      { title: "Categories", desc: "Use categories like Marketing, Utility, or Authentication." },
      { title: "Media Support", desc: "Add images, videos, or documents to templates." },
    ],
    prev: "Back: Flows",
    next: "Next: AI Assistant"
  } : {
    title: "Plantillas",
    subtitle: "Crea y gestiona plantillas de mensajes de WhatsApp.",
    sections: [
      { title: "Crear Plantilla", desc: "Construye plantillas con variables como {{name}} para personalización." },
      { title: "Aprobación de Meta", desc: "Las plantillas se envían a Meta para aprobación." },
      { title: "Seguimiento de Estado", desc: "Monitorea estado de aprobación: Pendiente, Aprobado, o Rechazado." },
      { title: "Categorías", desc: "Usa categorías como Marketing, Utilidad, o Autenticación." },
      { title: "Soporte de Medios", desc: "Añade imágenes, videos o documentos a plantillas." },
    ],
    prev: "Atrás: Flujos",
    next: "Siguiente: Asistente de IA"
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
          <Link href="/docs/flows" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/ai-assistant" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
