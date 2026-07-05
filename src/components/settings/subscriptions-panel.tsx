"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface SubscriptionData {
  subscription: {
    status: string;
    trial_ends_at: string;
    plans: {
      name: string;
      plan_type: string;
      price_rd: number;
    };
  };
  usage: {
    contacts: { current: number; limit: number; unlimited: boolean };
    team_members: { current: number; limit: number; unlimited: boolean };
    whatsapp_numbers: { current: number; limit: number; unlimited: boolean };
  };
}

export function SubscriptionPanel() {
  const supabase = createClient();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch("/api/usage");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.subscription) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No se encontró información de suscripción
      </div>
    );
  }

  const { subscription, usage } = data;
  const plan = subscription.plans;
  const status = subscription.status;
  const trialEndsAt = subscription.trial_ends_at;

  let daysRemaining: number | null = null;
  if (trialEndsAt && status === "trial") {
    const end = new Date(trialEndsAt);
    const now = new Date();
    daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const isTrial = status === "trial";
  const isActive = status === "active";
  const isExpired = isTrial && daysRemaining !== null && daysRemaining <= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Suscripción</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona tu plan y límites de uso
          </p>
        </div>
        <Link href="/pricing" className={buttonVariants()}>
          Cambiar Plan
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <Badge
              variant={isActive ? "default" : isExpired ? "destructive" : "secondary"}
              className="flex items-center gap-1"
            >
              {isActive ? (
                <>
                  <CheckCircle className="h-3 w-3" /> Activo
                </>
              ) : isExpired ? (
                <>
                  <AlertCircle className="h-3 w-3" /> Expirado
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" /> Trial
                </>
              )}
            </Badge>
          </div>
          <CardDescription>
            {plan.price_rd === 0
              ? "Plan gratuito"
              : `RD$${plan.price_rd.toLocaleString()}/mes`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTrial && daysRemaining !== null && !isExpired && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>{daysRemaining} días restantes</strong> en tu período de prueba.
                <br />
                <Link href="/pricing" className="underline">
                  Actualiza tu plan
                </Link>{" "}
                para continuar sin interrupciones.
              </p>
            </div>
          )}

          {isExpired && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-sm text-destructive">
                Tu período de prueba ha terminado.
                <br />
                <Link href="/pricing" className="underline font-medium">
                  Actualiza tu plan
                </Link>{" "}
                para seguir usando Zynex CRM.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Límites de uso</h4>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Contactos</span>
              <span>
                {usage.contacts.current} /{" "}
                {usage.contacts.unlimited ? "∞" : usage.contacts.limit}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Miembros del equipo</span>
              <span>
                {usage.team_members.current} /{" "}
                {usage.team_members.unlimited ? "∞" : usage.team_members.limit}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Números de WhatsApp</span>
              <span>
                {usage.whatsapp_numbers.current} /{" "}
                {usage.whatsapp_numbers.unlimited
                  ? "∞"
                  : usage.whatsapp_numbers.limit}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
