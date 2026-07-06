"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function TroubleshootingPage() {
  const { t, locale } = useTranslations();

  const content = locale === 'en' ? {
    title: "Troubleshooting",
    subtitle: "Solutions to common issues you might encounter.",
    sections: [
      { title: "WhatsApp Not Connecting", desc: "Verify your Phone Number ID and Access Token are correct. Check that your Meta app has WhatsApp product enabled." },
      { title: "Messages Not Sending", desc: "Ensure your template is approved by Meta. Check that you have credits available in your WhatsApp Business account." },
      { title: "Broadcasts Failing", desc: "Verify recipients have opted in to receive messages. Check that your template variables are correctly formatted." },
      { title: "Automations Not Triggering", desc: "Check that your trigger conditions are correctly set. Verify the automation is enabled." },
      { title: "Login Issues", desc: "Clear browser cache and cookies. Try using an incognito window. Check that your email is confirmed." },
    ],
    backToDocs: "Back to Documentation"
  } : {
    title: "Solución de Problemas",
    subtitle: "Soluciones a problemas comunes que puedes encontrar.",
    sections: [
      { title: "WhatsApp No Conecta", desc: "Verifica que tu Phone Number ID y Access Token sean correctos. Revisa que tu app de Meta tenga el producto WhatsApp habilitado." },
      { title: "Mensajes No Se Envían", desc: "Asegúrate de que tu plantilla esté aprobada por Meta. Verifica que tengas créditos disponibles en tu cuenta de WhatsApp Business." },
      { title: "Broadcasts Fallan", desc: "Verifica que los receptores hayan aceptado recibir mensajes. Revisa que las variables de tu plantilla estén correctamente formateadas." },
      { title: "Automatizaciones No Se Disparan", desc: "Revisa que tus condiciones de disparador estén correctamente configuradas. Verifica que la automatización esté habilitada." },
      { title: "Problemas de Login", desc: "Limpia la caché y cookies del navegador. Intenta usar una ventana de incógnito. Verifica que tu correo esté confirmado." },
    ],
    backToDocs: "Volver a Documentación"
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
          <ArrowLeft className="h-4 w-4" /> {c.backToDocs}
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
      </div>
    </div>
  );
}
