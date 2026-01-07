"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { EmailAudienceId } from "@/lib/constants/email-audiences";
import { queueEmailCampaign } from "@/lib/server/email-queue";
import type { BroadcastActionState } from "@/lib/actions/types";

const audienceValues: EmailAudienceId[] = [
  "all",
  "active",
  "inactive",
  "paused",
  "inactive_30",
  "never_booked",
];

const sendBroadcastSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(160),
  body: z.string().min(20, "Message should be at least 20 characters"),
  audience_filter: z.enum(audienceValues),
  template_id: z.string().optional(),
  send_option: z.enum(["now", "schedule"]).default("now"),
  scheduled_for: z.string().optional(),
});

export async function sendBroadcastEmail(
  _prevState: BroadcastActionState,
  formData: FormData
): Promise<BroadcastActionState> {
  const parsed = sendBroadcastSchema.safeParse({
    subject: formData.get("subject"),
    body: formData.get("body"),
    audience_filter: formData.get("audience_filter"),
    template_id: formData.get("template_id"),
    send_option: formData.get("send_option") ?? "now",
    scheduled_for: formData.get("scheduled_for"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid campaign details." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to send campaigns." };
  }

  const { data: tutorProfile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[EmailCampaign] Failed to load tutor profile", profileError);
    return { error: "We couldn’t load your profile. Try again." };
  }

  let studentQuery = supabase
    .from("students")
    .select("id, full_name, email, status, email_opt_out")
    .eq("tutor_id", user.id)
    .eq("email_opt_out", false);

  switch (parsed.data.audience_filter) {
    case "active":
      studentQuery = studentQuery.eq("status", "active");
      break;
    case "inactive":
      studentQuery = studentQuery.eq("status", "inactive");
      break;
    case "paused":
      studentQuery = studentQuery.eq("status", "paused");
      break;
    case "inactive_30": {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 30);
      studentQuery = studentQuery
        .eq("status", "inactive")
        .gte("updated_at", "1970-01-01")
        .lte("updated_at", threshold.toISOString());
      break;
    }
    case "never_booked":
      studentQuery = studentQuery.is("last_reengage_email_at", null);
      break;
    default:
      break;
  }

  const { data: students, error: studentsError } = await studentQuery;

  if (studentsError) {
    console.error("[EmailCampaign] Failed to query students", studentsError);
    return { error: "We couldn’t load your students. Try again." };
  }

  let filteredStudents =
    students?.filter((student) => student.email && student.email.includes("@")) ?? [];

  if (
    (parsed.data.audience_filter === "inactive_30" ||
      parsed.data.audience_filter === "never_booked") &&
    filteredStudents.length > 0
  ) {
    const studentIds = filteredStudents.map((student) => student.id);
    const { data: bookingRows } = await supabase
      .from("bookings")
      .select("student_id, scheduled_at")
      .eq("tutor_id", user.id)
      .in("student_id", studentIds)
      .order("scheduled_at", { ascending: false });

    const lastBookingMap = new Map<string, Date>();
    (bookingRows ?? []).forEach((booking) => {
      if (!booking.student_id || !booking.scheduled_at) return;
      if (!lastBookingMap.has(booking.student_id)) {
        lastBookingMap.set(booking.student_id, new Date(booking.scheduled_at));
      }
    });

    if (parsed.data.audience_filter === "never_booked") {
      filteredStudents = filteredStudents.filter(
        (student) => !lastBookingMap.has(student.id)
      );
    } else {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 30);
      filteredStudents = filteredStudents.filter((student) => {
        const lastBooking = lastBookingMap.get(student.id);
        if (!lastBooking) {
          return false;
        }
        return lastBooking < threshold;
      });
    }
  }

  if (filteredStudents.length === 0) {
    return { error: "No students match this audience yet." };
  }

  const tutorName = tutorProfile?.full_name?.trim() || "your tutor";
  let scheduledFor = new Date().toISOString();
  if (parsed.data.send_option === "schedule") {
    if (!parsed.data.scheduled_for) {
      return { error: "Choose a date and time for scheduled campaigns." };
    }
    const scheduledDate = new Date(parsed.data.scheduled_for);
    if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() < Date.now()) {
      return { error: "Scheduled time must be in the future." };
    }
    scheduledFor = scheduledDate.toISOString();
  }

  const personalize = (value: string, studentName: string) =>
    value
      .replace(/\{\{\s*student_name\s*\}\}/gi, studentName)
      .replace(/\{\{\s*tutor_name\s*\}\}/gi, tutorName);

  try {
    await queueEmailCampaign({
      tutorId: user.id,
      subject: parsed.data.subject,
      body: parsed.data.body,
      audienceFilter: parsed.data.audience_filter,
      templateId: parsed.data.template_id || null,
      kind: "broadcast",
      scheduledFor,
      recipientCount: filteredStudents.length,
      recipients: filteredStudents.map((student) => ({
        student_id: student.id,
        student_email: student.email!,
        student_name: student.full_name,
        personalization_subject: personalize(parsed.data.subject, student.full_name || "there"),
        personalization_body: personalize(parsed.data.body, student.full_name || "there"),
        scheduled_for: scheduledFor,
      })),
    });
  } catch (error) {
    console.error("[EmailCampaign] Failed to queue campaign", error);
    return { error: "We couldn’t queue this campaign. Try again." };
  }

  revalidatePath("/marketing/email");
  revalidatePath("/dashboard");

  return {
    success:
      parsed.data.send_option === "schedule"
        ? `Campaign scheduled for ${new Date(scheduledFor).toLocaleString()}.`
        : `Campaign queued for delivery.`,
  };
}
