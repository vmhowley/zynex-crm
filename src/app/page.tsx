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

const featureIcons = [MessageSquare, Users, BarChart3, Radio, Workflow, Sparkles];
const whyIcons = [Shield, HeadphonesIcon, Globe, Zap];

interface PlanMeta {
  key: number;
  popular: boolean;
  href: string;
  featureCount: number;
}

const plans: PlanMeta[] = [
  { key: 0, popular: false, href: "/signup", featureCount: 6 },
  { key: 1, popular: true, href: "/signup", featureCount: 5 },
  { key: 2, popular: false, href: "/signup", featureCount: 6 },
  { key: 3, popular: false, href: "https://wa.me/18096757686", featureCount: 6 },
];

export default function LandingPage() {
  const { t } = useTranslations();

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
              {t("nav_features")}
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav_howItWorks")}
            </a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav_pricing")}
            </a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {t("nav_faq")}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">{t("nav_login")}</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{t("nav_cta")}</Button>
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
              {t("hero_badge")}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t("hero_title")}
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("hero_subtitle")}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base px-8">
                  {t("hero_cta")} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#pricing">
                <Button size="lg" variant="outline" className="text-base px-8">
                  {t("hero_ctaSecondary")}
                </Button>
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-muted-foreground">
              {t("hero_trial")}
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
              {t("features_title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("features_subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureIcons.map((Icon, i) => (
              <Card key={i} className="border-muted hover:border-primary/50 transition-colors">
                <CardHeader>
                  <Icon className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg">{t(`features_card_${i}_title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t(`features_card_${i}_desc`)}
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
              {t("howItWorks_title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("howItWorks_subtitle")}
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  0{i + 1}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-semibold mb-2">{t(`howItWorks_step_${i}_title`)}</h3>
                  <p className="text-muted-foreground">{t(`howItWorks_step_${i}_desc`)}</p>
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
              {t("pricing_title")}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("pricing_subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.key} 
                className={`relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    {t("plans_mostPopular")}
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{t(`pricing_plan_${plan.key}_name`)}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t(`pricing_plan_${plan.key}_desc`)}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-4xl font-bold">{t(`pricing_plan_${plan.key}_price`)}</span>
                    {plan.key !== 0 && <span className="text-muted-foreground">/mes</span>}
                  </div>
                  
                  <ul className="space-y-2">
                    {Array.from({ length: plan.featureCount }, (_, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {t(`pricing_plan_${plan.key}_feature_${j}`)}
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href}>
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                      {t(`pricing_plan_${plan.key}_cta`)}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {t("pricing_help")}{" "}
            <a href="https://wa.me/18096757686" className="text-primary hover:underline">
              {t("pricing_contact")}
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
                {t("why_title")}
              </h2>
              <div className="space-y-6">
                {[0, 1, 2, 3].map((i) => {
                  const Icon = whyIcons[i];
                  return (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{t(`why_item_${i}_title`)}</h3>
                        <p className="text-sm text-muted-foreground">{t(`why_item_${i}_desc`)}</p>
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
                    &ldquo;{t("why_testimonial")}&rdquo;
                  </p>
                  <p className="text-sm font-medium">{t("why_author")}</p>
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
            {t("faq_title")}
          </h2>
          
          <div className="space-y-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-b pb-6">
                <h3 className="font-semibold mb-2">{t(`faq_item_${i}_q`)}</h3>
                <p className="text-muted-foreground">{t(`faq_item_${i}_a`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t("cta_title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("cta_subtitle")}
          </p>
          <Link href="/signup">
            <Button size="lg" className="gap-2 text-base px-8">
              {t("cta_button")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("cta_footer")}
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
                {t("landing_footerTagline")}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t("footer_product")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">{t("nav_features")}</a></li>
                <li><a href="#pricing" className="hover:text-foreground">{t("nav_pricing")}</a></li>
                <li><Link href="/login" className="hover:text-foreground">{t("nav_login")}</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t("footer_company")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("landing_aboutUs")}</a></li>
                <li><a href="https://wa.me/18096757686" className="hover:text-foreground">{t("landing_contact")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("landing_terms")}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">{t("footer_support")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("landing_help")}</a></li>
                <li><Link href="/docs" className="hover:text-foreground">{t("footer_docs")}</Link></li>
                <li><a href="https://wa.me/18096757686" className="hover:text-foreground">WhatsApp</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("footer_copyright")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("footer_powered")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
