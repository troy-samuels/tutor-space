import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalError, unauthorized } from "@/lib/api/error-responses";
import { createClient } from "@/lib/supabase/server";
import { createRefundRequest } from "@/lib/repositories/refunds";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return unauthorized("Unauthorized");
    }

    const body = await req.json();
    const { tutorId, bookingId, paymentsAuditId, amountCents, currency, reason, actorRequested } = body ?? {};
    if (!tutorId || !amountCents || !currency) {
      return badRequest("Missing required fields");
    }

    const id = await createRefundRequest(supabase, {
      tutorId,
      studentId: user.id,
      bookingId: bookingId ?? null,
      paymentsAuditId: paymentsAuditId ?? null,
      amountCents,
      currency,
      reason: reason ?? null,
      actorRequested: actorRequested ?? "student",
    });

    return NextResponse.json({ success: true, refundRequestId: id });
  } catch (error) {
    console.error("Refund request failed", error);
    return internalError("Failed to create refund request");
  }
}

