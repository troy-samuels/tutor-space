"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
	sendPaymentReceiptEmail,
	sendBookingConfirmationEmail,
	sendBookingPaymentRequestEmail,
} from "@/lib/emails/booking-emails";
import { createCalendarEventForBooking } from "@/lib/calendar/busy-windows";
import { requireTutor } from "./helpers";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { recordAudit } from "@/lib/repositories/audit";

// ============================================================================
// Mark Booking as Paid
// ============================================================================

/**
 * Mark a booking as paid and confirmed.
 * Called by tutor when student has paid via Venmo/PayPal/Zelle/etc.
 */
export async function markBookingAsPaid(bookingId: string) {
	const traceId = await getTraceId();
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { error: "You need to be signed in to update bookings." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "markBookingAsPaid:start", { bookingId });

	// Verify the booking belongs to this tutor
	const { data: booking, error: fetchError } = await supabase
		.from("bookings")
		.select(
			`
				id,
				tutor_id,
				status,
				payment_status,
				scheduled_at,
				timezone,
				payment_amount,
				currency,
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
					email
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
		logStepError(log, "markBookingAsPaid:update_failed", updateError, { bookingId });
		return { error: "Failed to mark booking as paid. Please try again." };
	}

	logStep(log, "markBookingAsPaid:status_updated", { bookingId });

	// Record audit log for manual payment
	await recordAudit(supabase, {
		actorId: user.id,
		targetId: bookingId,
		entityType: "booking",
		actionType: "manual_payment",
		metadata: {
			before: { status: booking.status, payment_status: booking.payment_status },
			after: { status: "confirmed", payment_status: "paid" },
			amount_cents: service?.price_amount ?? booking.payment_amount ?? 0,
			currency: service?.price_currency ?? booking.currency ?? "USD",
		},
	});

	const studentEmail = student?.email;
	const amountCents = booking.payment_amount ?? (service?.price_amount ?? 0);
	const currency = booking.currency ?? service?.price_currency ?? "USD";

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

	try {
		const serviceName = service?.name ?? "Lesson";
		const studentName = student?.full_name ?? "Student";
		const startDate = new Date(booking.scheduled_at);
		const durationMinutes = service?.duration_minutes ?? 60;
		const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

		const descriptionLines = [
			`TutorLingua booking - ${serviceName}`,
			`Student: ${studentName}`,
			`Booking ID: ${bookingId}`,
		];

		await createCalendarEventForBooking({
			tutorId: user.id,
			bookingId,
			title: `${serviceName} with ${studentName}`,
			start: startDate.toISOString(),
			end: endDate.toISOString(),
			description: descriptionLines.join("\n"),
			studentEmail: studentEmail || undefined,
			timezone: booking.timezone ?? "UTC",
		});
	} catch (calendarError) {
		logStepError(log, "markBookingAsPaid:calendar_event_failed", calendarError, { bookingId });
	}

	logStep(log, "markBookingAsPaid:success", { bookingId });
	return { success: true };
}

// ============================================================================
// Send Payment Request
// ============================================================================

/**
 * Send payment request email for a tutor-initiated booking.
 * If tutor has Stripe Connect enabled, generates checkout link and sends payment request email.
 * If no Stripe, sends confirmation email with manual payment instructions.
 */
export async function sendPaymentRequestForBooking(bookingId: string) {
	const traceId = await getTraceId();
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "sendPaymentRequest:start", { bookingId });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "sendPaymentRequest:error", { reason: "admin_client_unavailable" });
		return { error: "Service unavailable." };
	}

	// Fetch booking with student, service, and tutor profile
	const { data: booking, error: fetchError } = await supabase
		.from("bookings")
		.select(`
			id,
			tutor_id,
			scheduled_at,
			duration_minutes,
			timezone,
			payment_amount,
			currency,
			services (
				id,
				name,
				price_amount,
				price_currency
			),
			students (
				id,
				full_name,
				email,
				timezone
			)
		`)
		.eq("id", bookingId)
		.single();

	if (fetchError || !booking) {
		return { error: "Booking not found." };
	}

	if (booking.tutor_id !== user.id) {
		return { error: "You can only send payment requests for your own bookings." };
	}

	const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
	const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;

	if (!student?.email) {
		return { error: "Student email not found." };
	}

	// Get tutor profile for payment settings
	const { data: tutorProfile } = await adminClient
		.from("profiles")
		.select(`
			full_name, email, timezone,
			stripe_account_id, stripe_charges_enabled, stripe_onboarding_status,
			payment_instructions, venmo_handle, paypal_email, zelle_phone,
			stripe_payment_link, custom_payment_url,
			video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link,
			custom_video_url, custom_video_name
		`)
		.eq("id", user.id)
		.single();

	if (!tutorProfile) {
		return { error: "Could not load tutor profile." };
	}

	const serviceName = service?.name ?? "Lesson";
	const paymentAmount = booking.payment_amount ?? service?.price_amount ?? 0;
	const currency = booking.currency ?? service?.price_currency ?? "USD";
	const tutorTimezone = tutorProfile.timezone ?? booking.timezone ?? "UTC";
	const studentTimezone = student.timezone ?? tutorTimezone;

	// Check if Stripe Connect is enabled
	const stripeAccountReady =
		tutorProfile.stripe_charges_enabled === true &&
		tutorProfile.stripe_account_id &&
		tutorProfile.stripe_onboarding_status !== "restricted";

	let paymentUrl: string | undefined;

	// Try to generate Stripe checkout link if Stripe is enabled and there's a price
	if (stripeAccountReady && paymentAmount > 0) {
		try {
			const { createCheckoutSession, getOrCreateStripeCustomer } = await import("@/lib/stripe");

			const stripeCustomer = await getOrCreateStripeCustomer({
				userId: student.id,
				email: student.email,
				name: student.full_name,
			});

			const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
			const stripeCurrency = currency.toLowerCase();

			const session = await createCheckoutSession({
				customerId: stripeCustomer.id,
				priceAmount: paymentAmount,
				currency: stripeCurrency,
				successUrl: `${baseUrl}/book/success?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
				cancelUrl: `${baseUrl}/book/cancelled?booking_id=${bookingId}`,
				metadata: {
					bookingId,
					studentRecordId: student.id,
					tutorId: user.id,
				},
				lineItems: [
					{
						name: serviceName,
						description: `${booking.duration_minutes} minute lesson`,
						amount: paymentAmount,
					},
				],
				transferDestinationAccountId: tutorProfile.stripe_account_id,
			});

			paymentUrl = session.url ?? undefined;

			// Store checkout session ID on booking
			if (session.id) {
				await adminClient
					.from("bookings")
					.update({ stripe_checkout_session_id: session.id })
					.eq("id", bookingId);
			}
		} catch (stripeError) {
			logStepError(log, "sendPaymentRequest:stripe_checkout_failed", stripeError, { bookingId });
			// Fall back to manual payment instructions
		}
	}

	logStep(log, "sendPaymentRequest:sending_email", { bookingId, hasStripeLink: !!paymentUrl });

	// Send appropriate email based on whether we have a payment URL
	if (paymentUrl) {
		// Send payment request email with Stripe checkout link
		await sendBookingPaymentRequestEmail({
			studentName: student.full_name,
			studentEmail: student.email,
			tutorName: tutorProfile.full_name ?? "Your tutor",
			tutorEmail: tutorProfile.email ?? "",
			serviceName,
			scheduledAt: booking.scheduled_at,
			durationMinutes: booking.duration_minutes,
			timezone: studentTimezone,
			amount: paymentAmount / 100, // Convert cents to dollars
			currency,
			paymentUrl,
		});
	} else {
		// No Stripe - send confirmation email with manual payment instructions
		let meetingUrl: string | undefined;
		let meetingProvider: string | undefined;

		switch (tutorProfile.video_provider) {
			case "zoom_personal":
				meetingUrl = tutorProfile.zoom_personal_link ?? undefined;
				meetingProvider = "zoom_personal";
				break;
			case "google_meet":
				meetingUrl = tutorProfile.google_meet_link ?? undefined;
				meetingProvider = "google_meet";
				break;
			case "microsoft_teams":
				meetingUrl = tutorProfile.microsoft_teams_link ?? undefined;
				meetingProvider = "microsoft_teams";
				break;
			case "custom":
				meetingUrl = tutorProfile.custom_video_url ?? undefined;
				meetingProvider = "custom";
				break;
		}

		await sendBookingConfirmationEmail({
			studentName: student.full_name,
			studentEmail: student.email,
			tutorName: tutorProfile.full_name ?? "Your tutor",
			tutorEmail: tutorProfile.email ?? "",
			serviceName,
			scheduledAt: booking.scheduled_at,
			durationMinutes: booking.duration_minutes,
			timezone: studentTimezone,
			amount: paymentAmount / 100,
			currency,
			paymentInstructions: {
				general: tutorProfile.payment_instructions ?? undefined,
				venmoHandle: tutorProfile.venmo_handle ?? undefined,
				paypalEmail: tutorProfile.paypal_email ?? undefined,
				zellePhone: tutorProfile.zelle_phone ?? undefined,
				stripePaymentLink: tutorProfile.stripe_payment_link ?? undefined,
				customPaymentUrl: tutorProfile.custom_payment_url ?? undefined,
			},
			meetingUrl,
			meetingProvider,
			customVideoName: tutorProfile.custom_video_name ?? undefined,
		});
	}

	logStep(log, "sendPaymentRequest:success", { bookingId, hasStripePaymentLink: !!paymentUrl });
	return { success: true, hasStripePaymentLink: !!paymentUrl };
}
