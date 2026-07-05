"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function InboxDocPage() {
  const { t } = useTranslations();
  const isEn = t("auth.login") !== "Iniciar Sesión";

  const content = isEn ? {
    title: "Inbox",
    subtitle: "Shared workspace for WhatsApp conversations with your team.",
    sections: [
      { title: "Real-time Conversations", desc: "See messages as they arrive. No refresh needed." },
      { title: "Multiple Agents", desc: "Assign conversations to team members or keep them shared." },
      { title: "Templates", desc: "Quickly send pre-approved WhatsApp message templates." },
      { title: "Status Labels", desc: "Mark conversations as priority, follow-up, or closed." },
      { title: "Search", desc: "Find any conversation by contact name or message content." },
    ],
    prev: "Back: Getting Started",
    next: "Next: Contacts"
  } : {
    title: "Bandeja de Entrada",
    subtitle: "Espacio compartido para conversaciones de WhatsApp con tu equipo.",
    sections: [
      { title: "Conversaciones en Tiempo Real", desc: "Ve los mensajes llegan. Sin necesidad de actualizar." },
      { title: "Múltiples Agentes", desc: "Asigna conversaciones a miembros o mantenlas compartidas." },
      { title: "Plantillas", desc: "Envía rápidamente plantillas de WhatsApp pre-aprobadas." },
      { title: "Etiquetas de Estado", desc: "Marca conversaciones como prioridad, seguimiento o cerradas." },
      { title: "Búsqueda", desc: "Encuentra cualquier conversación por nombre o contenido." },
    ],
    prev: "Atrás: Primeros Pasos",
    next: "Siguiente: Contactos"
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
          <Link href="/docs/getting-started" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/contacts" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
