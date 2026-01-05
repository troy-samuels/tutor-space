"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
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
import { isTableMissing } from "@/lib/utils/supabase-errors";
import {
	requireTutor,
	ensureConversationThread,
	checkAdvanceBookingWindow,
	checkBookingLimits,
} from "./helpers";
import type { BookingRecord, ManualBookingInput } from "./types";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
	enrichError,
	type Logger,
} from "@/lib/logger";
import { withIdempotency } from "@/lib/utils/idempotency";

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

	const initialBookingStart = new Date(input.scheduled_at);
	const initialBookingEnd = new Date(
		initialBookingStart.getTime() + input.duration_minutes * 60 * 1000
	);

	const hasConflict = existingBookings?.some((existing) => {
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

	const { data: tutorProfile } = await adminClient
		.from("profiles")
		.select("timezone, max_lessons_per_day, max_lessons_per_week, advance_booking_days_min, advance_booking_days_max")
		.eq("id", user.id)
		.single();

	const tutorTimezone = tutorProfile?.timezone || input.timezone || "UTC";

	// Only check advance booking window if not explicitly skipped (tutor-initiated bookings skip this)
	if (!input.skipAdvanceBookingCheck) {
		const bookingWindow = await checkAdvanceBookingWindow({
			adminClient,
			tutorId: user.id,
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
		scheduledAt: input.scheduled_at,
		timezone: tutorTimezone,
	});

	if ("error" in bookingLimits) {
		return { error: bookingLimits.error };
	}

	// Create the booking atomically to avoid race conditions
	const { data: bookingResult, error: bookingError } = await adminClient.rpc(
		"create_booking_atomic",
		{
			p_tutor_id: user.id,
			p_student_id: input.student_id,
			p_service_id: input.service_id,
			p_scheduled_at: input.scheduled_at,
			p_duration_minutes: input.duration_minutes,
			p_timezone: tutorTimezone,
			p_status: "confirmed",
			p_payment_status: "unpaid",
			p_payment_amount: 0,
			p_currency: null,
			p_student_notes: input.notes ?? null,
		}
	);

	const booking = Array.isArray(bookingResult)
		? bookingResult[0]
		: (bookingResult as { id: string; created_at: string } | null);

	if (bookingError || !booking) {
		if (bookingError?.code === "P0001" || bookingError?.code === "23P01") {
			return {
				error:
					"This time slot was just booked. Please refresh and select a different time.",
			};
		}

		if (bookingError?.code === "P0002") {
			return { error: "This time window is blocked by the tutor." };
		}

		if (bookingError?.code === "55P03") {
			return { error: "Please retry booking; the tutor calendar is busy right now." };
		}

		logStepError(log, "createBooking:rpc_failed", bookingError, {
			studentId: input.student_id,
			serviceId: input.service_id,
		});
		return { error: "We couldn't save that booking. Please try again." };
	}

	logStep(log, "createBooking:booking_created", { bookingId: booking.id });

	// Post-insert conflict check (first-come-first-serve) in case of concurrent inserts
	const postInsertStart = new Date(input.scheduled_at);
	const postInsertEnd = new Date(postInsertStart.getTime() + input.duration_minutes * 60 * 1000);

	const { data: conflictingBookings } = await adminClient
		.from("bookings")
		.select("id, scheduled_at, duration_minutes, created_at")
		.eq("tutor_id", user.id)
		.in("status", ["pending", "confirmed"])
		.neq("id", booking.id)
		.lte("scheduled_at", postInsertEnd.toISOString())
		.order("created_at", { ascending: true });

	const hasPostInsertConflict = conflictingBookings?.some((existing) => {
		const existingStart = new Date(existing.scheduled_at);
		const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);
		return postInsertStart < existingEnd && postInsertEnd > existingStart && new Date(existing.created_at) < new Date(booking.created_at);
	});

	if (hasPostInsertConflict) {
		await adminClient.from("bookings").delete().eq("id", booking.id).eq("tutor_id", user.id);
		return {
			error:
				"This time slot was just booked. Please refresh and select a different time.",
		};
	}

	const { data, error } = await supabase
		.from("bookings")
		.select("*, students(full_name, email), services(name)")
		.eq("id", booking.id)
		.single<BookingRecord>();

	if (error) {
		return { error: "We couldn't load the new booking. Please try again." };
	}

	try {
		const student = Array.isArray(data.students) ? data.students[0] : data.students;
		const service = Array.isArray(data.services) ? data.services[0] : data.services;
		const studentName = student?.full_name ?? "Student";
		const serviceName = service?.name ?? "Lesson";
		const startDate = new Date(data.scheduled_at);
		const endDate = new Date(startDate.getTime() + data.duration_minutes * 60000);

		const descriptionLines = [
			`TutorLingua booking - ${serviceName}`,
			`Student: ${studentName}`,
			`Booking ID: ${data.id}`,
		];

		await createCalendarEventForBooking({
			tutorId: user.id,
			bookingId: data.id,
			title: `${serviceName} with ${studentName}`,
			start: startDate.toISOString(),
			end: endDate.toISOString(),
			description: descriptionLines.join("\n"),
			studentEmail: student?.email ?? undefined,
			timezone: tutorTimezone,
		});
		logStep(log, "createBooking:calendar_event_created", { bookingId: data.id });
	} catch (calendarError) {
		logStepError(log, "createBooking:calendar_event_failed", calendarError, { bookingId: data.id });
	}

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

	// Idempotency check - return cached response if this request was already processed
	if (params.clientMutationId) {
		const { getCachedResponse } = await import("@/lib/utils/idempotency");
		const cachedResponse = await getCachedResponse<
			| { error: string }
			| { success: true; bookingId: string; checkoutUrl?: string | null }
		>(adminClient, params.clientMutationId);

		if (cachedResponse) {
			logStep(log, "createBookingAndCheckout:idempotent_hit", {
				clientMutationId: params.clientMutationId,
			});
			return cachedResponse;
		}
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
		const serviceDurationMinutes =
			serviceRecord.duration_minutes || params.durationMinutes || 60;
		const serviceName = serviceRecord.name ?? "Lesson";
		let packageCalendarContext: {
			remainingMinutes: number | null;
			totalMinutes: number | null;
			sessionCount: number | null;
			packageName: string | null;
		} | null = null;

		const { data: tutorSettings } = await adminClient
			.from("profiles")
			.select("buffer_time_minutes, timezone")
			.eq("id", params.tutorId)
			.single();

		const bufferMinutes = tutorSettings?.buffer_time_minutes ?? 0;
		const tutorTimezone = tutorSettings?.timezone || params.timezone;

		const bookingWindow = await checkAdvanceBookingWindow({
			adminClient,
			tutorId: params.tutorId,
			scheduledAt: params.scheduledAt,
			timezone: tutorTimezone,
		});

		if ("error" in bookingWindow) {
			return { error: bookingWindow.error };
		}

		const bookingLimits = await checkBookingLimits({
			adminClient,
			tutorId: params.tutorId,
			scheduledAt: params.scheduledAt,
			timezone: tutorTimezone,
		});

		if ("error" in bookingLimits) {
			return { error: bookingLimits.error };
		}

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

		const busyResult = await getCalendarBusyWindowsWithStatus({
			tutorId: params.tutorId,
			start: new Date(params.scheduledAt),
			days: 60,
		});

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

		const busyWindows = busyResult.windows;

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
				logStepError(log, "createBookingAndCheckout:student_create_failed", studentError, {
					studentEmail: params.student.email,
				});
				return { error: "Failed to save student information. Please try again." };
			}

			studentId = newStudent.id;
			studentProfileId = newStudent.user_id ?? studentProfileId;
		}

		if (studentId) {
			await ensureConversationThread(adminClient, params.tutorId, studentId);

			// Sync access + connection for logged-in students so portal flows work
			if (user?.id) {
				let connectionTableAvailable = true;
				const { data: existingConnection, error: existingConnectionError } = await adminClient
					.from("student_tutor_connections")
					.select("id, status")
					.eq("student_user_id", user.id)
					.eq("tutor_id", params.tutorId)
					.maybeSingle();

				if (existingConnectionError) {
					if (isTableMissing(existingConnectionError, "student_tutor_connections")) {
						connectionTableAvailable = false;
						console.warn("[Bookings] Connection table missing, skipping connection sync");
					} else if (existingConnectionError.code !== "PGRST116") {
						console.error("Failed to look up connection:", existingConnectionError);
					}
				}

				if (connectionTableAvailable) {
					if (!existingConnection) {
						const { error: insertConnectionError } = await adminClient
							.from("student_tutor_connections")
							.insert({
								student_user_id: user.id,
								tutor_id: params.tutorId,
								status: "approved",
								requested_at: new Date().toISOString(),
								resolved_at: new Date().toISOString(),
								initial_message: "Auto-approved from booking",
							});

						if (insertConnectionError && !isTableMissing(insertConnectionError, "student_tutor_connections")) {
							console.error("Failed to create connection:", insertConnectionError);
						}
					} else if (existingConnection.status !== "approved") {
						const { error: updateConnectionError } = await adminClient
							.from("student_tutor_connections")
							.update({
								status: "approved",
								resolved_at: new Date().toISOString(),
							})
							.eq("id", existingConnection.id);

						if (updateConnectionError && !isTableMissing(updateConnectionError, "student_tutor_connections")) {
							console.error("Failed to update connection:", updateConnectionError);
						}
					}
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

		// 5. Create booking record atomically to avoid race conditions
		// If packageId or subscriptionId provided, booking will be confirmed immediately
		const usingCredit = !!(params.packageId || params.subscriptionId);
		const { data: bookingResult, error: bookingError } = await adminClient.rpc(
			"create_booking_atomic",
			{
				p_tutor_id: params.tutorId,
				p_student_id: studentId,
				p_service_id: params.serviceId,
				p_scheduled_at: params.scheduledAt,
				p_duration_minutes: serviceRecord.duration_minutes,
				p_timezone: tutorTimezone,
				p_status: usingCredit ? "confirmed" : "pending",
				p_payment_status: usingCredit ? "paid" : "unpaid",
				p_payment_amount: normalizedPriceCents,
				p_currency: serviceCurrency,
				p_student_notes: params.notes,
			}
		);

		const booking = Array.isArray(bookingResult)
			? bookingResult[0]
			: (bookingResult as { id: string; created_at: string } | null);

		if (bookingError || !booking) {
			if (bookingError?.code === "P0001") {
				return {
					error: "This time slot was just booked. Please select a different time.",
				};
			}

			if (bookingError?.code === "P0002") {
				return {
					error: "This time window is blocked by the tutor.",
				};
			}

			if (bookingError?.code === "55P03") {
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
			logStep(log, "createBookingAndCheckout:race_condition", { bookingId: booking.id, action: "delete" });
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
				minutesToRedeem: serviceDurationMinutes,
				tutorId: params.tutorId,
				studentId,
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

			packageCalendarContext = {
				remainingMinutes: redemptionResult.remainingMinutes ?? null,
				totalMinutes: redemptionResult.packageTotalMinutes ?? null,
				sessionCount: redemptionResult.packageSessionCount ?? null,
				packageName: redemptionResult.packageName ?? null,
			};
		}

		// 5b. If subscription redemption requested, process it
		if (params.subscriptionId) {
			const { redeemSubscriptionLesson } = await import("@/lib/actions/lesson-subscriptions");

			const redemptionResult = await redeemSubscriptionLesson(
				params.subscriptionId,
				booking.id
			);

			if (redemptionResult.error) {
				// Failed to redeem - delete booking and return error
				await adminClient
					.from("bookings")
					.delete()
					.eq("id", booking.id)
					.eq("tutor_id", params.tutorId);
				return {
					error: redemptionResult.error
				};
			}
		}

		// 6. Fetch tutor profile and service info for emails + Stripe Connect status
		const { data: tutorProfile } = await adminClient
			.from("profiles")
			.select(
				"full_name, email, payment_instructions, venmo_handle, paypal_email, zelle_phone, stripe_payment_link, custom_payment_url, video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link, calendly_link, custom_video_url, custom_video_name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status"
			)
			.eq("id", params.tutorId)
			.single();

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
				logStepError(log, "createBookingAndCheckout:student_email_failed", error, { bookingId: booking.id });
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
				const lessonsTotal =
					packageCalendarContext?.sessionCount ??
					(serviceDurationMinutes > 0 && packageCalendarContext?.totalMinutes
						? Math.floor(packageCalendarContext.totalMinutes / serviceDurationMinutes)
						: null);
				const lessonsRemaining =
					serviceDurationMinutes > 0 && packageCalendarContext?.remainingMinutes != null
						? Math.max(
								0,
								Math.floor(packageCalendarContext.remainingMinutes / serviceDurationMinutes)
							)
						: null;

				const descriptionLines = [
					`TutorLingua booking - ${serviceName}`,
					`Student: ${params.student.fullName}`,
					`Booking ID: ${booking.id}`,
				];

				if (packageCalendarContext) {
					descriptionLines.push(
						`Package: ${packageCalendarContext.packageName || "Lesson package"}`
					);

					if (lessonsRemaining !== null) {
						const totalLabel = lessonsTotal !== null ? `/${lessonsTotal}` : "";
						descriptionLines.push(`Remaining lessons: ${lessonsRemaining}${totalLabel}`);
					} else if (packageCalendarContext.remainingMinutes !== null) {
						descriptionLines.push(
							`Remaining minutes: ${packageCalendarContext.remainingMinutes}`
						);
					}
				}

				const eventTitle =
					lessonsRemaining !== null
						? `${serviceName} with ${params.student.fullName} (${lessonsRemaining}${
								lessonsTotal !== null ? `/${lessonsTotal}` : ""
							} left)`
						: `${serviceName} with ${params.student.fullName}`;

				createCalendarEventForBooking({
					tutorId: params.tutorId,
					bookingId: booking.id,
					title: eventTitle,
					start: startDate.toISOString(),
					end: endDate.toISOString(),
					description: descriptionLines.join("\n"),
					studentEmail: params.student.email,
					timezone: tutorTimezone,
				}).catch((error) => {
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
					logStep(log, "createBookingAndCheckout:stripe_checkout_created", {
						bookingId: booking.id,
						hasCheckoutUrl: !!session.url,
					});
					const stripeSuccessResponse = {
						success: true as const,
						bookingId: booking.id,
						checkoutUrl: session.url,
					};
					// Cache successful response for idempotency
					if (params.clientMutationId) {
						const { cacheResponse } = await import("@/lib/utils/idempotency");
						await cacheResponse(adminClient, params.clientMutationId, stripeSuccessResponse);
					}
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
		// Cache successful response for idempotency
		if (params.clientMutationId) {
			const { cacheResponse } = await import("@/lib/utils/idempotency");
			await cacheResponse(adminClient, params.clientMutationId, manualSuccessResponse);
		}
		return manualSuccessResponse;
	} catch (error) {
		logStepError(log, "createBookingAndCheckout:unexpected_error", error, {
			serviceId: params.serviceId,
			scheduledAt: params.scheduledAt,
		});
		return { error: "An unexpected error occurred. Please try again." };
	}
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

	// Validate input
	if (!input.student_id && !input.new_student) {
		return { error: "Please select or add a student." };
	}

	if (!input.service_id) {
		return { error: "Please select a service." };
	}

	// Get service details
	const { data: service, error: serviceError } = await supabase
		.from("services")
		.select("id, name, duration_minutes, price_amount, price_currency")
		.eq("id", input.service_id)
		.eq("tutor_id", user.id)
		.single();

	if (serviceError || !service) {
		return { error: "Service not found. Please select a valid service." };
	}

	// Get tutor profile
	const { data: tutorProfile, error: profileError } = await adminClient
		.from("profiles")
		.select(`
			full_name, email, timezone,
			video_provider, zoom_personal_link, google_meet_link, microsoft_teams_link,
			calendly_link, custom_video_url, custom_video_name,
			stripe_account_id, stripe_charges_enabled, stripe_onboarding_status,
			payment_instructions, venmo_handle, paypal_email, zelle_phone,
			stripe_payment_link, custom_payment_url
		`)
		.eq("id", user.id)
		.single();

	if (profileError || !tutorProfile) {
		return { error: "Could not load your profile. Please try again." };
	}

	const tutorTimezone = tutorProfile.timezone || input.timezone || "UTC";

	// Validate booking window
	const bookingWindow = await checkAdvanceBookingWindow({
		adminClient,
		tutorId: user.id,
		scheduledAt: input.scheduled_at,
		timezone: tutorTimezone,
	});

	if ("error" in bookingWindow) {
		return { error: bookingWindow.error };
	}

	// Check booking limits
	const bookingLimits = await checkBookingLimits({
		adminClient,
		tutorId: user.id,
		scheduledAt: input.scheduled_at,
		timezone: tutorTimezone,
	});

	if ("error" in bookingLimits) {
		return { error: bookingLimits.error };
	}

	// Check for conflicts
	const { data: existingBookings } = await supabase
		.from("bookings")
		.select("id, scheduled_at, duration_minutes")
		.eq("tutor_id", user.id)
		.in("status", ["pending", "confirmed"])
		.gte("scheduled_at", new Date(new Date(input.scheduled_at).getTime() - 24 * 60 * 60 * 1000).toISOString())
		.lte("scheduled_at", new Date(new Date(input.scheduled_at).getTime() + 24 * 60 * 60 * 1000).toISOString());

	const bookingStart = new Date(input.scheduled_at);
	const bookingEnd = new Date(bookingStart.getTime() + input.duration_minutes * 60 * 1000);

	const hasConflict = existingBookings?.some((existing) => {
		const existingStart = new Date(existing.scheduled_at);
		const existingEnd = new Date(existingStart.getTime() + existing.duration_minutes * 60 * 1000);
		return bookingStart < existingEnd && bookingEnd > existingStart;
	});

	if (hasConflict) {
		return { error: "This time slot conflicts with an existing booking. Please select a different time." };
	}

	// Get or create student
	let studentId = input.student_id;
	let studentData: { id: string; full_name: string; email: string; timezone?: string } | null = null;

	if (input.new_student) {
		// Create new student
		const { data: newStudent, error: studentError } = await adminClient
			.from("students")
			.insert({
				tutor_id: user.id,
				full_name: input.new_student.name,
				email: input.new_student.email.toLowerCase().trim(),
				timezone: input.new_student.timezone,
				source: "manual",
				calendar_access_status: "approved",
			})
			.select("id, full_name, email, timezone")
			.single();

		if (studentError) {
			// Check if student already exists
			if (studentError.code === "23505") {
				const { data: existing } = await adminClient
					.from("students")
					.select("id, full_name, email, timezone")
					.eq("tutor_id", user.id)
					.eq("email", input.new_student.email.toLowerCase().trim())
					.single();

				if (existing) {
					studentId = existing.id;
					studentData = existing;
				} else {
					return { error: "A student with this email already exists but could not be retrieved." };
				}
			} else {
				logStepError(log, "createManualBooking:student_create_failed", studentError, {
					email: input.new_student?.email,
				});
				return { error: "Could not create student. Please try again." };
			}
		} else {
			studentId = newStudent.id;
			studentData = newStudent;
			logStep(log, "createManualBooking:student_created", { studentId });
		}
	} else if (studentId) {
		// Fetch existing student
		const { data: existing } = await supabase
			.from("students")
			.select("id, full_name, email, timezone")
			.eq("id", studentId)
			.eq("tutor_id", user.id)
			.single();

		if (!existing) {
			return { error: "Student not found. Please select a valid student." };
		}
		studentData = existing;
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

	// Create booking
	const { data: bookingResult, error: bookingError } = await adminClient.rpc(
		"create_booking_atomic",
		{
			p_tutor_id: user.id,
			p_student_id: studentId,
			p_service_id: input.service_id,
			p_scheduled_at: input.scheduled_at,
			p_duration_minutes: input.duration_minutes,
			p_timezone: tutorTimezone,
			p_status: bookingStatus,
			p_payment_status: paymentStatus,
			p_payment_amount: paymentAmount,
			p_currency: service.price_currency ?? "USD",
			p_student_notes: input.notes ?? null,
		}
	);

	const booking = Array.isArray(bookingResult)
		? bookingResult[0]
		: (bookingResult as { id: string; created_at: string } | null);

	if (bookingError || !booking) {
		if (bookingError?.code === "P0001" || bookingError?.code === "23P01") {
			return { error: "This time slot was just booked. Please refresh and select a different time." };
		}
		logStepError(log, "createManualBooking:booking_rpc_failed", bookingError, {
			studentId,
			serviceId: input.service_id,
		});
		return { error: "We couldn't save that booking. Please try again." };
	}

	logStep(log, "createManualBooking:booking_created", { bookingId: booking.id });

	// Update booking with meeting URL
	if (meetingUrl) {
		await adminClient
			.from("bookings")
			.update({
				meeting_url: meetingUrl,
				meeting_provider: meetingProvider,
			})
			.eq("id", booking.id);
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

				const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
					transferDestinationAccountId: tutorProfile.stripe_account_id,
				});

				paymentUrl = session.url ?? undefined;

				// Store checkout session ID on booking
				await adminClient
					.from("bookings")
					.update({ stripe_checkout_session_id: session.id })
					.eq("id", booking.id);

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
		const startDate = new Date(input.scheduled_at);
		const endDate = new Date(startDate.getTime() + input.duration_minutes * 60000);

		await createCalendarEventForBooking({
			tutorId: user.id,
			bookingId: booking.id,
			title: `${service.name} with ${studentData.full_name}`,
			start: startDate.toISOString(),
			end: endDate.toISOString(),
			description: `TutorLingua booking - ${service.name}\nStudent: ${studentData.full_name}\nBooking ID: ${booking.id}`,
			studentEmail: studentData.email,
			timezone: tutorTimezone,
		});
	} catch (calendarError) {
		logStepError(log, "createManualBooking:calendar_event_failed", calendarError, { bookingId: booking.id });
	}

	revalidatePath("/bookings");
	revalidatePath("/calendar");

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
}
