"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface TrialBannerProps {
  onDismiss?: () => void;
}

export function TrialBanner({ onDismiss }: TrialBannerProps) {
  const supabase = createClient();
  const [status, setStatus] = useState<{
    status: string;
    trial_ends_at: string | null;
    days_remaining: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/subscription");
      const data = await res.json();

      if (data.subscription) {
        const trialEndsAt = data.subscription.trial_ends_at;
        let daysRemaining: number | null = null;

        if (trialEndsAt) {
          const end = new Date(trialEndsAt);
          const now = new Date();
          daysRemaining = Math.ceil(
            (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        setStatus({
          status: data.subscription.status,
          trial_ends_at: trialEndsAt,
          days_remaining: daysRemaining,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !status) return null;

  const isTrial = status.status === "trial";
  const isExpired = isTrial && status.days_remaining !== null && status.days_remaining <= 0;
  const isExpiringSoon = isTrial && status.days_remaining !== null && status.days_remaining <= 3 && status.days_remaining > 0;

  if (!isTrial && status.status !== "active") return null;

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border border-destructive/50 text-destructive-foreground">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Tu período de prueba ha terminado</p>
              <p className="text-sm text-destructive/80">
                Actualiza tu plan para continuar usando Zynex CRM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
              Ver Planes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/50 text-amber-700 dark:text-amber-400">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                Tu prueba termina en {status.days_remaining} día{status.days_remaining === 1 ? "" : "s"}
              </p>
              <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                No pierdas acceso a tu CRM, actualiza tu plan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/pricing" className={buttonVariants({ size: "sm", variant: "outline" })}>
              Actualizar Ahora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function SubscriptionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const res = await fetch("/api/subscription");
      const data = await res.json();

      if (data.subscription?.status === "trial" && data.subscription.trial_ends_at) {
        const end = new Date(data.subscription.trial_ends_at);
        const now = new Date();
        if (end < now) {
          setIsBlocked(true);
        }
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-4 max-w-md p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Período de Prueba Expirado</h2>
          <p className="text-muted-foreground">
            Tu período de prueba ha terminado. Actualiza tu plan para continuar
            usando Zynex CRM.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/pricing" className={buttonVariants()}>
              Ver Planes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
