"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function WhatsAppSetupPage() {
  const { t, locale } = useTranslations();

  const content = locale === 'en' ? {
    title: "WhatsApp Setup",
    subtitle: "Connect your WhatsApp Business number to start receiving and sending messages.",
    step1: "Create Meta App",
    step1Desc: "Go to developers.facebook.com, create an app and add WhatsApp product.",
    step2: "Get Credentials",
    step2Desc: "Copy your Phone Number ID and Access Token from the WhatsApp API Setup.",
    step3: "Configure in Zynex CRM",
    step3Desc: "Go to Settings → WhatsApp, paste your credentials and save.",
    step4: "Setup Webhook",
    step4Desc: "Configure webhook URL in Meta to receive incoming messages.",
    next: "Next: Automations",
    prev: "Back: Getting Started",
    faq: {
      title: "FAQ",
      items: [
        { q: "Do I need a business account?", a: "Yes, you need a WhatsApp Business account. You can create one for free at business.facebook.com" },
        { q: "How do I find my Phone Number ID?", a: "In Meta Developers → Your App → WhatsApp → API Setup, you'll see the Phone Number ID." },
        { q: "What permissions does the access token need?", a: "Your temporary access token has all necessary permissions. For production, use a permanent token." },
      ]
    }
  } : {
    title: "Configuración de WhatsApp",
    subtitle: "Conecta tu número de WhatsApp Business para comenzar a recibir y enviar mensajes.",
    step1: "Crear App en Meta",
    step1Desc: "Ve a developers.facebook.com, crea una app y añade el producto WhatsApp.",
    step2: "Obtener Credenciales",
    step2Desc: "Copia tu Phone Number ID y Access Token desde la API de WhatsApp.",
    step3: "Configurar en Zynex CRM",
    step3Desc: "Ve a Configuración → WhatsApp, pega tus credenciales y guarda.",
    step4: "Configurar Webhook",
    step4Desc: "Configura la URL del webhook en Meta para recibir mensajes entrantes.",
    next: "Siguiente: Automatizaciones",
    prev: "Atrás: Primeros Pasos",
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        { q: "¿Necesito una cuenta de negocios?", a: "Sí, necesitas una cuenta de WhatsApp Business. Puedes crear una gratis en business.facebook.com" },
        { q: "¿Dónde encuentro mi Phone Number ID?", a: "En Meta Developers → Tu App → WhatsApp → Configuración de API, verás el Phone Number ID." },
        { q: "¿Qué permisos necesita el access token?", a: "Tu access token temporal tiene todos los permisos necesarios. Para producción, usa un token permanente." },
      ]
    }
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
        <Link href="/docs/getting-started" className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> {locale === 'en' ? "Back to Documentation" : "Volver a Documentación"}
        </Link>

        <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
        <p className="text-lg text-muted-foreground mb-12">{c.subtitle}</p>

        <div className="space-y-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{c.step1}</h3>
              <p className="text-muted-foreground">{c.step1Desc}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{c.step2}</h3>
              <p className="text-muted-foreground">{c.step2Desc}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{c.step3}</h3>
              <p className="text-muted-foreground">{c.step3Desc}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
            <div>
              <h3 className="text-xl font-semibold mb-2">{c.step4}</h3>
              <p className="text-muted-foreground">{c.step4Desc}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-500">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{locale === 'en' ? "WhatsApp connected successfully!" : "¡WhatsApp conectado exitosamente!"}</span>
          </div>
        </div>

        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">{c.faq.title}</h2>
          <div className="space-y-4">
            {c.faq.items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-between">
          <Link href="/docs/getting-started" className="text-primary hover:underline inline-flex items-center gap-1">
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
