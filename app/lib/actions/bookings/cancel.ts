"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { sendBookingCancelledEmail } from "@/lib/emails/booking-emails";
import { sendTutorCancellationEmail } from "@/lib/emails/ops-emails";
import { deleteCalendarEventsForBooking } from "@/lib/calendar/busy-windows";
import { requireTutor, isCancelledStatus } from "./helpers";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";

// ============================================================================
// Cancel Booking
// ============================================================================

/**
 * Cancel a booking and refund package minutes if applicable.
 * Sends cancellation emails to student and tutor, notifies student in-app,
 * and removes calendar events.
 */
export async function cancelBooking(bookingId: string) {
	const traceId = await getTraceId();
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { error: "You need to be signed in to cancel bookings." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "cancelBooking:start", { bookingId });

	// Verify the booking belongs to this tutor
	const { data: booking, error: fetchError } = await supabase
		.from("bookings")
		.select(
			`
				id,
				tutor_id,
				status,
				scheduled_at,
				duration_minutes,
				timezone,
				services (
					name,
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
		return { error: "You can only cancel your own bookings." };
	}

	const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
	const tutorProfile = Array.isArray(booking.tutor) ? booking.tutor[0] : booking.tutor;
	const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
	const studentName = student?.full_name ?? "Student";
	const serviceName = service?.name ?? "Lesson";
	const durationMinutes = booking.duration_minutes ?? service?.duration_minutes ?? 60;
	const startDate = new Date(booking.scheduled_at);
	const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

	if (isCancelledStatus(booking.status)) {
		return { error: "Booking is already cancelled." };
	}

	// Update booking status
	const { error: updateError } = await supabase
		.from("bookings")
		.update({
			status: "cancelled",
			cancelled_at: new Date().toISOString(),
			cancelled_by: "tutor",
			updated_at: new Date().toISOString(),
		})
		.eq("id", bookingId)
		.eq("tutor_id", user.id);

	if (updateError) {
		logStepError(log, "cancelBooking:update_failed", updateError, { bookingId });
		return { error: "Failed to cancel booking. Please try again." };
	}

	logStep(log, "cancelBooking:status_updated", { bookingId });

	// Refund package minutes if this booking used a package
	const { refundPackageMinutes } = await import("@/lib/actions/packages");
	const refundResult = await refundPackageMinutes(bookingId);

	if (!refundResult.success) {
		logStep(log, "cancelBooking:package_refund_failed", { bookingId, error: refundResult.error });
		// Don't fail the cancellation if refund fails - just log it
	} else {
		logStep(log, "cancelBooking:package_refund_success", { bookingId });
	}

	const { refundSubscriptionLesson } = await import("@/lib/actions/lesson-subscriptions");
	const subscriptionRefund = await refundSubscriptionLesson(bookingId);

	if (!subscriptionRefund.success) {
		logStep(log, "cancelBooking:subscription_refund_failed", { bookingId, error: subscriptionRefund.error });
	} else {
		logStep(log, "cancelBooking:subscription_refund_success", { bookingId });
	}

	const studentEmail = student?.email;
	if (studentEmail) {
		await sendBookingCancelledEmail({
			studentName,
			studentEmail,
			tutorName: tutorProfile?.full_name ?? "Your tutor",
			serviceName,
			scheduledAt: booking.scheduled_at,
			timezone: booking.timezone ?? "UTC",
		});
	}

	try {
		await sendTutorCancellationEmail({
			tutorEmail: tutorProfile?.email ?? null,
			tutorName: tutorProfile?.full_name ?? "Tutor",
			studentName,
			serviceName,
			scheduledAt: booking.scheduled_at,
			timezone: booking.timezone ?? "UTC",
			rescheduleUrl: `${(process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co").replace(/\/$/, "")}/bookings`,
		});
	} catch (emailError) {
		logStepError(log, "cancelBooking:tutor_email_failed", emailError, { bookingId });
	}

	// Send in-app notification to student about cancellation
	// Need to get student's user_id if they have an account
	const adminClient = createServiceRoleClient();
	if (adminClient && student) {
		try {
			const { data: studentRecord } = await adminClient
				.from("students")
				.select("user_id")
				.eq("email", student.email)
				.eq("tutor_id", user.id)
				.single();

			if (studentRecord?.user_id) {
				const { notifyBookingCancelled } = await import("@/lib/actions/notifications");
				await notifyBookingCancelled({
					userId: studentRecord.user_id,
					userRole: "student",
					otherPartyName: tutorProfile?.full_name ?? "Your tutor",
					serviceName,
					scheduledAt: booking.scheduled_at,
					bookingId,
				});
			}
		} catch (notificationError) {
			logStepError(log, "cancelBooking:notification_failed", notificationError, { bookingId });
		}
	}

	try {
		await deleteCalendarEventsForBooking({
			tutorId: user.id,
			bookingId,
			match: {
				title: `${serviceName} with ${studentName}`,
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
		});
		logStep(log, "cancelBooking:calendar_event_deleted", { bookingId });
	} catch (calendarError) {
		logStepError(log, "cancelBooking:calendar_delete_failed", calendarError, { bookingId });
	}

	revalidatePath("/bookings");
	revalidatePath("/calendar");
	revalidatePath("/student/bookings");

	logStep(log, "cancelBooking:success", { bookingId });
	return { success: true };
}
