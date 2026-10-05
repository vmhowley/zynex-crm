/* Zynex CRM service worker.
 *
 * Keep this deliberately small: the authenticated CRM must always load the
 * current server-rendered application, while this worker enables installability
 * and lets the dashboard display notifications when it is in the background.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destination = event.notification.data?.url || "/inbox";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) return existing.focus();
      return self.clients.openWindow(destination);
    }),
  );
});
