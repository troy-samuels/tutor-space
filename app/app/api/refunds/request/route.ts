import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRefundRequest } from "@/lib/repositories/refunds";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tutorId, bookingId, paymentsAuditId, amountCents, currency, reason, actorRequested } = body ?? {};
    if (!tutorId || !amountCents || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to create refund request" }, { status: 500 });
  }
}


