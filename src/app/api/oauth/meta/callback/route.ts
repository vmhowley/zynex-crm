import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { encrypt } from "@/lib/whatsapp/encryption";
import type { ChannelType } from "@/types/channel";

function verifyStateToken(
  token: string,
): { accountId: string; userId: string; channel: string; nonce: string } | null {
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
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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
  if (!data.access_token) {
    throw new Error("No access token in response");
  }
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

async function upsertChannelConfig(params: {
  accountId: string;
  userId: string;
  channel: ChannelType;
  channelId: string;
  accessToken: string;
  igBusinessAccountId?: string;
}): Promise<void> {
  const admin = supabaseAdmin();
  const { data: existing } = await admin
    .from("channel_configs")
    .select("id")
    .eq("account_id", params.accountId)
    .eq("channel", params.channel)
    .maybeSingle();

  const config = {
    account_id: params.accountId,
    user_id: params.userId,
    channel: params.channel,
    channel_id: params.channelId,
    access_token: encrypt(params.accessToken),
    status: "connected",
    connected_at: new Date().toISOString(),
    ig_business_account_id: params.igBusinessAccountId ?? null,
  };

  if (existing) {
    await admin
      .from("channel_configs")
      .update(config)
      .eq("id", existing.id);
  } else {
    await admin.from("channel_configs").insert(config);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    const redirectTo = `${siteUrl}/settings?tab=channels`;

    if (error) {
      const reason = searchParams.get("error_reason") ?? error;
      return NextResponse.redirect(
        new URL(`${redirectTo}&oauth_error=${reason}`),
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL(`${redirectTo}&oauth_error=missing_params`));
    }

    const statePayload = verifyStateToken(state);
    if (!statePayload) {
      return NextResponse.redirect(
        new URL(`${redirectTo}&oauth_error=invalid_state`),
      );
    }

    const { accountId, userId, channel } = statePayload;
    const callbackUrl = `${siteUrl}/api/oauth/meta/callback`;

    const shortLivedToken = await exchangeCodeForToken(code, callbackUrl);
    const longLivedToken = await getLongLivedToken(shortLivedToken);
    const pages = await getPages(longLivedToken);

    if (pages.length === 0) {
      return NextResponse.redirect(
        new URL(`${redirectTo}&oauth_error=no_pages`),
      );
    }

    const pageChoices: Array<{
      pageId: string;
      pageName: string;
      accessToken: string;
      igAccount?: { id: string; username: string };
    }> = [];

    for (const page of pages) {
      if (channel === "instagram") {
        const igAccount = await getInstagramAccount(page.id, page.access_token);
        pageChoices.push({
          pageId: page.id,
          pageName: page.name,
          accessToken: page.access_token,
          igAccount: igAccount ?? undefined,
        });
      } else {
        pageChoices.push({
          pageId: page.id,
          pageName: page.name,
          accessToken: page.access_token,
        });
      }
    }

    if (pageChoices.length === 1) {
      const choice = pageChoices[0];
      const igBusinessAccountId =
        channel === "instagram" && choice.igAccount
          ? choice.igAccount.id
          : undefined;

      await subscribePage(choice.pageId, choice.accessToken).catch((err) => {
        console.warn("[oauth] subscribed_apps failed:", err);
      });

      await upsertChannelConfig({
        accountId,
        userId,
        channel: channel as ChannelType,
        channelId: choice.pageId,
        accessToken: choice.accessToken,
        igBusinessAccountId,
      });

      return NextResponse.redirect(
        new URL(`${redirectTo}&connected=${channel}`),
      );
    }

    return NextResponse.redirect(
      new URL(
        `/oauth/meta/pick?channel=${channel}&pages=${encodeURIComponent(JSON.stringify(pageChoices))}&accountId=${accountId}&userId=${userId}&token=${encodeURIComponent(longLivedToken)}`,
      ),
    );
  } catch (err) {
    console.error("Error in OAuth callback:", err);
    return NextResponse.redirect(
      new URL(
        `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/settings?tab=channels&oauth_error=callback_error`,
      ),
    );
  }
}
