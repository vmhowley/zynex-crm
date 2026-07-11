"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LimitType, FeatureType } from "@/lib/subscription/enforce";

export interface PlanLimits {
  contacts: { current: number; limit: number; unlimited: boolean };
  team_members: { current: number; limit: number; unlimited: boolean };
  whatsapp_numbers: { current: number; limit: number; unlimited: boolean };
}

export interface PlanFeatures {
  broadcasts: boolean;
  automations: boolean;
  flows: boolean;
  api: boolean;
}

interface SubscriptionData {
  plan: {
    max_contacts: number | null;
    max_team_members: number | null;
    max_whatsapp_numbers: number | null;
    broadcasts_enabled: boolean;
    automations_enabled: boolean;
    flows_enabled: boolean;
    api_access: boolean;
    name: string;
    plan_type: string;
  };
  status: string;
}

interface UsePlanLimitsResult {
  loading: boolean;
  error: string | null;
  limits: PlanLimits | null;
  features: PlanFeatures | null;
  planName: string | null;
  planType: string | null;
  canAddContact: boolean;
  canAddMember: boolean;
  canAddWhatsApp: boolean;
  canUseBroadcasts: boolean;
  canUseAutomations: boolean;
  canUseFlows: boolean;
  canUseApi: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to get current plan limits and usage for the user's account.
 * Provides easy-to-use booleans for UI gating.
 */
export function usePlanLimits(): UsePlanLimitsResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = await createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("No authenticated user");
        return;
      }

      // Get profile to find account_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.account_id) {
        setError("Profile not linked to account");
        return;
      }

      // Get subscription with plan details
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("account_id", profile.account_id)
        .in("status", ["trial", "active"])
        .single();

      if (subError || !subscription) {
        setError("No active subscription");
        return;
      }

      const plan = (subscription as unknown as { plans: SubscriptionData["plan"] })
        .plans;

      setPlanName(plan.name);
      setPlanType(plan.plan_type);

      // Get current usage counts
      const [
        { count: contactsCount },
        { count: membersCount },
        { count: whatsappCount },
      ] = await Promise.all([
        supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("account_id", profile.account_id),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("account_id", profile.account_id),
        supabase
          .from("channel_configs")
          .select("*", { count: "exact", head: true })
          .eq("account_id", profile.account_id)
          .eq("channel", "whatsapp"),
      ]);

      const parseLimit = (value: number | null): { limit: number; unlimited: boolean } => {
        if (value === null || value === -1) {
          return { limit: Infinity, unlimited: true };
        }
        return { limit: value, unlimited: false };
      };

      setLimits({
        contacts: {
          current: contactsCount || 0,
          ...parseLimit(plan.max_contacts),
        },
        team_members: {
          current: membersCount || 0,
          ...parseLimit(plan.max_team_members),
        },
        whatsapp_numbers: {
          current: whatsappCount || 0,
          ...parseLimit(plan.max_whatsapp_numbers),
        },
      });

      setFeatures({
        broadcasts: plan.broadcasts_enabled,
        automations: plan.automations_enabled,
        flows: plan.flows_enabled,
        api: plan.api_access,
      });
    } catch (err) {
      console.error("Error fetching plan limits:", err);
      setError("Failed to load plan limits");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper booleans for easy UI gating
  const canAddContact =
    limits?.contacts.current !== undefined &&
    limits?.contacts.current < limits?.contacts.limit;

  const canAddMember =
    limits?.team_members.current !== undefined &&
    limits?.team_members.current < limits?.team_members.limit;

  const canAddWhatsApp =
    limits?.whatsapp_numbers.current !== undefined &&
    limits?.whatsapp_numbers.current < limits?.whatsapp_numbers.limit;

  return {
    loading,
    error,
    limits,
    features,
    planName,
    planType,
    canAddContact: canAddContact ?? false,
    canAddMember: canAddMember ?? false,
    canAddWhatsApp: canAddWhatsApp ?? false,
    canUseBroadcasts: features?.broadcasts ?? false,
    canUseAutomations: features?.automations ?? false,
    canUseFlows: features?.flows ?? false,
    canUseApi: features?.api ?? false,
    refresh: fetchData,
  };
}

/**
 * Hook to check a specific limit before performing an action.
 * Use this for one-off checks that need fresh data.
 */
export function useCheckLimit() {
  const checkLimit = useCallback(
    async (limitType: LimitType): Promise<{ allowed: boolean; error?: string; current?: number; limit?: number }> => {
      try {
        const supabase = await createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { allowed: false, error: "No autenticado" };
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("account_id")
          .eq("user_id", user.id)
          .single();

        if (!profile?.account_id) {
          return { allowed: false, error: "Perfil no vinculado a cuenta" };
        }

        // Get subscription
        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("account_id", profile.account_id)
          .in("status", ["trial", "active"])
          .single();

        if (subError || !subscription) {
          return { allowed: false, error: "Sin suscripción activa" };
        }

        const plan = (subscription as unknown as { plans: SubscriptionData["plan"] })
          .plans;

        const limitKey = `max_${limitType}` as keyof typeof plan;
        const limit = plan[limitKey] as number | null;

        // Unlimited
        if (limit === null || limit === -1) {
          return { allowed: true };
        }

        // Get current count
        let current = 0;
        switch (limitType) {
          case "contacts": {
            const { count } = await supabase
              .from("contacts")
              .select("*", { count: "exact", head: true })
              .eq("account_id", profile.account_id);
            current = count || 0;
            break;
          }
          case "team_members": {
            const { count } = await supabase
              .from("profiles")
              .select("*", { count: "exact", head: true })
              .eq("account_id", profile.account_id);
            current = count || 0;
            break;
          }
          case "whatsapp_numbers": {
            const { count } = await supabase
              .from("channel_configs")
              .select("*", { count: "exact", head: true })
              .eq("account_id", profile.account_id)
              .eq("channel", "whatsapp");
            current = count || 0;
            break;
          }
        }

        if (current >= limit) {
          const typeLabels: Record<LimitType, string> = {
            contacts: "contactos",
            team_members: "miembros del equipo",
            whatsapp_numbers: "números de WhatsApp",
          };
          return {
            allowed: false,
            error: `Has alcanzado el límite de ${limit} ${typeLabels[limitType]}. Actualiza tu plan para continuar.`,
            current,
            limit,
          };
        }

        return { allowed: true, current, limit };
      } catch (err) {
        console.error("Error checking limit:", err);
        return { allowed: false, error: "Error al verificar límite" };
      }
    },
    []
  );

  const checkFeature = useCallback(
    async (feature: FeatureType): Promise<{ allowed: boolean; error?: string }> => {
      try {
        const supabase = await createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { allowed: false, error: "No autenticado" };
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("account_id")
          .eq("user_id", user.id)
          .single();

        if (!profile?.account_id) {
          return { allowed: false, error: "Perfil no vinculado a cuenta" };
        }

        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .select("*, plans(*)")
          .eq("account_id", profile.account_id)
          .in("status", ["trial", "active"])
          .single();

        if (subError || !subscription) {
          return { allowed: false, error: "Sin suscripción activa" };
        }

        const plan = (subscription as unknown as { plans: SubscriptionData["plan"] })
          .plans;

        const featureMap: Record<FeatureType, keyof typeof plan> = {
          broadcasts: "broadcasts_enabled",
          automations: "automations_enabled",
          flows: "flows_enabled",
          api: "api_access",
        };

        const enabled = plan[featureMap[feature]];

        if (!enabled) {
          const featureLabels: Record<FeatureType, string> = {
            broadcasts: "Broadcasts",
            automations: "Automatizaciones",
            flows: "Flujos",
            api: "API",
          };
          return {
            allowed: false,
            error: `${featureLabels[feature]} no está disponible en tu plan actual. Actualiza para desbloquear esta función.`,
          };
        }

        return { allowed: true };
      } catch (err) {
        console.error("Error checking feature:", err);
        return { allowed: false, error: "Error al verificar función" };
      }
    },
    []
  );

  return { checkLimit, checkFeature };
}
