"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import { validateServicePricing } from "@/lib/utils/booking-validation";
import {
  sendBookingCancelledEmail,
  sendBookingConfirmationEmail,
  sendPaymentReceiptEmail,
  sendTutorBookingNotificationEmail,
} from "@/lib/emails/booking-emails";
import { getActivePackages } from "@/lib/actions/packages";
import { ServerActionLimiters } from "@/lib/middleware/rate-limit";
import { getCalendarBusyWindows } from "@/lib/calendar/busy-windows";

export type BookingRecord = {
  id: string;
  tutor_id: string;
  student_id: string;
  service_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  currency: string | null;
  student_notes: string | null;
  meeting_url?: string | null;
  meeting_provider?: string | null;
  created_at: string;
  updated_at: string;
  students?: {
    id?: string;
    full_name: string;
    email: string;
  } | null;
  services?: {
    name: string;
  } | null;
  tutor?: {
    full_name: string;
    email?: string | null;
  } | null;
};

async function requireTutor() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

async function ensureConversationThread(
  adminClient: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  tutorId: string,
  studentId: string
) {
  const { error } = await adminClient
    .from("conversation_threads")
    .insert({ tutor_id: tutorId, student_id: studentId })
    .select("id")
    .single();

  if (error && error.code !== "23505") {
    console.error("Failed to create conversation thread:", error);
  }
}

export async function listBookings(): Promise<BookingRecord[]> {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return [];
  }

  const { data } = await supabase
    .from("bookings")
    .select(`
      *,
      students(full_name, email),
      services(name),
      session_package_redemptions(
        id,
        minutes_redeemed,
        status,
        session_package_purchases(
          session_package_templates(name)
        )
      )
    `)
    .eq("tutor_id", user.id)
    .order("scheduled_at", { ascending: true })
    .limit(100);

  return (data as BookingRecord[] | null) ?? [];
}

type CreateBookingInput = {
  service_id: string | null;
  student_id: string;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string;
  notes?: string;
};

export async function createBooking(input: CreateBookingInput) {
  const { supabase, user } = await requireTutor();
  if (!user) {
    return { error: "You need to be signed in to create bookings." };
  }

  // CONFLICT VALIDATION: Check for overlapping bookings before insert
  // This prevents double-booking the same timeslot
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, scheduled_at, duration_minutes")
    .eq("tutor_id", user.id)
    .in("status", ["pending", "confirmed"])
    .gte(
      "scheduled_at",
      new Date(
        new Date(input.scheduled_at).getTime() - 24 * 60 * 60 * 1000
      ).toISOString()
    )
    .lte(
      "scheduled_at",
      new Date(
        new Date(input.scheduled_at).getTime() + 24 * 60 * 60 * 1000
      ).toISOString()
    );

  const bookingStart = new Date(input.scheduled_at);
  const bookingEnd = new Date(
    bookingStart.getTime() + input.duration_minutes * 60 * 1000
  );

  const hasConflict = existingBookings?.some((existing) => {
    const existingStart = new Date(existing.scheduled_at);
    const existingEnd = new Date(
      existingStart.getTime() + existing.duration_minutes * 60 * 1000
    );
    // Check if time ranges overlap
    return bookingStart < existingEnd && bookingEnd > existingStart;
  });

  if (hasConflict) {
    return {
      error:
        "This time slot conflicts with an existing booking. Please select a different time.",
    };
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      tutor_id: user.id,
      service_id: input.service_id,
      student_id: input.student_id,
      scheduled_at: input.scheduled_at,
      duration_minutes: input.duration_minutes,
      timezone: input.timezone,
      status: "confirmed",
      payment_status: "unpaid",
      student_notes: input.notes ?? null,
    })
    .select("*, students(full_name, email), services(name)")
    .single<BookingRecord>();

  if (error) {
    // Check if error is due to the exclusion constraint (conflict at DB level)
    if (error.code === "23P01") {
      return {
        error:
          "This time slot was just booked. Please refresh and select a different time.",
      };
    }
    return { error: "We couldn't save that booking. Please try again." };
  }

  return { data };
}

/**
 * Create a booking for public booking flow with optional Stripe Connect payment
 * If tutor has Stripe Connect enabled, creates a checkout session
 * Otherwise falls back to manual payment instructions
 * This is called from the public booking page (no auth required)
 */
export async function createBookingAndCheckout(params: {
  tutorId: string;
  serviceId: string;
  scheduledAt: string;
  durationMinutes: number;
  timezone: string;
  student: {
    fullName: string;
    email: string;
    phone: string | null;
    timezone?: string;
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
  };
  notes: string | null;
  amount: number;
  currency: string;
  packageId?: string; // Optional: Use package instead of payment
}): Promise<
  | { error: string }
  | { success: true; bookingId: string; checkoutUrl?: string | null }
> {
  // Rate limit public booking requests to prevent abuse
  const headersList = await headers();
  const rateLimitResult = await ServerActionLimiters.booking(headersList);
  if (!rateLimitResult.success) {
    return { error: rateLimitResult.error || "Too many booking attempts. Please try again later." };
  }

  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again later." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const { data: serviceRecord } = await adminClient
      .from("services")
      .select(`
        id,
        tutor_id,
        name,
        description,
        duration_minutes,
        price,
        price_amount,
        currency,
        price_currency,
        is_active
      `)
      .eq("id", params.serviceId)
      .eq("tutor_id", params.tutorId)
      .eq("is_active", true)
      .single();

    if (!serviceRecord) {
      return { error: "Service not found or inactive" };
    }

    const servicePriceCents =
      typeof serviceRecord.price_amount === "number"
        ? serviceRecord.price_amount
        : typeof serviceRecord.price === "number"
          ? serviceRecord.price
          : 0;

    const pricingValidation = validateServicePricing({
      servicePriceCents,
      serviceCurrency:
        serviceRecord.price_currency || serviceRecord.currency || "USD",
      serviceDurationMinutes: serviceRecord.duration_minutes,
      requestedAmount: params.amount,
      requestedCurrency: params.currency,
      requestedDuration: params.durationMinutes,
    });

    if (!pricingValidation.success) {
      return { error: pricingValidation.error };
    }

    const serviceCurrency = pricingValidation.currency;
    const normalizedPriceCents = pricingValidation.priceCents;

    const { data: tutorSettings } = await adminClient
      .from("profiles")
      .select("buffer_time_minutes, timezone")
      .eq("id", params.tutorId)
      .single();

    const bufferMinutes = tutorSettings?.buffer_time_minutes ?? 0;
    const tutorTimezone = tutorSettings?.timezone || params.timezone;

    // 1. Get tutor's availability to validate booking
    const { data: availability } = await adminClient
      .from("availability")
      .select("day_of_week, start_time, end_time, is_available")
      .eq("tutor_id", params.tutorId)
      .eq("is_available", true);

    // 2. Get existing bookings to check conflicts
    const { data: existingBookings } = await adminClient
      .from("bookings")
      .select("id, scheduled_at, duration_minutes, status")
      .eq("tutor_id", params.tutorId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", new Date().toISOString());

    const busyWindows = await getCalendarBusyWindows({
      tutorId: params.tutorId,
      start: new Date(params.scheduledAt),
      days: 60,
    });

    // 3. Validate the booking
    const validation = validateBooking({
      scheduledAt: params.scheduledAt,
      durationMinutes: serviceRecord.duration_minutes,
      availability: availability || [],
      existingBookings: existingBookings || [],
      bufferMinutes,
      busyWindows,
    });

    if (!validation.isValid) {
      return { error: validation.errors.join(" ") };
    }

    // 4. Create or find student record
    let studentId: string;
    let studentProfileId: string | null = user?.id ?? null;

    // Check if student already exists by email
    const { data: existingStudent } = await adminClient
      .from("students")
      .select("id, user_id, status")
      .eq("tutor_id", params.tutorId)
      .eq("email", params.student.email)
      .single();

    // Enforce student status - only active/trial students can book
    if (existingStudent) {
      const blockedStatuses = ["paused", "alumni", "inactive", "suspended"];
      if (blockedStatuses.includes(existingStudent.status)) {
        return {
          error: `Your account status is "${existingStudent.status}". Please contact your tutor to reactivate your account before booking.`,
        };
      }
    }

    if (existingStudent) {
      studentId = existingStudent.id;
      studentProfileId = existingStudent.user_id ?? studentProfileId;

      // Update student info
      const updatePayload: Record<string, unknown> = {
        full_name: params.student.fullName,
        phone: params.student.phone,
        timezone: params.student.timezone || "UTC",
        parent_name: params.student.parentName,
        parent_email: params.student.parentEmail,
        parent_phone: params.student.parentPhone,
        updated_at: new Date().toISOString(),
      };

      if (!existingStudent.user_id && user?.id) {
        updatePayload.user_id = user.id;
      }

      await adminClient
        .from("students")
        .update(updatePayload)
        .eq("id", studentId)
        .eq("tutor_id", params.tutorId);
    } else {
      // Create new student
      const { data: newStudent, error: studentError } = await adminClient
        .from("students")
        .insert({
          tutor_id: params.tutorId,
          user_id: user?.id ?? null,
          full_name: params.student.fullName,
          email: params.student.email,
          phone: params.student.phone,
          timezone: params.student.timezone || "UTC",
          parent_name: params.student.parentName,
          parent_email: params.student.parentEmail,
          parent_phone: params.student.parentPhone,
          source: "booking_page",
        })
        .select("id, user_id")
        .single();

      if (studentError || !newStudent) {
        console.error("Failed to create student:", studentError);
        return { error: "Failed to save student information. Please try again." };
      }

      studentId = newStudent.id;
      studentProfileId = newStudent.user_id ?? studentProfileId;
    }

    if (studentId) {
      await ensureConversationThread(adminClient, params.tutorId, studentId);

      // Sync access + connection for logged-in students so portal flows work
      if (user?.id) {
        // Ensure connection is approved
        const { data: existingConnection } = await adminClient
          .from("student_tutor_connections")
          .select("id, status")
          .eq("student_user_id", user.id)
          .eq("tutor_id", params.tutorId)
          .maybeSingle();

        if (!existingConnection) {
          await adminClient.from("student_tutor_connections").insert({
            student_user_id: user.id,
            tutor_id: params.tutorId,
            status: "approved",
            requested_at: new Date().toISOString(),
            resolved_at: new Date().toISOString(),
            initial_message: "Auto-approved from booking",
          });
        } else if (existingConnection.status !== "approved") {
          await adminClient
            .from("student_tutor_connections")
            .update({
              status: "approved",
              resolved_at: new Date().toISOString(),
            })
            .eq("id", existingConnection.id);
        }

        // Ensure calendar access flag is aligned for legacy checks
        await adminClient
          .from("students")
          .update({
            calendar_access_status: "approved",
            access_approved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", studentId)
          .eq("tutor_id", params.tutorId);
      }
    }

    // 5. Create booking record as pending (payment happens outside platform)
    // If packageId provided, booking will be confirmed immediately after redemption
    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .insert({
        tutor_id: params.tutorId,
        student_id: studentId,
        service_id: params.serviceId,
        scheduled_at: params.scheduledAt,
        duration_minutes: serviceRecord.duration_minutes,
        timezone: tutorTimezone,
        status: params.packageId ? "confirmed" : "pending", // Confirmed if using package
        payment_status: params.packageId ? "paid" : "unpaid", // Paid if using package
        payment_amount: normalizedPriceCents,
        currency: serviceCurrency,
        student_notes: params.notes,
      })
      .select("id, created_at")
      .single();

    if (bookingError || !booking) {
      console.error("Failed to create booking:", bookingError);
      return { error: "Failed to create booking. Please try again." };
    }

    // 5.5. POST-INSERT CONFLICT CHECK: Prevent race conditions
    // Check if another booking was created at the same time slot while we were processing
    const bookingStartTime = new Date(params.scheduledAt);
    const bookingEndTime = new Date(bookingStartTime.getTime() + serviceRecord.duration_minutes * 60 * 1000);

    const { data: conflictingBookings } = await adminClient
      .from("bookings")
      .select("id, scheduled_at, duration_minutes, created_at")
      .eq("tutor_id", params.tutorId)
      .in("status", ["pending", "confirmed"])
      .neq("id", booking.id) // Exclude our own booking
      .lte("scheduled_at", bookingEndTime.toISOString())
      .order("created_at", { ascending: true });

    // Check for actual time overlap
    const hasConflict = conflictingBookings?.some((existing) => {
      const existingStart = new Date(existing.scheduled_at);
      const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);

      // Overlap if: our start < their end AND our end > their start
      const overlaps =
        bookingStartTime < existingEnd && bookingEndTime > existingStart;

      // Only conflict if the other booking was created before ours (first-come-first-serve)
      return overlaps && new Date(existing.created_at) < new Date(booking.created_at);
    });

    if (hasConflict) {
      // Another booking was created first - delete ours and return error
      console.log(`[bookings] Race condition detected - deleting booking ${booking.id}`);
      await adminClient
        .from("bookings")
        .delete()
        .eq("id", booking.id)
        .eq("tutor_id", params.tutorId);
      return {
        error: "This time slot was just booked by someone else. Please select a different time.",
      };
    }

    // 5a. If package redemption requested, process it
    if (params.packageId) {
      const { redeemPackageMinutes } = await import("@/lib/actions/packages");

      const redemptionResult = await redeemPackageMinutes({
        packageId: params.packageId,
        bookingId: booking.id,
        minutesToRedeem: serviceRecord.duration_minutes,
        tutorId: params.tutorId,
      });

      if (!redemptionResult.success) {
        // Failed to redeem - delete booking and return error
        await adminClient
          .from("bookings")
          .delete()
          .eq("id", booking.id)
          .eq("tutor_id", params.tutorId);
        return {
          error: redemptionResult.error || "Failed to redeem package minutes"
        };
      }
    }

    // 6. Fetch tutor profile and service info for emails + Stripe Connect status
    const { data: tutorProfile } = await adminClient
      .from("profiles")
      .select(
        "full_name, email, payment_instructions, venmo_handle, paypal_email, zelle_phone, stripe_payment_link, custom_payment_url, video_provider, zoom_personal_link, google_meet_link, calendly_link, custom_video_url, custom_video_name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status"
      )
      .eq("id", params.tutorId)
      .single();

    const serviceName = serviceRecord.name ?? "Lesson";

    // 7. Get meeting URL based on tutor's video provider
    let meetingUrl: string | null = null;
    let meetingProvider: string | null = null;

    if (tutorProfile) {
      switch (tutorProfile.video_provider) {
        case "zoom_personal":
          meetingUrl = tutorProfile.zoom_personal_link;
          meetingProvider = "zoom_personal";
          break;
        case "google_meet":
          meetingUrl = tutorProfile.google_meet_link;
          meetingProvider = "google_meet";
          break;
        case "calendly":
          meetingUrl = tutorProfile.calendly_link;
          meetingProvider = "calendly";
          break;
        case "custom":
          meetingUrl = tutorProfile.custom_video_url;
          meetingProvider = "custom";
          break;
        default:
          meetingUrl = null;
          meetingProvider = "none";
      }

      // Update booking with meeting URL
      if (meetingUrl) {
        await adminClient
          .from("bookings")
          .update({
            meeting_url: meetingUrl,
            meeting_provider: meetingProvider,
          })
          .eq("id", booking.id)
          .eq("tutor_id", params.tutorId);
      }
    }

    // 8. Send confirmation emails (don't block on email sending)
    if (tutorProfile) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      // Send to student
      sendBookingConfirmationEmail({
        studentName: params.student.fullName,
        studentEmail: params.student.email,
        tutorName: tutorProfile.full_name || "Your tutor",
        tutorEmail: tutorProfile.email,
        serviceName,
        scheduledAt: params.scheduledAt,
        durationMinutes: serviceRecord.duration_minutes,
        timezone: tutorTimezone,
        amount: normalizedPriceCents,
        currency: serviceCurrency,
        paymentInstructions: {
          general: tutorProfile.payment_instructions || undefined,
          venmoHandle: tutorProfile.venmo_handle || undefined,
          paypalEmail: tutorProfile.paypal_email || undefined,
          zellePhone: tutorProfile.zelle_phone || undefined,
          stripePaymentLink: tutorProfile.stripe_payment_link || undefined,
          customPaymentUrl: tutorProfile.custom_payment_url || undefined,
        },
        meetingUrl: meetingUrl || undefined,
        meetingProvider: meetingProvider || undefined,
        customVideoName: tutorProfile.custom_video_name || undefined,
      }).catch((error) => {
        console.error("Failed to send student confirmation email:", error);
      });

      // Send to tutor
      sendTutorBookingNotificationEmail({
        tutorName: tutorProfile.full_name || "Tutor",
        tutorEmail: tutorProfile.email,
        studentName: params.student.fullName,
        studentEmail: params.student.email,
        studentPhone: params.student.phone || undefined,
        serviceName,
        scheduledAt: params.scheduledAt,
        durationMinutes: serviceRecord.duration_minutes,
        timezone: tutorTimezone,
        amount: normalizedPriceCents,
        currency: serviceCurrency,
        notes: params.notes || undefined,
        dashboardUrl: `${appUrl}/bookings`,
      }).catch((error) => {
        console.error("Failed to send tutor notification email:", error);
      });
    }

    // 9. Check if tutor has Stripe Connect enabled and account is healthy
    const stripeAccountReady =
      tutorProfile?.stripe_charges_enabled === true &&
      tutorProfile?.stripe_account_id &&
      tutorProfile?.stripe_onboarding_status !== "restricted";

    if (!params.packageId && stripeAccountReady) {
      if (!studentProfileId) {
        console.warn("Student is not authenticated; skipping Stripe checkout and falling back to manual payment.");
      } else {
        // Tutor has Stripe Connect - create checkout session
        try {
          // First, ensure student has a Stripe customer ID
          const { data: studentProfile } = await adminClient
            .from("profiles")
            .select("stripe_customer_id, email, full_name")
            .eq("id", studentProfileId)
            .single();

          let stripeCustomerId = studentProfile?.stripe_customer_id;
          const studentEmail = studentProfile?.email || params.student.email;
          const studentName = studentProfile?.full_name || params.student.fullName;
          
          if (!stripeCustomerId) {
            // Create Stripe customer for the student
            const { getOrCreateStripeCustomer } = await import("@/lib/stripe");
            const customer = await getOrCreateStripeCustomer({
              userId: studentProfileId,
              email: studentEmail,
              name: studentName,
              metadata: {
                tutorId: params.tutorId,
                profileId: studentProfileId,
                studentRecordId: studentId,
              },
            });
            stripeCustomerId = customer.id;

            // Save to database
            await adminClient
              .from("profiles")
              .update({ stripe_customer_id: stripeCustomerId })
              .eq("id", studentProfileId);
          }

          // Create checkout session with destination charges
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const stripeCurrency = serviceCurrency.toLowerCase();
          const { createCheckoutSession } = await import("@/lib/stripe");
          
          const session = await createCheckoutSession({
            customerId: stripeCustomerId,
            priceAmount: normalizedPriceCents,
            currency: stripeCurrency,
            successUrl: `${baseUrl}/book/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${baseUrl}/book/cancelled?booking_id=${booking.id}`,
            metadata: {
              bookingId: booking.id,
              studentProfileId,
              studentRecordId: studentId,
              tutorId: params.tutorId,
            },
            lineItems: [
              {
                name: serviceName,
                description: `${serviceRecord.duration_minutes} minute lesson with ${tutorProfile.full_name || "your tutor"}`,
                amount: normalizedPriceCents,
                quantity: 1,
              },
            ],
            transferDestinationAccountId: tutorProfile.stripe_account_id,
            // No platform fee for now as per user requirements
            applicationFeeCents: undefined,
          });

          // Return checkout URL for redirect
          return {
            success: true,
            bookingId: booking.id,
            checkoutUrl: session.url,
          };
      }
        catch (stripeError) {
          console.error("Failed to create Stripe checkout:", stripeError);
          // Fall back to manual payment instructions
        }
      }
    }

    // Success - booking created, student will pay tutor directly (manual payment)
    return {
      success: true,
      bookingId: booking.id,
    };
  } catch (error) {
    console.error("Error in createBookingAndCheckout:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Mark a booking as paid and confirmed
 * Called by tutor when student has paid via Venmo/PayPal/Zelle/etc
 */
export async function markBookingAsPaid(bookingId: string) {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "You need to be signed in to update bookings." };
  }

  // Verify the booking belongs to this tutor
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
        id,
        tutor_id,
        scheduled_at,
        timezone,
        payment_amount,
        currency,
        services (
          name,
          price_amount,
          price_currency
        ),
        students (
          full_name,
          email
        ),
        tutor:profiles!bookings_tutor_id_fkey (
          full_name
        )
      `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only update your own bookings." };
  }

  const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const tutorProfile = Array.isArray(booking.tutor) ? booking.tutor[0] : booking.tutor;

  // Update booking status
  // SECURITY: Include tutor_id check in UPDATE for defense-in-depth
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .eq("tutor_id", user.id);

  if (updateError) {
    console.error("Failed to update booking:", updateError);
    return { error: "Failed to mark booking as paid. Please try again." };
  }

  const studentEmail = student?.email;
  const amountCents =
    booking.payment_amount ??
    (service?.price_amount ?? 0);
  const currency =
    booking.currency ??
    service?.price_currency ??
    "USD";

  if (studentEmail && amountCents > 0) {
    await sendPaymentReceiptEmail({
      studentName: student?.full_name ?? "Student",
      studentEmail,
      tutorName: tutorProfile?.full_name ?? "Your tutor",
      serviceName: service?.name ?? "Lesson",
      scheduledAt: booking.scheduled_at,
      timezone: booking.timezone ?? "UTC",
      amountCents,
      currency,
      paymentMethod: "Manual payment",
      notes: "Marked as paid by your tutor",
    });
  }

  return { success: true };
}

/**
 * Move a booking to a new time (tutor or student initiated)
 * - Tutors can reschedule their own bookings
 * - Students can reschedule their own bookings when linked to the booking record
 */
export async function rescheduleBooking(params: {
  bookingId: string;
  newStart: string;
  durationMinutes?: number;
  timezone?: string;
}) {
  const supabase = await createClient();
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You need to be signed in to update bookings." };
  }

  // Fetch booking with student + service context for authorization and defaults
  const { data: booking, error: bookingError } = await adminClient
    .from("bookings")
    .select(`
      id,
      tutor_id,
      student_id,
      scheduled_at,
      duration_minutes,
      status,
      timezone,
      payment_status,
      payment_amount,
      currency,
      meeting_url,
      meeting_provider,
      students (
        id,
        user_id,
        full_name,
        email
      ),
      services (
        id,
        name,
        duration_minutes
      )
    `)
    .eq("id", params.bookingId)
    .single();

  if (bookingError || !booking) {
    return { error: "Booking not found." };
  }
  const bookingRecord: any = booking;

  const studentUserId = Array.isArray(bookingRecord.students)
    ? bookingRecord.students[0]?.user_id
    : bookingRecord.students?.user_id;

  const isTutor = booking.tutor_id === user.id;
  const isStudent = studentUserId === user.id;

  if (!isTutor && !isStudent) {
    return { error: "You are not allowed to move this booking." };
  }

  const { data: tutorProfile } = await adminClient
    .from("profiles")
    .select("buffer_time_minutes, timezone")
    .eq("id", booking.tutor_id)
    .single();

  const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
  const tutorTimezone = tutorProfile?.timezone || booking.timezone || params.timezone || "UTC";

  const { data: availability } = await adminClient
    .from("availability")
    .select("day_of_week, start_time, end_time, is_available")
    .eq("tutor_id", booking.tutor_id)
    .eq("is_available", true);

  const { data: existingBookings } = await adminClient
    .from("bookings")
    .select("id, scheduled_at, duration_minutes, status")
    .eq("tutor_id", booking.tutor_id)
    .in("status", ["pending", "confirmed"])
    .neq("id", params.bookingId)
    .gte("scheduled_at", new Date().toISOString());

  const busyWindows = await getCalendarBusyWindows({
    tutorId: booking.tutor_id,
    start: new Date(params.newStart),
    days: 60,
  });

  const durationMinutes =
    params.durationMinutes ??
    bookingRecord.duration_minutes ??
    (Array.isArray(bookingRecord.services)
      ? bookingRecord.services[0]?.duration_minutes
      : bookingRecord.services?.duration_minutes) ??
    60;

  const validation = validateBooking({
    scheduledAt: params.newStart,
    durationMinutes,
    availability: availability || [],
    existingBookings: existingBookings || [],
    bufferMinutes,
    busyWindows,
  });

  if (!validation.isValid) {
    return { error: validation.errors.join(" ") };
  }

  const { data: updated, error: updateError } = await adminClient
    .from("bookings")
    .update({
      scheduled_at: params.newStart,
      duration_minutes: durationMinutes,
      timezone: tutorTimezone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.bookingId)
    .select("*, students(full_name, email), services(name)")
    .single<BookingRecord>();

  if (updateError || !updated) {
    console.error("Failed to reschedule booking:", updateError);
    return { error: "Could not reschedule this booking. Please try again." };
  }

  return { success: true, booking: updated };
}

/**
 * Check if student has available packages for booking
 * Used by public booking page to show package redemption option
 *
 * SECURITY NOTE: This is called from public booking page.
 * - If user is authenticated as a student, verify they own the email
 * - If user is authenticated as a tutor, verify they own the tutorId
 * - Unauthenticated users can check (for booking flow), but should be rate-limited
 */
export async function checkStudentPackages(params: {
  studentEmail: string;
  tutorId: string;
  durationMinutes: number;
}) {
  const supabase = await createClient();

  // SECURITY: If user is authenticated, verify authorization
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Get user's profile to check if they're a tutor
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    // If authenticated as a tutor, verify they own the tutorId
    if (profile) {
      if (profile.id !== params.tutorId) {
        return {
          error: "You can only check packages for your own students.",
          packages: []
        };
      }
    } else {
      // If authenticated as a student, verify they own the email
      const { data: studentProfile } = await supabase
        .from("students")
        .select("email, user_id")
        .eq("user_id", user.id)
        .single();

      if (studentProfile && studentProfile.email.toLowerCase() !== params.studentEmail.toLowerCase()) {
        return {
          error: "You can only check your own packages.",
          packages: []
        };
      }
    }
  }

  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { packages: [] };
  }

  try {
    // Find student by email and tutor
    const { data: student } = await adminClient
      .from("students")
      .select("id")
      .eq("email", params.studentEmail)
      .eq("tutor_id", params.tutorId)
      .single();

    if (!student) {
      return { packages: [] };
    }

    // Get active packages
    const packages = await getActivePackages(student.id, params.tutorId);

    // Filter packages with enough minutes
    const suitablePackages = packages.filter(
      (pkg) => pkg.remaining_minutes >= params.durationMinutes
    );

    return { packages: suitablePackages };
  } catch (error) {
    console.error("Error checking student packages:", error);
    return { packages: [] };
  }
}

/**
 * Cancel a booking and refund package minutes if applicable
 */
export async function cancelBooking(bookingId: string) {
  const { supabase, user } = await requireTutor();

  if (!user) {
    return { error: "You need to be signed in to cancel bookings." };
  }

  // Verify the booking belongs to this tutor
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select(
      `
        id,
        tutor_id,
        status,
        scheduled_at,
        timezone,
        services (
          name
        ),
        students (
          full_name,
          email
        ),
        tutor:profiles!bookings_tutor_id_fkey (
          full_name
        )
      `
    )
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only cancel your own bookings." };
  }

  const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
  const tutorProfile = Array.isArray(booking.tutor) ? booking.tutor[0] : booking.tutor;
  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;

  if (booking.status === "cancelled") {
    return { error: "Booking is already cancelled." };
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Failed to cancel booking:", updateError);
    return { error: "Failed to cancel booking. Please try again." };
  }

  // Refund package minutes if this booking used a package
  const { refundPackageMinutes } = await import("@/lib/actions/packages");
  const refundResult = await refundPackageMinutes(bookingId);

  if (!refundResult.success) {
    console.warn("Failed to refund package minutes:", refundResult.error);
    // Don't fail the cancellation if refund fails - just log it
  }

  const studentEmail = student?.email;
  if (studentEmail) {
    await sendBookingCancelledEmail({
      studentName: student?.full_name ?? "Student",
      studentEmail,
      tutorName: tutorProfile?.full_name ?? "Your tutor",
      serviceName: service?.name ?? "Lesson",
      scheduledAt: booking.scheduled_at,
      timezone: booking.timezone ?? "UTC",
    });
  }

  return { success: true };
}
