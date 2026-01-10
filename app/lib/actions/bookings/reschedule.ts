"use server";

import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import { sendBookingRescheduledEmails } from "@/lib/emails/ops-emails";
import { getCalendarBusyWindowsWithStatus, updateCalendarEventForBooking } from "@/lib/calendar/busy-windows";
import { checkBookingLimits } from "./helpers";
import { MAX_RESCHEDULES, isCancelledStatus, checkAdvanceBookingWindow } from "./types";
import { recordAudit } from "@/lib/repositories/audit";
import {
	getBookingForReschedule,
	getFullTutorProfileForBooking,
	getTutorAvailability,
	findFutureBookingsForTutor,
	updateBookingSchedule,
} from "@/lib/repositories/bookings";
import type { BookingRecord } from "./types";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import { isClassroomUrl, resolveBookingMeetingUrl, tutorHasStudioAccess } from "@/lib/utils/classroom-links";
import { buildBookingCalendarDetails } from "@/lib/calendar/booking-calendar-details";

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

	// Fetch booking with student + service context for authorization and defaults (using repository)
	const booking = await getBookingForReschedule(adminClient, params.bookingId);

	if (!booking) {
		logStep(log, "rescheduleBooking:booking_not_found", { bookingId: params.bookingId });
		return { error: "Booking not found." };
	}
	logStep(log, "rescheduleBooking:booking_fetched", { bookingId: params.bookingId, status: booking.status });
	const bookingRecord = booking as unknown as Record<string, unknown>;

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

	// Parallelize all 4 independent fetches for performance using repository functions
	const [
		tutorProfile,
		availability,
		existingBookings,
		busyResult,
		blockedTimes
	] = await Promise.all([
		getFullTutorProfileForBooking(adminClient, booking.tutor_id),
		getTutorAvailability(adminClient, booking.tutor_id),
		findFutureBookingsForTutor(adminClient, booking.tutor_id, params.bookingId),
		getCalendarBusyWindowsWithStatus({
			tutorId: booking.tutor_id,
			start: new Date(params.newStart),
			days: 60,
		}),
		adminClient
			.from("blocked_times")
			.select("start_time, end_time")
			.eq("tutor_id", booking.tutor_id)
			.lt("start_time", addDays(new Date(params.newStart), 2).toISOString())
			.gt("end_time", addDays(new Date(params.newStart), -1).toISOString()),
	]);

	const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
	const tutorTimezone = tutorProfile?.timezone || booking.timezone || params.timezone || "UTC";

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

	const busyWindows = [
		...busyResult.windows,
		...(blockedTimes.data ?? [])
			.filter((block) => block.start_time && block.end_time)
			.map((block) => ({ start: block.start_time as string, end: block.end_time as string })),
	];

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

	const bookingWindow = checkAdvanceBookingWindow({
		tutorProfile: tutorProfile ?? {},
		scheduledAt: params.newStart,
		timezone: tutorTimezone,
	});

	if ("error" in bookingWindow) {
		return { error: bookingWindow.error };
	}

	const bookingLimits = await checkBookingLimits({
		adminClient,
		tutorId: booking.tutor_id,
		tutorProfile: tutorProfile ?? {},
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

	// Update booking using repository function
	let updated: BookingRecord;
	try {
		const rawUpdated = await updateBookingSchedule(
			adminClient,
			params.bookingId,
			params.newStart,
			durationMinutes,
			tutorTimezone,
			{
				rescheduleCount: (booking.reschedule_count ?? 0) + 1,
				requestedBy,
				reason: params.reason,
			}
		);
		updated = rawUpdated as unknown as BookingRecord;
	} catch (updateError) {
		logStepError(log, "rescheduleBooking:update_failed", updateError, { bookingId: params.bookingId });
		return { error: "Could not reschedule this booking. Please try again." };
	}
	logStep(log, "rescheduleBooking:booking_updated", { bookingId: params.bookingId, newStart: params.newStart });

	// Record audit log for booking reschedule
	await recordAudit(adminClient, {
		actorId: user?.id ?? booking.tutor_id,
		targetId: params.bookingId,
		entityType: "booking",
		actionType: "update",
		metadata: {
			before: { scheduledAt: previousSchedule.scheduledAt },
			after: { scheduledAt: params.newStart },
			requestedBy: params.requestedBy ?? (isTutor ? "tutor" : "student"),
			rescheduleCount: (booking.reschedule_count ?? 0) + 1,
			reason: params.reason,
		},
	});

	try {
		const updatedStudent = Array.isArray(updated.students) ? updated.students[0] : updated.students;
		const updatedService = Array.isArray(updated.services) ? updated.services[0] : updated.services;
		const tutorHasStudio = tutorHasStudioAccess({
			tier: tutorProfile?.tier ?? null,
			plan: tutorProfile?.plan ?? null,
		});
		const resolvedMeetingUrl = resolveBookingMeetingUrl({
			meetingUrl: updated.meeting_url ?? previousSchedule.meetingUrl,
			bookingId: updated.id,
			shortCode: updated.short_code,
			baseUrl: appUrl,
			tutorHasStudio,
			allowClassroomFallback: true,
		});
		const resolvedMeetingProvider = resolvedMeetingUrl
			? updated.meeting_provider ??
				previousSchedule.meetingProvider ??
				(isClassroomUrl(resolvedMeetingUrl) ? "livekit" : undefined)
			: undefined;

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
			meetingUrl: resolvedMeetingUrl,
			meetingProvider: resolvedMeetingProvider,
			rescheduleUrl: `${appUrl.replace(/\/$/, "")}/bookings`,
		});
	} catch (emailError) {
		logStepError(log, "rescheduleBooking:email_failed", emailError, { bookingId: params.bookingId });
	}

	try {
		const previousStart = new Date(previousSchedule.scheduledAt);
		const previousEnd = new Date(
			previousStart.getTime() + (previousSchedule.durationMinutes ?? durationMinutes) * 60000
		);
		const calendarDetails = await buildBookingCalendarDetails({
			client: adminClient,
			bookingId: updated.id,
			baseUrl: appUrl,
		});

		if (calendarDetails) {
			await updateCalendarEventForBooking({
				tutorId: calendarDetails.tutorId,
				bookingId: calendarDetails.bookingId,
				title: calendarDetails.title,
				start: calendarDetails.start,
				end: calendarDetails.end,
				previousStart: previousStart.toISOString(),
				previousEnd: previousEnd.toISOString(),
				description: calendarDetails.description,
				location: calendarDetails.location ?? undefined,
				studentEmail: calendarDetails.studentEmail ?? undefined,
				timezone: calendarDetails.timezone,
				createIfMissing: updated.status === "confirmed" || updated.status === "completed",
			});
		}
	} catch (calendarError) {
		logStepError(log, "rescheduleBooking:calendar_update_failed", calendarError, { bookingId: params.bookingId });
	}

	revalidatePath("/bookings");
	revalidatePath("/calendar");
	revalidatePath("/student/bookings");

	logStep(log, "rescheduleBooking:success", { bookingId: params.bookingId, newStart: params.newStart });
	return { success: true, booking: updated };
}
