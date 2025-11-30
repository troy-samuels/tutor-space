import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { issueRefundForPaymentIntent } from "@/lib/services/refunds";
import { getAdminSessionFromCookies } from "@/lib/admin/session";

/**
 * POST /api/refunds/approve
 *
 * SECURITY: This endpoint REQUIRES admin authentication.
 * Only users with a valid admin session cookie can approve refunds.
 */
export async function POST(req: NextRequest) {
  try {
    // CRITICAL: Verify admin authentication BEFORE any processing
    const adminSession = await getAdminSessionFromCookies();

    if (!adminSession) {
      console.warn("[Refund Approve] Unauthorized attempt - no admin session");
      return NextResponse.json(
        { error: "Unauthorized - admin authentication required" },
        { status: 401 }
      );
    }

    // Verify admin has appropriate role (super_admin or admin can approve refunds)
    if (!["super_admin", "admin"].includes(adminSession.role)) {
      console.warn(
        `[Refund Approve] Forbidden - user ${adminSession.email} has role ${adminSession.role}`
      );
      return NextResponse.json(
        { error: "Forbidden - insufficient permissions" },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
    }

    const body = await req.json();
    const {
      refundRequestId,
      tutorId,
      studentId,
      bookingId,
      paymentsAuditId,
      paymentIntentId,
      amountCents,
      currency,
    } = body ?? {};

    if (!refundRequestId || !tutorId || !paymentIntentId || !currency) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Use the verified admin's ID from session, NOT from request body
    // This prevents admin ID spoofing attacks
    const verifiedAdminId = adminSession.adminId;

    console.log(
      `[Refund Approve] Admin ${adminSession.email} (${verifiedAdminId}) approving refund ${refundRequestId}`
    );

    const refundId = await issueRefundForPaymentIntent({
      client: supabase,
      tutorId,
      studentId: studentId ?? null,
      bookingId: bookingId ?? null,
      paymentsAuditId: paymentsAuditId ?? null,
      paymentIntentId,
      amountCents: amountCents ?? undefined,
      currency,
      refundRequestId,
      adminUserId: verifiedAdminId, // Use verified admin ID from session
    });

    return NextResponse.json({ success: true, refundId });
  } catch (error) {
    console.error("Approve refund failed", error);
    return NextResponse.json({ error: "Failed to approve refund" }, { status: 500 });
  }
}


