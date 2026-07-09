import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

function createStateToken(payload: {
  accountId: string;
  userId: string;
  channel: string;
  nonce: string;
  exp: number;
}): string {
  const json = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", process.env.ENCRYPTION_KEY!)
    .update(json)
    .digest("base64url");
  return `${json}.${sig}`;
}

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

const META_OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";

const CHANNEL_SCOPES: Record<string, string> = {
  instagram:
    "pages_messaging,instagram_basic,instagram_manage_messages,pages_show_list",
  messenger: "pages_messaging,pages_show_list",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    if (!channel || !["instagram", "messenger"].includes(channel)) {
      return NextResponse.json(
        { error: "Invalid channel. Must be 'instagram' or 'messenger'" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await resolveAccountId(supabase, user.id);
    if (!accountId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const isAdmin = await requireAdmin(supabase, user.id, accountId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can connect channels" },
        { status: 403 },
      );
    }

    const appId = process.env.META_APP_ID;
    if (!appId) {
      console.error("META_APP_ID is not set");
      return NextResponse.json(
        { error: "Meta App ID not configured" },
        { status: 500 },
      );
    }

    // Use SITE_URL if set (Vercel convention), otherwise fall back to NEXT_PUBLIC_SITE_URL
    const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    
    if (!siteUrl) {
      console.error("SITE_URL and NEXT_PUBLIC_SITE_URL are not set");
      return NextResponse.json(
        { error: "Site URL not configured. Please set NEXT_PUBLIC_SITE_URL environment variable." },
        { status: 500 }
      );
    }
    
    const callbackUrl = `${siteUrl}/api/oauth/meta/callback`;

    const nonce = crypto.randomBytes(16).toString("hex");
    const state = createStateToken({
      accountId,
      userId: user.id,
      channel,
      nonce,
      exp: Date.now() + 10 * 60 * 1000,
    });

    const scopes = CHANNEL_SCOPES[channel];
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      scope: scopes,
      state,
      response_type: "code",
    });

    return NextResponse.redirect(
      new URL(`${META_OAUTH_BASE}?${params.toString()}`),
    );
  } catch (err) {
    console.error("Error in GET /api/oauth/meta/start:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export { createStateToken, verifyStateToken };
