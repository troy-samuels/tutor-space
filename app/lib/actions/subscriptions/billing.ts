"use server";

/**
 * Subscription Lifecycle Module
 *
 * Handles subscription management operations:
 * - Checking active subscriptions
 * - Getting subscription details
 * - Cancelling subscriptions
 * - Student portal subscription views
 *
 * @module lib/actions/subscriptions/billing
 */

import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { recordAudit } from "@/lib/repositories/audit";
import {
	hasActiveSubscription as hasActiveInDb,
	getSubscriptionWithDetails as getSubscriptionFromDb,
	getSubscriptionForAuth,
	updateSubscriptionCancelAt,
	getStudentIdsByUserId,
	getStudentSubscriptionsWithDetails,
} from "@/lib/repositories/lesson-subscriptions";
import {
	getTraceId,
	createRequestLogger,
	logStep,
	logStepError,
} from "@/lib/logger";
import type { SubscriptionWithDetails } from "@/lib/subscription";
import type {
	ActionResult,
	StudentSubscriptionView,
	StudentSubscriptionSummary,
} from "./types";

// ============================================================================
// Stripe Client
// ============================================================================

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripeClient: Stripe | null | undefined;

function getStripe(): Stripe | null {
	if (typeof stripeClient !== "undefined") {
		return stripeClient;
	}

	if (!stripeSecretKey) {
		stripeClient = null;
		return stripeClient;
	}

	stripeClient = new Stripe(stripeSecretKey, {
		apiVersion: "2025-09-30.clover",
	});

	return stripeClient;
}

// ============================================================================
// Internal Helpers
// ============================================================================

async function getClientIp(): Promise<string> {
	const headersList = await headers();
	return (
		headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		headersList.get("x-real-ip") ||
		"unknown"
	);
}

async function requireUser() {
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

// ============================================================================
// Subscription Query Operations
// ============================================================================

/**
 * Check if student has an active subscription with a tutor.
 *
 * @param studentId - Student ID
 * @param tutorId - Tutor ID
 * @returns True if active subscription exists
 */
export async function hasActiveSubscription(
	studentId: string,
	tutorId: string
): Promise<boolean> {
	const adminClient = createServiceRoleClient();
	if (!adminClient) return false;

	try {
		return await hasActiveInDb(adminClient, studentId, tutorId);
	} catch (error) {
		console.error("[Subscriptions] Error checking subscription:", error);
		return false;
	}
}

/**
 * Get student's subscription with a tutor.
 *
 * @param studentId - Student ID
 * @param tutorId - Tutor ID
 * @returns Subscription with details or error
 */
export async function getStudentSubscription(
	studentId: string,
	tutorId: string
): Promise<ActionResult<SubscriptionWithDetails>> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, studentId);

	logStep(log, "getSubscription:start", { studentId, tutorId });

	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		return { error: "Database connection failed." };
	}

	try {
		const subscription = await getSubscriptionFromDb(adminClient, studentId, tutorId);

		if (!subscription) {
			logStep(log, "getSubscription:notFound", { studentId, tutorId });
			return { data: undefined, success: true };
		}

		logStep(log, "getSubscription:success", {
			subscriptionId: subscription.id,
			status: subscription.status,
		});

		return { data: subscription, success: true };
	} catch (error) {
		logStepError(log, "getSubscription:error", error, { studentId, tutorId });
		return { error: "Failed to load subscription." };
	}
}

// ============================================================================
// Subscription Lifecycle Operations
// ============================================================================

/**
 * Cancel a subscription at period end.
 *
 * Includes audit trail for compliance.
 *
 * @param subscriptionId - Subscription ID
 * @returns Success or error
 */
export async function cancelSubscription(
	subscriptionId: string
): Promise<ActionResult<{ success: boolean }>> {
	const traceId = await getTraceId();
	const clientIp = await getClientIp();
	const log = createRequestLogger(traceId, subscriptionId);

	logStep(log, "cancelSubscription:start", { subscriptionId, ip: clientIp });

	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	try {
		// Verify the subscription belongs to student or tutor
		const subscription = await getSubscriptionForAuth(supabase, subscriptionId);

		if (!subscription) {
			return { error: "Subscription not found." };
		}

		// Check authorization - student is returned as array from Supabase join
		const studentData = Array.isArray(subscription.student)
			? subscription.student[0]
			: subscription.student;
		const isStudent = studentData?.user_id === user.id;
		const isTutor = subscription.tutor_id === user.id;

		if (!isStudent && !isTutor) {
			return { error: "Not authorized to cancel this subscription." };
		}

		// Cancel in Stripe
		const stripe = getStripe();
		if (stripe && subscription.stripe_subscription_id) {
			try {
				await stripe.subscriptions.update(subscription.stripe_subscription_id, {
					cancel_at_period_end: true,
				});
			} catch (stripeError) {
				logStepError(log, "cancelSubscription:stripeError", stripeError, {
					subscriptionId,
				});
				return { error: "Failed to cancel subscription in Stripe." };
			}
		}

		// Update local record
		const adminClient = createServiceRoleClient();
		if (adminClient) {
			await updateSubscriptionCancelAt(adminClient, subscriptionId, true);

			// Record audit trail
			await recordAudit(adminClient, {
				actorId: user.id,
				targetId: subscriptionId,
				entityType: "billing",
				actionType: "subscription_cancelled",
				metadata: {
					cancelledBy: isStudent ? "student" : "tutor",
					ip: clientIp,
					traceId,
				},
			});
		}

		logStep(log, "cancelSubscription:success", {
			subscriptionId,
			cancelledBy: isStudent ? "student" : "tutor",
		});

		return { data: { success: true }, success: true };
	} catch (error) {
		logStepError(log, "cancelSubscription:error", error, { subscriptionId });
		return { error: "Failed to cancel subscription." };
	}
}

// ============================================================================
// Student Portal Operations
// ============================================================================

/**
 * Get all lesson subscriptions for the logged-in student.
 *
 * @returns Array of subscriptions or error
 */
export async function getStudentLessonSubscriptions(): Promise<
	ActionResult<StudentSubscriptionView[]>
> {
	const traceId = await getTraceId();
	const log = createRequestLogger(traceId);

	const { supabase, user } = await requireUser();

	if (!user) {
		return { error: "You need to be signed in." };
	}

	logStep(log, "getStudentSubscriptions:start", { userId: user.id });

	try {
		// Find all student records for this user
		const studentIds = await getStudentIdsByUserId(supabase, user.id);

		if (studentIds.length === 0) {
			return { data: [], success: true };
		}

		// Fetch subscriptions with nested data
		const subscriptions = await getStudentSubscriptionsWithDetails(supabase, studentIds);

		// Transform the data
		const result: StudentSubscriptionView[] = subscriptions.map((sub: any) => {
			const tutorData = Array.isArray(sub.tutor) ? sub.tutor[0] : sub.tutor;
			const templateData = Array.isArray(sub.template) ? sub.template[0] : sub.template;
			const periodData = Array.isArray(sub.current_period)
				? sub.current_period[0]
				: sub.current_period;
			const serviceData = templateData?.service;
			const serviceName = Array.isArray(serviceData)
				? serviceData[0]?.name
				: serviceData?.name;

			return {
				id: sub.id,
				status: sub.status,
				cancelAtPeriodEnd: sub.cancel_at_period_end || false,
				currentPeriodStart: sub.current_period_start,
				currentPeriodEnd: sub.current_period_end,
				tutor: {
					id: tutorData?.id || "",
					fullName: tutorData?.full_name || "",
					username: tutorData?.username || "",
					avatarUrl: tutorData?.avatar_url || null,
				},
				template: {
					id: templateData?.id || "",
					lessonsPerMonth: templateData?.lessons_per_month || 0,
					priceCents: templateData?.price_cents || 0,
					currency: templateData?.currency || "USD",
					serviceName: serviceName || "Lesson",
				},
				balance: {
					lessonsAllocated: periodData?.lessons_allocated || 0,
					lessonsRolledOver: periodData?.lessons_rolled_over || 0,
					lessonsUsed: periodData?.lessons_used || 0,
					lessonsAvailable:
						(periodData?.lessons_allocated || 0) +
						(periodData?.lessons_rolled_over || 0) -
						(periodData?.lessons_used || 0),
				},
			};
		});

		logStep(log, "getStudentSubscriptions:success", { count: result.length });

		return { data: result, success: true };
	} catch (error) {
		logStepError(log, "getStudentSubscriptions:error", error, { userId: user.id });
		return { error: "Failed to load subscriptions." };
	}
}

/**
 * Lightweight summary for student header.
 *
 * @returns Total available credits and next renewal date
 */
export async function getStudentSubscriptionSummary(): Promise<
	ActionResult<StudentSubscriptionSummary>
> {
	const result = await getStudentLessonSubscriptions();

	if (result.error) {
		return { error: result.error };
	}

	const data = result.data ?? [];
	const active = data.filter((sub) => sub.status !== "cancelled");
	const totalAvailable = active.reduce(
		(sum, sub) => sum + (sub.balance?.lessonsAvailable || 0),
		0
	);
	const nextRenewal =
		active
			.map((sub) => sub.currentPeriodEnd)
			.filter(Boolean)
			.sort()
			.at(0) || null;

	return {
		data: { totalAvailable, nextRenewal },
		success: true,
	};
}
