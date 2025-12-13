/**
 * Lesson Subscription Constants
 * Defines the standard subscription tiers and configuration
 */

// Standard subscription tiers (platform templates)
export const SUBSCRIPTION_TIERS = {
  TWO_LESSONS: {
    id: "2_lessons" as const,
    lessons_per_month: 2,
    suggested_price_cents: 8000, // $80/month
    label: "2 lessons/month",
    description: "Perfect for maintaining skills",
  },
  FOUR_LESSONS: {
    id: "4_lessons" as const,
    lessons_per_month: 4,
    suggested_price_cents: 15000, // $150/month
    label: "4 lessons/month",
    description: "Most popular - steady progress",
  },
  EIGHT_LESSONS: {
    id: "8_lessons" as const,
    lessons_per_month: 8,
    suggested_price_cents: 28000, // $280/month
    label: "8 lessons/month",
    description: "Intensive learning",
  },
} as const;

// Template tier type
export type TemplateTier = "2_lessons" | "4_lessons" | "8_lessons" | "custom";

// Subscription status type
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "canceled"
  | "past_due"
  | "trialing";

// Default rollover policy: 1 month's allocation max
export const DEFAULT_MAX_ROLLOVER_MULTIPLIER = 1;

// Get tier by ID
export function getTierById(tierId: TemplateTier) {
  switch (tierId) {
    case "2_lessons":
      return SUBSCRIPTION_TIERS.TWO_LESSONS;
    case "4_lessons":
      return SUBSCRIPTION_TIERS.FOUR_LESSONS;
    case "8_lessons":
      return SUBSCRIPTION_TIERS.EIGHT_LESSONS;
    default:
      return null;
  }
}

// Get lessons per month by tier
export function getLessonsPerMonth(tierId: TemplateTier): number {
  const tier = getTierById(tierId);
  return tier?.lessons_per_month ?? 0;
}

// All tier IDs for iteration
export const ALL_TIER_IDS: TemplateTier[] = [
  "2_lessons",
  "4_lessons",
  "8_lessons",
];
