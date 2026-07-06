"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/hooks/use-translations";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  plan_type: string;
  price_rd: number;
  trial_days: number;
  max_contacts: number | null;
  max_team_members: number | null;
  max_whatsapp_numbers: number | null;
  broadcasts_enabled: boolean;
  automations_enabled: boolean;
  flows_enabled: boolean;
  api_access: boolean;
}

export default function PricingPage() {
  const { t } = useTranslations();
  
  const supabase = createClient();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch("/api/plans"),
        fetch("/api/subscription"),
      ]);

      const plansData = await plansRes.json();
      const subData = await subRes.json();

      setPlans(plansData.plans || []);
      setCurrentPlan(subData.subscription?.plans?.plan_type || "free");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(plan: Plan) {
    if (plan.plan_type === "free") return;

    setSelectedPlan(plan);
    setUpgrading(plan.id);

    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentInstructions(data);
        setShowPaymentModal(true);
      } else {
        alert(data.error || "Error al procesar solicitud");
      }
    } catch (error) {
      console.error("Error upgrading:", error);
      alert("Error al procesar solicitud");
    } finally {
      setUpgrading(null);
    }
  }

  function formatLimit(value: number | null): string {
    if (value === null || value === -1) return "Ilimitado";
    return value.toLocaleString();
  }

  const features: { key: keyof Plan; label: string; format: (v: any) => string }[] = [
    { 
      key: "max_contacts", 
      label: "Contactos", 
      format: (v) => formatLimit(v as number | null) 
    },
    { 
      key: "max_team_members", 
      label: "Miembros del equipo", 
      format: (v) => formatLimit(v as number | null) 
    },
    { 
      key: "max_whatsapp_numbers", 
      label: "Números de WhatsApp", 
      format: (v) => formatLimit(v as number | null) 
    },
    { 
      key: "broadcasts_enabled", 
      label: "Broadcasts", 
      format: (v) => v ? "✓" : "✗" 
    },
    { 
      key: "automations_enabled", 
      label: "Automatizaciones", 
      format: (v) => v ? "✓" : "✗" 
    },
    { 
      key: "flows_enabled", 
      label: "Flujos visuales", 
      format: (v) => v ? "✓" : "✗" 
    },
    { 
      key: "api_access", 
      label: "Acceso API", 
      format: (v) => v ? "✓" : "✗" 
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">¿Ya tienes cuenta?</span>
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar Sesión</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Planes de Precios
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Elige el plan perfecto para ti
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todos los planes incluyen 14 días de prueba. 
            Sin compromiso, sin tarjeta de crédito.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-4 p-1 rounded-lg bg-muted">
            <div className="px-4 py-2 rounded-md bg-background text-sm font-medium shadow-sm">
              Mensual
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.plan_type;
            const currentIndex = plans.findIndex((p) => p.plan_type === currentPlan);
            const planIndex = plans.findIndex((p) => p.plan_type === plan.plan_type);
            const isUpgrade = currentIndex < planIndex;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col relative ${
                  plan.plan_type === "pro"
                    ? "border-primary shadow-lg shadow-primary/10"
                    : "border-border"
                }`}
              >
                {plan.plan_type === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Más Popular
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.plan_type === "free"
                      ? "Para comenzar"
                      : plan.trial_days > 0
                      ? `${plan.trial_days} días de prueba`
                      : "Facturación mensual"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">
                      {plan.price_rd === 0 ? "RD$0" : `RD$${plan.price_rd.toLocaleString()}`}
                    </span>
                    {plan.price_rd > 0 && (
                      <span className="text-muted-foreground text-sm">/mes</span>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {features.map((feature) => {
                      const value = plan[feature.key];
                      const formatted = feature.format(value);
                      const isIncluded = formatted === "✓";
                      
                      return (
                        <li key={feature.key} className="flex items-center gap-3 text-sm">
                          {isIncluded ? (
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className={isIncluded ? "" : "text-muted-foreground"}>
                            {feature.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
                <CardFooter className="pt-4">
                  {isCurrentPlan ? (
                    <Button disabled className="w-full" variant="secondary">
                      Plan Actual
                    </Button>
                  ) : plan.plan_type === "free" ? (
                    <Link href="/signup" className={buttonVariants({ className: "w-full", variant: "outline" })}>
                      Empezar Gratis
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan)}
                      disabled={upgrading === plan.id}
                      className="w-full"
                      variant={plan.plan_type === "pro" ? "default" : "outline"}
                    >
                      {upgrading === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isUpgrade ? (
                        "Mejorar Plan"
                      ) : (
                        "Cambiar Plan"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            ¿Necesitas ayuda para elegir?{" "}
            <a href="https://wa.me/18096757686" className="text-primary hover:underline">
              Contáctanos por WhatsApp
            </a>
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && paymentInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Solicitud de Pago</CardTitle>
              <CardDescription>
                Plan: {selectedPlan.name} - RD${selectedPlan.price_rd.toLocaleString()}/mes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <p className="font-medium">Datos para transferencia:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Banco:</span> <span className="font-medium">{paymentInstructions.instructions?.bank}</span></p>
                  <p><span className="text-muted-foreground">Cuenta:</span> <span className="font-medium">{paymentInstructions.instructions?.account}</span></p>
                  <p><span className="text-muted-foreground">Beneficiario:</span> <span className="font-medium">{paymentInstructions.instructions?.recipient}</span></p>
                  <p><span className="text-muted-foreground">Referencia:</span> <span className="font-mono font-medium">{paymentInstructions.instructions?.reference}</span></p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Próximos pasos:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Realiza la transferencia por RD${selectedPlan.price_rd.toLocaleString()}</li>
                  <li>Envía el comprobante por WhatsApp</li>
                  <li>Tu cuenta se activará en breve</li>
                </ol>
              </div>

              <a
                href={`https://wa.me/18096757686?text=Hola,%20he%20realizado%20el%20pago%20por%20el%20plan%20${selectedPlan.name}.%20Mi%20referencia%20es:%20${paymentInstructions.instructions?.reference}`}
                target="_blank"
                className={buttonVariants({ className: "w-full" })}
              >
                Enviar Comprobante por WhatsApp
              </a>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPaymentModal(false)}
              >
                Cerrar
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
