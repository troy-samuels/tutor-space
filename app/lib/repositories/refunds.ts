import type { SupabaseClient } from "@supabase/supabase-js";

export type RefundStatus = "requested" | "approved" | "rejected" | "processed";

export interface CreateRefundRequestInput {
  readonly tutorId: string;
  readonly studentId?: string | null;
  readonly bookingId?: string | null;
  readonly paymentsAuditId?: string | null;
  readonly amountCents: number;
  readonly currency: string;
  readonly reason?: string | null;
  readonly actorRequested: "student" | "tutor" | "admin";
}

export async function createRefundRequest(client: SupabaseClient, input: CreateRefundRequestInput): Promise<string> {
  const { data, error } = await client
    .from("refund_requests")
    .insert({
      tutor_id: input.tutorId,
      student_id: input.studentId ?? null,
      booking_id: input.bookingId ?? null,
      payments_audit_id: input.paymentsAuditId ?? null,
      amount_cents: input.amountCents,
      currency: input.currency,
      reason: input.reason ?? null,
      status: "requested",
      actor_requested: input.actorRequested,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateRefundStatus(
  client: SupabaseClient,
  refundRequestId: string,
  status: RefundStatus,
  processedByUserId?: string | null
): Promise<void> {
  const { error } = await client
    .from("refund_requests")
    .update({
      status,
      processed_by_user_id: processedByUserId ?? null,
      processed_at: ["approved", "rejected", "processed"].includes(status) ? new Date().toISOString() : null,
    })
    .eq("id", refundRequestId);
  if (error) throw error;
}


