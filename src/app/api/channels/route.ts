import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { ChannelType } from "@/types/channel";

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
