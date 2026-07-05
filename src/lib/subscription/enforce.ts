import { createClient } from "@/lib/supabase/server";

export type LimitType = "contacts" | "team_members" | "whatsapp_numbers";
export type FeatureType = "broadcasts" | "automations" | "flows" | "api";

export interface EnforcementResult {
  allowed: boolean;
  error?: string;
  currentCount?: number;
  limit?: number;
}

export async function checkLimit(
  accountId: string,
  limitType: LimitType,
  increment: number = 0
): Promise<EnforcementResult> {
  const supabase = await createClient();

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("account_id", accountId)
    .in("status", ["trial", "active"])
    .single();

  if (subError || !subscription) {
    return { allowed: false, error: "No active subscription" };
  }

  const plan = subscription.plans as any;
  const limit = plan[`max_${limitType}`];

  if (limit === null || limit === -1) {
    return { allowed: true };
  }

  let currentCount = 0;

  switch (limitType) {
    case "contacts": {
      const { count } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId);
      currentCount = count || 0;
      break;
    }
    case "team_members": {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId);
      currentCount = count || 0;
      break;
    }
    case "whatsapp_numbers": {
      const { count } = await supabase
        .from("whatsapp_config")
        .select("*", { count: "exact", head: true })
        .eq("account_id", accountId);
      currentCount = count || 0;
      break;
    }
  }

  const newCount = currentCount + increment;

  if (newCount > limit) {
    return {
      allowed: false,
      error: `Has alcanzado el límite de ${limit} ${limitType.replace("_", " ")}. Actualiza tu plan.`,
      currentCount,
      limit,
    };
  }

  return { allowed: true, currentCount, limit };
}

export async function checkFeature(
  accountId: string,
  feature: FeatureType
): Promise<EnforcementResult> {
  const supabase = await createClient();

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("account_id", accountId)
    .in("status", ["trial", "active"])
    .single();

  if (subError || !subscription) {
    return { allowed: false, error: "No active subscription" };
  }

  const plan = subscription.plans as any;
  const featureMap: Record<FeatureType, string> = {
    broadcasts: "broadcasts_enabled",
    automations: "automations_enabled",
    flows: "flows_enabled",
    api: "api_access",
  };

  const enabled = plan[featureMap[feature]];

  if (!enabled) {
    return {
      allowed: false,
      error: `Esta característica no está disponible en tu plan. Actualiza para desbloquear.`,
    };
  }

  return { allowed: true };
}

export async function checkSubscriptionAccess(
  accountId: string
): Promise<{ allowed: boolean; status?: string; trial_ends_at?: string }> {
  const supabase = await createClient();

  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("status, trial_ends_at")
    .eq("account_id", accountId)
    .single();

  if (error || !subscription) {
    return { allowed: false };
  }

  if (subscription.status === "suspended") {
    return { allowed: false, status: "suspended" };
  }

  if (subscription.status === "trial" && subscription.trial_ends_at) {
    const trialEnd = new Date(subscription.trial_ends_at);
    const now = new Date();

    if (trialEnd < now) {
      return { allowed: false, status: "expired" };
    }
  }

  return {
    allowed: true,
    status: subscription.status,
    trial_ends_at: subscription.trial_ends_at,
  };
}
