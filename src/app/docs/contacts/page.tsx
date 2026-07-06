"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function ContactsDocPage() {
  const { t, locale } = useTranslations();

  const content = locale === 'en' ? {
    title: "Contacts",
    subtitle: "Manage your customer database with tags, custom fields and notes.",
    sections: [
      { title: "Add Contacts", desc: "Add contacts manually or import from CSV." },
      { title: "Tags", desc: "Organize contacts with custom tags for segmentation." },
      { title: "Custom Fields", desc: "Add fields like company, position, or custom data." },
      { title: "Notes", desc: "Add notes to remember important details about each contact." },
      { title: "Import/Export", desc: "Import contacts from CSV or export your database." },
    ],
    prev: "Back: Inbox",
    next: "Next: Pipelines"
  } : {
    title: "Contactos",
    subtitle: "Gestiona tu base de clientes con etiquetas, campos personalizados y notas.",
    sections: [
      { title: "Añadir Contactos", desc: "Añade contactos manualmente o importa desde CSV." },
      { title: "Etiquetas", desc: "Organiza contactos con etiquetas personalizadas para segmentación." },
      { title: "Campos Personalizados", desc: "Añade campos como empresa, posición o datos personalizados." },
      { title: "Notas", desc: "Añade notas para recordar detalles importantes de cada contacto." },
      { title: "Importar/Exportar", desc: "Importa contactos desde CSV o exporta tu base de datos." },
    ],
    prev: "Atrás: Bandeja de Entrada",
    next: "Siguiente: Pipelines"
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
          <Link href="/docs/inbox" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/pipelines" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
