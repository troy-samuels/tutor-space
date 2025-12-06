import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

type ResendEventPayload = {
  type?: string;
  event?: string;
  data?: Record<string, any>;
  record?: Record<string, any>;
  email?: string;
  to?: string | string[];
};

function extractRecipient(payload: ResendEventPayload["data"] | undefined, fallback: ResendEventPayload) {
  const data = payload ?? {};
  const candidates = [
    (data as any).email,
    (data as any).to,
    (data as any).recipient,
    (data as any).original_recipient,
    fallback.email,
    fallback.to,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate)) {
      if (candidate.length > 0) return candidate[0];
    } else if (typeof candidate === "string") {
      return candidate;
    }
  }
  return null;
}

function normalizeEventType(payload: ResendEventPayload) {
  return (
    payload.type ||
    payload.event ||
    (payload.record && (payload.record as any).type) ||
    "unknown"
  ).toString();
}

function toIsoDate(value: any) {
  if (!value) return new Date().toISOString();
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime()) ? new Date().toISOString() : asDate.toISOString();
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: ResendEventPayload;
  try {
    payload = (await request.json()) as ResendEventPayload;
  } catch (error) {
    console.error("[Resend webhook] Failed to parse body", error);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = normalizeEventType(payload).toLowerCase();
  const eventData = payload.data || payload.record || {};
  const recipient = extractRecipient(eventData, payload);

  if (!recipient) {
    console.warn("[Resend webhook] Missing recipient", payload);
    return NextResponse.json({ success: true, skipped: "no recipient" });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const occurredAt = toIsoDate(
    (eventData as any).created_at || (eventData as any).timestamp
  );
  const messageId =
    (eventData as any).id ||
    (eventData as any).message_id ||
    (eventData as any).event_id ||
    null;
  const reason =
    (eventData as any).reason ||
    (eventData as any).error ||
    (eventData as any).bounce_type ||
    null;

  // Record raw event
  const { data: eventRecord, error: eventError } = await supabase
    .from("email_events")
    .insert({
      message_id: messageId,
      to_email: recipient,
      event_type: eventType,
      reason,
      metadata: payload as Record<string, unknown>,
      occurred_at: occurredAt,
    })
    .select("id")
    .single();

  if (eventError) {
    console.error("[Resend webhook] Failed to persist event", eventError);
  }

  const suppressionTypes = new Set([
    "bounced", "bounce", "email.bounced",
    "complained", "complaint", "email.complained",
    "dropped", "email.dropped"
  ]);
  if (suppressionTypes.has(eventType)) {
    const { error: suppressionError } = await supabase
      .from("email_suppressions")
      .upsert(
        {
          email: recipient,
          reason: reason || eventType,
          last_event_id: eventRecord?.id ?? null,
          last_seen: occurredAt,
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (suppressionError) {
      console.error("[Resend webhook] Failed to upsert suppression", suppressionError);
    }
  }

  return NextResponse.json({ success: true });
}
