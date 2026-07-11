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
import { Check, X, Loader2, ArrowLeft, Sparkles, MessageSquare } from "lucide-react";
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
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentPaymentRequestId, setCurrentPaymentRequestId] = useState<string | null>(null);

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
    setUploadSuccess(false);

    try {
      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentInstructions(data);
        setCurrentPaymentRequestId(data.payment_request?.id || null);
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

  async function handleUploadReceipt(file: File) {
    if (!currentPaymentRequestId) {
      alert("Error: No se encontró la solicitud de pago");
      return;
    }

    setUploadingReceipt(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("payment_request_id", currentPaymentRequestId);

      const res = await fetch("/api/payments/upload-receipt", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadSuccess(true);
        alert("Comprobante subido exitosamente. Te contactaremos pronto.");
      } else {
        alert(data.error || "Error al subir el comprobante");
      }
    } catch (error) {
      console.error("Error uploading receipt:", error);
      alert("Error al subir el comprobante");
    } finally {
      setUploadingReceipt(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        alert("Tipo de archivo no permitido. Usa JPEG, PNG, WebP o PDF.");
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("El archivo excede el límite de 10MB");
        return;
      }

      handleUploadReceipt(file);
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

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary">
                <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">Zynex CRM</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                {t("nav_terms")}
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {t("nav_privacy")}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Zynex SRL. {t("footer_copyright")}
            </p>
          </div>
        </div>
      </footer>

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
                  <li>Sube el comprobante de pago (imagen o PDF)</li>
                  <li>Tu cuenta se activará en 24-48 horas hábiles</li>
                </ol>
              </div>

              {/* Upload Receipt Section */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 space-y-3">
                <p className="font-medium text-sm text-center">
                  {uploadSuccess ? "¡Comprobante subido exitosamente!" : "Sube tu comprobante de pago"}
                </p>

                {uploadSuccess ? (
                  <div className="flex items-center justify-center text-emerald-500">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-2 font-medium">Comprobante recibido</span>
                  </div>
                ) : (
                  <>
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={uploadingReceipt}
                      />
                      <div className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
                        {uploadingReceipt ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Subir comprobante (Imagen o PDF)
                          </>
                        )}
                      </div>
                    </label>
                    <p className="text-xs text-muted-foreground text-center">
                      Máx. 10MB • JPEG, PNG, WebP o PDF
                    </p>
                  </>
                )}
              </div>

              {/* Alternative: WhatsApp */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O también</span>
                </div>
              </div>

              <a
                href={`https://wa.me/18096757686?text=Hola,%20he%20realizado%20el%20pago%20por%20el%20plan%20${selectedPlan.name}.%20Mi%20referencia%20es:%20${paymentInstructions.instructions?.reference}`}
                target="_blank"
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
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
