import webpush from "web-push";
import { supabaseAdmin } from "@/lib/flows/admin-client";

export async function sendPushToAccount(input: { accountId: string; title: string; body: string; url: string }) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const { data } = await supabaseAdmin().from("push_subscriptions")
    .select("endpoint,p256dh,auth").eq("account_id", input.accountId);
  await Promise.allSettled((data ?? []).map((subscription) =>
    webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(input))
  ));
}
