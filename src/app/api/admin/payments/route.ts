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

  const isAdmin = profile?.account_role === "owner";

  if (!isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { data: paymentRequests } = await supabase
    .from("payment_requests")
    .select(`
      *,
      accounts (
        id,
        name,
        owner_user_id,
        profiles (
          user_id,
          full_name,
          email
        )
      ),
      subscriptions (
        plans (
          name,
          plan_type
        )
      )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return NextResponse.json({ payment_requests: paymentRequests || [] });
}
