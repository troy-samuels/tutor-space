"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import { validateServicePricing } from "@/lib/utils/booking-validation";
import {
  sendBookingConfirmationEmail,
  sendTutorBookingNotificationEmail,
} from "@/lib/emails/booking-emails";
import { getActivePackages } from "@/lib/actions/packages";

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
  created_at: string;
  updated_at: string;
  students?: {
    full_name: string;
    email: string;
  } | null;
  services?: {
    name: string;
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
    return { error: "We couldn’t save that booking. Please try again." };
  }

  return { data };
}

/**
 * Create a booking for public booking flow (no payment processing)
 * Students pay tutors directly via their preferred payment method
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
    parentName: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
  };
  notes: string | null;
  amount: number;
  currency: string;
  packageId?: string; // Optional: Use package instead of payment
}) {
  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    return { error: "Service unavailable. Please try again later." };
  }

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

    // 3. Validate the booking
    const validation = validateBooking({
      scheduledAt: params.scheduledAt,
      durationMinutes: serviceRecord.duration_minutes,
      availability: availability || [],
      existingBookings: existingBookings || [],
      bufferMinutes,
    });

    if (!validation.isValid) {
      return { error: validation.errors.join(" ") };
    }

    // 4. Create or find student record
    let studentId: string;

    // Check if student already exists by email
    const { data: existingStudent } = await adminClient
      .from("students")
      .select("id")
      .eq("tutor_id", params.tutorId)
      .eq("email", params.student.email)
      .single();

    if (existingStudent) {
      studentId = existingStudent.id;

      // Update student info
      await adminClient
        .from("students")
        .update({
          full_name: params.student.fullName,
          phone: params.student.phone,
          parent_name: params.student.parentName,
          parent_email: params.student.parentEmail,
          parent_phone: params.student.parentPhone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", studentId)
        .eq("tutor_id", params.tutorId);
    } else {
      // Create new student
      const { data: newStudent, error: studentError } = await adminClient
        .from("students")
        .insert({
          tutor_id: params.tutorId,
          full_name: params.student.fullName,
          email: params.student.email,
          phone: params.student.phone,
          parent_name: params.student.parentName,
          parent_email: params.student.parentEmail,
          parent_phone: params.student.parentPhone,
          source: "booking_page",
        })
        .select("id")
        .single();

      if (studentError || !newStudent) {
        console.error("Failed to create student:", studentError);
        return { error: "Failed to save student information. Please try again." };
      }

      studentId = newStudent.id;
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
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Failed to create booking:", bookingError);
      return { error: "Failed to create booking. Please try again." };
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

    // 6. Fetch tutor profile and service info for emails
    const { data: tutorProfile } = await adminClient
      .from("profiles")
      .select(
        "full_name, email, payment_instructions, venmo_handle, paypal_email, zelle_phone, stripe_payment_link, custom_payment_url, video_provider, zoom_personal_link, google_meet_link, calendly_link, custom_video_url, custom_video_name"
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

    // Success - booking created, student will pay tutor directly
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
    .select("id, tutor_id")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only update your own bookings." };
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      payment_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    console.error("Failed to update booking:", updateError);
    return { error: "Failed to mark booking as paid. Please try again." };
  }

  return { success: true };
}

/**
 * Check if student has available packages for booking
 * Used by public booking page to show package redemption option
 */
export async function checkStudentPackages(params: {
  studentEmail: string;
  tutorId: string;
  durationMinutes: number;
}) {
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
    .select("id, tutor_id, status")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: "Booking not found." };
  }

  if (booking.tutor_id !== user.id) {
    return { error: "You can only cancel your own bookings." };
  }

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

  return { success: true };
}
