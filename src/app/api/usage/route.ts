import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", user.id)
    .single();

  if (!profile?.account_id) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("account_id", profile.account_id)
    .single();

  if (!subscription) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const plan = subscription.plans as any;

  const { data: usage } = await supabase
    .from("account_usage")
    .select("*")
    .eq("account_id", profile.account_id);

  const usageMap: Record<string, number> = {};
  (usage || []).forEach((u) => {
    usageMap[u.usage_type] = u.current_count;
  });

  const contactsCount = usageMap["contacts"] || 0;
  const teamMembersCount = usageMap["team_members"] || 0;
  const whatsappNumbersCount = usageMap["whatsapp_numbers"] || 0;

  return NextResponse.json({
    plan: {
      id: plan.id,
      name: plan.name,
      plan_type: plan.plan_type,
    },
    subscription: {
      status: subscription.status,
      trial_ends_at: subscription.trial_ends_at,
      paid_until: subscription.paid_until,
    },
    usage: {
      contacts: {
        current: contactsCount,
        limit: plan.max_contacts,
        unlimited: plan.max_contacts === null || plan.max_contacts === -1,
      },
      team_members: {
        current: teamMembersCount,
        limit: plan.max_team_members,
        unlimited: plan.max_team_members === null || plan.max_team_members === -1,
      },
      whatsapp_numbers: {
        current: whatsappNumbersCount,
        limit: plan.max_whatsapp_numbers,
        unlimited: plan.max_whatsapp_numbers === null || plan.max_whatsapp_numbers === -1,
      },
    },
    features: {
      broadcasts: plan.broadcasts_enabled,
      automations: plan.automations_enabled,
      flows: plan.flows_enabled,
      api: plan.api_access,
    },
  });
}
