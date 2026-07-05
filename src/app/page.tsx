"use client";

import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Users,
  Radio,
  ArrowRight,
  CheckCircle,
  BarChart3,
  Workflow,
  Shield,
  HeadphonesIcon,
  Globe,
  Star,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "@/hooks/use-translations";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LandingPage() {
  const { t, locale, setLocale } = useTranslations();
  const isEn = locale === "en";

  const content = {
    es: {
      nav: { features: "Funciones", howItWorks: "Cómo funciona", pricing: "Precios", faq: "FAQ", login: "Iniciar Sesión", cta: "Empezar Gratis" },
      hero: { badge: "CRM para WhatsApp Business", title: "Gestiona tu negocio por WhatsApp desde un solo lugar", subtitle: "Bandeja de entrada compartida, contactos, pipelines de ventas, broadcasts y automatizaciones. Todo lo que necesitas para escalar tu negocio por WhatsApp.", cta: "Empezar Gratis", ctaSecondary: "Ver Planes", trial: "14 días de prueba • No se requiere tarjeta de crédito" },
      features: { title: "Todo lo que necesitas", subtitle: "Una herramienta integral para tu negocio por WhatsApp. Sin necesidad de combinar múltiples aplicaciones.", cards: [{ title: "Bandeja de Entrada Compartida", desc: "Todo tu equipo trabaja desde un mismo inbox. Asigna conversaciones, responde como equipo y nunca pierdas un lead." }, { title: "Centro de Contactos", desc: "Etiquetas, campos personalizados, notas y deduplicación automática. Importa contactos desde CSV." }, { title: "Pipeline de Ventas", desc: "Arrastra tratos por etapas. Ve qué está ganado, qué se está cayendo y dónde está atascado el revenue." }, { title: "Campañas Broadcast", desc: "Envía plantillas aprobadas por Meta a listas segmentadas. Tracking en tiempo real de entrega y lecturas." }, { title: "Automatizaciones", desc: "Bienvenida a nuevos contactos, sigue-up automáticos, routing por keywords. Constructor visual de flujos." }, { title: "Asistente de IA", desc: "Genera respuestas con IA. Trae tu propia API key de OpenAI o Anthropic. Sin costo adicional por mensaje." }] },
      howItWorks: { title: "En vivo en menos de 30 minutos", subtitle: "La mayoría de equipos están operativos antes de terminar su primer café.", steps: [{ title: "Conecta tu número de WhatsApp", desc: "Pega tu phone number ID y access token desde Meta. Funciona con cualquier proveedor de WhatsApp Business API." }, { title: "Trae tus contactos", desc: "Importa un CSV o deja que los mensajes entrantes construyan tu lista automáticamente." }, { title: "Responde, automatiza y mide", desc: "Usa la bandeja compartida, configura flujos para trabajo repetitivo y haz seguimiento de lo que funciona." }] },
      pricing: { title: "Planes diseñados para ti", subtitle: "Elige el plan que mejor se adapte a tu negocio. Todos incluyen soporte técnico y actualizaciones.", plans: [{ name: "Gratis", price: "RD$0", desc: "Para probar", features: ["25 contactos", "1 miembro del equipo", "Solo bandeja de entrada", "Sin broadcasts", "Sin automatizaciones", "Sin WhatsApp"], cta: "Empezar Gratis" }, { name: "Básico", price: "RD$1,500", desc: "Para pequeños negocios", popular: true, features: ["500 contactos", "3 miembros del equipo", "Broadcasts ilimitados", "Sin automatizaciones", "1 número de WhatsApp"], cta: "Comenzar Trial" }, { name: "Pro", price: "RD$3,000", desc: "Para equipos en crecimiento", features: ["2,000 contactos", "10 miembros del equipo", "Broadcasts ilimitados", "Automatizaciones", "Flujos visuales", "3 números de WhatsApp"], cta: "Comenzar Trial" }, { name: "Empresarial", price: "RD$6,000", desc: "Para empresas", features: ["Contactos ilimitados", "Miembros ilimitados", "Todo incluido", "Acceso API", "Números ilimitados", "Soporte prioritario"], cta: "Contactar Ventas" }], help: "¿Necesitas ayuda para elegir?", contact: "Contáctanos" },
      why: { title: "¿Por qué Zynex CRM?", items: [{ title: "Datos seguros", desc: "Tu información almacenada de forma segura. Respaldo diario y encriptación." }, { title: "Soporte en español", desc: "Equipo de soporte disponible para ayudarte en lo que necesites." }, { title: "Pensado para Latam", desc: "Precios en pesos dominicanos, integración con WhatsApp Business API oficial." }, { title: "Actualizaciones constantes", desc: "Nuevas funciones regularmente basadas en feedback de usuarios." }], testimonial: "La mejor herramienta para gestionar WhatsApp para mi negocio. Fácil de usar y el soporte es excelente.", author: "- Carlos M., Emprendedor" },
      faq: { title: "Preguntas Frecuentes", items: [{ q: "¿Zynex CRM es gratuito?", a: "Tenemos un plan gratuito para siempre con 50 contactos y 1 miembro. También ofrecemos 14 días de prueba de todos los planes pagos." }, { q: "¿Funciona con WhatsApp oficial?", a: "Sí, Zynex CRM funciona con la API oficial de WhatsApp Business de Meta. Solo necesitas tu phone number ID y access token." }, { q: "¿Puedo enviar mensajes masivos?", a: "Sí, los planes Básico, Pro y Empresarial incluyen broadcasts ilimitados con plantillas aprobadas por Meta." }, { q: "¿Cómo funciona el pago?", a: "Aceptamos transferencias bancarias. Cuando solicitas un plan, te damos los datos para realizar el pago y tu cuenta se activa manualmente." }, { q: "¿Mis datos están seguros?", a: "Sí, tus datos están almacenados de forma segura con respaldos diarios y encriptación. Puedes exportar tu información cuando lo necesites." }, { q: "¿Necesito saber programar?", a: "No, Zynex CRM está diseñado para que cualquier persona pueda usarlo. La interfaz es intuitiva y no requiere conocimientos técnicos." }] },
      cta: { title: "¿Listo para empezar?", subtitle: "Crea tu cuenta gratis y descubre cómo Zynex CRM puede ayudarte a hacer crecer tu negocio.", button: "Crear Cuenta Gratis", footer: "No se requiere tarjeta de crédito • 14 días de prueba" },
      footer: { product: "Producto", company: "Empresa", support: "Soporte", docs: "Documentación", copyright: "© 2024 Zynex SRL. Todos los derechos reservados.", powered: "Construido sobre WhatsApp Business API • Meta" }
    },
    en: {
      nav: { features: "Features", howItWorks: "How it works", pricing: "Pricing", faq: "FAQ", login: "Sign In", cta: "Get Started Free" },
      hero: { badge: "WhatsApp Business CRM", title: "Manage your WhatsApp business from one place", subtitle: "Shared inbox, contacts, sales pipelines, broadcasts and automations. Everything you need to scale your WhatsApp business.", cta: "Get Started Free", ctaSecondary: "View Plans", trial: "14-day trial • No credit card required" },
      features: { title: "Everything you need", subtitle: "An all-in-one tool for your WhatsApp business. No need to combine multiple apps.", cards: [{ title: "Shared Inbox", desc: "Your whole team works from the same inbox. Assign conversations, reply as a team and never miss a lead." }, { title: "Contact Center", desc: "Tags, custom fields, notes and automatic deduplication. Import contacts from CSV." }, { title: "Sales Pipeline", desc: "Drag deals through stages. See what's won, what's falling through and where revenue is stuck." }, { title: "Broadcast Campaigns", desc: "Send Meta-approved templates to segmented lists. Real-time tracking of delivery and reads." }, { title: "Automations", desc: "Welcome new contacts, automatic follow-ups, keyword routing. Visual flow builder." }, { title: "AI Assistant", desc: "Generate responses with AI. Bring your own OpenAI or Anthropic API key. No additional cost per message." }] },
      howItWorks: { title: "Live in under 30 minutes", subtitle: "Most teams are up and running before finishing their first coffee.", steps: [{ title: "Connect your WhatsApp number", desc: "Paste your phone number ID and access token from Meta. Works with any WhatsApp Business API provider." }, { title: "Bring your contacts", desc: "Import a CSV or let incoming messages build your list automatically." }, { title: "Reply, automate and measure", desc: "Use the shared inbox, set up flows for repetitive work and track what works." }] },
      pricing: { title: "Plans designed for you", subtitle: "Choose the plan that best fits your business. All include technical support and updates.", plans: [{ name: "Free", price: "RD$0", desc: "To try out", features: ["25 contacts", "1 team member", "Inbox only", "No broadcasts", "No automations", "No WhatsApp"], cta: "Get Started Free" }, { name: "Basic", price: "RD$1,500", desc: "For small businesses", popular: true, features: ["500 contacts", "3 team members", "Unlimited broadcasts", "No automations", "1 WhatsApp number"], cta: "Start Trial" }, { name: "Pro", price: "RD$3,000", desc: "For growing teams", features: ["2,000 contacts", "10 team members", "Unlimited broadcasts", "Automations", "Visual flows", "3 WhatsApp numbers"], cta: "Start Trial" }, { name: "Enterprise", price: "RD$6,000", desc: "For companies", features: ["Unlimited contacts", "Unlimited members", "Everything included", "API access", "Unlimited numbers", "Priority support"], cta: "Contact Sales" }], help: "Need help choosing?", contact: "Contact us" },
      why: { title: "Why Zynex CRM?", items: [{ title: "Secure data", desc: "Your information stored securely. Daily backups and encryption." }, { title: "Spanish support", desc: "Support team available to help you with anything you need." }, { title: "Made for Latam", desc: "Prices in Dominican pesos, official WhatsApp Business API integration." }, { title: "Constant updates", desc: "New features regularly based on user feedback." }], testimonial: "The best tool to manage WhatsApp for my business. Easy to use and the support is excellent.", author: "- Carlos M., Entrepreneur" },
      faq: { title: "Frequently Asked Questions", items: [{ q: "Is Zynex CRM free?", a: "We have a forever-free plan with 50 contacts and 1 member. We also offer 14-day trials of all paid plans." }, { q: "Does it work with official WhatsApp?", a: "Yes, Zynex CRM works with Meta's official WhatsApp Business API. You just need your phone number ID and access token." }, { q: "Can I send bulk messages?", a: "Yes, Basic, Pro and Enterprise plans include unlimited broadcasts with Meta-approved templates." }, { q: "How does payment work?", a: "We accept bank transfers. When you request a plan, we give you the details to make the payment and your account is activated manually." }, { q: "Is my data safe?", a: "Yes, your data is stored securely with daily backups and encryption. You can export your information whenever you need." }, { q: "Do I need to know how to code?", a: "No, Zynex CRM is designed for anyone to use. The interface is intuitive and requires no technical knowledge." }] },
      cta: { title: "Ready to get started?", subtitle: "Create a free account and discover how Zynex CRM can help you grow your business.", button: "Create Free Account", footer: "No credit card required • 14-day trial" },
      footer: { product: "Product", company: "Company", support: "Support", docs: "Documentation", copyright: "© 2024 Zynex SRL. All rights reserved.", powered: "Built on WhatsApp Business API • Meta" }
    }
  };

  const c = isEn ? content.en : content.es;
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Zynex CRM</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {c.nav.features}
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {c.nav.howItWorks}
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {c.nav.pricing}
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {c.nav.faq}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">{c.nav.login}</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{c.nav.cta}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        
          <div className="container mx-auto relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              {c.hero.badge}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {c.hero.title}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {c.hero.subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base px-8">
                  {c.hero.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="lg" variant="outline" className="text-base px-8">
                  {c.hero.ctaSecondary}
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              {c.hero.trial}
            </p>
          </div>

          {/* Demo Preview */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="bg-muted px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-muted-foreground">Zynex CRM</span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">María González</p>
                    <p className="text-sm text-muted-foreground">Hola, necesito información sobre...</p>
                  </div>
                  <span className="text-xs text-muted-foreground">2m</span>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Juan Pérez</p>
                    <p className="text-sm text-muted-foreground">¿Tienen disponibilidad para...</p>
                  </div>
                  <span className="text-xs text-muted-foreground">15m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {c.features.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {c.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MessageSquare, ...c.features.cards[0] },
              { icon: Users, ...c.features.cards[1] },
              { icon: BarChart3, ...c.features.cards[2] },
              { icon: Radio, ...c.features.cards[3] },
              { icon: Workflow, ...c.features.cards[4] },
              { icon: Sparkles, ...c.features.cards[5] },
            ].map((feature, i) => (
              <Card key={i} className="border-muted hover:border-primary/50 transition-colors">
                <CardHeader>
                  <feature.icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {c.howItWorks.title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {c.howItWorks.subtitle}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {c.howItWorks.steps.map((item, i) => (
              <div key={i} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  0{i + 1}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {c.pricing.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {c.pricing.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {c.pricing.plans.map((plan, i) => (
              <Card 
                key={i} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    {isEn ? "Most Popular" : "Más Popular"}
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.desc}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "RD$0" && <span className="text-muted-foreground">/mes</span>}
                  </div>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.name === "Empresarial" || plan.name === "Enterprise" ? "https://wa.me/18096757686" : "/signup"}>
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {c.pricing.help}{" "}
            <a href="https://wa.me/18096757686" className="text-primary hover:underline">
              {c.pricing.contact}
            </a>
          </p>
        </div>
      </section>

      {/* Why Zynex CRM */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {c.why.title}
              </h2>
              <div className="space-y-6">
                {c.why.items.map((item, i) => {
                  const icons = [Shield, HeadphonesIcon, Globe, Zap];
                  const Icon = icons[i];
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex gap-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    &ldquo;{c.why.testimonial}&rdquo;
                  </p>
                  <p className="text-sm font-medium">{c.why.author}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            {c.faq.title}
          </h2>
          
          <div className="space-y-6">
            {c.faq.items.map((faq, i) => (
              <div key={i} className="border-b pb-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {c.cta.title}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {c.cta.subtitle}
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 text-base px-8">
              {c.cta.button} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            {c.cta.footer}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
                  <MessageSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">Zynex CRM</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {isEn ? "WhatsApp Business CRM made for Latin American entrepreneurs and businesses." : "CRM para WhatsApp Business pensado para emprendedores y negocios latinoamericanos."}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{c.footer.product}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">{c.nav.features}</a></li>
                <li><a href="#pricing" className="hover:text-foreground">{c.nav.pricing}</a></li>
                <li><Link href="/login" className="hover:text-foreground">{c.nav.login}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{c.footer.company}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{isEn ? "About Us" : "Sobre Nosotros"}</a></li>
                <li><a href="https://wa.me/18096757686" className="hover:text-foreground">{isEn ? "Contact" : "Contacto"}</a></li>
                <li><a href="#" className="hover:text-foreground">{isEn ? "Terms" : "Términos"}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{c.footer.support}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{isEn ? "Help" : "Ayuda"}</a></li>
                <li><Link href="/docs" className="hover:text-foreground">{c.footer.docs}</Link></li>
                <li><a href="https://wa.me/18096757686" className="hover:text-foreground">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {c.footer.copyright}
            </p>
            <p className="text-sm text-muted-foreground">
              {c.footer.powered}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
