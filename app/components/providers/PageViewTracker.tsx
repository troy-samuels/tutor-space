"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";

  const key = "tl_session_id";
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

export function PageViewTracker() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip if same path (prevents double tracking on initial load)
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    // Skip tracking for certain paths
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/admin")
    ) {
      return;
    }

    // Track page view
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    fetch("/api/analytics/page-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        sessionId,
        referrer: document.referrer || null,
      }),
    }).catch(() => {
      // Fail silently - analytics shouldn't break the app
    });
  }, [pathname]);

  return null;
}
