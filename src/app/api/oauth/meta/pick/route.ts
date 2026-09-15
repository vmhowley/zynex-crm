import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/flows/admin-client";
import { decrypt, encrypt } from "@/lib/whatsapp/encryption";
import type { ChannelType } from "@/types/channel";

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
}

async function getPages(accessToken: string): Promise<PageInfo[]> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?` +
      new URLSearchParams({ access_token: accessToken }),
    { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to fetch pages");
  }
  return data.data ?? [];
}

async function getInstagramAccount(pageId: string, pageToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?` +
      new URLSearchParams({
        fields: "instagram_business_account{id,username}",
        access_token: pageToken,
      }),
    { cache: "no-store" },
  );
  const data = await res.json();
  if (!res.ok || data.error) return null;
  return data.instagram_business_account ?? null;
}

async function subscribePage(pageId: string, pageToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?` +
      new URLSearchParams({
        access_token: pageToken,
        subscribed_fields: "messages,messaging_postbacks",
      }),
    { method: "POST" },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message ?? "Failed to subscribe Meta page");
  }
}

async function resolveCaller() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id, account_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !profile?.account_id ||
    !["owner", "admin"].includes(profile.account_role || "")
  ) return null;

  return { user, accountId: profile.account_id as string };
}

async function loadPendingSession(sessionId: string, userId: string, accountId: string) {
  const { data, error } = await supabaseAdmin()
    .from("meta_oauth_pending_sessions")
    .select("id, account_id, user_id, channel, encrypted_access_token, expires_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .maybeSingle();

  if (error || !data) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    await supabaseAdmin().from("meta_oauth_pending_sessions").delete().eq("id", data.id);
    return null;
  }
  return data;
}

async function saveConnection(params: {
  accountId: string;
  userId: string;
  channel: ChannelType;
  page: PageInfo;
  igAccount?: { id: string; username: string } | null;
}) {
  const admin = supabaseAdmin();
  const { data: claimed, error: claimError } = await admin
    .from("channel_configs")
    .select("id, account_id, is_primary")
    .eq("channel", params.channel)
    .eq("channel_id", params.page.id)
    .maybeSingle();

  if (claimError) throw claimError;
  if (claimed && claimed.account_id !== params.accountId) {
    throw new Error("This Meta page is already connected to another account");
  }

  let isPrimary = Boolean(claimed?.is_primary);
  if (!claimed) {
    const { data: primary } = await admin
      .from("channel_configs")
      .select("id")
      .eq("account_id", params.accountId)
      .eq("channel", params.channel)
      .eq("is_primary", true)
      .maybeSingle();
    isPrimary = !primary;
  }

  const row = {
    account_id: params.accountId,
    user_id: params.userId,
    channel: params.channel,
    channel_id: params.page.id,
    display_name:
      params.channel === "instagram" && params.igAccount?.username
        ? `@${params.igAccount.username}`
        : params.page.name,
    access_token: encrypt(params.page.access_token),
    status: "connected",
    connected_at: new Date().toISOString(),
    ig_business_account_id: params.igAccount?.id ?? null,
    is_primary: isPrimary,
    updated_at: new Date().toISOString(),
  };

  if (claimed) {
    const { error } = await admin.from("channel_configs").update(row).eq("id", claimed.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("channel_configs").insert(row);
    if (error) throw error;
  }
}

export async function GET(request: Request) {
  try {
    const caller = await resolveCaller();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessionId = new URL(request.url).searchParams.get("session") || "";
    if (!sessionId) return NextResponse.json({ error: "Missing session" }, { status: 400 });

    const pending = await loadPendingSession(sessionId, caller.user.id, caller.accountId);
    if (!pending) {
      return NextResponse.json({ error: "OAuth session expired or invalid" }, { status: 404 });
    }

    const accessToken = decrypt(pending.encrypted_access_token);
    const pages = await getPages(accessToken);
    const choices = await Promise.all(
      pages.map(async (page) => {
        const igAccount =
          pending.channel === "instagram"
            ? await getInstagramAccount(page.id, page.access_token)
            : null;
        return {
          page_id: page.id,
          page_name: page.name,
          instagram_username: igAccount?.username ?? null,
        };
      }),
    );

    return NextResponse.json({ channel: pending.channel, pages: choices });
  } catch (err) {
    console.error("Error in GET /api/oauth/meta/pick:", err);
    return NextResponse.json({ error: "Failed to load Meta pages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await resolveCaller();
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const sessionId = typeof body.session_id === "string" ? body.session_id : "";
    const pageId = typeof body.page_id === "string" ? body.page_id : "";
    if (!sessionId || !pageId) {
      return NextResponse.json({ error: "Missing selection" }, { status: 400 });
    }

    const pending = await loadPendingSession(sessionId, caller.user.id, caller.accountId);
    if (!pending) {
      return NextResponse.json({ error: "OAuth session expired or invalid" }, { status: 404 });
    }

    const longLivedToken = decrypt(pending.encrypted_access_token);
    const pages = await getPages(longLivedToken);
    const page = pages.find((item) => item.id === pageId);
    if (!page) {
      return NextResponse.json({ error: "Selected page is not available" }, { status: 400 });
    }

    const igAccount =
      pending.channel === "instagram"
        ? await getInstagramAccount(page.id, page.access_token)
        : null;

    await subscribePage(page.id, page.access_token);
    await saveConnection({
      accountId: caller.accountId,
      userId: caller.user.id,
      channel: pending.channel as ChannelType,
      page,
      igAccount,
    });

    await supabaseAdmin()
      .from("meta_oauth_pending_sessions")
      .delete()
      .eq("id", pending.id);

    return NextResponse.json({ success: true, channel: pending.channel });
  } catch (err) {
    console.error("Error in POST /api/oauth/meta/pick:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
