import Stripe from "stripe";
import type { ServiceRoleClient, ProcessedStripeEventRow } from "./types";

/**
 * Claims a Stripe event for processing using idempotency.
 * Returns { duplicate: true } if the event was already processed or is being processed.
 * Returns { duplicate: false } if the event was successfully claimed for processing.
 */
export async function claimStripeEvent(
  event: Stripe.Event,
  supabase: ServiceRoleClient,
  correlationId: string
): Promise<{ duplicate: boolean }> {
  const now = new Date();
  const nowIso = now.toISOString();
  const timeoutSeconds = Number(process.env.STRIPE_WEBHOOK_PROCESSING_TIMEOUT_SECONDS ?? "600");
  const timeoutMs = Math.max(timeoutSeconds, 60) * 1000;

  const { error: insertError } = await supabase
    .from("processed_stripe_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      processed_at: nowIso,
      metadata: { livemode: event.livemode },
      status: "processing",
      processing_started_at: nowIso,
      updated_at: nowIso,
      correlation_id: correlationId,
      livemode: event.livemode,
    });

  if (!insertError) {
    return { duplicate: false };
  }

  if (insertError.code !== "23505") {
    throw insertError;
  }

  const { data: existingEvent, error: existingError } = await supabase
    .from("processed_stripe_events")
    .select("status, processing_started_at, updated_at")
    .eq("event_id", event.id)
    .maybeSingle<ProcessedStripeEventRow>();

  if (existingError && existingError.code !== "PGRST116") {
    throw existingError;
  }

  if (!existingEvent) {
    return { duplicate: false };
  }

  if (existingEvent.status === "processed") {
    return { duplicate: true };
  }

  const startedAt = existingEvent.processing_started_at || existingEvent.updated_at;
  const startedAtMs = startedAt ? new Date(startedAt).getTime() : 0;
  const isStale = !startedAt || Number.isNaN(startedAtMs) || Date.now() - startedAtMs > timeoutMs;

  if (existingEvent.status === "processing" && !isStale) {
    return { duplicate: true };
  }

  const { data: takeover, error: updateError } = await supabase
    .from("processed_stripe_events")
    .update({
      status: "processing",
      processing_started_at: nowIso,
      updated_at: nowIso,
      last_error: null,
      last_error_at: null,
    })
    .eq("event_id", event.id)
    .eq("status", existingEvent.status)
    .select("event_id")
    .maybeSingle();

  if (updateError && updateError.code !== "PGRST116") {
    throw updateError;
  }

  if (!takeover) {
    return { duplicate: true };
  }

  return { duplicate: false };
}

/**
 * Marks a Stripe event as successfully processed.
 */
export async function markStripeEventProcessed(
  event: Stripe.Event,
  supabase: ServiceRoleClient,
  processingDurationMs?: number
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("processed_stripe_events")
    .update({
      status: "processed",
      processed_at: nowIso,
      updated_at: nowIso,
      last_error: null,
      last_error_at: null,
      processing_duration_ms: processingDurationMs ?? null,
    })
    .eq("event_id", event.id);

  if (error) {
    console.error("[Stripe Webhook] Failed to mark event as processed:", error);
  }
}

/**
 * Marks a Stripe event as failed processing.
 */
export async function markStripeEventFailed(
  event: Stripe.Event,
  supabase: ServiceRoleClient,
  error: unknown
): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("processed_stripe_events")
    .update({
      status: "failed",
      updated_at: nowIso,
      last_error: error instanceof Error ? error.message : String(error),
      last_error_at: nowIso,
    })
    .eq("event_id", event.id);

  if (updateError) {
    console.error("Failed to mark Stripe event as failed:", updateError);
  }
}
