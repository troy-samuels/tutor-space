import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin, logAdminAction, getClientIP } from "@/lib/admin/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const adminSession = await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { subject, body, recipientType, recipientIds } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { error: "Subject and body are required" },
        { status: 400 }
      );
    }

    // Get recipients based on type
    let recipients: Array<{ id: string; email: string; full_name: string | null }> = [];

    if (recipientIds && recipientIds.length > 0) {
      // Specific tutors
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", recipientIds)
        .eq("role", "tutor");

      if (error) throw error;
      recipients = data || [];
    } else if (recipientType) {
      // Filter by plan
      let query = supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("role", "tutor");

      if (recipientType !== "all") {
        if (recipientType === "professional") {
          query = query.or("plan.eq.professional,plan.is.null");
        } else {
          query = query.eq("plan", recipientType);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      recipients = data || [];
    } else {
      return NextResponse.json(
        { error: "Must specify recipients or recipient type" },
        { status: 400 }
      );
    }

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      );
    }

    // Send emails
    const emailPromises = recipients.map((recipient) =>
      resend.emails.send({
        from: "TutorLingua <noreply@tutorlingua.co>",
        to: recipient.email,
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <p>Hi ${recipient.full_name || "there"},</p>
            ${body.split("\n").map((p: string) => `<p>${p}</p>`).join("")}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
            <p style="color: #666; font-size: 12px;">
              This email was sent by TutorLingua. If you have questions, reply to this email.
            </p>
          </div>
        `,
      })
    );

    await Promise.allSettled(emailPromises);

    // Log to admin_emails table
    await supabase.from("admin_emails").insert({
      admin_user_id: adminSession.adminId,
      recipient_ids: recipients.map((r) => r.id),
      subject,
      body,
      recipient_count: recipients.length,
    });

    // Log the action
    await logAdminAction(adminSession.adminId, "send_email", {
      metadata: {
        recipientCount: recipients.length,
        subject,
        recipientType: recipientType || "specific",
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      sentCount: recipients.length,
    });
  } catch (error) {
    console.error("Admin email send error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
