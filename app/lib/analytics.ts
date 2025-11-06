"use client";

type AnalyticsPayload = Record<string, unknown>;

export function track(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  // Replace with PostHog/Segment integration when available.
  if (process.env.NODE_ENV !== "production") {
    console.info(`[analytics] ${event}`, payload);
  }
  window.dispatchEvent(
    new CustomEvent("tutorlingua:analytics", {
      detail: { event, payload, timestamp: Date.now() },
    }),
  );
}

export function trackOnce(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  const marker = `tutorlingua.analytics.${event}`;
  if ((window as unknown as Record<string, boolean>)[marker]) return;
  (window as unknown as Record<string, boolean>)[marker] = true;
  track(event, payload);
}
