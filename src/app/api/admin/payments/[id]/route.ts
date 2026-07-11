import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAILS = [
  "admin@digitbillrd.com",
  "admin@zynex.do",
  "soporte@zynex.do"
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email || "");

  if (!isSuperAdmin) {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }

  const { action, notes } = await request.json();

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: paymentRequest } = await supabase
    .from("payment_requests")
    .select("*, subscriptions!inner(plans(*))")
    .eq("id", id)
    .single();

  if (!paymentRequest) {
    return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  const { error: updateError } = await supabase
    .from("payment_requests")
    .update({
      status: newStatus,
      processed_at: new Date().toISOString(),
      processed_by: user.id,
      notes: notes || null,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (action === "approve") {
    const plan = (paymentRequest.subscriptions as any)?.plans;

    const { error: subError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        plan_id: plan?.id,
        started_at: new Date().toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        paid_until: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq("account_id", paymentRequest.account_id);

    if (subError) {
      console.error("Error updating subscription:", subError);
    }

    const { error: accountError } = await supabase
      .from("accounts")
      .update({
        plan_type: plan?.plan_type,
      })
      .eq("id", paymentRequest.account_id);

    if (accountError) {
      console.error("Error updating account:", accountError);
    }
  }

  return NextResponse.json({ success: true });
}
