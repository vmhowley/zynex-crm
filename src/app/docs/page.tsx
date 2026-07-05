"use client";

import Link from "next/link";
import { MessageSquare, Users, Radio, Workflow, Settings, Sparkles, BarChart3, Zap, FileText, CreditCard, HelpCircle } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function DocsPage() {
  const { t } = useTranslations();
  const isEn = t("auth.login") !== "Iniciar Sesión";

  const sections = isEn ? {
    title: "Documentation",
    subtitle: "Learn how to use Zynex CRM to manage your WhatsApp business.",
    setup: "Getting Started",
    features: "Features",
    account: "Account & Settings",
    faq: "FAQ",
    gettingStarted: {
      title: "Getting Started with Zynex CRM",
      desc: "Learn the basics: create account, configure WhatsApp and your first contact."
    },
    whatsapp: {
      title: "Configure WhatsApp",
      desc: "Connect your WhatsApp Business number in minutes."
    },
    cards: [
      { title: "Inbox", desc: "Real-time conversations with your team", href: "/docs/inbox", icon: MessageSquare },
      { title: "Contacts", desc: "Manage clients, tags and custom fields", href: "/docs/contacts", icon: Users },
      { title: "Pipelines", desc: "Kanban to track your deals and sales", href: "/docs/pipelines", icon: BarChart3 },
      { title: "Broadcasts", desc: "Send bulk messages to your customers", href: "/docs/broadcasts", icon: Radio },
      { title: "Automations", desc: "Respond automatically and optimize your time", href: "/docs/automations", icon: Zap },
      { title: "Flows", desc: "Create visual chatbots with WhatsApp", href: "/docs/flows", icon: Workflow },
      { title: "Templates", desc: "Create and manage WhatsApp templates", href: "/docs/templates", icon: FileText },
      { title: "AI Assistant", desc: "Generate automatic responses with AI", href: "/docs/ai-assistant", icon: Sparkles },
      { title: "Team Members", desc: "Invite your team and manage permissions", href: "/docs/members", icon: Users },
    ],
    settings: {
      title: "Settings",
      desc: "Profile, password, theme and preferences."
    },
    subscription: {
      title: "Subscription & Payments",
      desc: "Manage your plan, upgrades and billing."
    },
    faqItems: [
      { q: "How do I connect my WhatsApp?", a: "Go to Settings → WhatsApp and follow the steps. You'll need your phone number ID and access token from Meta." },
      { q: "Can I send bulk messages?", a: "Yes, Basic, Pro and Enterprise plans include broadcasts. You only need Meta-approved templates." },
      { q: "How does payment work?", a: "Select a plan, we'll give you the bank details, make the transfer and your account will be activated." },
      { q: "Do I need to know how to code?", a: "No, Zynex CRM is designed for anyone to use without technical knowledge." },
    ]
  } : {
    title: "Documentación",
    subtitle: "Aprende a usar Zynex CRM para gestionar tu negocio por WhatsApp.",
    setup: "Primeros Pasos",
    features: "Funciones",
    account: "Cuenta y Configuración",
    faq: "Preguntas Frecuentes",
    gettingStarted: {
      title: "Comenzando con Zynex CRM",
      desc: "Aprende lo básico: crear cuenta, configurar WhatsApp y tu primer contacto."
    },
    whatsapp: {
      title: "Configurar WhatsApp",
      desc: "Conecta tu número de WhatsApp Business en minutos."
    },
    cards: [
      { title: "Bandeja de Entrada", desc: "Conversaciones en tiempo real con tu equipo", href: "/docs/inbox", icon: MessageSquare },
      { title: "Contactos", desc: "Gestiona clientes, etiquetas y campos personalizados", href: "/docs/contacts", icon: Users },
      { title: "Pipeline de Ventas", desc: "Kanban para seguir tus tratos y ventas", href: "/docs/pipelines", icon: BarChart3 },
      { title: "Broadcasts", desc: "Envía mensajes masivos a tus clientes", href: "/docs/broadcasts", icon: Radio },
      { title: "Automatizaciones", desc: "Responde automáticamente y optimiza tu tiempo", href: "/docs/automations", icon: Zap },
      { title: "Flujos", desc: "Crea chatbots visuales con WhatsApp", href: "/docs/flows", icon: Workflow },
      { title: "Plantillas", desc: "Crea y gestiona plantillas de WhatsApp", href: "/docs/templates", icon: FileText },
      { title: "Asistente de IA", desc: "Genera respuestas automáticas con inteligencia artificial", href: "/docs/ai-assistant", icon: Sparkles },
      { title: "Miembros del Equipo", desc: "Invita a tu equipo y gestiona permisos", href: "/docs/members", icon: Users },
    ],
    settings: {
      title: "Configuración",
      desc: "Perfil, contraseña, tema y preferencias."
    },
    subscription: {
      title: "Suscripción y Pagos",
      desc: "Gestiona tu plan, upgrades y facturación."
    },
    faqItems: [
      { q: "¿Cómo conecto mi WhatsApp?", a: "Ve a Configuración → WhatsApp y sigue los pasos. Necesitarás tu phone number ID y access token de Meta." },
      { q: "¿Puedo enviar mensajes masivos?", a: "Sí, los planes Básico, Pro y Empresarial incluyen broadcasts. Solo necesitas plantillas aprobadas por Meta." },
      { q: "¿Cómo funciona el pago?", a: "Selecciona un plan, te damos los datos bancarios, realizas la transferencia y tu cuenta se activa." },
      { q: "¿Necesito saber programar?", a: "No, Zynex CRM está diseñado para que cualquier persona pueda usarlo sin conocimientos técnicos." },
    ]
  };

  const s = sections;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                <MessageSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Zynex CRM</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/docs" className="text-sm font-medium text-primary">{s.title}</Link>
            <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">{isEn ? "Pricing" : "Precios"}</Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{s.title}</h1>
          <p className="text-lg text-muted-foreground mb-12">
            {s.subtitle}
          </p>

          {/* Getting Started */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              {s.setup}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/docs/getting-started" className="block p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <h3 className="font-semibold mb-2">{s.gettingStarted.title}</h3>
                <p className="text-sm text-muted-foreground">{s.gettingStarted.desc}</p>
              </Link>
              <Link href="/docs/whatsapp-setup" className="block p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <h3 className="font-semibold mb-2">{s.whatsapp.title}</h3>
                <p className="text-sm text-muted-foreground">{s.whatsapp.desc}</p>
              </Link>
            </div>
          </section>

          {/* Features */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              {s.features}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.cards.map((card, i) => (
                <Link key={i} href={card.href} className="block p-4 rounded-lg border hover:border-primary/50 transition-colors">
                  <card.icon className="h-8 w-8 text-primary mb-2" />
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Account */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              {s.account}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/docs/settings" className="block p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <h3 className="font-semibold mb-2">{s.settings.title}</h3>
                <p className="text-sm text-muted-foreground">{s.settings.desc}</p>
              </Link>
              <Link href="/docs/subscription" className="block p-6 rounded-lg border hover:border-primary/50 transition-colors">
                <CreditCard className="h-8 w-8 text-primary mb-2" />
                <h3 className="font-semibold mb-2">{s.subscription.title}</h3>
                <p className="text-sm text-muted-foreground">{s.subscription.desc}</p>
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              {s.faq}
            </h2>
            <div className="space-y-4">
              {s.faqItems.map((item, i) => (
                <div key={i} className="p-4 rounded-lg border">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
