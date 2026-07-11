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

  // Get payment history with subscription and plan info
  const { data: payments, error } = await supabase
    .from("payment_requests")
    .select(`
      id,
      amount,
      currency,
      status,
      payment_method,
      payment_reference,
      proof_image_url,
      notes,
      requested_at,
      processed_at,
      created_at,
      subscription_id,
      subscriptions(
        id,
        plan_id,
        plans(
          name,
          plan_type
        )
      )
    `)
    .eq("account_id", profile.account_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Error al obtener historial de pagos" },
      { status: 500 }
    );
  }

  // Transform data to include plan name
  const transformedPayments = (payments || []).map((payment: any) => {
    // Handle the case where subscriptions might be an array
    const subscription = Array.isArray(payment.subscriptions) 
      ? payment.subscriptions[0] 
      : payment.subscriptions;
    const plan = subscription?.plans;
    
    // Handle the case where plans might be an array
    const planData = Array.isArray(plan) ? plan[0] : plan;
    
    return {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      payment_method: payment.payment_method,
      payment_reference: payment.payment_reference,
      proof_image_url: payment.proof_image_url,
      notes: payment.notes,
      requested_at: payment.requested_at,
      processed_at: payment.processed_at,
      created_at: payment.created_at,
      plan_name: planData?.name || "Plan",
      plan_type: planData?.plan_type || "free",
    };
  });

  return NextResponse.json({
    payments: transformedPayments,
  });
}
