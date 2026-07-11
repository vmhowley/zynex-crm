"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Mail, Phone, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SubscriptionInfo {
  status: string;
  plan_name?: string;
  plan_type?: string;
  trial_ends_at?: string;
  suspended_at?: string;
}

export default function SuspendedPage() {
  const supabase = createClient();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/subscription");
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSuspended = subscription?.status === "suspended";
  const isTrialExpired = subscription?.status === "trial" && subscription?.trial_ends_at && 
    new Date(subscription.trial_ends_at) < new Date();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            {isSuspended ? "Cuenta Suspendida" : "Prueba Expirada"}
          </h1>
          <p className="text-muted-foreground">
            {isSuspended
              ? "Tu cuenta ha sido suspendida. Para reactivarla, contacta con nuestro equipo."
              : "Tu período de prueba ha terminado. Actualiza tu plan para continuar usando Zynex CRM."}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {subscription?.plan_name || "Plan"}
            </CardTitle>
            <CardDescription>
              Estado: <span className="text-destructive font-medium">
                {isSuspended ? "Suspendido" : "Prueba Expirada"}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm">¿Cómo reactivar tu cuenta?</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                {isTrialExpired ? (
                  <>
                    <li>Elige un plan que se ajuste a tus necesidades</li>
                    <li>Realiza el pago mediante transferencia</li>
                    <li>Envía el comprobante de pago</li>
                    <li>Tu cuenta se activará en breve</li>
                  </>
                ) : (
                  <>
                    <li>Contacta con nuestro equipo de soporte</li>
                    <li>Coordina el pago pendiente</li>
                    <li>Envía el comprobante de pago</li>
                    <li>Tu cuenta será reactivada</li>
                  </>
                )}
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Opciones de contacto</h4>
              <div className="grid gap-2">
                <a
                  href="https://wa.me/18096757686"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp: +1 (809) 675-7686
                </a>
                <a
                  href="mailto:soporte@zynex.do"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  soporte@zynex.do
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          <Link href="/pricing">
            <Button className="w-full" size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Ver Planes y Precios
            </Button>
          </Link>
          
          <Link href="/login">
            <Button variant="outline" className="w-full" size="lg">
              Iniciar Sesión
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          ¿Ya realizaste el pago? 
          <a href="https://wa.me/18096757686" className="text-primary hover:underline ml-1">
            Envíanos el comprobante
          </a>
        </p>
      </div>
    </div>
  );
}
