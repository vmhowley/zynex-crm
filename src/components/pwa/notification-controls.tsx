"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Notification as CrmNotification } from "@/types";

function isSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

function vapidKeyToUint8Array(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = window.atob(padded);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

async function registerPushSubscription(
  supabase: ReturnType<typeof createClient>,
) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!isSupported() || Notification.permission !== "granted" || !publicKey) return;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKeyToUint8Array(publicKey),
  });
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return;

  const { error } = await supabase.from("push_subscriptions").upsert({
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
  if (error) throw error;
}

/**
 * Explicit permission control plus in-app realtime → device notification
 * bridge. Permission is never requested automatically; it is a user action.
 */
export function NotificationPermissionButton() {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    null,
  );

  useEffect(() => {
    if (isSupported()) setPermission(Notification.permission);
  }, []);

  if (permission !== "default") return null;

  async function enableNotifications() {
    if (!isSupported()) return;
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") {
      try {
        await registerPushSubscription(createClient());
      } catch (error) {
        console.warn("[push] subscription failed", error);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={() => void enableNotifications()}
      className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Activar notificaciones"
      title="Activar notificaciones"
    >
      <BellRing className="size-4" />
    </button>
  );
}

export function RealtimeNotificationBridge() {
  useEffect(() => {
    const supabase = createClient();
    void registerPushSubscription(supabase).catch((error: unknown) =>
      console.warn("[push] subscription failed", error),
    );
    const channel = supabase
      .channel("pwa-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        async (payload) => {
          const notification = payload.new as CrmNotification;

          // Realtime is useful even if browser permission has not been
          // granted yet. Surface the new lead immediately in the open CRM.
          if (document.visibilityState === "visible") {
            toast(notification.title, {
              description: notification.body ?? "Tienes una nueva notificación.",
            });
            return;
          }

          // In the background, promote the same event to an OS notification
          // when the user explicitly enabled it.
          if (!isSupported() || Notification.permission !== "granted") return;
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(notification.title, {
            body: notification.body ?? "Tienes una nueva notificación.",
            icon: "/icon",
            badge: "/icon",
            tag: `zynex-${notification.id}`,
            data: {
              url: notification.conversation_id
                ? `/inbox?c=${notification.conversation_id}`
                : "/notifications",
            },
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
