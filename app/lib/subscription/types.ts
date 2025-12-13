/**
 * Lesson Subscription Types
 * TypeScript types for the subscription feature
 */

import type { TemplateTier, SubscriptionStatus } from "./constants";

// Database record types
export interface LessonSubscriptionTemplate {
  id: string;
  tutor_id: string;
  service_id: string;
  lessons_per_month: number;
  template_tier: TemplateTier;
  price_cents: number;
  currency: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  max_rollover_lessons: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonSubscription {
  id: string;
  template_id: string;
  student_id: string;
  tutor_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonAllowancePeriod {
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

export interface LessonSubscriptionRedemption {
  id: string;
  period_id: string;
  booking_id: string;
  lessons_redeemed: number;
  refunded_at: string | null;
  created_at: string;
}

// Input types for creating/updating
export interface CreateSubscriptionTemplateInput {
  service_id: string;
  template_tier: TemplateTier;
  lessons_per_month: number;
  price_cents: number;
  currency?: string;
  max_rollover_lessons?: number | null;
}

export interface UpdateSubscriptionTemplateInput {
  price_cents?: number;
  is_active?: boolean;
  max_rollover_lessons?: number | null;
}

// Response types
export interface SubscriptionBalance {
  total_available: number;
  lessons_allocated: number;
  lessons_rolled_over: number;
  lessons_used: number;
  period_ends_at: string;
}

export interface SubscriptionWithDetails extends LessonSubscription {
  template: LessonSubscriptionTemplate;
  current_period: LessonAllowancePeriod | null;
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface TemplateWithSubscribers extends LessonSubscriptionTemplate {
  subscriber_count: number;
  active_subscriptions: Array<{
    id: string;
    student: {
      id: string;
      full_name: string;
      email: string;
    };
    status: SubscriptionStatus;
    lessons_used: number;
    lessons_available: number;
    period_ends_at: string;
  }>;
}

// Service form subscription tier config
export interface ServiceSubscriptionTierConfig {
  tier_id: TemplateTier;
  enabled: boolean;
  price_cents: number | null;
}

export interface ServiceSubscriptionConfig {
  enabled: boolean;
  tiers: ServiceSubscriptionTierConfig[];
}
