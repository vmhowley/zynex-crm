import { NextResponse } from "next/server";
import { requirePlatformRole } from "@/lib/platform/auth";
import { supabaseAdmin } from "@/lib/flows/admin-client";

export async function GET() {
  const platformUser = await requirePlatformRole([
    "super_admin",
    "support",
    "billing",
  ]);

  if (!platformUser) {
    return NextResponse.json({ error: "Platform admin only" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin().rpc(
    "platform_account_overview",
  );

  if (error) {
    console.error("Error fetching platform account overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }

  return NextResponse.json({ accounts: data || [] });
}
