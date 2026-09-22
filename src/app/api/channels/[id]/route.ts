import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

async function getContext(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("account_id, account_role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data?.account_id) return null;
  return { accountId: data.account_id as string, role: data.account_role as string | null };
}

function canManage(role: string | null) {
  return role === "owner" || role === "admin";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getContext(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (!canManage(ctx.role)) return NextResponse.json({ error: "Only admins can manage channels" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const admin = supabaseAdmin();
    const { data: target } = await admin
      .from("channel_configs")
      .select("id, channel, is_primary")
      .eq("id", id)
      .eq("account_id", ctx.accountId)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    if (body.is_primary === true && !target.is_primary) {
      await admin.from("channel_configs").update({ is_primary: false }).eq("account_id", ctx.accountId).eq("channel", target.channel).eq("is_primary", true);
      const { error } = await admin.from("channel_configs").update({ is_primary: true }).eq("id", id).eq("account_id", ctx.accountId);
      if (error) return NextResponse.json({ error: "Failed to set primary channel" }, { status: 500 });
    }

    if (typeof body.display_name === "string") {
      const { error } = await admin.from("channel_configs").update({ display_name: body.display_name.trim() || null }).eq("id", id).eq("account_id", ctx.accountId);
      if (error) return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in PATCH /api/channels/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getContext(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (!canManage(ctx.role)) return NextResponse.json({ error: "Only admins can disconnect channels" }, { status: 403 });

    const { id } = await params;
    const admin = supabaseAdmin();
    const { data: target } = await admin
      .from("channel_configs")
      .select("id, channel, is_primary")
      .eq("id", id)
      .eq("account_id", ctx.accountId)
      .maybeSingle();
    if (!target) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    const { error } = await admin
      .from("channel_configs")
      .update({ status: "disconnected", is_primary: false })
      .eq("id", id)
      .eq("account_id", ctx.accountId);
    if (error) return NextResponse.json({ error: "Failed to disconnect channel" }, { status: 500 });

    if (target.is_primary) {
      const { data: replacement } = await admin
        .from("channel_configs")
        .select("id")
        .eq("account_id", ctx.accountId)
        .eq("channel", target.channel)
        .eq("status", "connected")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (replacement) await admin.from("channel_configs").update({ is_primary: true }).eq("id", replacement.id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/channels/[id]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
