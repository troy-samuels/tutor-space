"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  sendDailyDigestEmail,
  sendLeadNurtureEmail,
  sendParentUpdateEmail,
  sendTestimonialRequestEmail,
  type LeadNurtureStage,
} from "@/lib/emails/engagement";

const parentUpdateSchema = z.object({
  bookingId: z.string().uuid(),
  highlights: z.array(z.string().min(1)).min(1),
  nextFocus: z.string().optional(),
  resources: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
      })
    )
    .optional(),
  bookingLink: z.string().url().optional(),
});

export async function sendParentUpdateForBooking(form: z.infer<typeof parentUpdateSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const payload = parentUpdateSchema.safeParse(form);
  if (!payload.success) {
    return { error: payload.error.issues[0]?.message ?? "Invalid payload." };
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
        id,
        tutor_id,
        scheduled_at,
        timezone,
        services ( name ),
        students (
          full_name,
          email,
          parent_email,
          parent_name
        ),
        tutor:profiles!bookings_tutor_id_fkey (
          full_name,
          username
        )
      `
    )
    .eq("id", payload.data.bookingId)
    .single();

  if (error || !booking || booking.tutor_id !== user.id) {
    return { error: "Booking not found." };
  }

  const recipient =
    booking.students?.parent_email || booking.students?.email;

  if (!recipient) {
    return { error: "Student record has no parent email." };
  }

  await sendParentUpdateEmail({
    to: recipient,
    parentName: booking.students?.parent_name ?? undefined,
    studentName: booking.students?.full_name ?? "Your student",
    tutorName: booking.tutor?.full_name ?? "Your tutor",
    lessonDate: new Date(booking.scheduled_at).toLocaleDateString(),
    timezone: booking.timezone ?? "UTC",
    highlights: payload.data.highlights,
    nextFocus: payload.data.nextFocus,
    resources: payload.data.resources,
    bookingLink:
      payload.data.bookingLink ??
      (booking.tutor?.username
        ? `${process.env.NEXT_PUBLIC_APP_URL}/book/${booking.tutor.username}`
        : undefined),
  });

  return { success: true };
}

const testimonialSchema = z.object({
  studentId: z.string().uuid(),
  testimonialUrl: z.string().url(),
  lessonHighlight: z.string().min(5),
  incentive: z.string().optional(),
});

export async function sendTestimonialRequest(form: z.infer<typeof testimonialSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const payload = testimonialSchema.safeParse(form);
  if (!payload.success) {
    return { error: payload.error.issues[0]?.message ?? "Invalid payload." };
  }

  const { data: student, error } = await supabase
    .from("students")
    .select("id, tutor_id, full_name, email, parent_email, parent_name")
    .eq("id", payload.data.studentId)
    .single();

  if (error || !student || student.tutor_id !== user.id) {
    return { error: "Student not found." };
  }

  const recipient = student.parent_email || student.email;
  if (!recipient) {
    return { error: "Student has no contact email." };
  }

  await sendTestimonialRequestEmail({
    to: recipient,
    parentName: student.parent_name,
    tutorName: user.user_metadata?.full_name ?? "Your tutor",
    studentName: student.full_name,
    lessonHighlight: payload.data.lessonHighlight,
    testimonialUrl: payload.data.testimonialUrl,
    incentive: payload.data.incentive,
  });

  return { success: true };
}

const leadNurtureSchema = z.object({
  leadId: z.string().uuid(),
  stage: z.enum(["getting_started", "social_proof", "last_call"]) as z.ZodType<LeadNurtureStage>,
  bookingLink: z.string().url(),
  bonusOffer: z.string().optional(),
});

export async function sendLeadNurtureEmailAction(form: z.infer<typeof leadNurtureSchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const payload = leadNurtureSchema.safeParse(form);
  if (!payload.success) {
    return { error: payload.error.issues[0]?.message ?? "Invalid payload." };
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .select("id, tutor_id, full_name, email")
    .eq("id", payload.data.leadId)
    .single();

  if (error || !lead || lead.tutor_id !== user.id) {
    return { error: "Lead not found." };
  }

  if (!lead.email) {
    return { error: "Lead has no email." };
  }

  await sendLeadNurtureEmail({
    to: lead.email,
    tutorName: user.user_metadata?.full_name ?? "Your tutor",
    leadName: lead.full_name,
    stage: payload.data.stage,
    bookingLink: payload.data.bookingLink,
    bonusOffer: payload.data.bonusOffer,
  });

  return { success: true };
}

export async function sendDailyDigestEmailAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, timezone")
    .eq("id", user.id)
    .single();

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: upcoming } = await supabase
    .from("bookings")
    .select(
      `
        scheduled_at,
        services (name),
        students (full_name)
      `
    )
    .eq("tutor_id", user.id)
    .eq("status", "confirmed")
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", horizon.toISOString())
    .order("scheduled_at", { ascending: true });

  const lessons =
    upcoming?.map((booking) => ({
      student: booking.students?.full_name ?? "Student",
      service: booking.services?.name ?? "Lesson",
      timeLabel: new Date(booking.scheduled_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    })) ?? [];

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, due_date, total_due_cents, currency, status")
    .eq("tutor_id", user.id)
    .neq("status", "paid")
    .lte("due_date", horizon.toISOString())
    .order("due_date", { ascending: true })
    .limit(5);

  const invoiceItems =
    invoices?.map((invoice) => ({
      label: invoice.invoice_number
        ? `Invoice ${invoice.invoice_number}`
        : "Invoice",
      amount: invoice.total_due_cents
        ? `${(invoice.total_due_cents / 100).toFixed(2)} ${invoice.currency ?? "USD"}`
        : invoice.currency ?? "USD",
      dueDate: invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString()
        : "Soon",
    })) ?? [];

  const { data: leads } = await supabase
    .from("leads")
    .select("full_name, status, updated_at")
    .eq("tutor_id", user.id)
    .in("status", ["new", "contacted"])
    .limit(5);

  const leadItems =
    leads?.map((lead) => ({
      name: lead.full_name,
      channel: lead.status,
      lastAction: lead.updated_at
        ? new Date(lead.updated_at).toLocaleDateString()
        : "No touch",
    })) ?? [];

  const recipientEmail = profile?.email ?? user.email;
  if (!recipientEmail) {
    return { error: "Tutor profile is missing an email address." };
  }

  await sendDailyDigestEmail({
    to: recipientEmail,
    tutorName: profile?.full_name ?? user.user_metadata?.full_name ?? "Tutor",
    dateLabel: now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    timezone: profile?.timezone ?? "UTC",
    lessons,
    invoices: invoiceItems,
    leads: leadItems,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return { success: true };
}
