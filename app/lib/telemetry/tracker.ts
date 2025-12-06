type TelemetryEvent =
  | "site_created"
  | "site_create_error"
  | "site_updated"
  | "site_update_conflict"
  | "site_update_error"
  | "site_published"
  | "site_publish_error";

export function track(event: TelemetryEvent, props?: Record<string, unknown>) {
  // No-op for now; plug your provider here (e.g., PostHog/Amplitude/Sentry breadcrumbs)
  try {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[telemetry]", event, props ?? {});
    }
  } catch {
    // ignore
  }
}


