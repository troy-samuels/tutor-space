import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import type { ServiceRoleClient, BookingDetails } from "../utils/types";
import {
  sendPaymentReceiptEmail,
  sendBookingConfirmationEmail,
  sendTutorBookingConfirmedEmail,
  sendTutorPaymentReceivedEmail,
} from "@/lib/emails/booking-emails";
import { createCalendarEventForBooking } from "@/lib/calendar/busy-windows";
import { buildBookingCalendarDetails } from "@/lib/calendar/booking-calendar-details";
import { buildClassroomUrl, tutorHasStudioAccess, isClassroomUrl } from "@/lib/utils/classroom-links";
import { updateBookingMeetingUrl } from "@/lib/repositories/bookings";

type BookingPaymentUpdateResult = {
  shouldProcessSideEffects: boolean;
  didUpdate: boolean;
};

/**
 * Handles booking payment from checkout sessions.
 */
export async function handleBookingPayment(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.log("No bookingId in session metadata");
    return;
  }

  const paymentResult = await markBookingPaidIfNeeded(session, supabase, bookingId);
  if (!paymentResult.shouldProcessSideEffects) return;

  if (paymentResult.didUpdate) {
    await recordConnectPaymentAudit(session, supabase, bookingId);
  }

  const bookingDetails = await fetchBookingDetails(supabase, bookingId);

  const meetingDetails = await resolveMeetingDetails(session, supabase, bookingDetails);
  await sendBookingPaymentEmails(session, bookingDetails, meetingDetails);
  queueCalendarEventCreation(supabase, bookingId, session, bookingDetails);
}

/**
 * Handles async payment failure for checkout sessions.
 * Logs failure and keeps booking unpaid.
 */
export async function handleCheckoutSessionAsyncPaymentFailed(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient
): Promise<void> {
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    console.log("Async payment failed without bookingId metadata");
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      payment_status: "unpaid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .neq("payment_status", "paid");

  if (error) {
    console.error("Failed to record async payment failure for booking:", error);
  } else {
    console.log(`⚠️ Async payment failed for booking ${bookingId}, left as unpaid`);
  }
}

async function markBookingPaidIfNeeded(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient,
  bookingId: string
): Promise<BookingPaymentUpdateResult> {
  const paymentVerified = await ensurePaymentIntentSucceeded(session);
  if (!paymentVerified) {
    return { shouldProcessSideEffects: false, didUpdate: false };
  }

  const existingBooking = await fetchBookingPaymentState(supabase, bookingId);
  if (!existingBooking) {
    return { shouldProcessSideEffects: false, didUpdate: false };
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;

  if (existingBooking.payment_status === "paid") {
    if (paymentIntentId && existingBooking.stripe_payment_intent_id === paymentIntentId) {
      console.log(`⚠️ Booking ${bookingId} already marked as paid for this payment, continuing side-effects`);
      return { shouldProcessSideEffects: true, didUpdate: false };
    }
    console.log(`⚠️ Booking ${bookingId} already marked as paid, skipping update`);
    return { shouldProcessSideEffects: false, didUpdate: false };
  }

  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      payment_amount: typeof session.amount_total === "number" ? session.amount_total : null,
      currency: session.currency?.toUpperCase() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .neq("payment_status", "paid")
    .select("id")
    .single();

  if (updateError) {
    if (updateError.code === "PGRST116") {
      console.log(
        `⚠️ Booking ${bookingId} already marked as paid by another process, skipping side-effects`
      );
      return { shouldProcessSideEffects: false, didUpdate: false };
    }
    console.error("Failed to update booking payment status:", updateError);
    throw updateError;
  }

  if (!updatedBooking) {
    console.log(`⚠️ Booking ${bookingId} update returned no rows, skipping side-effects`);
    return { shouldProcessSideEffects: false, didUpdate: false };
  }

  console.log(`✅ Booking ${bookingId} marked as paid`);
  return { shouldProcessSideEffects: true, didUpdate: true };
}

async function ensurePaymentIntentSucceeded(
  session: Stripe.Checkout.Session
): Promise<boolean> {
  if (!session.payment_intent) return true;

  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent as string
  );

  if (paymentIntent.status !== "succeeded") {
    console.error(
      `⚠️ Payment intent ${paymentIntent.id} status is ${paymentIntent.status}, not succeeded. Skipping booking update.`
    );
    return false;
  }

  console.log(`✅ Payment verified: ${paymentIntent.id} status = succeeded`);
  return true;
}

async function fetchBookingPaymentState(
  supabase: ServiceRoleClient,
  bookingId: string
) {
  const { data: existingBooking, error: bookingFetchError } = await supabase
    .from("bookings")
    .select("status, payment_status, stripe_payment_intent_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingFetchError) {
    console.error(`Failed to fetch booking ${bookingId}:`, bookingFetchError);
    throw bookingFetchError;
  }

  if (!existingBooking) {
    console.error(`Booking ${bookingId} not found, skipping update`);
    return null;
  }

  return existingBooking;
}

async function recordConnectPaymentAudit(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient,
  bookingId: string
): Promise<void> {
  if (!session.payment_intent || !session.metadata?.tutorId) return;

  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent as string
  );

  const metadata = session.metadata as Record<string, string> | null;
  const studentProfileId = metadata?.studentProfileId || metadata?.studentId || null;

  let auditStudentId: string | null = null;
  if (studentProfileId) {
    const { data: studentProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", studentProfileId)
      .single();

    if (studentProfile?.id) {
      auditStudentId = studentProfile.id;
    }
  }

  if (!paymentIntent.transfer_data?.destination) return;

  const { error: auditError } = await supabase.from("payments_audit").insert({
    tutor_id: session.metadata.tutorId,
    student_id: auditStudentId,
    booking_id: bookingId,
    amount_cents: session.amount_total || 0,
    currency: session.currency || "usd",
    application_fee_cents: paymentIntent.application_fee_amount || 0,
    net_amount_cents:
      (session.amount_total || 0) - (paymentIntent.application_fee_amount || 0),
    stripe_payment_intent_id: session.payment_intent as string,
    stripe_charge_id: paymentIntent.latest_charge as string | null,
    destination_account_id: paymentIntent.transfer_data.destination as string,
    payment_type: "booking",
    created_at: new Date().toISOString(),
  });

  if (auditError) {
    console.error("Failed to create payment audit record:", auditError);
  } else {
    console.log(`✅ Payment audit recorded for booking ${bookingId}`);
  }
}

export async function fetchBookingDetails(
  supabase: ServiceRoleClient,
  bookingId: string
): Promise<BookingDetails> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        id,
        tutor_id,
        scheduled_at,
        timezone,
        payment_amount,
        currency,
        meeting_url,
        meeting_provider,
        short_code,
        services (
          name,
          price_amount,
          price_currency,
          duration_minutes
        ),
        students (
          full_name,
          email
        ),
        tutor:profiles!bookings_tutor_id_fkey (
          full_name,
          email,
          tier,
          plan
        )
      `
    )
    .eq("id", bookingId)
    .single<BookingDetails>();

  if (error) {
    console.error("Failed to fetch booking details:", error);
    throw error;
  }

  if (!data) {
    const notFoundError = new Error(`Booking ${bookingId} not found after payment update`);
    console.error(notFoundError.message);
    throw notFoundError;
  }

  return data;
}

async function resolveMeetingDetails(
  session: Stripe.Checkout.Session,
  supabase: ServiceRoleClient,
  bookingDetails: BookingDetails
) {
  let meetingUrlForEmail = bookingDetails.meeting_url ?? null;
  let meetingProviderForEmail = bookingDetails.meeting_provider ?? null;

  if (!meetingUrlForEmail) {
    const tutorHasStudio = tutorHasStudioAccess({
      tier: bookingDetails.tutor?.tier ?? null,
      plan: bookingDetails.tutor?.plan ?? null,
    });
    const resolvedTutorId = bookingDetails.tutor_id ?? session.metadata?.tutorId ?? null;

    if (tutorHasStudio && resolvedTutorId) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const meetingUrl = buildClassroomUrl(
          bookingDetails.id,
          bookingDetails.short_code,
          appUrl
        );
        await updateBookingMeetingUrl(
          supabase,
          bookingDetails.id,
          resolvedTutorId,
          meetingUrl,
          "livekit"
        );
        meetingUrlForEmail = meetingUrl;
        meetingProviderForEmail = "livekit";
      } catch (meetingUrlError) {
        console.error("[Webhook] Failed to set LiveKit meeting URL:", meetingUrlError);
      }
    }
  }

  if (meetingUrlForEmail && !meetingProviderForEmail) {
    meetingProviderForEmail = isClassroomUrl(meetingUrlForEmail) ? "livekit" : "custom";
  }

  return { meetingUrlForEmail, meetingProviderForEmail };
}

async function sendBookingPaymentEmails(
  session: Stripe.Checkout.Session,
  bookingDetails: BookingDetails,
  meetingDetails: {
    meetingUrlForEmail: string | null;
    meetingProviderForEmail: string | null;
  }
): Promise<void> {
  const studentEmail = bookingDetails.students?.email;
  const amountCents =
    bookingDetails.payment_amount ??
    bookingDetails.services?.price_amount ??
    (typeof session.amount_total === "number" ? session.amount_total : 0);
  const currency =
    bookingDetails.currency ??
    bookingDetails.services?.price_currency ??
    session.currency?.toUpperCase() ??
    "USD";
  const durationMinutes = bookingDetails.services?.duration_minutes ?? 60;

  const emailTasks: Array<{ label: string; promise: Promise<unknown> }> = [];

  if (studentEmail && amountCents > 0) {
    emailTasks.push({
      label: "student_confirmation",
      promise: sendBookingConfirmationEmail({
        bookingId: bookingDetails.id,
        studentName: bookingDetails.students?.full_name ?? "Student",
        studentEmail,
        tutorName: bookingDetails.tutor?.full_name ?? "Your tutor",
        tutorEmail: bookingDetails.tutor?.email ?? "",
        serviceName: bookingDetails.services?.name ?? "Lesson",
        scheduledAt: bookingDetails.scheduled_at ?? new Date().toISOString(),
        durationMinutes,
        timezone: bookingDetails.timezone ?? "UTC",
        amount: amountCents / 100,
        currency,
        confirmationStatus: "confirmed",
        paymentStatus: "paid",
        meetingUrl: meetingDetails.meetingUrlForEmail ?? undefined,
        meetingProvider: meetingDetails.meetingProviderForEmail ?? undefined,
      }),
    });
    emailTasks.push({
      label: "student_receipt",
      promise: sendPaymentReceiptEmail({
        bookingId: bookingDetails.id,
        studentName: bookingDetails.students?.full_name ?? "Student",
        studentEmail,
        tutorName: bookingDetails.tutor?.full_name ?? "Your tutor",
        serviceName: bookingDetails.services?.name ?? "Lesson",
        scheduledAt: bookingDetails.scheduled_at ?? new Date().toISOString(),
        timezone: bookingDetails.timezone ?? "UTC",
        amountCents,
        currency,
        paymentMethod: (session.payment_method_types?.[0] ?? "card").toUpperCase(),
        invoiceNumber: typeof session.invoice === "string" ? session.invoice : undefined,
      }),
    });
  }

  const tutorEmail = bookingDetails.tutor?.email;
  if (tutorEmail && amountCents > 0 && session.metadata?.tutorId) {
    emailTasks.push({
      label: "tutor_payment_received",
      promise: sendTutorPaymentReceivedEmail({
        bookingId: bookingDetails.id,
        tutorName: bookingDetails.tutor?.full_name ?? "Tutor",
        tutorEmail,
        studentName: bookingDetails.students?.full_name ?? "Student",
        serviceName: bookingDetails.services?.name ?? "Lesson",
        scheduledAt: bookingDetails.scheduled_at ?? new Date().toISOString(),
        timezone: bookingDetails.timezone ?? "UTC",
        amountCents,
        currency,
        paymentMethod: "STRIPE",
        notes: `Payment received from ${bookingDetails.students?.full_name ?? "student"} via Stripe Connect. Funds will be available in your Stripe account according to your payout schedule.`,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co"}/bookings`,
      }),
    });
  }

  const tutorNotifyEmail = bookingDetails.tutor?.email;
  const tutorName = bookingDetails.tutor?.full_name ?? "Tutor";
  if (tutorNotifyEmail && amountCents > 0) {
    emailTasks.push({
      label: "tutor_booking_confirmed",
      promise: sendTutorBookingConfirmedEmail({
        bookingId: bookingDetails.id,
        tutorName,
        tutorEmail: tutorNotifyEmail,
        studentName: bookingDetails.students?.full_name ?? "Student",
        studentEmail: studentEmail ?? "",
        serviceName: bookingDetails.services?.name ?? "Lesson",
        scheduledAt: bookingDetails.scheduled_at ?? new Date().toISOString(),
        durationMinutes,
        timezone: bookingDetails.timezone ?? "UTC",
        amount: amountCents / 100,
        currency,
        notes: undefined,
        meetingUrl: meetingDetails.meetingUrlForEmail ?? undefined,
        meetingProvider: meetingDetails.meetingProviderForEmail ?? undefined,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.tutorlingua.co"}/bookings`,
        paymentStatusLabel: "Paid via Stripe",
      }),
    });
  }

  if (emailTasks.length === 0) return;

  const results = await Promise.allSettled(emailTasks.map((task) => task.promise));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`[Webhook] Failed to send ${emailTasks[index].label} email:`, result.reason);
    }
  });
}

function queueCalendarEventCreation(
  supabase: ServiceRoleClient,
  bookingId: string,
  session: Stripe.Checkout.Session,
  bookingDetails: BookingDetails
): void {
  const tutorId = session.metadata?.tutorId;
  if (!tutorId || !bookingDetails.scheduled_at) return;

  buildBookingCalendarDetails({
    client: supabase,
    bookingId,
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  })
    .then((calendarDetails) => {
      if (!calendarDetails) return null;
      return createCalendarEventForBooking({
        tutorId: calendarDetails.tutorId,
        bookingId: calendarDetails.bookingId,
        title: calendarDetails.title,
        start: calendarDetails.start,
        end: calendarDetails.end,
        description: calendarDetails.description,
        location: calendarDetails.location ?? undefined,
        studentEmail: calendarDetails.studentEmail ?? undefined,
        timezone: calendarDetails.timezone,
      });
    })
    .catch((err) => {
      console.error("[Webhook] Failed to create calendar event:", err);
    });
}
