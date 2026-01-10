"use client";

import { useEffect, useRef } from "react";

type SignupCheckoutResponse = {
  redirectUrl?: string | null;
};

export function SignupCheckoutGuard() {
  const redirectingRef = useRef(false);

  useEffect(() => {
    const checkGate = async () => {
      if (redirectingRef.current) return;

      try {
        const response = await fetch("/api/stripe/signup-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (response.status === 401) {
          window.location.assign("/login");
          return;
        }

        if (!response.ok) return;

        const data = (await response.json()) as SignupCheckoutResponse;
        if (data?.redirectUrl) {
          redirectingRef.current = true;
          window.location.assign(data.redirectUrl);
        }
      } catch (error) {
        console.error("[SignupCheckoutGuard] Failed to enforce checkout:", error);
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      const navEntry = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      const isBackForward =
        event.persisted || (navEntry && navEntry.type === "back_forward");

      if (isBackForward) {
        void checkGate();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
