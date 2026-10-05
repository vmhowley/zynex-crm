"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Notification as CrmNotification } from "@/types";

function isSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
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
    if (!isSupported() || Notification.permission !== "granted") return;

    const supabase = createClient();
    const channel = supabase
      .channel("pwa-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        async (payload) => {
          // Do not interrupt the person while they are looking at the CRM.
          if (document.visibilityState === "visible") return;
          const notification = payload.new as CrmNotification;
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
