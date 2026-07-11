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

async function resolveAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.account_id) return null;
  return data.account_id as string;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await resolveAccountId(supabase, user.id);
    if (!accountId) {
      return NextResponse.json({ channels: [] });
    }

    const { data, error } = await supabaseAdmin()
      .from("channel_configs")
      .select(
        "id, channel, channel_id, status, connected_at, ig_business_account_id",
      )
      .eq("account_id", accountId)
      .eq("status", "connected")
      .in("channel", ["whatsapp", "instagram", "messenger"]);

    if (error) {
      console.error("Error fetching channels:", error);
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      channels: (data ?? []).map((row) => ({
        id: row.id,
        channel: row.channel as ChannelType,
        channel_id: row.channel_id,
        status: row.status,
        connected_at: row.connected_at,
        ig_business_account_id: row.ig_business_account_id,
      })),
    });
  } catch (err) {
    console.error("Error in GET /api/channels:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await resolveAccountId(supabase, user.id);
    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 400 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .eq("account_id", accountId)
      .single();

    if (!profile || !["owner", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Only admins can configure channels" }, { status: 403 });
    }

    const body = await request.json();
    const { channel, page_id, access_token, verify_token, ig_business_account_id } = body;

    if (!channel || !["instagram", "messenger"].includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    if (!page_id || !access_token) {
      return NextResponse.json({ error: "Page ID and Access Token are required" }, { status: 400 });
    }

    // Check if already exists
    console.log("Checking existing channel:", { accountId, channel, channel_type: typeof channel });
    
    const existing = await supabaseAdmin()
      .from("channel_configs")
      .select("id")
      .eq("account_id", accountId)
      .eq("channel", channel)
      .maybeSingle();

    console.log("Existing channel:", existing);

    const encryptedToken = encrypt(access_token);

    if (existing?.data) {
      // Update existing
      const updateData: Record<string, unknown> = {
        channel_id: page_id,
        access_token: encryptedToken,
        status: "connected",
        connected_at: new Date().toISOString(),
      };
      
      if (verify_token) {
        updateData.webhook_verify_token = verify_token;
      }
      
      const { error: updateError } = await supabaseAdmin()
        .from("channel_configs")
        .update(updateData)
        .eq("id", existing.data.id);

      if (updateError) {
        console.error("Error updating channel:", updateError);
        return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
      }
    } else {
      // Insert new
      const insertData: Record<string, unknown> = {
        account_id: accountId,
        user_id: user.id,
        channel,
        channel_id: page_id,
        access_token: encryptedToken,
        status: "connected",
        connected_at: new Date().toISOString(),
      };
      
      if (verify_token) {
        insertData.webhook_verify_token = verify_token;
      }
      
      const { error: insertError } = await supabaseAdmin()
        .from("channel_configs")
        .insert(insertData);

      if (insertError) {
        console.error("Error inserting channel:", insertError);
        return NextResponse.json({ error: "Failed to connect channel" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST /api/channels:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
