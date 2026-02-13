"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.error("[PWA] Service worker registration failed", error);
      }
    };

    const onLoad = () => {
      void registerServiceWorker();
    };

    if (document.readyState === "complete") {
      onLoad();
      return;
    }

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
