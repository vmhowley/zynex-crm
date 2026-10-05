"use client";

import { useEffect } from "react";

/** Registers the minimal worker used by the installable CRM shell. */
export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      // A failed registration must never block the authenticated CRM.
      console.warn("[pwa] service worker registration failed", error);
    });
  }, []);

  return null;
}
