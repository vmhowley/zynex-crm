import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { encrypt } from "@/lib/whatsapp/encryption";
import type { ChannelType } from "@/types/channel";

function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function subscribePage(
  pageId: string,
  accessToken: string,
): Promise<void> {
  await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?` +
      new URLSearchParams({
        access_token: accessToken,
        subscribed_fields: "messages,messaging_postbacks",
      }),
    { method: "POST" },
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      channel,
      pageId,
      pageName,
      accessToken,
      igBusinessAccountId,
      accountId,
      userId,
    } = body;

    if (!channel || !pageId || !accessToken || !accountId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (!["instagram", "messenger"].includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    await subscribePage(pageId, accessToken).catch((err) => {
      console.warn("[oauth] subscribed_apps failed:", err);
    });

    const admin = supabaseAdmin();
    const { data: existing } = await admin
      .from("channel_configs")
      .select("id")
      .eq("account_id", accountId)
      .eq("channel", channel)
      .maybeSingle();

    const config = {
      account_id: accountId,
      user_id: userId,
      channel: channel as ChannelType,
      channel_id: pageId,
      access_token: encrypt(accessToken),
      status: "connected",
      connected_at: new Date().toISOString(),
      ig_business_account_id: igBusinessAccountId ?? null,
    };

    if (existing) {
      await admin.from("channel_configs").update(config).eq("id", existing.id);
    } else {
      await admin.from("channel_configs").insert(config);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST /api/oauth/meta/pick:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
