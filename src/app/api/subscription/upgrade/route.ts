import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
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

  if (profile.account_role !== "owner" && profile.account_role !== "admin") {
    return NextResponse.json(
      { error: "Only owners and admins can upgrade" },
      { status: 403 }
    );
  }

  const { plan_id } = await request.json();

  if (!plan_id) {
    return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
  }

  const { data: plan } = await supabase
    .from("plans")
    .select("*")
    .eq("id", plan_id)
    .single();

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("account_id", profile.account_id)
    .single();

  if (!currentSubscription) {
    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 }
    );
  }

  const { data: paymentRequest, error: paymentError } = await supabase
    .from("payment_requests")
    .insert({
      account_id: profile.account_id,
      subscription_id: currentSubscription.id,
      amount: plan.price_rd,
      currency: "DOP",
      status: "pending",
      payment_method: "transfer",
    })
    .select()
    .single();

  if (paymentError) {
    return NextResponse.json(
      { error: paymentError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    payment_request: paymentRequest,
    plan,
    instructions: {
      bank: "Banco Popular Dominicano",
      account: "XXXXXXXXXXXXX",
      recipient: "Zynex SRL",
      reference: paymentRequest.id.slice(0, 8).toUpperCase(),
    },
  });
}
