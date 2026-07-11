import { createClient } from "@/lib/supabase/server";

export type LimitType = "contacts" | "team_members" | "whatsapp_numbers";
export type FeatureType = "broadcasts" | "automations" | "flows" | "api";

/**
 * Usage data retrieved from account_usage table or computed
 */
export interface UsageData {
  contacts: number;
  team_members: number;
  whatsapp_numbers: number;
}

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

/**
 * Get real-time usage from account_usage table or compute from tables.
 * Falls back to direct table queries if no usage record exists.
 */
export async function getUsage(accountId: string): Promise<UsageData> {
  const supabase = await createClient();

  // Try to get from account_usage table first
  const currentPeriod = new Date();
  const periodStart = new Date(
    currentPeriod.getFullYear(),
    currentPeriod.getMonth(),
    1
  ).toISOString();

  const { data: usageRecords } = await supabase
    .from("account_usage")
    .select("usage_type, current_count")
    .eq("account_id", accountId)
    .gte("period_start", periodStart);

  const usageMap = new Map<string, number>();
  if (usageRecords) {
    usageRecords.forEach((r) => {
      usageMap.set(r.usage_type, r.current_count);
    });
  }

  // If no records in account_usage, compute from actual tables
  if (usageMap.size === 0 || !usageMap.has("contacts")) {
    const { count: contactsCount } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId);
    usageMap.set("contacts", contactsCount || 0);
  }

  if (!usageMap.has("team_members")) {
    const { count: membersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId);
    usageMap.set("team_members", membersCount || 0);
  }

  if (!usageMap.has("whatsapp_numbers")) {
    const { count: whatsappCount } = await supabase
      .from("channel_configs")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId)
      .eq("channel", "whatsapp");
    usageMap.set("whatsapp_numbers", whatsappCount || 0);
  }

  return {
    contacts: usageMap.get("contacts") || 0,
    team_members: usageMap.get("team_members") || 0,
    whatsapp_numbers: usageMap.get("whatsapp_numbers") || 0,
  };
}

/**
 * Combined check: verifies subscription AND gets real usage data.
 * Use this for UI displays where you need both limits AND current usage.
 */
export async function checkUsage(
  accountId: string
): Promise<{
  allowed: boolean;
  error?: string;
  usage: UsageData;
  limits: {
    contacts: number | null;
    team_members: number | null;
    whatsapp_numbers: number | null;
  };
  planName?: string;
  planType?: string;
}> {
  const supabase = await createClient();

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("account_id", accountId)
    .in("status", ["trial", "active"])
    .single();

  if (subError || !subscription) {
    return {
      allowed: false,
      error: "No active subscription",
      usage: { contacts: 0, team_members: 0, whatsapp_numbers: 0 },
      limits: { contacts: null, team_members: null, whatsapp_numbers: null },
    };
  }

  const plan = subscription.plans as any;
  const limits = {
    contacts: plan.max_contacts,
    team_members: plan.max_team_members,
    whatsapp_numbers: plan.max_whatsapp_numbers,
  };

  const usage = await getUsage(accountId);

  return {
    allowed: true,
    usage,
    limits,
    planName: plan.name,
    planType: plan.plan_type,
  };
}

/**
 * Simple limit check that returns only whether the action is allowed
 * and the current count for display purposes.
 */
export async function checkLimitWithUsage(
  accountId: string,
  limitType: LimitType
): Promise<EnforcementResult> {
  const checkResult = await checkLimit(accountId, limitType);
  return checkResult;
}
