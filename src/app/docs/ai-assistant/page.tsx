"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function AIAssistantDocPage() {
  const { t } = useTranslations();
  const isEn = t("auth.login") !== "Iniciar Sesión";

  const content = isEn ? {
    title: "AI Assistant",
    subtitle: "Generate automatic responses using artificial intelligence.",
    sections: [
      { title: "Bring Your Own Key", desc: "Use your own OpenAI or Anthropic API key." },
      { title: "Draft Responses", desc: "AI suggests replies based on conversation context." },
      { title: "Auto-Reply Bot", desc: "Set up AI to automatically respond to common questions." },
      { title: "Knowledge Base", desc: "Upload documents and FAQs for AI to answer from." },
      { title: "Human Handoff", desc: "AI transfers to live agent for complex issues." },
    ],
    prev: "Back: Templates",
    next: "Next: Members"
  } : {
    title: "Asistente de IA",
    subtitle: "Genera respuestas automáticas usando inteligencia artificial.",
    sections: [
      { title: "Trae Tu Propia Clave", desc: "Usa tu propia clave de API de OpenAI o Anthropic." },
      { title: "Borrador de Respuestas", desc: "IA sugiere respuestas basadas en el contexto de la conversación." },
      { title: "Bot de Auto-Respuesta", desc: "Configura IA para responder automáticamente a preguntas comunes." },
      { title: "Base de Conocimiento", desc: "Sube documentos y FAQs para que la IA responda desde ellos." },
      { title: "Traslado a Humano", desc: "IA transfiere a agente vivo para temas complejos." },
    ],
    prev: "Atrás: Plantillas",
    next: "Siguiente: Miembros"
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
          <Link href="/docs/templates" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
          <Link href="/docs/members" className="text-primary hover:underline inline-flex items-center gap-1">
            {c.next} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
