import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	LessonSubscriptionTemplate,
	SubscriptionWithDetails,
} from "@/lib/subscription";

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionBasic {
	id: string;
	status: string;
	student_id: string;
	tutor_id: string;
	template_id: string;
	stripe_subscription_id: string | null;
	cancel_at_period_end: boolean;
	current_period_start: string;
	current_period_end: string;
}

export interface SubscriptionWithStudent {
	id: string;
	stripe_subscription_id: string | null;
	tutor_id: string;
	student: { user_id: string | null }[];
}

export interface SubscriberInfo {
	subscription_id: string;
	student_id: string;
	student_name: string;
	student_email: string;
	status: string;
	lessons_used: number;
	lessons_available: number;
	period_ends_at: string;
}

// ============================================================================
// Template Operations
// ============================================================================

/**
 * Get a subscription template by ID with tutor ownership check.
 *
 * @param client - Supabase client
 * @param templateId - Template ID
 * @param tutorId - Tutor ID for ownership verification
 * @returns Template or null
 */
export async function getTemplateByIdForTutor(
	client: SupabaseClient,
	templateId: string,
	tutorId: string
): Promise<LessonSubscriptionTemplate | null> {
	const { data, error } = await client
		.from("lesson_subscription_templates")
		.select("*")
		.eq("id", templateId)
		.eq("tutor_id", tutorId)
		.single();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return data as LessonSubscriptionTemplate | null;
}

/**
 * Get subscription templates for a specific service.
 *
 * @param client - Supabase client
 * @param serviceId - Service ID
 * @param tutorId - Tutor ID for ownership verification
 * @returns Array of templates
 */
export async function getTemplatesForService(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<LessonSubscriptionTemplate[]> {
	const { data, error } = await client
		.from("lesson_subscription_templates")
		.select("*")
		.eq("service_id", serviceId)
		.eq("tutor_id", tutorId)
		.order("lessons_per_month", { ascending: true });

	if (error) {
		throw error;
	}

	return (data ?? []) as LessonSubscriptionTemplate[];
}

/**
 * Get all templates for a tutor.
 *
 * @param client - Supabase client
 * @param tutorId - Tutor ID
 * @returns Array of templates
 */
export async function getTemplatesForTutor(
	client: SupabaseClient,
	tutorId: string
): Promise<LessonSubscriptionTemplate[]> {
	const { data, error } = await client
		.from("lesson_subscription_templates")
		.select("*")
		.eq("tutor_id", tutorId)
		.order("created_at", { ascending: false });

	if (error) {
		throw error;
	}

	return (data ?? []) as LessonSubscriptionTemplate[];
}

/**
 * Get active templates for a service (public view).
 *
 * @param client - Supabase client
 * @param serviceId - Service ID
 * @returns Array of active templates
 */
export async function getActiveTemplatesForService(
	client: SupabaseClient,
	serviceId: string
): Promise<LessonSubscriptionTemplate[]> {
	const { data, error } = await client
		.from("lesson_subscription_templates")
		.select("*")
		.eq("service_id", serviceId)
		.eq("is_active", true)
		.order("lessons_per_month", { ascending: true });

	if (error) {
		throw error;
	}

	return (data ?? []) as LessonSubscriptionTemplate[];
}

/**
 * Insert a new subscription template.
 *
 * @param client - Supabase client
 * @param data - Template data
 * @returns Created template
 */
export async function insertTemplate(
	client: SupabaseClient,
	data: {
		tutor_id: string;
		service_id: string;
		lessons_per_month: number;
		template_tier: string;
		price_cents: number;
		currency: string;
		stripe_product_id: string | null;
		stripe_price_id: string | null;
		max_rollover_lessons: number | null;
		is_active: boolean;
	}
): Promise<LessonSubscriptionTemplate> {
	const { data: template, error } = await client
		.from("lesson_subscription_templates")
		.insert(data)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return template as LessonSubscriptionTemplate;
}

/**
 * Update a subscription template.
 *
 * @param client - Supabase client
 * @param templateId - Template ID
 * @param tutorId - Tutor ID for ownership verification
 * @param data - Fields to update
 * @returns Updated template
 */
export async function updateTemplate(
	client: SupabaseClient,
	templateId: string,
	tutorId: string,
	data: Partial<{
		price_cents: number;
		is_active: boolean;
		max_rollover_lessons: number | null;
		stripe_price_id: string | null;
	}>
): Promise<LessonSubscriptionTemplate> {
	const { data: template, error } = await client
		.from("lesson_subscription_templates")
		.update(data)
		.eq("id", templateId)
		.eq("tutor_id", tutorId)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return template as LessonSubscriptionTemplate;
}

/**
 * Deactivate all templates for a service.
 *
 * @param client - Supabase client
 * @param serviceId - Service ID
 * @param tutorId - Tutor ID
 */
export async function deactivateTemplatesForService(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<void> {
	const { error } = await client
		.from("lesson_subscription_templates")
		.update({ is_active: false })
		.eq("service_id", serviceId)
		.eq("tutor_id", tutorId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Subscription Operations
// ============================================================================

/**
 * Check if a student has an active subscription with a tutor.
 *
 * @param client - Supabase client
 * @param studentId - Student ID
 * @param tutorId - Tutor ID
 * @returns True if active subscription exists
 */
export async function hasActiveSubscription(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<boolean> {
	const { data, error } = await client
		.from("lesson_subscriptions")
		.select("id")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.in("status", ["active", "trialing"])
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return !!data;
}

/**
 * Get a student's subscription with a tutor.
 *
 * @param client - Supabase client
 * @param studentId - Student ID
 * @param tutorId - Tutor ID
 * @returns Subscription with details or null
 */
export async function getSubscriptionWithDetails(
	client: SupabaseClient,
	studentId: string,
	tutorId: string
): Promise<SubscriptionWithDetails | null> {
	const { data, error } = await client
		.from("lesson_subscriptions")
		.select(`
			*,
			template:lesson_subscription_templates!inner (*),
			current_period:lesson_allowance_periods (*)
		`)
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.eq("current_period.is_current", true)
		.maybeSingle();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	if (!data) {
		return null;
	}

	// Flatten the nested current_period array
	return {
		...data,
		template: data.template,
		current_period: Array.isArray(data.current_period)
			? data.current_period[0] || null
			: data.current_period,
	} as SubscriptionWithDetails;
}

/**
 * Get subscription with student info for authorization check.
 *
 * @param client - Supabase client
 * @param subscriptionId - Subscription ID
 * @returns Subscription with student info
 */
export async function getSubscriptionForAuth(
	client: SupabaseClient,
	subscriptionId: string
): Promise<SubscriptionWithStudent | null> {
	const { data, error } = await client
		.from("lesson_subscriptions")
		.select(`
			id,
			stripe_subscription_id,
			tutor_id,
			student:students!inner (
				user_id
			)
		`)
		.eq("id", subscriptionId)
		.single();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return data as SubscriptionWithStudent | null;
}

/**
 * Update subscription cancel_at_period_end flag.
 *
 * @param client - Supabase client (admin recommended)
 * @param subscriptionId - Subscription ID
 * @param cancelAtPeriodEnd - New value
 */
export async function updateSubscriptionCancelAt(
	client: SupabaseClient,
	subscriptionId: string,
	cancelAtPeriodEnd: boolean
): Promise<void> {
	const { error } = await client
		.from("lesson_subscriptions")
		.update({ cancel_at_period_end: cancelAtPeriodEnd })
		.eq("id", subscriptionId);

	if (error) {
		throw error;
	}
}

/**
 * Get subscribers for a template with balance info.
 *
 * @param client - Supabase client
 * @param templateId - Template ID
 * @returns Array of subscriber info
 */
export async function getTemplateSubscribers(
	client: SupabaseClient,
	templateId: string
): Promise<SubscriberInfo[]> {
	const { data, error } = await client
		.from("lesson_subscriptions")
		.select(`
			id,
			status,
			current_period_end,
			student:students!inner (
				id,
				full_name,
				email
			),
			current_period:lesson_allowance_periods!inner (
				lessons_allocated,
				lessons_rolled_over,
				lessons_used
			)
		`)
		.eq("template_id", templateId)
		.eq("current_period.is_current", true)
		.in("status", ["active", "past_due", "trialing"]);

	if (error) {
		throw error;
	}

	return (data || []).map((sub: {
		id: string;
		status: string;
		current_period_end: string;
		student: { id: string; full_name: string; email: string }[];
		current_period: { lessons_allocated: number; lessons_rolled_over: number; lessons_used: number }[];
	}) => {
		const student = sub.student[0];
		const period = sub.current_period[0];
		return {
			subscription_id: sub.id,
			student_id: student?.id ?? "",
			student_name: student?.full_name ?? "",
			student_email: student?.email ?? "",
			status: sub.status,
			lessons_used: period?.lessons_used ?? 0,
			lessons_available:
				(period?.lessons_allocated ?? 0) +
				(period?.lessons_rolled_over ?? 0) -
				(period?.lessons_used ?? 0),
			period_ends_at: sub.current_period_end,
		};
	});
}

/**
 * Get student records by user ID.
 *
 * @param client - Supabase client
 * @param userId - Auth user ID
 * @returns Array of student IDs
 */
export async function getStudentIdsByUserId(
	client: SupabaseClient,
	userId: string
): Promise<string[]> {
	const { data, error } = await client
		.from("students")
		.select("id")
		.eq("user_id", userId);

	if (error) {
		throw error;
	}

	return (data ?? []).map((s) => s.id);
}

/**
 * Get student subscriptions with full details for student portal.
 *
 * @param client - Supabase client
 * @param studentIds - Array of student IDs
 * @returns Raw subscription data
 */
export async function getStudentSubscriptionsWithDetails(
	client: SupabaseClient,
	studentIds: string[]
): Promise<any[]> {
	const { data, error } = await client
		.from("lesson_subscriptions")
		.select(`
			id,
			status,
			cancel_at_period_end,
			current_period_start,
			current_period_end,
			tutor:profiles!lesson_subscriptions_tutor_id_fkey (
				id,
				full_name,
				username,
				avatar_url
			),
			template:lesson_subscription_templates!lesson_subscriptions_template_id_fkey (
				id,
				lessons_per_month,
				price_cents,
				currency,
				service:services!lesson_subscription_templates_service_id_fkey (
					name
				)
			),
			current_period:lesson_allowance_periods (
				lessons_allocated,
				lessons_rolled_over,
				lessons_used
			)
		`)
		.in("student_id", studentIds)
		.in("status", ["active", "past_due", "trialing"])
		.eq("current_period.is_current", true);

	if (error) {
		throw error;
	}

	return data ?? [];
}

// ============================================================================
// Service Operations
// ============================================================================

/**
 * Verify service ownership.
 *
 * @param client - Supabase client
 * @param serviceId - Service ID
 * @param tutorId - Tutor ID
 * @returns Service info or null
 */
export async function verifyServiceOwnership(
	client: SupabaseClient,
	serviceId: string,
	tutorId: string
): Promise<{ id: string; name: string } | null> {
	const { data, error } = await client
		.from("services")
		.select("id, name")
		.eq("id", serviceId)
		.eq("tutor_id", tutorId)
		.single();

	if (error && error.code !== "PGRST116") {
		throw error;
	}

	return data as { id: string; name: string } | null;
}

/**
 * Update service subscriptions_enabled flag.
 *
 * @param client - Supabase client
 * @param serviceId - Service ID
 * @param enabled - New value
 */
export async function updateServiceSubscriptionsEnabled(
	client: SupabaseClient,
	serviceId: string,
	enabled: boolean
): Promise<void> {
	const { error } = await client
		.from("services")
		.update({ subscriptions_enabled: enabled })
		.eq("id", serviceId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Balance & Credit Operations (RPC Wrappers)
// ============================================================================

export interface SubscriptionBalance {
	total_available: number;
	lessons_allocated: number;
	lessons_rolled_over: number;
	lessons_used: number;
	period_ends_at: string;
}

/**
 * Get subscription balance via RPC function.
 *
 * @param client - Supabase client
 * @param subscriptionId - Subscription ID
 * @returns Balance info or null if no current period
 */
export async function getSubscriptionBalanceRpc(
	client: SupabaseClient,
	subscriptionId: string
): Promise<SubscriptionBalance | null> {
	const { data, error } = await client.rpc("get_subscription_balance", {
		p_subscription_id: subscriptionId,
	});

	if (error) {
		throw error;
	}

	if (!data || (Array.isArray(data) && data.length === 0)) {
		return null;
	}

	const balance = Array.isArray(data) ? data[0] : data;
	return balance as SubscriptionBalance;
}

/**
 * Redeem subscription lesson via RPC function.
 * This is atomic and handles row locking.
 *
 * @param client - Supabase client (admin recommended)
 * @param subscriptionId - Subscription ID
 * @param bookingId - Booking ID to redeem for
 * @param lessonsCount - Number of lessons to redeem (default 1)
 * @returns True on success
 * @throws Error if insufficient credits or subscription not found
 */
export async function redeemSubscriptionLessonRpc(
	client: SupabaseClient,
	subscriptionId: string,
	bookingId: string,
	lessonsCount: number = 1
): Promise<boolean> {
	const { data, error } = await client.rpc("redeem_subscription_lesson", {
		p_subscription_id: subscriptionId,
		p_booking_id: bookingId,
		p_lessons_count: lessonsCount,
	});

	if (error) {
		throw error;
	}

	return data as boolean;
}

/**
 * Refund subscription lesson via RPC function.
 *
 * @param client - Supabase client (admin recommended)
 * @param bookingId - Booking ID to refund
 * @returns True if refund was applied, false if no redemption found
 */
export async function refundSubscriptionLessonRpc(
	client: SupabaseClient,
	bookingId: string
): Promise<boolean> {
	const { data, error } = await client.rpc("refund_subscription_lesson", {
		p_booking_id: bookingId,
	});

	if (error) {
		throw error;
	}

	return data as boolean;
}

// ============================================================================
// Period Operations
// ============================================================================

export interface AllowancePeriod {
	id: string;
	subscription_id: string;
	period_start: string;
	period_end: string;
	lessons_allocated: number;
	lessons_rolled_over: number;
	lessons_used: number;
	is_current: boolean;
	finalized_at: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Get the current allowance period for a subscription.
 *
 * @param client - Supabase client
 * @param subscriptionId - Subscription ID
 * @returns Current period or null
 */
export async function getCurrentPeriod(
	client: SupabaseClient,
	subscriptionId: string
): Promise<AllowancePeriod | null> {
	const { data, error } = await client
		.from("lesson_allowance_periods")
		.select("*")
		.eq("subscription_id", subscriptionId)
		.eq("is_current", true)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as AllowancePeriod;
}

/**
 * Get a period by ID.
 *
 * @param client - Supabase client
 * @param periodId - Period ID
 * @returns Period or null
 */
export async function getPeriodById(
	client: SupabaseClient,
	periodId: string
): Promise<AllowancePeriod | null> {
	const { data, error } = await client
		.from("lesson_allowance_periods")
		.select("*")
		.eq("id", periodId)
		.single();

	if (error) {
		if (error.code === "PGRST116") {
			return null;
		}
		throw error;
	}

	return data as AllowancePeriod;
}

/**
 * Update lessons_rolled_over on a period (for cross-period refunds).
 *
 * @param client - Supabase client (admin recommended)
 * @param periodId - Period ID
 * @param newRolledOver - New rolled over value
 */
export async function updatePeriodRollover(
	client: SupabaseClient,
	periodId: string,
	newRolledOver: number
): Promise<void> {
	const { error } = await client
		.from("lesson_allowance_periods")
		.update({ lessons_rolled_over: newRolledOver })
		.eq("id", periodId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Redemption Operations
// ============================================================================

export interface Redemption {
	id: string;
	period_id: string;
	booking_id: string;
	lessons_redeemed: number;
	refunded_at: string | null;
	created_at: string;
}

/**
 * Get a redemption record by booking ID.
 *
 * @param client - Supabase client
 * @param bookingId - Booking ID
 * @returns Redemption or null
 */
export async function getRedemptionByBookingId(
	client: SupabaseClient,
	bookingId: string
): Promise<Redemption | null> {
	const { data, error } = await client
		.from("lesson_subscription_redemptions")
		.select("*")
		.eq("booking_id", bookingId)
		.maybeSingle();

	if (error) {
		throw error;
	}

	return data as Redemption | null;
}

/**
 * Get redemption with period and template info for cross-period refunds.
 *
 * @param client - Supabase client
 * @param bookingId - Booking ID
 * @returns Redemption with related data or null
 */
export async function getRedemptionWithPeriodAndTemplate(
	client: SupabaseClient,
	bookingId: string
): Promise<{
	redemption: Redemption;
	period: AllowancePeriod;
	template: { max_rollover_lessons: number | null; lessons_per_month: number } | null;
} | null> {
	// Get redemption
	const redemption = await getRedemptionByBookingId(client, bookingId);
	if (!redemption || redemption.refunded_at) {
		return null;
	}

	// Get period
	const period = await getPeriodById(client, redemption.period_id);
	if (!period) {
		return null;
	}

	// Get template for rollover limits
	const { data: subscription, error: subError } = await client
		.from("lesson_subscriptions")
		.select(`
			template:lesson_subscription_templates (
				max_rollover_lessons,
				lessons_per_month
			)
		`)
		.eq("id", period.subscription_id)
		.single();

	if (subError) {
		throw subError;
	}

	const templateData = Array.isArray(subscription?.template)
		? subscription.template[0]
		: subscription?.template;

	return {
		redemption,
		period,
		template: templateData ?? null,
	};
}

/**
 * Mark a redemption as refunded.
 *
 * @param client - Supabase client (admin recommended)
 * @param redemptionId - Redemption ID
 */
export async function markRedemptionRefunded(
	client: SupabaseClient,
	redemptionId: string
): Promise<void> {
	const { error } = await client
		.from("lesson_subscription_redemptions")
		.update({ refunded_at: new Date().toISOString() })
		.eq("id", redemptionId);

	if (error) {
		throw error;
	}
}

// ============================================================================
// Subscription Status Operations
// ============================================================================

/**
 * Update subscription status and/or cancel_at_period_end.
 *
 * @param client - Supabase client (admin recommended)
 * @param subscriptionId - Subscription ID
 * @param updates - Status and/or cancelAtPeriodEnd to update
 */
export async function updateSubscriptionStatus(
	client: SupabaseClient,
	subscriptionId: string,
	updates: {
		status?: string;
		cancelAtPeriodEnd?: boolean;
	}
): Promise<void> {
	const updateData: Record<string, unknown> = {};

	if (updates.status !== undefined) {
		updateData.status = updates.status;
	}
	if (updates.cancelAtPeriodEnd !== undefined) {
		updateData.cancel_at_period_end = updates.cancelAtPeriodEnd;
	}

	const { error } = await client
		.from("lesson_subscriptions")
		.update(updateData)
		.eq("id", subscriptionId);

	if (error) {
		throw error;
	}
}
