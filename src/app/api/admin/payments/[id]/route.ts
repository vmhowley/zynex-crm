import { NextResponse } from "next/server";
import { requirePlatformRole } from "@/lib/platform/auth";
import { supabaseAdmin } from "@/lib/flows/admin-client";

interface PlanRow {
  id: string;
  plan_type: string;
}

interface SubscriptionJoin {
  plans: PlanRow | PlanRow[] | null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const platformUser = await requirePlatformRole(["super_admin", "billing"]);
  if (!platformUser) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }

  const { id } = await params;
  const { action, notes } = await request.json();

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: paymentRequest, error: paymentError } = await admin
    .from("payment_requests")
    .select("*, subscriptions!inner(plans(*))")
    .eq("id", id)
    .single();

  if (paymentError || !paymentRequest) {
    return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const { error: updateError } = await admin
    .from("payment_requests")
    .update({
      status: newStatus,
      processed_at: new Date().toISOString(),
      processed_by: platformUser.userId,
      notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (action === "approve") {
    const subscriptionJoin = paymentRequest.subscriptions as SubscriptionJoin | SubscriptionJoin[] | null;
    const normalizedSubscription = Array.isArray(subscriptionJoin)
      ? subscriptionJoin[0]
      : subscriptionJoin;
    const rawPlans = normalizedSubscription?.plans;
    const plan = Array.isArray(rawPlans) ? rawPlans[0] : rawPlans;

    if (!plan?.id) {
      return NextResponse.json(
        { error: "Payment request is missing its target plan" },
        { status: 409 },
      );
    }

    const now = new Date();
    const paidUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { error: subError } = await admin
      .from("subscriptions")
      .update({
        status: "active",
        plan_id: plan.id,
        started_at: now.toISOString(),
        current_period_start: now.toISOString(),
        current_period_end: paidUntil.toISOString(),
        paid_until: paidUntil.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("account_id", paymentRequest.account_id);

    if (subError) {
      console.error("Error updating subscription:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    const { error: accountError } = await admin
      .from("accounts")
      .update({ plan_type: plan.plan_type })
      .eq("id", paymentRequest.account_id);

    if (accountError) {
      console.error("Error updating account:", accountError);
      return NextResponse.json({ error: accountError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
