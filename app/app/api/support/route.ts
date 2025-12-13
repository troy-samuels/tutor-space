import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendSupportTicketEmails } from "@/lib/emails/ops-emails";
import { EMAIL_CONFIG } from "@/lib/resend";

const ticketSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(1),
  category: z.string().optional(),
  tutorId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = ticketSchema.safeParse(await request.json());
    if (!payload.success) {
      return NextResponse.json(
        { error: payload.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const admin = createServiceRoleClient();
    const { data: profile } = admin
      ? await admin.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle()
      : { data: null };

    const submittedByRole =
      profile?.role === "tutor" || profile?.role === "student" ? profile.role : "unknown";

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject: payload.data.subject,
        message: payload.data.message,
        category: payload.data.category ?? "general",
        submitted_by_role: submittedByRole,
        tutor_id: payload.data.tutorId ?? null,
        student_id: payload.data.studentId ?? null,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[Support] Failed to create ticket", error);
      return NextResponse.json({ error: "Could not submit ticket" }, { status: 500 });
    }

    const supportEmail = EMAIL_CONFIG.replyTo;
    await sendSupportTicketEmails({
      userEmail: user.email,
      userName: profile?.full_name ?? user.user_metadata?.full_name ?? null,
      ticketId: data.id,
      subject: payload.data.subject,
      message: payload.data.message,
      category: payload.data.category ?? "general",
      supportEmail,
      viewUrl: `${(process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co").replace(/\/+$/, "")}/admin/support`,
    });

    return NextResponse.json({ success: true, ticketId: data.id });
  } catch (error) {
    console.error("[Support] Unexpected error", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
