import { createServiceRoleClient } from "@/lib/supabase/admin";
import Stripe from "stripe";

export type ServiceRoleClient = NonNullable<ReturnType<typeof createServiceRoleClient>>;

export type BookingDetails = {
  id: string;
  tutor_id: string | null;
  payment_amount: number | null;
  currency: string | null;
  scheduled_at: string | null;
  timezone: string | null;
  meeting_url: string | null;
  meeting_provider: string | null;
  short_code: string | null;
  services: {
    name: string | null;
    price_amount: number | null;
    price_currency: string | null;
    duration_minutes: number | null;
  } | null;
  students: {
    full_name: string | null;
    email: string | null;
  } | null;
  tutor: {
    full_name: string | null;
    email: string | null;
    tier?: string | null;
    plan?: string | null;
  } | null;
};

export type DigitalProductPurchaseDetails = {
  id: string;
  buyer_email: string;
  buyer_name: string | null;
  download_token: string;
  products: {
    title: string | null;
    tutor_id: string;
  } | null;
  tutor: {
    full_name: string | null;
  } | null;
};

export type DigitalProductPurchaseWithProduct = DigitalProductPurchaseDetails & {
  products: {
    id: string;
    title: string | null;
    tutor_id: string;
  } | null;
};

export type StripeSubscriptionPayload = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

export type LessonSubscriptionContext = {
  studentEmail?: string | null;
  studentName: string;
  tutorEmail?: string | null;
  tutorName: string;
  lessonsPerMonth?: number | null;
  planName: string;
  periodEnd?: string | null;
};

export type LessonSubscriptionRow = {
  current_period_end: string | null;
  student?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  tutor?: { full_name: string | null; email: string | null } | { full_name: string | null; email: string | null }[] | null;
  template?:
    | {
        lessons_per_month: number | null;
        service?: { name: string | null } | { name: string | null }[] | null;
      }
    | Array<{
        lessons_per_month: number | null;
        service?: { name: string | null } | { name: string | null }[] | null;
      }>
    | null;
};

export type ProcessedStripeEventStatus = "processing" | "processed" | "failed";

export type ProcessedStripeEventRow = {
  status: ProcessedStripeEventStatus;
  processing_started_at: string | null;
  updated_at: string | null;
};

export const LIFETIME_PLANS = ["tutor_life", "studio_life", "founder_lifetime"] as const;
export type LifetimePlan = (typeof LIFETIME_PLANS)[number];
