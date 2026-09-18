import { NextResponse } from "next/server";
import { requirePlatformRole } from "@/lib/platform/auth";
import { supabaseAdmin } from "@/lib/flows/admin-client";

export async function GET() {
  const platformUser = await requirePlatformRole([
    "super_admin",
    "billing",
  ]);

  if (!platformUser) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }

  const { data: paymentRequests, error } = await supabaseAdmin()
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

  if (error) {
    console.error("Error fetching platform payment requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment requests" },
      { status: 500 },
    );
  }

  return NextResponse.json({ payment_requests: paymentRequests || [] });
}
