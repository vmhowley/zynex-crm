import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function resolveAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.account_id ?? null;
}

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .maybeSingle();
  return data?.role === "owner" || data?.role === "admin";
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const accountId = await resolveAccountId(supabase, user.id);
    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const isAdmin = await requireAdmin(supabase, user.id, accountId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can disconnect channels" },
        { status: 403 },
      );
    }

    const { error } = await supabaseAdmin()
      .from("channel_configs")
      .update({ status: "disconnected" })
      .eq("id", id)
      .eq("account_id", accountId);

    if (error) {
      console.error("Error disconnecting channel:", error);
      return NextResponse.json(
        { error: "Failed to disconnect channel" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/channels/[id]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
