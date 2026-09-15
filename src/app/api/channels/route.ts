import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { ChannelType } from "@/types/channel";
import { encrypt } from "@/lib/whatsapp/encryption";

function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ accountId: string; role: string | null } | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_id, account_role")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.account_id) return null;
  return { accountId: data.account_id as string, role: data.account_role as string | null };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getContext(supabase, user.id);
    if (!ctx) return NextResponse.json({ channels: [] });

    const { data, error } = await supabaseAdmin()
      .from("channel_configs")
      .select("id, channel, channel_id, display_name, is_primary, status, connected_at, ig_business_account_id, waba_id")
      .eq("account_id", ctx.accountId)
      .in("channel", ["whatsapp", "instagram", "messenger"])
      .order("channel")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching channels:", error);
      return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
    }

    return NextResponse.json({ channels: data ?? [] });
  } catch (err) {
    console.error("Error in GET /api/channels:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ctx = await getContext(supabase, user.id);
    if (!ctx) return NextResponse.json({ error: "Account not found" }, { status: 400 });
    if (!ctx.role || !["owner", "admin"].includes(ctx.role)) {
      return NextResponse.json({ error: "Only admins can configure channels" }, { status: 403 });
    }

    const body = await request.json();
    const { channel, page_id, access_token, verify_token, ig_business_account_id, display_name } = body;

    if (!channel || !["instagram", "messenger"].includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }
    if (!page_id || !access_token) {
      return NextResponse.json({ error: "Page ID and Access Token are required" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: claimed, error: claimError } = await admin
      .from("channel_configs")
      .select("id, account_id")
      .eq("channel", channel)
      .eq("channel_id", page_id)
      .maybeSingle();

    if (claimError) return NextResponse.json({ error: "Failed to validate channel" }, { status: 500 });
    if (claimed && claimed.account_id !== ctx.accountId) {
      return NextResponse.json({ error: "This channel is already linked to another account" }, { status: 409 });
    }

    const { data: primary } = await admin
      .from("channel_configs")
      .select("id")
      .eq("account_id", ctx.accountId)
      .eq("channel", channel)
      .eq("is_primary", true)
      .maybeSingle();

    const config: Record<string, unknown> = {
      account_id: ctx.accountId,
      user_id: user.id,
      channel,
      channel_id: page_id,
      display_name: typeof display_name === "string" && display_name.trim() ? display_name.trim() : null,
      access_token: encrypt(access_token),
      status: "connected",
      connected_at: new Date().toISOString(),
      ig_business_account_id: channel === "instagram" ? ig_business_account_id || null : null,
    };
    if (verify_token) config.webhook_verify_token = encrypt(verify_token);

    if (claimed) {
      const { error } = await admin.from("channel_configs").update(config).eq("id", claimed.id).eq("account_id", ctx.accountId);
      if (error) return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
      return NextResponse.json({ success: true, id: claimed.id, created: false });
    }

    config.is_primary = !primary;
    const { data: inserted, error } = await admin.from("channel_configs").insert(config).select("id, is_primary").single();
    if (error) {
      console.error("Error inserting channel:", error);
      return NextResponse.json({ error: "Failed to connect channel" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: inserted.id, created: true, is_primary: inserted.is_primary });
  } catch (err) {
    console.error("Error in POST /api/channels:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
