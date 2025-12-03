import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAdmin, logAdminAction, getClientIP } from "@/lib/admin/auth";
import { resend, EMAIL_CONFIG } from "@/lib/resend";
import {
  TutorReengagementEmail,
  TutorReengagementEmailText,
  getReengagementSubject,
  type ReengagementStage,
} from "@/emails/tutor-reengagement";

const VALID_TEMPLATES: ReengagementStage[] = [
  "friendly_checkin",
  "feature_highlight",
  "account_status",
];

const COOLDOWN_DAYS = 7;

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

    const body = await request.json();
    const { tutorId, templateId } = body;

    // Validate required fields
    if (!tutorId || !templateId) {
      return NextResponse.json(
        { error: "tutorId and templateId are required" },
        { status: 400 }
      );
    }

    // Validate template ID
    if (!VALID_TEMPLATES.includes(templateId)) {
      return NextResponse.json(
        { error: `Invalid template ID. Must be one of: ${VALID_TEMPLATES.join(", ")}` },
        { status: 400 }
      );
    }

    // Get tutor details
    const { data: tutor, error: tutorError } = await supabase
      .from("profiles")
      .select("id, email, full_name, last_login_at")
      .eq("id", tutorId)
      .eq("role", "tutor")
      .single();

    if (tutorError || !tutor) {
      return NextResponse.json(
        { error: "Tutor not found" },
        { status: 404 }
      );
    }

    // Check for recent re-engagement email (7-day cooldown)
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

    const { data: recentEmail } = await supabase
      .from("tutor_reengagement_emails")
      .select("id, sent_at, template_id")
      .eq("tutor_id", tutorId)
      .gte("sent_at", cooldownDate.toISOString())
      .order("sent_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentEmail) {
      const sentDate = new Date(recentEmail.sent_at);
      const daysSinceSent = Math.floor(
        (Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysRemaining = COOLDOWN_DAYS - daysSinceSent;

      return NextResponse.json(
        {
          error: `A re-engagement email was sent ${daysSinceSent} day(s) ago. Please wait ${daysRemaining} more day(s) before sending another.`,
          cooldownRemaining: daysRemaining,
          lastSentAt: recentEmail.sent_at,
          lastTemplateId: recentEmail.template_id,
        },
        { status: 429 }
      );
    }

    // Calculate days since last login
    let daysSinceLogin: number | undefined;
    if (tutor.last_login_at) {
      const lastLoginDate = new Date(tutor.last_login_at);
      daysSinceLogin = Math.floor(
        (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Generate email content
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
    const tutorName = tutor.full_name || "";
    const subject = getReengagementSubject(templateId as ReengagementStage);
    const html = TutorReengagementEmail({
      tutorName,
      stage: templateId as ReengagementStage,
      loginUrl,
      daysSinceLogin,
    });
    const text = TutorReengagementEmailText({
      tutorName,
      stage: templateId as ReengagementStage,
      loginUrl,
      daysSinceLogin,
    });

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: tutor.email,
      subject,
      html,
      text,
      replyTo: EMAIL_CONFIG.replyTo,
    });

    if (emailError) {
      console.error("Failed to send re-engagement email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    // Record the email in the database
    const { error: insertError } = await supabase
      .from("tutor_reengagement_emails")
      .insert({
        tutor_id: tutorId,
        admin_user_id: adminSession.adminId,
        template_id: templateId,
        metadata: {
          days_since_login: daysSinceLogin,
          tutor_email: tutor.email,
          tutor_name: tutor.full_name,
        },
      });

    if (insertError) {
      console.error("Failed to record re-engagement email:", insertError);
      // Don't fail the request - email was sent successfully
    }

    // Log the admin action
    await logAdminAction(adminSession.adminId, "send_reengagement_email", {
      targetType: "tutor",
      targetId: tutorId,
      metadata: {
        templateId,
        daysSinceLogin,
        tutorEmail: tutor.email,
      },
      ipAddress: getClientIP(request),
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Re-engagement email sent to ${tutor.email}`,
      templateId,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Re-engagement email API error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check re-engagement email history for a tutor
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get("tutorId");

    if (!tutorId) {
      return NextResponse.json(
        { error: "tutorId is required" },
        { status: 400 }
      );
    }

    // Get email history for this tutor
    const { data: emails, error } = await supabase
      .from("tutor_reengagement_emails")
      .select(`
        id,
        template_id,
        sent_at,
        metadata,
        admin_user_id
      `)
      .eq("tutor_id", tutorId)
      .order("sent_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching re-engagement email history:", error);
      return NextResponse.json(
        { error: "Failed to fetch email history" },
        { status: 500 }
      );
    }

    // Check if in cooldown period
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

    const lastEmail = emails?.[0];
    const isInCooldown = lastEmail && new Date(lastEmail.sent_at) > cooldownDate;

    let cooldownRemaining = 0;
    if (isInCooldown && lastEmail) {
      const sentDate = new Date(lastEmail.sent_at);
      const daysSinceSent = Math.floor(
        (Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      cooldownRemaining = COOLDOWN_DAYS - daysSinceSent;
    }

    return NextResponse.json({
      emails: emails || [],
      isInCooldown,
      cooldownRemaining,
      cooldownDays: COOLDOWN_DAYS,
    });
  } catch (error) {
    console.error("Re-engagement email history API error:", error);

    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
