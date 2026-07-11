"use client";

import { usePlanLimits } from "@/hooks/use-plan-limits";
import { useTranslations } from "@/hooks/use-translations";
import { UsageCard } from "@/components/subscription/usage-card";
import { Users, UserCog, MessageCircle, Loader2, Crown, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UsagePage() {
  const { t } = useTranslations();
  const {
    loading,
    error,
    limits,
    features,
    planName,
    planType,
    canAddContact,
    canAddMember,
    canAddWhatsApp,
    refresh,
  } = usePlanLimits();

  const isAtLimit = (type: "contacts" | "team_members" | "whatsapp_numbers") => {
    if (!limits) return false;
    const limit = limits[type];
    if (limit.unlimited) return false;
    return limit.current >= limit.limit;
  };

  const isNearLimit = (type: "contacts" | "team_members" | "whatsapp_numbers") => {
    if (!limits) return false;
    const limit = limits[type];
    if (limit.unlimited) return false;
    const percentage = (limit.current / limit.limit) * 100;
    return percentage >= 70;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !limits) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <Crown className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Error al cargar uso</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button variant="outline" onClick={() => refresh()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Uso del Plan
          </h1>
          <p className="text-muted-foreground">
            Gestiona los recursos de tu cuenta
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh()}>
          <Loader2 className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Plan Info Card */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{planName}</CardTitle>
                <CardDescription className="capitalize">
                  Plan {planType}
                </CardDescription>
              </div>
            </div>
            <Link href="/pricing">
              <Button variant="outline" size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Cambiar Plan
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {features?.broadcasts && (
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                Broadcasts
              </Badge>
            )}
            {features?.automations && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                Automatizaciones
              </Badge>
            )}
            {features?.flows && (
              <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">
                Flujos Visuales
              </Badge>
            )}
            {features?.api && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                Acceso API
              </Badge>
            )}
            {!features?.broadcasts &&
              !features?.automations &&
              !features?.flows &&
              !features?.api && (
                <Badge variant="secondary">Sin funciones adicionales</Badge>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UsageCard
          icon={Users}
          label="Contactos"
          current={limits.contacts.current}
          limit={limits.contacts.limit}
          unlimited={limits.contacts.unlimited}
          showUpgrade={isNearLimit("contacts")}
          onUpgrade={() => (window.location.href = "/pricing")}
        />
        <UsageCard
          icon={UserCog}
          label="Miembros del Equipo"
          current={limits.team_members.current}
          limit={limits.team_members.limit}
          unlimited={limits.team_members.unlimited}
          showUpgrade={isNearLimit("team_members")}
          onUpgrade={() => (window.location.href = "/pricing")}
        />
        <UsageCard
          icon={MessageCircle}
          label="Números de WhatsApp"
          current={limits.whatsapp_numbers.current}
          limit={limits.whatsapp_numbers.limit}
          unlimited={limits.whatsapp_numbers.unlimited}
          showUpgrade={isNearLimit("whatsapp_numbers")}
          onUpgrade={() => (window.location.href = "/pricing")}
        />
      </div>

      {/* Status Messages */}
      {(isAtLimit("contacts") ||
        isAtLimit("team_members") ||
        isAtLimit("whatsapp_numbers")) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400">
                  Has alcanzado uno de tus límites
                </h4>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  Para continuar creciendo sin restricciones, te recomendamos
                  actualizar tu plan. Contamos con opciones para businesses de
                  todos los tamaños.
                </p>
                <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
                  Ver Planes
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Necesitas más recursos?</CardTitle>
          <CardDescription>
            Contáctanos si necesitas personalizar tu plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://wa.me/18096757686"
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline" })}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chatear por WhatsApp
            </a>
            <Link href="/settings?tab=billing" className={buttonVariants({ variant: "ghost" })}>
              Ver historial de facturación
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
