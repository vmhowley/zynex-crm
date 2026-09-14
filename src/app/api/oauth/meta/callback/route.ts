import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/flows/admin-client";
import { encrypt } from "@/lib/whatsapp/encryption";
import type { ChannelType } from "@/types/channel";

function verifyStateToken(
  token: string,
): { accountId: string; userId: string; channel: string; nonce: string; exp?: number } | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [json, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", process.env.ENCRYPTION_KEY!)
    .update(json)
    .digest("base64url");
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username: string;
  };
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<string> {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      }),
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Token exchange failed");
  }
  if (!data.access_token) throw new Error("No access token in response");
  return data.access_token;
}

async function getLongLivedToken(shortLivedToken: string): Promise<string> {
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const res = await fetch(
    `https://graph.facebook.com/v21.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      }),
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Token exchange failed");
  }
  return data.access_token;
}

async function getPages(accessToken: string): Promise<PageInfo[]> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?` +
      new URLSearchParams({ access_token: accessToken }),
  );
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message ?? "Failed to fetch pages");
  }
  return data.data ?? [];
}

async function getInstagramAccount(
  pageId: string,
  accessToken: string,
): Promise<{ id: string; username: string } | null> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pageId}?` +
      new URLSearchParams({
        fields: "instagram_business_account{id,username}",
        access_token: accessToken,
      }),
  );
  const data = await res.json();
  if (!res.ok || data.error) return null;
  return data.instagram_business_account ?? null;
}

async function subscribePage(pageId: string, accessToken: string): Promise<void> {
  await fetch(
    `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps?` +
      new URLSearchParams({
        access_token: accessToken,
        subscribed_fields: "messages,messaging_postbacks",
      }),
    { method: "POST" },
  );
}

async function saveConnection(params: {
  accountId: string;
  userId: string;
  channel: ChannelType;
  channelId: string;
  displayName: string;
  accessToken: string;
  igBusinessAccountId?: string;
}) {
  const admin = supabaseAdmin();
  const { data: claimed, error: claimError } = await admin
    .from("channel_configs")
    .select("id, account_id, is_primary")
    .eq("channel", params.channel)
    .eq("channel_id", params.channelId)
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
    channel_id: params.channelId,
    display_name: params.displayName,
    access_token: encrypt(params.accessToken),
    status: "connected",
    connected_at: new Date().toISOString(),
    ig_business_account_id: params.igBusinessAccountId ?? null,
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
  const requestUrl = new URL(request.url);
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  const redirectTo = `${siteUrl}/settings?tab=channels`;

  try {
    const { searchParams } = requestUrl;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      const reason = searchParams.get("error_reason") ?? error;
      return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=${encodeURIComponent(reason)}`));
    }
    if (!code || !state) {
      return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=missing_params`));
    }

    const statePayload = verifyStateToken(state);
    if (!statePayload || !["instagram", "messenger"].includes(statePayload.channel)) {
      return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=invalid_state`));
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== statePayload.userId) {
      return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=session_mismatch`));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("account_id, account_role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (
      profile?.account_id !== statePayload.accountId ||
      !["owner", "admin"].includes(profile?.account_role || "")
    ) {
      return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=forbidden`));
    }

    const callbackUrl = `${siteUrl}/api/oauth/meta/callback`;
    const shortLivedToken = await exchangeCodeForToken(code, callbackUrl);
    const longLivedToken = await getLongLivedToken(shortLivedToken);
    const pages = await getPages(longLivedToken);

    if (pages.length === 0) {
      return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=no_pages`));
    }

    if (pages.length === 1) {
      const page = pages[0];
      const igAccount =
        statePayload.channel === "instagram"
          ? await getInstagramAccount(page.id, page.access_token)
          : null;

      await subscribePage(page.id, page.access_token).catch((err) => {
        console.warn("[oauth] subscribed_apps failed:", err);
      });

      await saveConnection({
        accountId: statePayload.accountId,
        userId: user.id,
        channel: statePayload.channel as ChannelType,
        channelId: page.id,
        displayName:
          statePayload.channel === "instagram" && igAccount?.username
            ? `@${igAccount.username}`
            : page.name,
        accessToken: page.access_token,
        igBusinessAccountId: igAccount?.id,
      });

      return NextResponse.redirect(
        new URL(`${redirectTo}&connected=${statePayload.channel}`),
      );
    }

    const admin = supabaseAdmin();
    await admin
      .from("meta_oauth_pending_sessions")
      .delete()
      .eq("user_id", user.id)
      .lt("expires_at", new Date().toISOString());

    const { data: pending, error: pendingError } = await admin
      .from("meta_oauth_pending_sessions")
      .insert({
        account_id: statePayload.accountId,
        user_id: user.id,
        channel: statePayload.channel,
        encrypted_access_token: encrypt(longLivedToken),
      })
      .select("id")
      .single();

    if (pendingError || !pending) throw pendingError || new Error("Failed to create OAuth session");

    return NextResponse.redirect(
      new URL(`/oauth/meta/pick?session=${encodeURIComponent(pending.id)}`, siteUrl),
    );
  } catch (err) {
    console.error("Error in OAuth callback:", err);
    return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=callback_error`));
  }
}
