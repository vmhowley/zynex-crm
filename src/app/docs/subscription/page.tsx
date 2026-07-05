"use client";

import Link from "next/link";
import { MessageSquare, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "@/hooks/use-translations";

export default function SubscriptionDocPage() {
  const { t } = useTranslations();
  const isEn = t("auth.login") !== "Iniciar Sesión";

  const content = isEn ? {
    title: "Subscription & Billing",
    subtitle: "Manage your plan, payments and billing information.",
    sections: [
      { title: "Plans", desc: "Choose from Free, Basic, Pro, or Enterprise plans." },
      { title: "Bank Transfer", desc: "Pay via bank transfer. Upload receipt after payment." },
      { title: "Trial Period", desc: "14-day free trial on all paid plans." },
      { title: "Upgrade/Downgrade", desc: "Change your plan at any time." },
      { title: "Invoice History", desc: "View and download past invoices." },
    ],
    prev: "Back: Members",
    backToDocs: "Back to Documentation"
  } : {
    title: "Suscripción y Facturación",
    subtitle: "Gestiona tu plan, pagos e información de facturación.",
    sections: [
      { title: "Planes", desc: "Elige entre planes Gratis, Básico, Pro, o Empresarial." },
      { title: "Transferencia Bancaria", desc: "Paga vía transferencia bancaria. Sube recibo después del pago." },
      { title: "Período de Prueba", desc: "14 días de prueba gratis en todos los planes de pago." },
      { title: "Upgrade/Downgrade", desc: "Cambia tu plan en cualquier momento." },
      { title: "Historial de Facturas", desc: "Ve y descarga facturas pasadas." },
    ],
    prev: "Atrás: Miembros",
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
            {isEn ? "Pricing" : "Precios"}
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

        <div className="mt-12">
          <Link href="/docs/members" className="text-primary hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> {c.prev}
          </Link>
        </div>
      </div>
    </div>
  );
}
