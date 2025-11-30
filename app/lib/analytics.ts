"use client";

type AnalyticsPayload = Record<string, unknown>;

export function track(event: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  const posthog = (window as unknown as { posthog?: { capture?: (event: string, payload?: AnalyticsPayload) => void } }).posthog;
  if (posthog?.capture) {
    posthog.capture(event, payload);
  }
  const sentry = (window as unknown as { Sentry?: { captureMessage?: (message: string, context?: unknown) => void } }).Sentry;
  if (sentry?.captureMessage) {
    sentry.captureMessage(`analytics:${event}`, { extra: payload });
  }
  // Local breadcrumb for debugging when analytics SDKs are not yet wired.
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
