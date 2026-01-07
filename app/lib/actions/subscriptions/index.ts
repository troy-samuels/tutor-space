/**
 * Subscriptions Module - Barrel Export
 *
 * This module provides subscription management functionality with:
 * - Idempotency protection on credit operations
 * - Audit logging for compliance (GDPR/SOC2)
 * - Structured observability with traceId
 * - Repository pattern for database operations
 *
 * @module lib/actions/subscriptions
 */

// ============================================================================
// Types
// ============================================================================

export type {
	TemplateTier,
	LessonSubscriptionTemplate,
	SubscriptionBalance,
	SubscriptionWithDetails,
	CreateSubscriptionTemplateInput,
	UpdateSubscriptionTemplateInput,
	ActionResult,
	RedeemCreditResult,
	RefundCreditResult,
	StudentSubscriptionView,
	StudentSubscriptionSummary,
	TemplateSubscriberView,
	TierConfig,
} from "./types";

// ============================================================================
// Credit Management (CRITICAL - with idempotency + audit)
// ============================================================================

export {
	getSubscriptionBalance,
	redeemSubscriptionLesson,
	refundSubscriptionLesson,
} from "./credits";

// ============================================================================
// Subscription Lifecycle
// ============================================================================

export {
	hasActiveSubscription,
	getStudentSubscription,
	cancelSubscription,
	getStudentLessonSubscriptions,
	getStudentSubscriptionSummary,
} from "./billing";

// ============================================================================
// Tutor Tier Management
// ============================================================================

export {
	createSubscriptionTemplate,
	updateSubscriptionTemplate,
	deleteSubscriptionTemplate,
	listSubscriptionTemplates,
	getServiceSubscriptionTemplates,
	getTemplateSubscribers,
	getPublicServiceSubscriptionTemplates,
	saveServiceSubscriptionTiers,
} from "./tiers";
