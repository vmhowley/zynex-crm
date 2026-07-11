"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { usePlanLimits } from "@/hooks/use-plan-limits";
import { cn } from "@/lib/utils";

export type GateType =
  | "add-contact"
  | "add-member"
  | "add-whatsapp"
  | "broadcasts"
  | "automations"
  | "flows"
  | "api";

interface PlanGatedButtonProps extends Omit<ComponentProps<typeof Button>, "disabled"> {
  /** The type of gate to apply */
  gate: GateType;
  /** Override the default disabled state */
  disabled?: boolean;
  /** Custom error message to show */
  customMessage?: string;
  /** Show upgrade prompt (default: true) */
  showUpgradePrompt?: boolean;
  /** Click handler - only fires if allowed */
  onClick?: () => void;
  /** Navigation target - uses router.push if provided */
  href?: string;
  /** Children content */
  children?: ReactNode;
  /** Additional className */
  className?: string;
  /** Button variant */
  variant?: ComponentProps<typeof Button>["variant"];
  /** Button size */
  size?: ComponentProps<typeof Button>["size"];
}

/**
 * Button that gates actions based on the account's subscription plan limits.
 * 
 * Usage:
 * 
 *   <PlanGatedButton gate="add-contact">
 *     <Plus className="h-4 w-4" /> Add Contact
 *   </PlanGatedButton>
 * 
 *   <PlanGatedButton gate="broadcasts" href="/broadcasts/new">
 *     New Broadcast
 *   </PlanGatedButton>
 * 
 *   <PlanGatedButton gate="automations" disabled={isSubmitting}>
 *     Save Automation
 *   </PlanGatedButton>
 */
export function PlanGatedButton({
  gate,
  disabled: externalDisabled,
  customMessage,
  showUpgradePrompt = true,
  onClick,
  href,
  children,
  className,
  variant = "default",
  size = "default",
  ...rest
}: PlanGatedButtonProps) {
  const router = useRouter();
  const { loading, limits, features, planName, canAddContact, canAddMember, canAddWhatsApp, canUseBroadcasts, canUseAutomations, canUseFlows, canUseApi } = usePlanLimits();

  // Determine if action is allowed based on gate type
  let isAllowed = true;
  let reason = "";
  let limitInfo = "";

  switch (gate) {
    case "add-contact":
      isAllowed = canAddContact;
      reason = "Has alcanzado el límite de contactos";
      if (limits?.contacts && !limits.contacts.unlimited) {
        limitInfo = ` (${limits.contacts.current}/${limits.contacts.limit})`;
      }
      break;
    case "add-member":
      isAllowed = canAddMember;
      reason = "Has alcanzado el límite de miembros del equipo";
      if (limits?.team_members && !limits.team_members.unlimited) {
        limitInfo = ` (${limits.team_members.current}/${limits.team_members.limit})`;
      }
      break;
    case "add-whatsapp":
      isAllowed = canAddWhatsApp;
      reason = "Has alcanzado el límite de números de WhatsApp";
      if (limits?.whatsapp_numbers && !limits.whatsapp_numbers.unlimited) {
        limitInfo = ` (${limits.whatsapp_numbers.current}/${limits.whatsapp_numbers.limit})`;
      }
      break;
    case "broadcasts":
      isAllowed = canUseBroadcasts;
      reason = "Los broadcasts no están disponibles en tu plan";
      break;
    case "automations":
      isAllowed = canUseAutomations;
      reason = "Las automatizaciones no están disponibles en tu plan";
      break;
    case "flows":
      isAllowed = canUseFlows;
      reason = "Los flujos no están disponibles en tu plan";
      break;
    case "api":
      isAllowed = canUseApi;
      reason = "El acceso a API no está disponible en tu plan";
      break;
  }

  const isDisabled = externalDisabled || !isAllowed;
  
  // Build tooltip message
  let tooltip = "";
  if (!isAllowed) {
    tooltip = customMessage || reason;
    if (showUpgradePrompt && planName) {
      tooltip += `. Actualiza tu plan para desbloquear.`;
    }
  }

  const handleClick = () => {
    if (isDisabled || loading) return;
    
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <span
      className={cn("inline-flex", !isAllowed && "cursor-not-allowed")}
      title={tooltip}
    >
      <Button
        disabled={isDisabled || loading}
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </Button>
    </span>
  );
}

/**
 * Component that conditionally renders children based on plan limits.
 * Use this for more complex UI that needs to show/hide sections.
 * 
 * Usage:
 * 
 *   <PlanGate gate="broadcasts">
 *     <BroadcastDashboard />
 *   </PlanGate>
 * 
 *   <PlanGate gate="add-contact" fallback={<UpgradePrompt />}>
 *     <AddContactButton />
 *   </PlanGate>
 */
interface PlanGateProps {
  gate: GateType;
  children: ReactNode;
  /** Content to show when gate is not passed */
  fallback?: ReactNode;
  /** Show a default upgrade prompt when blocked */
  showUpgradePrompt?: boolean;
}

export function PlanGate({ gate, children, fallback, showUpgradePrompt = true }: PlanGateProps) {
  const { loading, limits, features, planName, canAddContact, canAddMember, canAddWhatsApp, canUseBroadcasts, canUseAutomations, canUseFlows, canUseApi } = usePlanLimits();

  let isAllowed = true;

  switch (gate) {
    case "add-contact":
      isAllowed = canAddContact;
      break;
    case "add-member":
      isAllowed = canAddMember;
      break;
    case "add-whatsapp":
      isAllowed = canAddWhatsApp;
      break;
    case "broadcasts":
      isAllowed = canUseBroadcasts;
      break;
    case "automations":
      isAllowed = canUseAutomations;
      break;
    case "flows":
      isAllowed = canUseFlows;
      break;
    case "api":
      isAllowed = canUseApi;
      break;
  }

  if (loading) {
    // Show nothing while loading, or you could show a skeleton
    return null;
  }

  if (!isAllowed) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback: show upgrade prompt
    if (showUpgradePrompt) {
      const featureNames: Record<GateType, string> = {
        "add-contact": "contactos",
        "add-member": "miembros del equipo",
        "add-whatsapp": "números de WhatsApp",
        "broadcasts": "Broadcasts",
        "automations": "Automatizaciones",
        "flows": "Flujos",
        "api": "API",
      };
      
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {features === null 
              ? `Esta función no está disponible en tu plan actual.`
              : `${featureNames[gate]} no está disponible en el plan ${planName || 'actual'}.`
            }
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => window.location.href = '/settings?tab=subscription'}
            className="mt-2"
          >
            Ver planes disponibles
          </Button>
        </div>
      );
    }
    
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if a specific action is allowed based on plan limits.
 * Useful for more complex logic beyond simple button gating.
 */
export function usePlanGate(gate: GateType): { allowed: boolean; loading: boolean; reason?: string } {
  const { loading, limits, features, planName, canAddContact, canAddMember, canAddWhatsApp, canUseBroadcasts, canUseAutomations, canUseFlows, canUseApi } = usePlanLimits();

  let isAllowed = true;
  let reason = "";

  switch (gate) {
    case "add-contact":
      isAllowed = canAddContact;
      reason = "Has alcanzado el límite de contactos";
      break;
    case "add-member":
      isAllowed = canAddMember;
      reason = "Has alcanzado el límite de miembros del equipo";
      break;
    case "add-whatsapp":
      isAllowed = canAddWhatsApp;
      reason = "Has alcanzado el límite de números de WhatsApp";
      break;
    case "broadcasts":
      isAllowed = canUseBroadcasts;
      reason = "Los broadcasts no están disponibles en tu plan";
      break;
    case "automations":
      isAllowed = canUseAutomations;
      reason = "Las automatizaciones no están disponibles en tu plan";
      break;
    case "flows":
      isAllowed = canUseFlows;
      reason = "Los flujos no están disponibles en tu plan";
      break;
    case "api":
      isAllowed = canUseApi;
      reason = "El acceso a API no está disponible en tu plan";
      break;
  }

  return { allowed: isAllowed, loading, reason: isAllowed ? undefined : reason };
}
