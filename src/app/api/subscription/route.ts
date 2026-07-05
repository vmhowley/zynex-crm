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
    .select("account_id, account_role")
    .eq("user_id", user.id)
    .single();

  if (!profile?.account_id) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(`
      id,
      status,
      trial_started_at,
      trial_ends_at,
      started_at,
      paid_until,
      plans (
        id,
        name,
        plan_type,
        price_rd,
        trial_days,
        max_contacts,
        max_team_members,
        max_whatsapp_numbers,
        broadcasts_enabled,
        automations_enabled,
        flows_enabled,
        api_access
      )
    `)
    .eq("account_id", profile.account_id)
    .single();

  const { data: usage } = await supabase
    .from("account_usage")
    .select("*")
    .eq("account_id", profile.account_id);

  return NextResponse.json({
    subscription,
    usage: usage || [],
  });
}
