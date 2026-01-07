import type { HomeworkAttachment } from "@/lib/repositories/homework";

// ============================================================================
// Data Normalization
// ============================================================================

/**
 * Normalize homework attachments array.
 * Filters invalid entries and ensures required fields.
 */
export function normalizeAttachments(
	attachments?: HomeworkAttachment[] | null
): HomeworkAttachment[] {
	if (!attachments || !Array.isArray(attachments)) return [];
	return attachments
		.filter((att) => att && typeof att === "object")
		.map((att) => ({
			label: att.label || "Resource",
			url: att.url,
			type: att.type ?? "link",
		}))
		.filter((att) => !!att.url);
}

// ============================================================================
// Subscription Check Helpers
// ============================================================================

/**
 * Check if a student has active AI Practice subscription.
 */
export function isSubscriptionActive(student: {
	ai_practice_enabled?: boolean;
	ai_practice_current_period_end?: string | null;
	ai_practice_free_tier_enabled?: boolean;
}): boolean {
	const isPaidActive =
		student.ai_practice_enabled === true &&
		(!student.ai_practice_current_period_end ||
			new Date(student.ai_practice_current_period_end) > new Date());
	const isFreeActive = student.ai_practice_free_tier_enabled === true;
	return isPaidActive || isFreeActive;
}
