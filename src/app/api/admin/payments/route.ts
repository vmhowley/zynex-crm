import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SUPER_ADMIN_EMAILS = [
  "admin@digitbillrd.com",
  "admin@zynex.do",
  "soporte@zynex.do"
];

export async function GET() {
  const supabase = await createClient();

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
