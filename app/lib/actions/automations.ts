"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { hasProAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import {
	getTraceId,
	createRequestLogger,
	withActionLogging,
} from "@/lib/logger";
import {
	getThreadByTutorStudent,
	createThread,
	insertMessage,
	updateThreadPreview,
} from "@/lib/repositories/messaging";

// ============================================================================
// Types
// ============================================================================

export type AutomationTriggerType =
	| "lesson_completed"
	| "student_inactive"
	| "package_low_balance"
	| "trial_completed_no_purchase";

export type TriggerSettings = {
	// lesson_completed
	cooldown_hours?: number;
	// student_inactive
	days_inactive?: number;
	// package_low_balance
	threshold_minutes?: number;
	// trial_completed_no_purchase
	delay_hours?: number;
	check_for_package?: boolean;
	check_for_subscription?: boolean;
};

export type AutomationRule = {
	id: string;
	tutor_id: string;
	name: string;
	trigger_type: AutomationTriggerType;
	audience_type: "all_students" | "specific_student";
	target_student_id: string | null;
	message_body: string;
	is_active: boolean;
	trigger_settings: TriggerSettings;
	created_at: string;
	updated_at: string;
};

export type AutomationEvent = {
	id: string;
	tutor_id: string;
	student_id: string;
	booking_id: string | null;
	rule_id: string;
	status: "pending" | "processing" | "sent" | "skipped" | "failed";
	skipped_reason: string | null;
	error_message: string | null;
	scheduled_for: string;
	requires_condition_check: boolean;
	condition_check_data: Record<string, unknown> | null;
	retry_count: number;
	next_retry_at: string | null;
	max_retries: number;
	created_at: string;
	processed_at: string | null;
	students?: {
		full_name: string | null;
	} | null;
};

export type AutomationActionState = {
	error?: string;
	success?: string;
	rule?: AutomationRule;
};

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MESSAGES: Record<AutomationTriggerType, string> = {
	lesson_completed:
		"Great lesson today, {{student_name}}! I'll send your next steps soon.",
	student_inactive:
		"Hi {{student_name}}! It's been a while since our last lesson. I'd love to continue helping you progress. Book your next session here!",
	package_low_balance:
		"Hi {{student_name}}! You're down to your last lesson credit. Renew your package to keep your preferred time slot!",
	trial_completed_no_purchase:
		"Hi {{student_name}}! I hope you enjoyed our trial lesson. I have a specific plan for how we can hit your goals. Book your first full session here!",
};

const DEFAULT_RULE_NAMES: Record<AutomationTriggerType, string> = {
	lesson_completed: "Post-lesson follow-up",
	student_inactive: "Sleeping Giant (Re-engagement)",
	package_low_balance: "Package Low-Balance Alert",
	trial_completed_no_purchase: "Trial Conversion Nudge",
};

const DEFAULT_TRIGGER_SETTINGS: Record<AutomationTriggerType, TriggerSettings> = {
	lesson_completed: { cooldown_hours: 24 },
	student_inactive: { days_inactive: 14, cooldown_hours: 720 }, // 30 days
	package_low_balance: { threshold_minutes: 60, cooldown_hours: 168 }, // 7 days
	trial_completed_no_purchase: {
		delay_hours: 24,
		check_for_package: true,
		check_for_subscription: true,
		cooldown_hours: 168, // 7 days
	},
};

// Legacy constant for backward compatibility
const DEFAULT_MESSAGE = DEFAULT_MESSAGES.lesson_completed;
const COOLDOWN_HOURS = 24;

// ============================================================================
// Schemas
// ============================================================================

const updateRuleSchema = z.object({
	message_body: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
	audience_type: z.enum(["all_students", "specific_student"]),
	target_student_id: z.string().uuid().nullable().optional(),
});

// ============================================================================
// Actions
// ============================================================================

/**
 * Fetches the tutor's automation rule for a specific trigger type
 */
export async function getAutomationRule(
	triggerType: AutomationTriggerType = "lesson_completed"
): Promise<AutomationRule | null> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return null;

	const { data, error } = await supabase
		.from("automation_rules")
		.select("*")
		.eq("tutor_id", user.id)
		.eq("trigger_type", triggerType)
		.single();

	if (error && error.code !== "PGRST116") {
		// PGRST116 = no rows returned
		console.error("[getAutomationRule] Error:", error);
	}

	return data as AutomationRule | null;
}

/**
 * Fetches all automation rules for the current tutor
 */
export async function getAllAutomationRules(): Promise<AutomationRule[]> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return [];

	const { data, error } = await supabase
		.from("automation_rules")
		.select("*")
		.eq("tutor_id", user.id)
		.order("created_at", { ascending: true });

	if (error) {
		console.error("[getAllAutomationRules] Error:", error);
		return [];
	}

	return (data as AutomationRule[]) ?? [];
}

/**
 * One-click activation: creates rule with default message and activates it
 */
export async function activatePostLessonRule(): Promise<AutomationActionState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging("activatePostLessonRule", log, {}, async () => {
		// Check Pro access
		const { data: profile } = await supabase
			.from("profiles")
			.select("plan")
			.eq("id", user.id)
			.single();

		const plan = (profile?.plan as PlatformBillingPlan) || "professional";
		if (!hasProAccess(plan)) {
			return { error: "upgrade_required" };
		}

		// Check if rule already exists
		const { data: existing } = await supabase
			.from("automation_rules")
			.select("id")
			.eq("tutor_id", user.id)
			.eq("trigger_type", "lesson_completed")
			.single();

		if (existing) {
			// Rule exists, just activate it
			const { error: updateError } = await supabase
				.from("automation_rules")
				.update({ is_active: true })
				.eq("id", existing.id);

			if (updateError) {
				console.error("[activatePostLessonRule] Update error:", updateError);
				return { error: "Failed to activate rule." };
			}
		} else {
			// Create new rule
			const { error: insertError } = await supabase.from("automation_rules").insert({
				tutor_id: user.id,
				name: "Post-lesson follow-up",
				trigger_type: "lesson_completed",
				audience_type: "all_students",
				message_body: DEFAULT_MESSAGE,
				is_active: true,
			});

			if (insertError) {
				console.error("[activatePostLessonRule] Insert error:", insertError);
				return { error: "Failed to create rule." };
			}
		}

		revalidatePath("/settings/automations");
		return { success: "Rule is active" };
	});
}

/**
 * Generic activation function for any trigger type
 * Creates rule with default message and activates it
 */
export async function activateAutomationRule(
	triggerType: AutomationTriggerType
): Promise<AutomationActionState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging("activateAutomationRule", log, { triggerType }, async () => {
		// Check Pro access
		const { data: profile } = await supabase
			.from("profiles")
			.select("plan")
			.eq("id", user.id)
			.single();

		const plan = (profile?.plan as PlatformBillingPlan) || "professional";
		if (!hasProAccess(plan)) {
			return { error: "upgrade_required" };
		}

		// Check if rule already exists
		const { data: existing } = await supabase
			.from("automation_rules")
			.select("id, is_active")
			.eq("tutor_id", user.id)
			.eq("trigger_type", triggerType)
			.single();

		if (existing) {
			// Rule exists, just activate it
			const { data: updated, error: updateError } = await supabase
				.from("automation_rules")
				.update({ is_active: true })
				.eq("id", existing.id)
				.select()
				.single();

			if (updateError) {
				console.error("[activateAutomationRule] Update error:", updateError);
				return { error: "Failed to activate rule." };
			}

			revalidatePath("/settings/automations");
			return { success: "Rule is active", rule: updated as AutomationRule };
		}

		// Create new rule with defaults
		const { data: newRule, error: insertError } = await supabase
			.from("automation_rules")
			.insert({
				tutor_id: user.id,
				name: DEFAULT_RULE_NAMES[triggerType],
				trigger_type: triggerType,
				audience_type: "all_students",
				message_body: DEFAULT_MESSAGES[triggerType],
				trigger_settings: DEFAULT_TRIGGER_SETTINGS[triggerType],
				is_active: true,
			})
			.select()
			.single();

		if (insertError) {
			console.error("[activateAutomationRule] Insert error:", insertError);
			return { error: "Failed to create rule." };
		}

		revalidatePath("/settings/automations");
		return { success: "Rule is active", rule: newRule as AutomationRule };
	});
}

/**
 * Updates any automation rule by ID
 */
export async function updateAutomationRuleById(
	ruleId: string,
	input: {
		message_body?: string;
		audience_type?: "all_students" | "specific_student";
		target_student_id?: string | null;
		trigger_settings?: TriggerSettings;
		is_active?: boolean;
	}
): Promise<AutomationActionState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging("updateAutomationRuleById", log, { ruleId }, async () => {
		// Verify ownership
		const { data: existing } = await supabase
			.from("automation_rules")
			.select("id")
			.eq("id", ruleId)
			.eq("tutor_id", user.id)
			.single();

		if (!existing) {
			return { error: "Rule not found." };
		}

		// Validate target_student_id if specific_student
		if (input.audience_type === "specific_student" && !input.target_student_id) {
			return { error: "Please select a student." };
		}

		const updateData: Record<string, unknown> = {};
		if (input.message_body !== undefined) updateData.message_body = input.message_body;
		if (input.audience_type !== undefined) {
			updateData.audience_type = input.audience_type;
			updateData.target_student_id =
				input.audience_type === "specific_student" ? input.target_student_id : null;
		}
		if (input.trigger_settings !== undefined) updateData.trigger_settings = input.trigger_settings;
		if (input.is_active !== undefined) updateData.is_active = input.is_active;

		const { data, error } = await supabase
			.from("automation_rules")
			.update(updateData)
			.eq("id", ruleId)
			.select()
			.single();

		if (error) {
			console.error("[updateAutomationRuleById] Error:", error);
			return { error: "Failed to update rule." };
		}

		revalidatePath("/settings/automations");
		return { success: "Rule updated", rule: data as AutomationRule };
	});
}

/**
 * Toggles any automation rule by ID
 */
export async function toggleAutomationRuleById(ruleId: string): Promise<AutomationActionState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging("toggleAutomationRuleById", log, { ruleId }, async () => {
		// Get current state and verify ownership
		const { data: rule } = await supabase
			.from("automation_rules")
			.select("id, is_active")
			.eq("id", ruleId)
			.eq("tutor_id", user.id)
			.single();

		if (!rule) {
			return { error: "Rule not found." };
		}

		const { error } = await supabase
			.from("automation_rules")
			.update({ is_active: !rule.is_active })
			.eq("id", rule.id);

		if (error) {
			console.error("[toggleAutomationRuleById] Error:", error);
			return { error: "Failed to toggle rule." };
		}

		revalidatePath("/settings/automations");
		return {
			success: rule.is_active ? "Rule paused" : "Rule activated",
		};
	});
}

/**
 * Deletes any automation rule by ID
 */
export async function deleteAutomationRuleById(ruleId: string): Promise<AutomationActionState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging("deleteAutomationRuleById", log, { ruleId }, async () => {
		// Verify ownership
		const { data: existing } = await supabase
			.from("automation_rules")
			.select("id")
			.eq("id", ruleId)
			.eq("tutor_id", user.id)
			.single();

		if (!existing) {
			return { error: "Rule not found." };
		}

		const { error } = await supabase.from("automation_rules").delete().eq("id", ruleId);

		if (error) {
			console.error("[deleteAutomationRuleById] Error:", error);
			return { error: "Failed to delete rule." };
		}

		revalidatePath("/settings/automations");
		return { success: "Rule deleted" };
	});
}

/**
 * Updates the rule's message body and audience settings
 */
export async function updateAutomationRule(
	input: z.infer<typeof updateRuleSchema>
): Promise<AutomationActionState> {
	const parsed = updateRuleSchema.safeParse(input);
	if (!parsed.success) {
		return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
	}

	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging(
		"updateAutomationRule",
		log,
		{ audienceType: parsed.data.audience_type },
		async () => {
			// Validate target_student_id if specific_student
			if (
				parsed.data.audience_type === "specific_student" &&
				!parsed.data.target_student_id
			) {
				return { error: "Please select a student." };
			}

			const updateData: Record<string, unknown> = {
				message_body: parsed.data.message_body,
				audience_type: parsed.data.audience_type,
				target_student_id:
					parsed.data.audience_type === "specific_student"
						? parsed.data.target_student_id
						: null,
			};

			const { data, error } = await supabase
				.from("automation_rules")
				.update(updateData)
				.eq("tutor_id", user.id)
				.eq("trigger_type", "lesson_completed")
				.select()
				.single();

			if (error) {
				console.error("[updateAutomationRule] Error:", error);
				return { error: "Failed to update rule." };
			}

			revalidatePath("/settings/automations");
			return { success: "Rule updated", rule: data as AutomationRule };
		}
	);
}

/**
 * Toggles the rule's is_active status
 */
export async function toggleAutomationRule(): Promise<AutomationActionState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging("toggleAutomationRule", log, {}, async () => {
		// Get current state
		const { data: rule } = await supabase
			.from("automation_rules")
			.select("id, is_active")
			.eq("tutor_id", user.id)
			.eq("trigger_type", "lesson_completed")
			.single();

		if (!rule) {
			return { error: "Rule not found." };
		}

		const { error } = await supabase
			.from("automation_rules")
			.update({ is_active: !rule.is_active })
			.eq("id", rule.id);

		if (error) {
			console.error("[toggleAutomationRule] Error:", error);
			return { error: "Failed to toggle rule." };
		}

		revalidatePath("/settings/automations");
		return {
			success: rule.is_active ? "Rule paused" : "Rule activated",
		};
	});
}

/**
 * Deletes the automation rule
 */
export async function deleteAutomationRule(): Promise<AutomationActionState> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return { error: "You must be signed in." };
	}

	const traceId = await getTraceId();
	const log = createRequestLogger(traceId, user.id);

	return withActionLogging("deleteAutomationRule", log, {}, async () => {
		const { error } = await supabase
			.from("automation_rules")
			.delete()
			.eq("tutor_id", user.id)
			.eq("trigger_type", "lesson_completed");

		if (error) {
			console.error("[deleteAutomationRule] Error:", error);
			return { error: "Failed to delete rule." };
		}

		revalidatePath("/settings/automations");
		return { success: "Rule deleted" };
	});
}

/**
 * Fetches recent automation events for activity list
 */
export async function getAutomationActivity(
	limit: number = 10
): Promise<AutomationEvent[]> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return [];

	const { data, error } = await supabase
		.from("automation_events")
		.select(
			`
			*,
			students (
				full_name
			)
		`
		)
		.eq("tutor_id", user.id)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		console.error("[getAutomationActivity] Error:", error);
		return [];
	}

	return (data as AutomationEvent[]) ?? [];
}

/**
 * Processes pending automation events (called by cron)
 * Claims events, checks cooldowns, sends messages
 * Supports scheduled events, condition checks, retry logic, and opt-out checking
 */
export async function processAutomationEvents(): Promise<{
	processed: number;
	sent: number;
	skipped: number;
	failed: number;
	retried: number;
}> {
	const adminClient = createServiceRoleClient();
	if (!adminClient) {
		console.error("[processAutomationEvents] No admin client available");
		return { processed: 0, sent: 0, skipped: 0, failed: 0, retried: 0 };
	}

	let processed = 0;
	let sent = 0;
	let skipped = 0;
	let failed = 0;
	let retried = 0;

	const now = new Date().toISOString();

	// Find pending events that are ready to process (scheduled_for <= NOW)
	// Limit to 50 per run to avoid timeouts
	const { data: pendingIds, error: pendingError } = await adminClient
		.from("automation_events")
		.select("id")
		.eq("status", "pending")
		.lte("scheduled_for", now)
		.order("scheduled_for", { ascending: true })
		.limit(50);

	if (pendingError) {
		console.error("[processAutomationEvents] Pending fetch error:", pendingError);
		return { processed: 0, sent: 0, skipped: 0, failed: 0, retried: 0 };
	}

	if (!pendingIds || pendingIds.length === 0) {
		return { processed: 0, sent: 0, skipped: 0, failed: 0, retried: 0 };
	}

	// Claim pending events
	const { data: pendingEvents, error: claimError } = await adminClient
		.from("automation_events")
		.update({ status: "processing" })
		.in(
			"id",
			pendingIds.map((event) => event.id)
		)
		.eq("status", "pending")
		.select(
			`
			*,
			automation_rules (
				message_body,
				audience_type,
				target_student_id,
				is_active,
				trigger_type,
				trigger_settings
			),
			students (
				full_name,
				email
			)
		`
		);

	if (claimError) {
		console.error("[processAutomationEvents] Claim error:", claimError);
		return { processed: 0, sent: 0, skipped: 0, failed: 0, retried: 0 };
	}

	if (!pendingEvents || pendingEvents.length === 0) {
		return { processed: 0, sent: 0, skipped: 0, failed: 0, retried: 0 };
	}

	for (const event of pendingEvents) {
		processed++;
		const rule = event.automation_rules as {
			message_body: string;
			audience_type: string;
			target_student_id: string | null;
			is_active: boolean;
			trigger_type: AutomationTriggerType;
			trigger_settings: TriggerSettings;
		} | null;
		const student = event.students as { full_name: string | null; email: string | null } | null;

		if (!rule) {
			await markEventFailed(adminClient, event.id, "Rule not found");
			failed++;
			continue;
		}

		if (!rule.is_active) {
			await markEventSkipped(adminClient, event.id, "rule_inactive");
			skipped++;
			continue;
		}

		if (
			rule.audience_type === "specific_student" &&
			rule.target_student_id &&
			rule.target_student_id !== event.student_id
		) {
			await markEventSkipped(adminClient, event.id, "student_mismatch");
			skipped++;
			continue;
		}

		// Check email suppressions (opt-out)
		if (student?.email) {
			const { data: suppression } = await adminClient
				.from("email_suppressions")
				.select("id")
				.eq("email", student.email.toLowerCase())
				.single();

			if (suppression) {
				await markEventSkipped(adminClient, event.id, "student_opted_out");
				skipped++;
				continue;
			}
		}

		// Condition check for trial_completed_no_purchase
		if (event.requires_condition_check && event.condition_check_data) {
			const checkData = event.condition_check_data as {
				check_for_package?: boolean;
				check_for_subscription?: boolean;
			};

			// Check if student has an active package
			if (checkData.check_for_package) {
				const { data: activePackage } = await adminClient
					.from("session_package_purchases")
					.select("id")
					.eq("student_id", event.student_id)
					.gt("remaining_minutes", 0)
					.gte("expires_at", now)
					.limit(1)
					.single();

				if (activePackage) {
					await markEventSkipped(adminClient, event.id, "student_has_package");
					skipped++;
					continue;
				}
			}

			// Check if student has an active subscription
			if (checkData.check_for_subscription) {
				const { data: activeSubscription } = await adminClient
					.from("lesson_subscriptions")
					.select("id")
					.eq("student_id", event.student_id)
					.eq("status", "active")
					.limit(1)
					.single();

				if (activeSubscription) {
					await markEventSkipped(adminClient, event.id, "student_has_subscription");
					skipped++;
					continue;
				}
			}
		}

		// Package low balance validation at send time (avoid stale alerts)
		if (rule.trigger_type === "package_low_balance" && event.condition_check_data) {
			const packageCheck = event.condition_check_data as {
				package_id?: string;
			};
			const packageId = packageCheck.package_id;

			if (packageId) {
				const thresholdMinutes = rule.trigger_settings?.threshold_minutes ?? 60;
				const { data: pkg } = await adminClient
					.from("session_package_purchases")
					.select("remaining_minutes, expires_at")
					.eq("id", packageId)
					.eq("student_id", event.student_id)
					.gt("remaining_minutes", 0)
					.gte("expires_at", now)
					.single();

				if (!pkg) {
					await markEventSkipped(adminClient, event.id, "package_not_active");
					skipped++;
					continue;
				}

				if (pkg.remaining_minutes > thresholdMinutes) {
					await markEventSkipped(adminClient, event.id, "package_balance_recovered");
					skipped++;
					continue;
				}
			}
		}

		const contextKey =
			rule.trigger_type === "package_low_balance"
				? ((event.condition_check_data as { package_id?: string } | null)?.package_id ?? "")
				: "";

		// Get configurable cooldown from trigger_settings
		const cooldownHours = rule.trigger_settings?.cooldown_hours ?? COOLDOWN_HOURS;

		// Check cooldown
		const { data: cooldown } = await adminClient
			.from("automation_cooldowns")
			.select("last_sent_at")
			.eq("tutor_id", event.tutor_id)
			.eq("student_id", event.student_id)
			.eq("rule_id", event.rule_id)
			.eq("context_key", contextKey)
			.single();

		if (cooldown) {
			const lastSent = new Date(cooldown.last_sent_at);
			const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);

			if (hoursSince < cooldownHours) {
				await markEventSkipped(adminClient, event.id, "cooldown_active");
				skipped++;
				continue;
			}
		}

		// Get additional context for template variables
		const tutorProfile = await getTutorProfile(adminClient, event.tutor_id);
		const packageInfo = await getStudentPackageInfo(adminClient, event.student_id);
		const lastLessonDate = await getLastLessonDate(adminClient, event.student_id, event.tutor_id);
		const bookingLink = `${process.env.NEXT_PUBLIC_APP_URL}/book/${tutorProfile?.username || ""}`;

		// Prepare message with expanded variable substitution
		const messageBody = expandTemplateVariables(rule.message_body, {
			student_name: student?.full_name || "there",
			tutor_name: tutorProfile?.full_name || "Your tutor",
			package_remaining: packageInfo?.remaining_minutes?.toString() || "0",
			lesson_date: lastLessonDate || "your last lesson",
			booking_link: bookingLink,
		});

		try {
			// Get or create thread
			let threadId: string;
			const { data: existingThread } = await getThreadByTutorStudent(
				adminClient,
				event.tutor_id,
				event.student_id
			);

			if (existingThread) {
				threadId = existingThread.id;
			} else {
				const { data: newThread, error: threadError } = await createThread(adminClient, {
					tutorId: event.tutor_id,
					studentId: event.student_id,
				});

				if (threadError || !newThread) {
					throw new Error("Failed to create thread");
				}
				threadId = newThread.id;
			}

			// Send message
			const { error: messageError } = await insertMessage(adminClient, {
				threadId,
				tutorId: event.tutor_id,
				studentId: event.student_id,
				senderRole: "tutor",
				body: messageBody,
				readByTutor: true,
				readByStudent: false,
			});

			if (messageError) {
				throw messageError;
			}

			// Update thread preview
			await updateThreadPreview(adminClient, threadId, {
				lastMessagePreview: messageBody.slice(0, 160),
				lastMessageAt: now,
				tutorUnread: false,
				studentUnread: true,
			});

			// Update cooldown
			await adminClient.from("automation_cooldowns").upsert(
				{
					tutor_id: event.tutor_id,
					student_id: event.student_id,
					rule_id: event.rule_id,
					context_key: contextKey,
					last_sent_at: now,
				},
				{ onConflict: "tutor_id,student_id,rule_id,context_key" }
			);

			// Mark event as sent
			await adminClient
				.from("automation_events")
				.update({ status: "sent", processed_at: now })
				.eq("id", event.id);

			sent++;
		} catch (err) {
			console.error("[processAutomationEvents] Send error:", err);

			// Retry logic with exponential backoff
			const retryCount = event.retry_count ?? 0;
			const maxRetries = event.max_retries ?? 3;

			if (retryCount < maxRetries) {
				const backoffMinutes = Math.pow(2, retryCount) * 5; // 5, 10, 20 min
				const nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000).toISOString();

				await adminClient
					.from("automation_events")
					.update({
						status: "pending",
						retry_count: retryCount + 1,
						next_retry_at: nextRetryAt,
						scheduled_for: nextRetryAt,
						error_message: err instanceof Error ? err.message : "Unknown error",
					})
					.eq("id", event.id);

				retried++;
			} else {
				await markEventFailed(
					adminClient,
					event.id,
					`Max retries exceeded: ${err instanceof Error ? err.message : "Unknown error"}`
				);
				failed++;
			}
		}
	}

	return { processed, sent, skipped, failed, retried };
}

// ============================================================================
// Helpers
// ============================================================================

async function markEventSkipped(
	client: ReturnType<typeof createServiceRoleClient>,
	eventId: string,
	reason: string
) {
	if (!client) return;
	await client
		.from("automation_events")
		.update({
			status: "skipped",
			skipped_reason: reason,
			processed_at: new Date().toISOString(),
		})
		.eq("id", eventId);
}

async function markEventFailed(
	client: ReturnType<typeof createServiceRoleClient>,
	eventId: string,
	errorMessage: string
) {
	if (!client) return;
	await client
		.from("automation_events")
		.update({
			status: "failed",
			error_message: errorMessage,
			processed_at: new Date().toISOString(),
		})
		.eq("id", eventId);
}

/**
 * Expands template variables in a message body
 */
function expandTemplateVariables(
	template: string,
	variables: Record<string, string>
): string {
	let result = template;
	for (const [key, value] of Object.entries(variables)) {
		const regex = new RegExp(`\\{\\{${key}\\}\\}`, "gi");
		result = result.replace(regex, value);
	}
	return result;
}

/**
 * Gets tutor profile for template variables
 */
async function getTutorProfile(
	client: ReturnType<typeof createServiceRoleClient>,
	tutorId: string
): Promise<{ full_name: string | null; username: string | null } | null> {
	if (!client) return null;

	const { data } = await client
		.from("profiles")
		.select("full_name, username")
		.eq("id", tutorId)
		.single();

	return data;
}

/**
 * Gets student package info for template variables
 */
async function getStudentPackageInfo(
	client: ReturnType<typeof createServiceRoleClient>,
	studentId: string
): Promise<{ remaining_minutes: number } | null> {
	if (!client) return null;

	const { data } = await client
		.from("session_package_purchases")
		.select("remaining_minutes")
		.eq("student_id", studentId)
		.gt("remaining_minutes", 0)
		.gte("expires_at", new Date().toISOString())
		.order("remaining_minutes", { ascending: true })
		.limit(1)
		.single();

	return data;
}

/**
 * Gets the last lesson date for a student (formatted)
 */
async function getLastLessonDate(
	client: ReturnType<typeof createServiceRoleClient>,
	studentId: string,
	tutorId: string
): Promise<string | null> {
	if (!client) return null;

	const { data } = await client
		.from("bookings")
		.select("scheduled_at")
		.eq("student_id", studentId)
		.eq("tutor_id", tutorId)
		.eq("status", "completed")
		.order("scheduled_at", { ascending: false })
		.limit(1)
		.single();

	if (!data?.scheduled_at) return null;

	// Format the date nicely
	const date = new Date(data.scheduled_at);
	return date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
}

/**
 * Get students for the student selector in the customize drawer
 */
export async function getStudentsForSelector(): Promise<
	{ id: string; full_name: string | null }[]
> {
	const supabase = await createClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) return [];

	const { data, error } = await supabase
		.from("students")
		.select("id, full_name")
		.eq("tutor_id", user.id)
		.is("deleted_at", null)
		.order("full_name", { ascending: true });

	if (error) {
		console.error("[getStudentsForSelector] Error:", error);
		return [];
	}

	return data ?? [];
}
