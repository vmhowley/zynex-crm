"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, CheckCircle, Zap } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function GettingStartedPage() {
  const { t, locale } = useTranslations();

  const content = locale === 'en' ? {
    title: "Getting Started with Zynex CRM",
    subtitle: "Learn the basics to start using Zynex CRM in minutes.",
    step1: "Create your account",
    step1Desc: "Go to the signup page and create your account with your email and password. You'll get 14 days free trial to test all features.",
    signupLink: "Create free account →",
    step2: "Connect your WhatsApp",
    step2Desc: "Once inside, go to Settings → WhatsApp and follow these steps:",
    step2List: ["Enter your Phone Number ID from Meta", "Enter your Access Token", "Configure the Webhook URL", "Verify the connection"],
    noWhatsApp: "Don't have WhatsApp Business data?",
    contactUs: "Contact us for help",
    step3: "Add your contacts",
    step3Desc: "Go to the Contacts section and add your customers. You can do it manually or import from a CSV file.",
    step3List: ["Add contacts one by one", "Import from CSV", "Contacts are created automatically when receiving messages"],
    step4: "Start chatting",
    step4Desc: "Go to the Inbox to see all your conversations. You can:",
    step4List: ["Reply to customer messages", "Assign conversations to team members", "Use WhatsApp templates for quick replies", "Add internal notes"],
    step5: "Explore more features",
    step5Desc: "Once you're familiar with the basics, explore these features:",
    pipelines: "Sales Pipeline",
    pipelinesDesc: "Manage your sales opportunities",
    broadcasts: "Broadcasts",
    broadcastsDesc: "Send bulk messages to your customers",
    automations: "Automations",
    automationsDesc: "Respond automatically",
    ai: "AI Assistant",
    aiDesc: "Generate responses with artificial intelligence",
    needHelp: "Need help?",
    helpDesc: "If you have any questions, write to us on WhatsApp and we'll help you.",
    contactWhatsApp: "Contact on WhatsApp →",
    backToDocs: "Back to Documentation",
    pricing: "Pricing",
    viewPricing: "View Pricing"
  } : {
    title: "Comenzando con Zynex CRM",
    subtitle: "Aprende lo básico para empezar a usar Zynex CRM en minutos.",
    step1: "Crea tu cuenta",
    step1Desc: "Ve a la página de registro y crea tu cuenta con tu email y contraseña. Tendrás 14 días de prueba gratis para probar todas las funciones.",
    signupLink: "Crear cuenta gratis →",
    step2: "Conecta tu WhatsApp",
    step2Desc: "Una vez dentro, ve a Configuración → WhatsApp y sigue estos pasos:",
    step2List: ["Ingresa tu Phone Number ID de Meta", "Ingresa tu Access Token", "Configura el Webhook URL", "Verifica la conexión"],
    noWhatsApp: "¿No tienes los datos de WhatsApp Business?",
    contactUs: "Contáctanos para ayuda",
    step3: "Añade tus contactos",
    step3Desc: "Ve a la sección Contactos y añade tus clientes. Puedes hacerlo manualmente o importar desde un archivo CSV.",
    step3List: ["Añadir contactos uno por uno", "Importar desde CSV", "Los contactos se crean automáticamente al recibir mensajes"],
    step4: "Empieza a conversar",
    step4Desc: "Ve a la Bandeja de Entrada para ver todas tus conversaciones. Puedes:",
    step4List: ["Responder mensajes de tus clientes", "Asignar conversaciones a miembros del equipo", "Usar plantillas de WhatsApp para respuestas rápidas", "Añadir notas internas"],
    step5: "Explora más funciones",
    step5Desc: "Una vez familiarizado con lo básico, explora estas funciones:",
    pipelines: "Pipeline de Ventas",
    pipelinesDesc: "Gestiona tus oportunidades de venta",
    broadcasts: "Broadcasts",
    broadcastsDesc: "Envía mensajes masivos a tus clientes",
    automations: "Automatizaciones",
    automationsDesc: "Responde automáticamente",
    ai: "Asistente de IA",
    aiDesc: "Genera respuestas con inteligencia artificial",
    needHelp: "¿Necesitas ayuda?",
    helpDesc: "Si tienes alguna duda, escríbenos por WhatsApp y te ayudamos.",
    contactWhatsApp: "Contactar por WhatsApp →",
    backToDocs: "Volver a Documentación",
    pricing: "Precios",
    viewPricing: "Ver Precios"
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
            {c.viewPricing}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <Link href="/docs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          {c.backToDocs}
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{c.title}</h1>
          <p className="text-lg text-muted-foreground mb-8">
            {c.subtitle}
          </p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. {c.step1}</h2>
              <p className="text-muted-foreground">
                {c.step1Desc}
              </p>
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  {c.signupLink}
                </Link>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. {c.step2}</h2>
              <p className="text-muted-foreground">
                {c.step2Desc}
              </p>
              <ol className="list-decimal list-inside space-y-2 mt-4 text-muted-foreground">
                {c.step2List.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
              <p className="mt-4 text-sm text-muted-foreground">
                {c.noWhatsApp}{" "}
                <Link href="https://wa.me/18096757686" className="text-primary hover:underline">
                  {c.contactUs}
                </Link>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. {c.step3}</h2>
              <p className="text-muted-foreground">
                {c.step3Desc}
              </p>
              <ul className="mt-4 space-y-2">
                {c.step3List.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. {c.step4}</h2>
              <p className="text-muted-foreground">
                {c.step4Desc}
              </p>
              <ul className="mt-4 space-y-2">
                {c.step4List.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. {c.step5}</h2>
              <p className="text-muted-foreground">
                {c.step5Desc}
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <Link href="/docs/pipelines" className="block p-4 rounded-lg border hover:border-primary/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {c.pipelines}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.pipelinesDesc}
                  </p>
                </Link>
                <Link href="/docs/broadcasts" className="block p-4 rounded-lg border hover:border-primary/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {c.broadcasts}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.broadcastsDesc}
                  </p>
                </Link>
                <Link href="/docs/automations" className="block p-4 rounded-lg border hover:border-primary/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {c.automations}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.automationsDesc}
                  </p>
                </Link>
                <Link href="/docs/ai-assistant" className="block p-4 rounded-lg border hover:border-primary/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {c.ai}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {c.aiDesc}
                  </p>
                </Link>
              </div>
            </section>
          </div>

          <div className="mt-12 p-6 rounded-lg bg-primary/10 border border-primary/20">
            <h3 className="font-semibold mb-2">{c.needHelp}</h3>
            <p className="text-sm text-muted-foreground">
              {c.helpDesc}
            </p>
            <Link 
              href="https://wa.me/18096757686" 
              className="inline-block mt-4 text-sm font-medium text-primary hover:underline"
            >
              {c.contactWhatsApp}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
