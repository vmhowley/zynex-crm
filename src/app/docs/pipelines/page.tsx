"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function PipelinesDocPage() {
  const { t } = useTranslations();
  const isEn = t("auth.login") !== "Iniciar Sesión";

  const content = isEn ? {
    title: "Pipelines",
    subtitle: "Kanban boards to track your deals and sales process.",
    sections: [
      { title: "Create Pipelines", desc: "Create multiple pipelines for different sales processes." },
      { title: "Deal Stages", desc: "Customize stages like Lead, Qualified, Proposal, Won, Lost." },
      { title: "Drag & Drop", desc: "Move deals between stages with drag and drop." },
      { title: "Deal Value", desc: "Track deal amounts and forecast revenue." },
      { title: "Analytics", desc: "View win rates, conversion rates and pipeline health." },
    ],
    prev: "Back: Contacts",
    next: "Next: Broadcasts"
  } : {
    title: "Pipelines",
    subtitle: "Tableros Kanban para seguir tus tratos y proceso de ventas.",
    sections: [
      { title: "Crear Pipelines", desc: "Crea múltiples pipelines para diferentes procesos de venta." },
      { title: "Etapas de Tratos", desc: "Personaliza etapas como Lead, Calificado, Propuesta, Ganado, Perdido." },
      { title: "Arrastrar y Soltar", desc: "Mueve tratos entre etapas con arrastrar y soltar." },
      { title: "Valor del Trato", desc: "Sigue montos de tratos y pronostica ingresos." },
      { title: "Analíticas", desc: "Ve tasas de conversión, ganados y salud del pipeline." },
    ],
    prev: "Atrás: Contactos",
    next: "Siguiente: Broadcasts"
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
          <Link href="/docs/contacts" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/broadcasts" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
