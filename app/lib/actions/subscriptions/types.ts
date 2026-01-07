/**
 * Subscriptions Module - Shared Types
 *
 * Types used across the subscription action modules:
 * - credits.ts (credit management)
 * - billing.ts (subscription lifecycle)
 * - tiers.ts (template management)
 *
 * @module lib/actions/subscriptions/types
 */

// Re-export core types from subscription lib
export type {
	TemplateTier,
	LessonSubscriptionTemplate,
	SubscriptionBalance,
	SubscriptionWithDetails,
	CreateSubscriptionTemplateInput,
	UpdateSubscriptionTemplateInput,
} from "@/lib/subscription";

// ============================================================================
// Action Result Types
// ============================================================================

export interface ActionSuccess<T = undefined> {
	data?: T;
	success: true;
	error?: never;
}

export interface ActionError {
	data?: never;
	success?: false;
	error: string;
}

export type ActionResult<T = undefined> = ActionSuccess<T> | ActionError;

// ============================================================================
// Credit Operations
// ============================================================================

export interface RedeemCreditInput {
	subscriptionId: string;
	bookingId: string;
	lessonsCount?: number;
	studentId?: string; // For audit trail
}

export interface RedeemCreditResult {
	success: boolean;
	cached?: boolean;
	newBalance?: number;
}

export interface RefundCreditResult {
	success: boolean;
	refunded: boolean;
}

// ============================================================================
// Student Portal Views
// ============================================================================

export interface StudentSubscriptionView {
	id: string;
	status: string;
	cancelAtPeriodEnd: boolean;
	currentPeriodStart: string;
	currentPeriodEnd: string;
	tutor: {
		id: string;
		fullName: string;
		username: string;
		avatarUrl: string | null;
	};
	template: {
		id: string;
		lessonsPerMonth: number;
		priceCents: number;
		currency: string;
		serviceName: string;
	};
	balance: {
		lessonsAllocated: number;
		lessonsRolledOver: number;
		lessonsUsed: number;
		lessonsAvailable: number;
	};
}

export interface StudentSubscriptionSummary {
	totalAvailable: number;
	nextRenewal: string | null;
}

// ============================================================================
// Template Subscribers
// ============================================================================

export interface TemplateSubscriberView {
	template: import("@/lib/subscription").LessonSubscriptionTemplate;
	subscribers: Array<{
		subscription_id: string;
		student_id: string;
		student_name: string;
		student_email: string;
		status: string;
		lessons_used: number;
		lessons_available: number;
		period_ends_at: string;
	}>;
}

// ============================================================================
// Tier Configuration
// ============================================================================

export interface TierConfig {
	tier_id: import("@/lib/subscription").TemplateTier;
	price_cents: number | null;
}
