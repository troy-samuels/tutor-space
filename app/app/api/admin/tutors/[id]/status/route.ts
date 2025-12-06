import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, getClientIP, hasRole } from "@/lib/admin/auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

type AccountStatus = "active" | "suspended" | "deactivated" | "pending_review";

interface StatusUpdateRequest {
  status: AccountStatus;
  reason?: string;
}

/**
 * PATCH /api/admin/tutors/[id]/status
 * Update a tutor's account status (suspend, reactivate, deactivate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(request);
    const { id: tutorId } = await params;

    // Verify admin has sufficient permissions (admin or super_admin required)
    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Get admin user to check role
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", session.adminId)
      .single();

    if (!adminUser || !hasRole(adminUser.role, "admin")) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin or super_admin role required." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as StatusUpdateRequest;
    const { status, reason } = body;

    if (!status || !["active", "suspended", "deactivated", "pending_review"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be: active, suspended, deactivated, or pending_review" },
        { status: 400 }
      );
    }

    // Get current tutor info
    const { data: tutor, error: fetchError } = await supabase
      .from("profiles")
      .select("id, email, full_name, account_status")
      .eq("id", tutorId)
      .single();

    if (fetchError || !tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    const previousStatus = tutor.account_status;

    // Update the tutor's status
    const updateData: Record<string, unknown> = {
      account_status: status,
    };

    if (status === "suspended") {
      updateData.suspended_at = new Date().toISOString();
      updateData.suspended_by = session.adminId;
      updateData.suspension_reason = reason || null;
    } else if (status === "active") {
      // Clear suspension fields when reactivating
      updateData.suspended_at = null;
      updateData.suspended_by = null;
      updateData.suspension_reason = null;
    } else if (status === "deactivated") {
      updateData.deactivated_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", tutorId);

    if (updateError) {
      console.error("Error updating tutor status:", updateError);
      return NextResponse.json(
        { error: "Failed to update tutor status" },
        { status: 500 }
      );
    }

    // Log the action
    await logAdminAction(session.adminId, `tutor_${status}`, {
      targetType: "tutor",
      targetId: tutorId,
      metadata: {
        previousStatus,
        newStatus: status,
        reason: reason || null,
        tutorEmail: tutor.email,
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    // Send email notification to tutor
    if (tutor.email) {
      try {
        if (status === "suspended") {
          const result = await sendEmail({
            to: tutor.email,
            subject: "Your TutorLingua Account Has Been Suspended",
            html: `
              <h2>Account Suspended</h2>
              <p>Dear ${tutor.full_name || "Tutor"},</p>
              <p>Your TutorLingua account has been suspended by a platform administrator.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
              <p>While your account is suspended, you will not be able to:</p>
              <ul>
                <li>Access your dashboard</li>
                <li>Accept new bookings</li>
                <li>Communicate with students</li>
              </ul>
              <p>If you believe this is an error or would like to appeal this decision, please contact our support team at support@tutorlingua.co.</p>
              <p>Best regards,<br>The TutorLingua Team</p>
            `,
            category: "admin.tutor_status",
            metadata: { tutorId, status },
          });
          if (!result.success) {
            throw new Error(result.error || "Failed to send suspension email");
          }
        } else if (status === "active" && previousStatus === "suspended") {
          const result = await sendEmail({
            to: tutor.email,
            subject: "Your TutorLingua Account Has Been Reactivated",
            html: `
              <h2>Account Reactivated</h2>
              <p>Dear ${tutor.full_name || "Tutor"},</p>
              <p>Great news! Your TutorLingua account has been reactivated.</p>
              <p>You can now:</p>
              <ul>
                <li>Access your dashboard</li>
                <li>Accept new bookings</li>
                <li>Communicate with students</li>
              </ul>
              <p>Welcome back! If you have any questions, please contact our support team at support@tutorlingua.co.</p>
              <p>Best regards,<br>The TutorLingua Team</p>
            `,
            category: "admin.tutor_status",
            metadata: { tutorId, status },
          });
          if (!result.success) {
            throw new Error(result.error || "Failed to send reactivation email");
          }
        } else if (status === "deactivated") {
          const result = await sendEmail({
            to: tutor.email,
            subject: "Your TutorLingua Account Has Been Deactivated",
            html: `
              <h2>Account Deactivated</h2>
              <p>Dear ${tutor.full_name || "Tutor"},</p>
              <p>Your TutorLingua account has been deactivated.</p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
              <p>If you would like to reactivate your account in the future, please contact our support team at support@tutorlingua.co.</p>
              <p>Best regards,<br>The TutorLingua Team</p>
            `,
            category: "admin.tutor_status",
            metadata: { tutorId, status },
          });
          if (!result.success) {
            throw new Error(result.error || "Failed to send deactivation email");
          }
        }
      } catch (emailError) {
        console.error("Failed to send status notification email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      previousStatus,
      newStatus: status,
    });
  } catch (error) {
    console.error("Error in tutor status update:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update status" },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}

/**
 * GET /api/admin/tutors/[id]/status
 * Get a tutor's status history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const { id: tutorId } = await params;

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    // Get current status
    const { data: tutor, error: tutorError } = await supabase
      .from("profiles")
      .select("account_status, suspended_at, suspended_by, suspension_reason, deactivated_at")
      .eq("id", tutorId)
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    // Get status history
    const { data: history, error: historyError } = await supabase
      .from("tutor_status_history")
      .select(`
        id,
        previous_status,
        new_status,
        reason,
        changed_at,
        admin_users (
          full_name,
          email
        )
      `)
      .eq("profile_id", tutorId)
      .order("changed_at", { ascending: false })
      .limit(20);

    if (historyError) {
      console.error("Error fetching status history:", historyError);
    }

    return NextResponse.json({
      currentStatus: tutor,
      history: history || [],
    });
  } catch (error) {
    console.error("Error fetching tutor status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch status" },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}
