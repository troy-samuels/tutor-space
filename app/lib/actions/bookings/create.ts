"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { addMinutes } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { validateBooking } from "@/lib/utils/booking-conflicts";
import { validateServicePricing } from "@/lib/utils/booking-validation";
import {
	sendBookingConfirmationEmail,
	sendTutorBookingNotificationEmail,
	sendBookingPaymentRequestEmail,
} from "@/lib/emails/booking-emails";
import { ServerActionLimiters } from "@/lib/middleware/rate-limit";
import { createCalendarEventForBooking, getCalendarBusyWindowsWithStatus } from "@/lib/calendar/busy-windows";
import { buildBookingCalendarDetails } from "@/lib/calendar/booking-calendar-details";
import { isTableMissing } from "@/lib/utils/supabase-errors";
import { recordAudit } from "@/lib/repositories/audit";
import {
	requireTutor,
	ensureConversationThread,
	checkBookingLimits,
} from "./helpers";
import type { BookingRecord, ManualBookingInput, TutorProfileData } from "./types";
import { checkAdvanceBookingWindow } from "./types";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
	sanitizeInput,
	enrichError,
	type Logger,
} from "@/lib/logger";
import { withIdempotency } from "@/lib/utils/idempotency";
import {
	findBookingsInTimeRange,
	getTutorProfileBookingSettings,
	getFullTutorProfileForBooking,
	getActiveServiceForTutor,
	getTutorAvailability,
	getOrCreateStudent,
	getStudentById,
	getStudentByEmail,
	getStudentTutorConnection,
	upsertStudentTutorConnection,
	insertBookingAtomic,
	updateBookingMeetingUrl,
	updateBookingCheckoutSession,
	updateBookingShortCode,
	hardDeleteBooking,
	getBookingWithDetails,
	getServiceWithTutorProfile,
	getBookingPrerequisites,
	createStudentWithConnection,
	checkPostInsertConflict,
	getStudentStripeInfo,
	updateStudentStripeCustomerId,
	type CreateBookingInput as RepositoryCreateBookingInput,
	type FullTutorProfile,
} from "@/lib/repositories/bookings";
import { generateUniqueShortCode } from "@/lib/utils/short-code";
import { buildClassroomUrl, tutorHasStudioAccess } from "@/lib/utils/classroom-links";

// ============================================================================
// Internal Input Type for createBooking
// ============================================================================

type CreateBookingInput = {
	service_id: string | null;
	student_id: string;
	scheduled_at: string;
	duration_minutes: number;
	timezone: string;
	notes?: string;
	skipAdvanceBookingCheck?: boolean; // Skip validation for tutor-initiated bookings
};

// ============================================================================
// Create Booking (Tutor-Initiated)
// ============================================================================

/**
 * Create a booking for a tutor-initiated booking.
 * Used from the calendar/bookings page when a tutor creates a booking manually.
 */
export async function createBooking(input: CreateBookingInput) {
	const traceId = await getTraceId();
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { error: "You need to be signed in to create bookings." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "createBooking:start", {
		serviceId: input.service_id,
		studentId: input.student_id,
		scheduledAt: input.scheduled_at,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "createBooking:error", { reason: "admin_client_unavailable" });
		return { error: "Service unavailable. Please try again." };
	}

	// CONFLICT VALIDATION: Check for overlapping bookings before insert
	// This prevents double-booking the same timeslot
	const initialBookingStart = new Date(input.scheduled_at);
	const initialBookingEnd = new Date(
		initialBookingStart.getTime() + input.duration_minutes * 60 * 1000
	);

	let existingBookings: Awaited<ReturnType<typeof findBookingsInTimeRange>>;
	try {
		existingBookings = await findBookingsInTimeRange(adminClient, user.id, initialBookingStart);
	} catch (error) {
		logStepError(log, "createBooking:conflict_check_failed", error, {});
		return { error: "Could not verify availability. Please try again." };
	}

	const hasConflict = existingBookings.some((existing) => {
		const existingStart = new Date(existing.scheduled_at);
		const existingEnd = new Date(
			existingStart.getTime() + existing.duration_minutes * 60 * 1000
		);
		// Check if time ranges overlap
		return initialBookingStart < existingEnd && initialBookingEnd > existingStart;
	});

	if (hasConflict) {
		return {
			error:
				"This time slot conflicts with an existing booking. Please select a different time.",
		};
	}

	let tutorProfile: Awaited<ReturnType<typeof getTutorProfileBookingSettings>>;
	try {
		tutorProfile = await getTutorProfileBookingSettings(adminClient, user.id);
	} catch (error) {
		logStepError(log, "createBooking:profile_fetch_failed", error, {});
		return { error: "Could not load tutor settings. Please try again." };
	}

	const tutorTimezone = tutorProfile?.timezone || input.timezone || "UTC";

	// Only check advance booking window if not explicitly skipped (tutor-initiated bookings skip this)
	if (!input.skipAdvanceBookingCheck) {
		const bookingWindow = checkAdvanceBookingWindow({
			tutorProfile: tutorProfile ?? {},
			scheduledAt: input.scheduled_at,
			timezone: tutorTimezone,
		});

		if ("error" in bookingWindow) {
			return { error: bookingWindow.error };
		}
	}

	const bookingLimits = await checkBookingLimits({
		adminClient,
		tutorId: user.id,
		tutorProfile: tutorProfile ?? {},
		scheduledAt: input.scheduled_at,
		timezone: tutorTimezone,
	});

	if ("error" in bookingLimits) {
		return { error: bookingLimits.error };
	}

	const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
	const bookingStart = new Date(input.scheduled_at);
	const bookingEnd = addMinutes(bookingStart, input.duration_minutes);
	const blockedStart = addMinutes(bookingStart, -bufferMinutes);
	const blockedEnd = addMinutes(bookingEnd, bufferMinutes);

	const [availability, busyResult, blockedTimesResult] = await Promise.all([
		getTutorAvailability(adminClient, user.id),
		getCalendarBusyWindowsWithStatus({
			tutorId: user.id,
			start: bookingStart,
			days: 60,
		}),
		adminClient
			.from("blocked_times")
			.select("start_time, end_time")
			.eq("tutor_id", user.id)
			.lt("start_time", blockedEnd.toISOString())
			.gt("end_time", blockedStart.toISOString()),
	]);

	if (busyResult.unverifiedProviders.length) {
		return {
			error:
				"We couldn't verify your external calendar. Please refresh the page or reconnect your calendar and try again.",
		};
	}

	if (busyResult.staleProviders.length) {
		return {
			error:
				"External calendar sync looks stale. Please open Calendar settings to refresh the connection before booking.",
		};
	}

	const busyWindows = [
		...busyResult.windows,
		...(blockedTimesResult.data ?? [])
			.filter((block) => block.start_time && block.end_time)
			.map((block) => ({ start: block.start_time as string, end: block.end_time as string })),
	];

	const validation = validateBooking({
		scheduledAt: input.scheduled_at,
		durationMinutes: input.duration_minutes,
		availability: availability || [],
		existingBookings: existingBookings || [],
		bufferMinutes,
		busyWindows,
		timezone: tutorTimezone,
	});

	if (!validation.isValid) {
		return { error: validation.errors.join(" ") };
	}

	// Create the booking atomically to avoid race conditions (repository)
	let booking: { id: string; created_at: string };
	try {
		booking = await insertBookingAtomic(adminClient, {
			tutorId: user.id,
			studentId: input.student_id,
			serviceId: input.service_id,
			scheduledAt: input.scheduled_at,
			durationMinutes: input.duration_minutes,
			timezone: tutorTimezone,
			status: "confirmed",
			paymentStatus: "unpaid",
			paymentAmount: 0,
			currency: null,
			studentNotes: input.notes ?? null,
		});
	} catch (bookingError) {
		const err = bookingError as { code?: string };
		if (err?.code === "P0001" || err?.code === "23P01") {
			return {
				error:
					"This time slot was just booked. Please refresh and select a different time.",
			};
		}

		if (err?.code === "P0002") {
			return { error: "This time window is blocked by the tutor." };
		}

		if (err?.code === "55P03") {
			return { error: "Please retry booking; the tutor calendar is busy right now." };
		}

		logStepError(log, "createBooking:rpc_failed", bookingError, {
			studentId: input.student_id,
			serviceId: input.service_id,
		});
		return { error: "We couldn't save that booking. Please try again." };
	}

	logStep(log, "createBooking:booking_created", { bookingId: booking.id });

	// Generate and save memorable short code for classroom URL
	let bookingShortCode: string | null = null;
	try {
		const shortCode = await generateUniqueShortCode(adminClient);
		await updateBookingShortCode(adminClient, booking.id, shortCode);
		bookingShortCode = shortCode;
		logStep(log, "createBooking:short_code_created", { bookingId: booking.id, shortCode });
	} catch (shortCodeError) {
		// Non-blocking - booking still works with full ID
		logStepError(log, "createBooking:short_code_failed", shortCodeError, { bookingId: booking.id });
	}

	// Set LiveKit classroom URL for Studio tier tutors
	const tutorHasStudio = tutorHasStudioAccess({
		tier: tutorProfile?.tier ?? null,
		plan: tutorProfile?.plan ?? null,
	});
	if (tutorHasStudio) {
		try {
			const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
			const meetingUrl = buildClassroomUrl(booking.id, bookingShortCode, appUrl);
			await updateBookingMeetingUrl(adminClient, booking.id, user.id, meetingUrl, "livekit");
			logStep(log, "createBooking:meeting_url_set", { bookingId: booking.id, meetingUrl });
		} catch (meetingUrlError) {
			// Non-blocking - booking still works without pre-set meeting URL
			logStepError(log, "createBooking:meeting_url_failed", meetingUrlError, { bookingId: booking.id });
		}
	}

	// Post-insert conflict check (first-come-first-serve) in case of concurrent inserts
	const postInsertStart = new Date(input.scheduled_at);
	const postInsertEnd = new Date(postInsertStart.getTime() + input.duration_minutes * 60 * 1000);

	let conflictingBookings: Awaited<ReturnType<typeof findBookingsInTimeRange>>;
	try {
		conflictingBookings = await findBookingsInTimeRange(adminClient, user.id, postInsertStart, booking.id);
	} catch (error) {
		logStepError(log, "createBooking:post_insert_check_failed", error, { bookingId: booking.id });
		conflictingBookings = [];
	}

	const hasPostInsertConflict = conflictingBookings.some((existing) => {
		const existingStart = new Date(existing.scheduled_at);
		const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);
		return postInsertStart < existingEnd && postInsertEnd > existingStart && new Date(existing.created_at ?? "") < new Date(booking.created_at);
	});

	if (hasPostInsertConflict) {
		try {
			await hardDeleteBooking(adminClient, booking.id, user.id);
		} catch (deleteError) {
			logStepError(log, "createBooking:rollback_delete_failed", deleteError, { bookingId: booking.id });
		}
		return {
			error:
				"This time slot was just booked. Please refresh and select a different time.",
		};
	}

	let data: BookingRecord | null;
	try {
		const bookingDetails = await getBookingWithDetails(adminClient, booking.id, user.id);
		data = bookingDetails as unknown as BookingRecord;
	} catch (fetchError) {
		logStepError(log, "createBooking:fetch_details_failed", fetchError, { bookingId: booking.id });
		return { error: "We couldn't load the new booking. Please try again." };
	}

	if (!data) {
		return { error: "We couldn't load the new booking. Please try again." };
	}

	try {
		const calendarDetails = await buildBookingCalendarDetails({
			client: adminClient,
			bookingId: data.id,
			baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		});

		if (calendarDetails) {
			await createCalendarEventForBooking({
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
		}
		logStep(log, "createBooking:calendar_event_created", { bookingId: data.id });
	} catch (calendarError) {
		logStepError(log, "createBooking:calendar_event_failed", calendarError, { bookingId: data.id });
	}

	const sanitizedBooking = sanitizeInput(data) as Record<string, unknown>;

	// Record audit log for booking creation
	await recordAudit(adminClient, {
		actorId: user.id,
		targetId: data.id,
		entityType: "booking",
		actionType: "create",
		beforeState: null,
		afterState: sanitizedBooking,
		metadata: {
			studentId: data.student_id,
			scheduledAt: data.scheduled_at,
			durationMinutes: data.duration_minutes,
			serviceId: data.service_id,
			source: "tutor_dashboard",
		},
	});

	logStep(log, "createBooking:success", { bookingId: data.id });
	return { data };
}

// ============================================================================
// Create Booking and Checkout (Public Booking Flow)
// ============================================================================

/**
 * Create a booking for public booking flow with optional Stripe Connect payment.
 * If tutor has Stripe Connect enabled, creates a checkout session.
 * Otherwise falls back to manual payment instructions.
 * This is called from the public booking page (no auth required).
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
	subscriptionId?: string; // Optional: Use subscription credit instead of payment
	clientMutationId?: string; // Optional: Idempotency key to prevent duplicate bookings
}): Promise<
	| { error: string }
	| { success: true; bookingId: string; checkoutUrl?: string | null }
> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, params.tutorId);

	logStep(log, "createBookingAndCheckout:start", {
		serviceId: params.serviceId,
		scheduledAt: params.scheduledAt,
		studentEmail: params.student.email,
		hasPackage: !!params.packageId,
		hasSubscription: !!params.subscriptionId,
	});

	// Rate limit public booking requests to prevent abuse
	const headersList = await headers();
	const rateLimitResult = await ServerActionLimiters.booking(headersList);
	if (!rateLimitResult.success) {
		logStep(log, "createBookingAndCheckout:rate_limited", {});
		return { error: rateLimitResult.error || "Too many booking attempts. Please try again later." };
	}

	const supabase = await createClient();
	const adminClient = createServiceRoleClient();

	if (!adminClient) {
		logStep(log, "createBookingAndCheckout:error", { reason: "admin_client_unavailable" });
		return { error: "Service unavailable. Please try again later." };
	}

	// Use atomic idempotency wrapper to prevent duplicate bookings
	const { withIdempotency } = await import("@/lib/utils/idempotency");
	const { cached, response } = await withIdempotency(
		adminClient,
		params.clientMutationId,
		async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			try {
		// Group 1: Parallelize serviceRecord + FULL tutorProfile fetch (repository)
		const { service: serviceRecord, tutorProfile } = await getServiceWithTutorProfile(
			adminClient,
			params.serviceId,
			params.tutorId
		);

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
		const serviceDurationMinutes =
			serviceRecord.duration_minutes || params.durationMinutes || 60;
		const serviceName = serviceRecord.name ?? "Lesson";

		const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
		const tutorTimezone = tutorProfile?.timezone || params.timezone;
		const bookingStart = new Date(params.scheduledAt);
		const bookingEnd = addMinutes(bookingStart, serviceDurationMinutes);
		const blockedStart = addMinutes(bookingStart, -bufferMinutes);
		const blockedEnd = addMinutes(bookingEnd, bufferMinutes);

		const bookingWindow = checkAdvanceBookingWindow({
			tutorProfile: tutorProfile ?? {},
			scheduledAt: params.scheduledAt,
			timezone: tutorTimezone,
		});

		if ("error" in bookingWindow) {
			return { error: bookingWindow.error };
		}

		const bookingLimits = await checkBookingLimits({
			adminClient,
			tutorId: params.tutorId,
			tutorProfile: tutorProfile ?? {},
			scheduledAt: params.scheduledAt,
			timezone: tutorTimezone,
		});

		if ("error" in bookingLimits) {
			return { error: bookingLimits.error };
		}

		// Group 2: Parallelize prerequisites and calendar busy windows (repository)
		const [prerequisites, busyResult, blockedTimesResult] = await Promise.all([
			getBookingPrerequisites(adminClient, params.tutorId, params.student.email),
			getCalendarBusyWindowsWithStatus({
				tutorId: params.tutorId,
				start: new Date(params.scheduledAt),
				days: 60,
			}),
			adminClient
				.from("blocked_times")
				.select("start_time, end_time")
				.eq("tutor_id", params.tutorId)
				.lt("start_time", blockedEnd.toISOString())
				.gt("end_time", blockedStart.toISOString()),
		]);

		const { availability, existingBookings, existingStudent } = prerequisites;

		if (busyResult.unverifiedProviders.length) {
			return {
				error:
					"We couldn't verify your external calendar. Please refresh the page or reconnect your calendar and try again.",
			};
		}

		if (busyResult.staleProviders.length) {
			return {
				error:
					"External calendar sync looks stale. Please open Calendar settings to refresh the connection before booking.",
			};
		}

		const busyWindows = [
			...busyResult.windows,
			...(blockedTimesResult.data ?? [])
				.filter((block) => block.start_time && block.end_time)
				.map((block) => ({ start: block.start_time as string, end: block.end_time as string })),
		];

		// 3. Validate the booking
		const validation = validateBooking({
			scheduledAt: params.scheduledAt,
			durationMinutes: serviceRecord.duration_minutes,
			availability: availability || [],
			existingBookings: existingBookings || [],
			bufferMinutes,
			busyWindows,
			timezone: tutorTimezone,
		});

		if (!validation.isValid) {
			return { error: validation.errors.join(" ") };
		}

		// 4. Enforce student status - only active/trial students can book
		if (existingStudent) {
			const blockedStatuses = ["paused", "alumni", "inactive", "suspended"];
			if (blockedStatuses.includes(existingStudent.status)) {
				return {
					error: `Your account status is "${existingStudent.status}". Please contact your tutor to reactivate your account before booking.`,
				};
			}
		}

		// 4a. Create or update student with connection management (repository)
		let studentId: string;
		let studentProfileId: string | null;

		try {
			const studentResult = await createStudentWithConnection(
				adminClient,
				params.tutorId,
				{
					email: params.student.email,
					fullName: params.student.fullName,
					phone: params.student.phone,
					timezone: params.student.timezone,
					parentName: params.student.parentName,
					parentEmail: params.student.parentEmail,
					parentPhone: params.student.parentPhone,
				},
				{
					studentUserId: user?.id ?? null,
					autoApprove: !!user?.id,
				}
			);
			studentId = studentResult.studentId;
			studentProfileId = studentResult.studentProfileId;
		} catch (studentError) {
			logStepError(log, "createBookingAndCheckout:student_create_failed", studentError, {
				studentEmail: params.student.email,
			});
			return { error: "Failed to save student information. Please try again." };
		}

		// Ensure conversation thread exists
		await ensureConversationThread(adminClient, params.tutorId, studentId);

		// 5. Create booking record atomically to avoid race conditions (repository)
		// If packageId or subscriptionId provided, booking will be confirmed immediately
		const usingCredit = !!(params.packageId || params.subscriptionId);

		let booking: { id: string; created_at: string };
		try {
			booking = await insertBookingAtomic(adminClient, {
				tutorId: params.tutorId,
				studentId,
				serviceId: params.serviceId,
				scheduledAt: params.scheduledAt,
				durationMinutes: serviceRecord.duration_minutes,
				timezone: tutorTimezone,
				status: usingCredit ? "confirmed" : "pending",
				paymentStatus: usingCredit ? "paid" : "unpaid",
				paymentAmount: normalizedPriceCents,
				currency: serviceCurrency,
				studentNotes: params.notes,
			});
		} catch (bookingError) {
			const err = bookingError as { code?: string };
			if (err?.code === "P0001") {
				return {
					error: "This time slot was just booked. Please select a different time.",
				};
			}

			if (err?.code === "P0002") {
				return {
					error: "This time window is blocked by the tutor.",
				};
			}

			if (err?.code === "55P03") {
				return {
					error: "Please retry booking; the tutor calendar is busy right now.",
				};
			}

			logStepError(log, "createBookingAndCheckout:booking_create_failed", bookingError, {
				studentId,
				serviceId: params.serviceId,
			});
			return { error: "Failed to create booking. Please try again." };
		}

		logStep(log, "createBookingAndCheckout:booking_created", { bookingId: booking.id });

		let bookingShortCode: string | null = null;
		// Generate and save memorable short code for classroom URL
		try {
			const shortCode = await generateUniqueShortCode(adminClient);
			await updateBookingShortCode(adminClient, booking.id, shortCode);
			bookingShortCode = shortCode;
			logStep(log, "createBookingAndCheckout:short_code_created", { bookingId: booking.id, shortCode });
		} catch (shortCodeError) {
			// Non-blocking - booking still works with full ID
			logStepError(log, "createBookingAndCheckout:short_code_failed", shortCodeError, { bookingId: booking.id });
		}

		let bookingAuditState: Record<string, unknown> | null = null;
		try {
			const bookingDetails = await getBookingWithDetails(adminClient, booking.id, params.tutorId);
			bookingAuditState = sanitizeInput(bookingDetails ?? booking) as Record<string, unknown>;
		} catch (auditError) {
			logStepError(log, "createBookingAndCheckout:audit_snapshot_failed", auditError, {
				bookingId: booking.id,
			});
			bookingAuditState = sanitizeInput(booking) as Record<string, unknown>;
		}

		// Record audit log for booking creation
		await recordAudit(adminClient, {
			actorId: params.tutorId,
			targetId: booking.id,
			entityType: "booking",
			actionType: "create",
			beforeState: null,
			afterState: bookingAuditState,
			metadata: {
				studentId,
				scheduledAt: params.scheduledAt,
				durationMinutes: serviceRecord.duration_minutes,
				serviceId: params.serviceId,
				source: "public_checkout",
				paymentMethod: params.packageId ? "package" : params.subscriptionId ? "subscription" : "stripe",
			},
		});

		// 5.5. POST-INSERT CONFLICT CHECK: Prevent race conditions (repository)
		const hasConflict = await checkPostInsertConflict(
			adminClient,
			params.tutorId,
			booking.id,
			booking.created_at,
			params.scheduledAt,
			serviceRecord.duration_minutes
		);

		if (hasConflict) {
			// Another booking was created first - delete ours and return error
			logStep(log, "createBookingAndCheckout:race_condition", { bookingId: booking.id, action: "delete" });
			await hardDeleteBooking(adminClient, booking.id, params.tutorId);
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
				minutesToRedeem: serviceDurationMinutes,
				tutorId: params.tutorId,
				studentId,
			});

			if (!redemptionResult.success) {
				// Failed to redeem - delete booking and return error (repository)
				await hardDeleteBooking(adminClient, booking.id, params.tutorId);
				return {
					error: redemptionResult.error || "Failed to redeem package minutes"
				};
			}

		}

		// 5b. If subscription redemption requested, process it
		if (params.subscriptionId) {
			const { redeemSubscriptionLesson } = await import("@/lib/actions/subscriptions");

			const redemptionResult = await redeemSubscriptionLesson(
				params.subscriptionId,
				booking.id
			);

			if (redemptionResult.error) {
				// Failed to redeem - delete booking and return error (repository)
				await hardDeleteBooking(adminClient, booking.id, params.tutorId);
				return {
					error: redemptionResult.error
				};
			}
		}

		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		// 6. tutorProfile already fetched at start of function (dependency injection)
		// 7. Get meeting URL based on tutor's video provider
		let meetingUrl: string | null = null;
		let meetingProvider: string | null = null;

		if (tutorProfile) {
			switch (tutorProfile.video_provider) {
				case "zoom_personal":
					meetingUrl = tutorProfile.zoom_personal_link ?? null;
					meetingProvider = "zoom_personal";
					break;
				case "google_meet":
					meetingUrl = tutorProfile.google_meet_link ?? null;
					meetingProvider = "google_meet";
					break;
				case "microsoft_teams":
					meetingUrl = tutorProfile.microsoft_teams_link ?? null;
					meetingProvider = "microsoft_teams";
					break;
				case "calendly":
					meetingUrl = tutorProfile.calendly_link ?? null;
					meetingProvider = "calendly";
					break;
				case "custom":
					meetingUrl = tutorProfile.custom_video_url ?? null;
					meetingProvider = "custom";
					break;
				default:
					meetingUrl = null;
					meetingProvider = "none";
			}

			// Update booking with meeting URL (repository)
			if (meetingUrl && meetingProvider) {
				await updateBookingMeetingUrl(adminClient, booking.id, params.tutorId, meetingUrl, meetingProvider);
			}

			const tutorHasStudio = tutorHasStudioAccess({
				tier: tutorProfile.tier ?? null,
				plan: tutorProfile.plan ?? null,
			});
			if (!meetingUrl && tutorHasStudio) {
				meetingUrl = buildClassroomUrl(booking.id, bookingShortCode, appUrl);
				meetingProvider = "livekit";
				// Persist LiveKit classroom URL to database
				await updateBookingMeetingUrl(adminClient, booking.id, params.tutorId, meetingUrl, meetingProvider);
			}
		}

		// 8. Send confirmation emails (don't block on email sending)
		if (tutorProfile) {
			// Send to student
			sendBookingConfirmationEmail({
				studentName: params.student.fullName,
				studentEmail: params.student.email,
				tutorName: tutorProfile.full_name || "Your tutor",
				tutorEmail: tutorProfile.email ?? "",
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
				logStepError(log, "createBookingAndCheckout:student_email_failed", error, { bookingId: booking.id });
			});

			// Send to tutor
			sendTutorBookingNotificationEmail({
				tutorName: tutorProfile.full_name || "Tutor",
				tutorEmail: tutorProfile.email ?? "",
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
				logStepError(log, "createBookingAndCheckout:tutor_email_failed", error, { bookingId: booking.id });
			});

			// Send in-app notification to tutor
			try {
				const { notifyNewBooking } = await import("@/lib/actions/notifications");
				await notifyNewBooking({
					tutorId: params.tutorId,
					studentName: params.student.fullName,
					serviceName,
					scheduledAt: params.scheduledAt,
					bookingId: booking.id,
				});
			} catch (notificationError) {
				logStepError(log, "createBookingAndCheckout:notification_failed", notificationError, { bookingId: booking.id });
			}
		}

		// 8.5. Create calendar event immediately for confirmed bookings (packages/subscriptions)
		if (usingCredit) {
			const startDate = new Date(params.scheduledAt);
			const endDate = new Date(
				startDate.getTime() + (serviceDurationMinutes > 0 ? serviceDurationMinutes : 60) * 60000
			);

			if (!Number.isNaN(startDate.getTime())) {
				buildBookingCalendarDetails({
					client: adminClient,
					bookingId: booking.id,
					baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
				})
					.then((calendarDetails) => {
						if (!calendarDetails) return;
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
					.catch((error) => {
						logStepError(log, "createBookingAndCheckout:calendar_event_failed", error, { bookingId: booking.id });
					});
			}
		}

		// 9. Check if tutor has Stripe Connect enabled and account is healthy
		const stripeAccountReady =
			tutorProfile?.stripe_charges_enabled === true &&
			tutorProfile?.stripe_account_id &&
			tutorProfile?.stripe_onboarding_status !== "restricted";

		if (!params.packageId && stripeAccountReady) {
			if (!studentProfileId) {
				logStep(log, "createBookingAndCheckout:stripe_skip_unauthenticated", { bookingId: booking.id });
			} else {
				// Tutor has Stripe Connect - create checkout session
				try {
					// First, ensure student has a Stripe customer ID (repository)
					const stripeInfo = await getStudentStripeInfo(adminClient, studentProfileId);

					let stripeCustomerId = stripeInfo?.stripe_customer_id;
					const studentEmail = stripeInfo?.email || params.student.email;
					const studentName = stripeInfo?.full_name || params.student.fullName;

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

						// Save to database (repository)
						await updateStudentStripeCustomerId(adminClient, studentProfileId, stripeCustomerId);
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
						transferDestinationAccountId: tutorProfile.stripe_account_id ?? undefined,
						// No platform fee for now as per user requirements
						applicationFeeCents: undefined,
					});

					// Return checkout URL for redirect
					logStep(log, "createBookingAndCheckout:stripe_checkout_created", {
						bookingId: booking.id,
						hasCheckoutUrl: !!session.url,
					});
					const stripeSuccessResponse = {
						success: true as const,
						bookingId: booking.id,
						checkoutUrl: session.url,
					};
					// Response is automatically cached by withIdempotency wrapper
					return stripeSuccessResponse;
				} catch (stripeError) {
					logStepError(log, "createBookingAndCheckout:stripe_checkout_failed", stripeError, { bookingId: booking.id });
					// Fall back to manual payment instructions
				}
			}
		}

		// Success - booking created, student will pay tutor directly (manual payment)
		logStep(log, "createBookingAndCheckout:success", { bookingId: booking.id, paymentMethod: "manual" });
		const manualSuccessResponse = {
			success: true as const,
			bookingId: booking.id,
		};
		// Response is automatically cached by withIdempotency wrapper
		return manualSuccessResponse;
		} catch (error) {
			logStepError(log, "createBookingAndCheckout:unexpected_error", error, {
				serviceId: params.serviceId,
				scheduledAt: params.scheduledAt,
			});
			return { error: "An unexpected error occurred. Please try again." };
		}
	},
		traceId
	);

	// Log if this was a cached response
	if (cached) {
		logStep(log, "createBookingAndCheckout:idempotent_hit", {
			clientMutationId: params.clientMutationId,
		});
	}

	return response;
}

// ============================================================================
// Create Manual Booking with Payment Link
// ============================================================================

/**
 * Create a manual booking with flexible payment options.
 *
 * Payment options:
 * - send_link: Creates pending booking, generates Stripe checkout, sends payment email
 * - already_paid: Creates confirmed booking, sends confirmation email
 * - free: Creates confirmed booking with complimentary status, sends confirmation email
 */
export async function createManualBookingWithPaymentLink(input: ManualBookingInput): Promise<{
	data?: { bookingId: string; paymentUrl?: string };
	error?: string;
}> {
	const traceId = await getTraceId();
	const { supabase, user } = await requireTutor();

	if (!user) {
		return { error: "You need to be signed in to create bookings." };
	}

	const log = createRequestLogger(traceId, user.id);
	logStep(log, "createManualBooking:start", {
		serviceId: input.service_id,
		studentId: input.student_id,
		paymentOption: input.payment_option,
	});

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		logStep(log, "createManualBooking:error", { reason: "admin_client_unavailable" });
		return { error: "Service unavailable. Please try again." };
	}

	// Use atomic idempotency wrapper to prevent duplicate bookings
	const { withIdempotency } = await import("@/lib/utils/idempotency");
	const { cached, response } = await withIdempotency(
		adminClient,
		input.clientMutationId,
		async () => {
			// Validate input
			if (!input.student_id && !input.new_student) {
				return { error: "Please select or add a student." };
			}

			if (!input.service_id) {
				return { error: "Please select a service." };
			}

			// Parallelize service and tutorProfile fetch (repository)
	const { service, tutorProfile } = await getServiceWithTutorProfile(
		adminClient,
		input.service_id,
		user.id
	);

	if (!service) {
		return { error: "Service not found. Please select a valid service." };
	}

	if (!tutorProfile) {
		return { error: "Could not load your profile. Please try again." };
	}

	const tutorTimezone = tutorProfile.timezone || input.timezone || "UTC";

	// Validate booking window (synchronous - uses pre-fetched profile)
	const bookingWindow = checkAdvanceBookingWindow({
		tutorProfile: tutorProfile ?? {},
		scheduledAt: input.scheduled_at,
		timezone: tutorTimezone,
	});

	if ("error" in bookingWindow) {
		return { error: bookingWindow.error };
	}

	// Check booking limits (uses pre-fetched profile for limits)
	const bookingLimits = await checkBookingLimits({
		adminClient,
		tutorId: user.id,
		tutorProfile: tutorProfile ?? {},
		scheduledAt: input.scheduled_at,
		timezone: tutorTimezone,
	});

	if ("error" in bookingLimits) {
		return { error: bookingLimits.error };
	}

	const bufferMinutes = tutorProfile?.buffer_time_minutes ?? 0;
	const bookingStart = new Date(input.scheduled_at);
	const bookingEnd = addMinutes(bookingStart, input.duration_minutes);
	const blockedStart = addMinutes(bookingStart, -bufferMinutes);
	const blockedEnd = addMinutes(bookingEnd, bufferMinutes);

	const [availability, existingBookings, busyResult, blockedTimesResult] = await Promise.all([
		getTutorAvailability(adminClient, user.id),
		findBookingsInTimeRange(adminClient, user.id, bookingStart),
		getCalendarBusyWindowsWithStatus({
			tutorId: user.id,
			start: bookingStart,
			days: 60,
		}),
		adminClient
			.from("blocked_times")
			.select("start_time, end_time")
			.eq("tutor_id", user.id)
			.lt("start_time", blockedEnd.toISOString())
			.gt("end_time", blockedStart.toISOString()),
	]);

	if (busyResult.unverifiedProviders.length) {
		return {
			error:
				"We couldn't verify your external calendar. Please refresh the page or reconnect your calendar and try again.",
		};
	}

	if (busyResult.staleProviders.length) {
		return {
			error:
				"External calendar sync looks stale. Please open Calendar settings to refresh the connection before booking.",
		};
	}

	const busyWindows = [
		...busyResult.windows,
		...(blockedTimesResult.data ?? [])
			.filter((block) => block.start_time && block.end_time)
			.map((block) => ({ start: block.start_time as string, end: block.end_time as string })),
	];

	const validation = validateBooking({
		scheduledAt: input.scheduled_at,
		durationMinutes: input.duration_minutes,
		availability: availability || [],
		existingBookings: existingBookings || [],
		bufferMinutes,
		busyWindows,
		timezone: tutorTimezone,
	});

	if (!validation.isValid) {
		return { error: validation.errors.join(" ") };
	}

	// Get or create student (repository)
	let studentId = input.student_id;
	let studentData: { id: string; full_name: string; email: string; timezone?: string } | null = null;

	if (input.new_student) {
		try {
			const studentResult = await getOrCreateStudent(adminClient, user.id, {
				email: input.new_student.email,
				fullName: input.new_student.name,
				timezone: input.new_student.timezone,
				source: "manual",
			});
			studentId = studentResult.id;
			studentData = {
				id: studentResult.id,
				full_name: input.new_student.name,
				email: input.new_student.email.toLowerCase().trim(),
				timezone: input.new_student.timezone,
			};
			if (studentResult.isNew) {
				logStep(log, "createManualBooking:student_created", { studentId });
			}
		} catch (studentError) {
			logStepError(log, "createManualBooking:student_create_failed", studentError, {
				email: input.new_student?.email,
			});
			return { error: "Could not create student. Please try again." };
		}
	} else if (studentId) {
		// Fetch existing student (repository)
		const existing = await getStudentById(adminClient, studentId, user.id);

		if (!existing) {
			return { error: "Student not found. Please select a valid student." };
		}
		studentData = {
			id: existing.id as string,
			full_name: existing.full_name as string,
			email: existing.email as string,
			timezone: existing.timezone as string | undefined,
		};
	}

	if (!studentId || !studentData) {
		return { error: "Could not identify student. Please try again." };
	}

	// Determine booking status based on payment option
	const isPendingPayment = input.payment_option === "send_link";
	const isFree = input.payment_option === "free";

	const bookingStatus = isPendingPayment ? "pending" : "confirmed";
	const paymentStatus = isFree ? "complimentary" : (isPendingPayment ? "unpaid" : "paid");
	const paymentAmount = isFree ? 0 : (service.price_amount ?? 0);

	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	// Get meeting URL from tutor's video settings
	let meetingUrl: string | null = null;
	let meetingProvider: string | null = null;

	if (tutorProfile.video_provider) {
		switch (tutorProfile.video_provider) {
			case "zoom_personal":
				meetingUrl = tutorProfile.zoom_personal_link;
				meetingProvider = "zoom_personal";
				break;
			case "google_meet":
				meetingUrl = tutorProfile.google_meet_link;
				meetingProvider = "google_meet";
				break;
			case "microsoft_teams":
				meetingUrl = tutorProfile.microsoft_teams_link;
				meetingProvider = "microsoft_teams";
				break;
			case "calendly":
				meetingUrl = tutorProfile.calendly_link;
				meetingProvider = "calendly";
				break;
			case "custom":
				meetingUrl = tutorProfile.custom_video_url;
				meetingProvider = "custom";
				break;
		}
	}

	// Create booking (repository)
	let booking: { id: string; created_at: string };
	try {
		booking = await insertBookingAtomic(adminClient, {
			tutorId: user.id,
			studentId,
			serviceId: input.service_id,
			scheduledAt: input.scheduled_at,
			durationMinutes: input.duration_minutes,
			timezone: tutorTimezone,
			status: bookingStatus,
			paymentStatus,
			paymentAmount,
			currency: service.price_currency ?? "USD",
			studentNotes: input.notes ?? null,
		});
	} catch (bookingError) {
		const err = bookingError as { code?: string };
		if (err?.code === "P0001" || err?.code === "23P01") {
			return { error: "This time slot was just booked. Please refresh and select a different time." };
		}
		logStepError(log, "createManualBooking:booking_rpc_failed", bookingError, {
			studentId,
			serviceId: input.service_id,
		});
		return { error: "We couldn't save that booking. Please try again." };
	}

	logStep(log, "createManualBooking:booking_created", { bookingId: booking.id });

	let bookingShortCode: string | null = null;
	// Generate and save memorable short code for classroom URL
	try {
		const shortCode = await generateUniqueShortCode(adminClient);
		await updateBookingShortCode(adminClient, booking.id, shortCode);
		bookingShortCode = shortCode;
		logStep(log, "createManualBooking:short_code_created", { bookingId: booking.id, shortCode });
	} catch (shortCodeError) {
		// Non-blocking - booking still works with full ID
		logStepError(log, "createManualBooking:short_code_failed", shortCodeError, { bookingId: booking.id });
	}

	// Update booking with meeting URL (repository)
	if (meetingUrl && meetingProvider) {
		await updateBookingMeetingUrl(adminClient, booking.id, user.id, meetingUrl, meetingProvider);
	}

	const tutorHasStudio = tutorHasStudioAccess({
		tier: tutorProfile.tier ?? null,
		plan: tutorProfile.plan ?? null,
	});
	if (!meetingUrl && tutorHasStudio) {
		meetingUrl = buildClassroomUrl(booking.id, bookingShortCode, appUrl);
		meetingProvider = "livekit";
		// Persist LiveKit classroom URL to database
		await updateBookingMeetingUrl(adminClient, booking.id, user.id, meetingUrl, meetingProvider);
	}

	// Ensure conversation thread exists
	await ensureConversationThread(adminClient, user.id, studentId);

	// Handle payment link generation if needed
	let paymentUrl: string | undefined;

	if (input.payment_option === "send_link") {
		// Check if Stripe Connect is enabled
		const stripeAccountReady =
			tutorProfile.stripe_charges_enabled === true &&
			tutorProfile.stripe_account_id &&
			tutorProfile.stripe_onboarding_status !== "restricted";

		if (stripeAccountReady && paymentAmount > 0) {
			try {
				const { createCheckoutSession, getOrCreateStripeCustomer } = await import("@/lib/stripe");

				// Get or create Stripe customer for student
				const stripeCustomer = await getOrCreateStripeCustomer({
					userId: studentId, // Use studentId as the user identifier
					email: studentData.email,
					name: studentData.full_name,
				});

				const baseUrl = appUrl;
				const stripeCurrency = (service.price_currency ?? "USD").toLowerCase();

				const session = await createCheckoutSession({
					customerId: stripeCustomer.id,
					priceAmount: paymentAmount,
					currency: stripeCurrency,
					successUrl: `${baseUrl}/book/success?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
					cancelUrl: `${baseUrl}/book/cancelled?booking_id=${booking.id}`,
					metadata: {
						bookingId: booking.id,
						studentRecordId: studentId,
						tutorId: user.id,
					},
					lineItems: [
						{
							name: service.name,
							description: `${input.duration_minutes} minute lesson`,
							amount: paymentAmount, // Price in cents
						},
					],
					transferDestinationAccountId: tutorProfile.stripe_account_id ?? undefined,
				});

				paymentUrl = session.url ?? undefined;

				// Store checkout session ID on booking (repository)
				await updateBookingCheckoutSession(adminClient, booking.id, session.id);

			} catch (stripeError) {
				logStepError(log, "createManualBooking:stripe_checkout_failed", stripeError, { bookingId: booking.id });
				// Fall back to manual payment
				paymentUrl = undefined;
			}
		}

		// Send payment request email
		if (paymentUrl) {
			await sendBookingPaymentRequestEmail({
				studentName: studentData.full_name,
				studentEmail: studentData.email,
				tutorName: tutorProfile.full_name ?? "Your tutor",
				tutorEmail: tutorProfile.email ?? "",
				serviceName: service.name,
				scheduledAt: input.scheduled_at,
				durationMinutes: input.duration_minutes,
				timezone: studentData.timezone ?? tutorTimezone,
				amount: paymentAmount / 100,
				currency: service.price_currency ?? "USD",
				paymentUrl,
			});
		} else {
			// Stripe not available, send confirmation with manual payment instructions
			await sendBookingConfirmationEmail({
				studentName: studentData.full_name,
				studentEmail: studentData.email,
				tutorName: tutorProfile.full_name ?? "Your tutor",
				tutorEmail: tutorProfile.email ?? "",
				serviceName: service.name,
				scheduledAt: input.scheduled_at,
				durationMinutes: input.duration_minutes,
				timezone: studentData.timezone ?? tutorTimezone,
				amount: paymentAmount / 100,
				currency: service.price_currency ?? "USD",
				paymentInstructions: {
					general: tutorProfile.payment_instructions ?? undefined,
					venmoHandle: tutorProfile.venmo_handle ?? undefined,
					paypalEmail: tutorProfile.paypal_email ?? undefined,
					zellePhone: tutorProfile.zelle_phone ?? undefined,
					stripePaymentLink: tutorProfile.stripe_payment_link ?? undefined,
					customPaymentUrl: tutorProfile.custom_payment_url ?? undefined,
				},
				meetingUrl: meetingUrl ?? undefined,
				meetingProvider: meetingProvider ?? undefined,
				customVideoName: tutorProfile.custom_video_name ?? undefined,
			});
		}
	} else {
		// Send confirmation email for already_paid or free bookings
		await sendBookingConfirmationEmail({
			studentName: studentData.full_name,
			studentEmail: studentData.email,
			tutorName: tutorProfile.full_name ?? "Your tutor",
			tutorEmail: tutorProfile.email ?? "",
			serviceName: service.name,
			scheduledAt: input.scheduled_at,
			durationMinutes: input.duration_minutes,
			timezone: studentData.timezone ?? tutorTimezone,
			amount: isFree ? 0 : paymentAmount / 100,
			currency: service.price_currency ?? "USD",
			meetingUrl: meetingUrl ?? undefined,
			meetingProvider: meetingProvider ?? undefined,
			customVideoName: tutorProfile.custom_video_name ?? undefined,
		});
	}

	// Send notification to tutor
	await sendTutorBookingNotificationEmail({
		tutorName: tutorProfile.full_name ?? "Tutor",
		tutorEmail: tutorProfile.email ?? "",
		studentName: studentData.full_name,
		studentEmail: studentData.email,
		serviceName: service.name,
		scheduledAt: input.scheduled_at,
		durationMinutes: input.duration_minutes,
		timezone: tutorTimezone,
		amount: isFree ? 0 : paymentAmount / 100,
		currency: service.price_currency ?? "USD",
		notes: input.notes,
		dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/bookings`,
	});

	// Create calendar event
	try {
		const calendarDetails = await buildBookingCalendarDetails({
			client: adminClient,
			bookingId: booking.id,
			baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
		});

		if (calendarDetails) {
			await createCalendarEventForBooking({
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
		}
	} catch (calendarError) {
		logStepError(log, "createManualBooking:calendar_event_failed", calendarError, { bookingId: booking.id });
	}

	revalidatePath("/bookings");
	revalidatePath("/calendar");

	let bookingAuditState: Record<string, unknown> | null = null;
	try {
		const bookingDetails = await getBookingWithDetails(adminClient, booking.id, user.id);
		bookingAuditState = sanitizeInput(bookingDetails ?? booking) as Record<string, unknown>;
	} catch (auditError) {
		logStepError(log, "createManualBooking:audit_snapshot_failed", auditError, { bookingId: booking.id });
		bookingAuditState = sanitizeInput(booking) as Record<string, unknown>;
	}

	// Record audit log for booking creation
	await recordAudit(adminClient, {
		actorId: user.id,
		targetId: booking.id,
		entityType: "booking",
		actionType: "create",
		beforeState: null,
		afterState: bookingAuditState,
		metadata: {
			studentId,
			scheduledAt: input.scheduled_at,
			durationMinutes: input.duration_minutes,
			serviceId: input.service_id,
			source: "manual_with_payment_link",
			paymentOption: input.payment_option,
		},
	});

	logStep(log, "createManualBooking:success", {
		bookingId: booking.id,
		hasPaymentUrl: !!paymentUrl,
		paymentOption: input.payment_option,
	});

		return {
			data: {
				bookingId: booking.id,
				paymentUrl,
			},
		};
		},
	traceId
	);

	// Log if this was a cached response
	if (cached) {
		logStep(log, "createManualBooking:idempotent_hit", {
			clientMutationId: input.clientMutationId,
		});
	}

	return response;
}
