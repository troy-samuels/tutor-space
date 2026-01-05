"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import { sendBookingRescheduledEmails } from "@/lib/emails/ops-emails";
import { getCalendarBusyWindowsWithStatus, updateCalendarEventForBooking } from "@/lib/calendar/busy-windows";
import { MAX_RESCHEDULES, isCancelledStatus, checkAdvanceBookingWindow, checkBookingLimits } from "./helpers";
import type { BookingRecord } from "./types";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";

// ============================================================================
// Reschedule Booking
// ============================================================================

/**
 * Move a booking to a new time (tutor or student initiated).
 * - Tutors can reschedule their own bookings
 * - Students can reschedule their own bookings when linked to the booking record
 *
 * Validates availability, booking limits, and calendar conflicts before updating.
 * Sends reschedule notification emails and updates calendar events.
 */
export async function rescheduleBooking(params: {
	bookingId: string;
	newStart: string;
	durationMinutes?: number;
	timezone?: string;
	requestedBy?: "tutor" | "student";
	reason?: string | null;
}) {
	const traceId = await getTraceId();
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

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "rescheduleBooking:start", {
		bookingId: params.bookingId,
		newStart: params.newStart,
	});

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
			reschedule_count,
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
		logStep(log, "rescheduleBooking:booking_not_found", { bookingId: params.bookingId });
		return { error: "Booking not found." };
	}
	logStep(log, "rescheduleBooking:booking_fetched", { bookingId: params.bookingId, status: booking.status });
	const bookingRecord: Record<string, unknown> = booking;

	const studentUserId = Array.isArray(bookingRecord.students)
		? (bookingRecord.students[0] as { user_id?: string })?.user_id
		: (bookingRecord.students as { user_id?: string })?.user_id;

	const isTutor = booking.tutor_id === user.id;
	const isStudent = studentUserId === user.id;

	if (!isTutor && !isStudent) {
		return { error: "You are not allowed to move this booking." };
	}

	if (isCancelledStatus(booking.status)) {
		return { error: "Cannot reschedule a cancelled booking." };
	}

	if (booking.status === "completed") {
		return { error: "Cannot reschedule a completed booking." };
	}

	if (new Date(booking.scheduled_at) < new Date()) {
		return { error: "Cannot reschedule a past booking." };
	}

	if ((booking.reschedule_count ?? 0) >= MAX_RESCHEDULES) {
		return { error: `Maximum reschedules (${MAX_RESCHEDULES}) reached.` };
	}

	const { data: tutorProfile } = await adminClient
		.from("profiles")
		.select("buffer_time_minutes, timezone, full_name, email, advance_booking_days_min, advance_booking_days_max, max_lessons_per_day, max_lessons_per_week")
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

	const busyResult = await getCalendarBusyWindowsWithStatus({
		tutorId: booking.tutor_id,
		start: new Date(params.newStart),
		days: 60,
	});

	if (busyResult.unverifiedProviders.length) {
		logStep(log, "rescheduleBooking:calendar_unverified", { providers: busyResult.unverifiedProviders });
		return {
			error:
				"We couldn't verify your external calendar. Please refresh and try again, or reconnect your calendar.",
		};
	}

	if (busyResult.staleProviders.length) {
		logStep(log, "rescheduleBooking:calendar_stale", { providers: busyResult.staleProviders });
		return {
			error:
				"External calendar sync looks stale. Please refresh your calendar connection before rescheduling.",
		};
	}

	const busyWindows = busyResult.windows;

	const servicesData = bookingRecord.services as
		| { duration_minutes?: number }
		| Array<{ duration_minutes?: number }>
		| null;
	const serviceDuration = Array.isArray(servicesData)
		? servicesData[0]?.duration_minutes
		: servicesData?.duration_minutes;

	const durationMinutes =
		params.durationMinutes ??
		(bookingRecord.duration_minutes as number | undefined) ??
		serviceDuration ??
		60;

	const previousSchedule = {
		scheduledAt: booking.scheduled_at,
		timezone: booking.timezone || tutorTimezone,
		durationMinutes:
			(bookingRecord.duration_minutes as number | undefined) || serviceDuration || durationMinutes,
		meetingUrl: booking.meeting_url ?? null,
		meetingProvider: booking.meeting_provider ?? null,
	};
	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
	const requestedBy = params.requestedBy ?? (isTutor ? "tutor" : "student");

	const bookingWindow = await checkAdvanceBookingWindow({
		adminClient,
		tutorId: booking.tutor_id,
		scheduledAt: params.newStart,
		timezone: tutorTimezone,
	});

	if ("error" in bookingWindow) {
		return { error: bookingWindow.error };
	}

	const bookingLimits = await checkBookingLimits({
		adminClient,
		tutorId: booking.tutor_id,
		scheduledAt: params.newStart,
		timezone: tutorTimezone,
		excludeBookingId: params.bookingId,
	});

	if ("error" in bookingLimits) {
		return { error: bookingLimits.error };
	}

	const validation = validateBooking({
		scheduledAt: params.newStart,
		durationMinutes,
		availability: availability || [],
		existingBookings: existingBookings || [],
		bufferMinutes,
		busyWindows,
		timezone: tutorTimezone,
	});

	if (!validation.isValid) {
		logStep(log, "rescheduleBooking:validation_failed", { errors: validation.errors });
		return { error: validation.errors.join(" ") };
	}
	logStep(log, "rescheduleBooking:validation_passed", { newStart: params.newStart, durationMinutes });

	const { data: updated, error: updateError } = await adminClient
		.from("bookings")
		.update({
			scheduled_at: params.newStart,
			duration_minutes: durationMinutes,
			timezone: tutorTimezone,
			reschedule_count: (booking.reschedule_count ?? 0) + 1,
			reschedule_requested_at: new Date().toISOString(),
			reschedule_requested_by: requestedBy,
			reschedule_reason: params.reason ?? null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", params.bookingId)
		.select("*, students(full_name, email), services(name)")
		.single<BookingRecord>();

	if (updateError || !updated) {
		logStepError(log, "rescheduleBooking:update_failed", updateError, { bookingId: params.bookingId });
		return { error: "Could not reschedule this booking. Please try again." };
	}
	logStep(log, "rescheduleBooking:booking_updated", { bookingId: params.bookingId, newStart: params.newStart });

	try {
		const updatedStudent = Array.isArray(updated.students) ? updated.students[0] : updated.students;
		const updatedService = Array.isArray(updated.services) ? updated.services[0] : updated.services;

		await sendBookingRescheduledEmails({
			studentEmail: updatedStudent?.email,
			tutorEmail: tutorProfile?.email,
			studentName: updatedStudent?.full_name ?? "Student",
			tutorName: tutorProfile?.full_name ?? "Your tutor",
			serviceName: updatedService?.name ?? "Lesson",
			oldScheduledAt: previousSchedule.scheduledAt,
			newScheduledAt: updated.scheduled_at,
			timezone: updated.timezone ?? tutorTimezone,
			durationMinutes: updated.duration_minutes ?? durationMinutes,
			meetingUrl: updated.meeting_url ?? previousSchedule.meetingUrl ?? undefined,
			meetingProvider: updated.meeting_provider ?? previousSchedule.meetingProvider ?? undefined,
			rescheduleUrl: `${appUrl.replace(/\/$/, "")}/bookings`,
		});
	} catch (emailError) {
		logStepError(log, "rescheduleBooking:email_failed", emailError, { bookingId: params.bookingId });
	}

	try {
		const updatedStudent = Array.isArray(updated.students) ? updated.students[0] : updated.students;
		const updatedService = Array.isArray(updated.services) ? updated.services[0] : updated.services;
		const studentName = updatedStudent?.full_name ?? "Student";
		const serviceName = updatedService?.name ?? "Lesson";
		const startDate = new Date(updated.scheduled_at);
		const previousStart = new Date(previousSchedule.scheduledAt);
		const previousEnd = new Date(
			previousStart.getTime() + (previousSchedule.durationMinutes ?? durationMinutes) * 60000
		);
		const endDate = new Date(
			startDate.getTime() + (updated.duration_minutes ?? durationMinutes) * 60000
		);

		const descriptionLines = [
			`TutorLingua booking - ${serviceName}`,
			`Student: ${studentName}`,
			`Booking ID: ${updated.id}`,
		];

		await updateCalendarEventForBooking({
			tutorId: booking.tutor_id,
			bookingId: updated.id,
			title: `${serviceName} with ${studentName}`,
			start: startDate.toISOString(),
			end: endDate.toISOString(),
			previousStart: previousStart.toISOString(),
			previousEnd: previousEnd.toISOString(),
			description: descriptionLines.join("\n"),
			studentEmail: updatedStudent?.email ?? undefined,
			timezone: updated.timezone ?? tutorTimezone,
			createIfMissing: updated.status === "confirmed" || updated.status === "completed",
		});
	} catch (calendarError) {
		logStepError(log, "rescheduleBooking:calendar_update_failed", calendarError, { bookingId: params.bookingId });
	}

	revalidatePath("/bookings");
	revalidatePath("/calendar");
	revalidatePath("/student/bookings");

	logStep(log, "rescheduleBooking:success", { bookingId: params.bookingId, newStart: params.newStart });
	return { success: true, booking: updated };
}
