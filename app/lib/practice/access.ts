import type { SupabaseClient } from "@supabase/supabase-js";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export function getPracticeSubscriptionKeyForTutor(tutorId: string): string {
  return `studio:${tutorId}`;
}

export function getCurrentPracticePeriod(now: Date = new Date()): {
  periodStart: Date;
  periodEnd: Date;
} {
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
  return { periodStart, periodEnd };
}

export async function getTutorHasPracticeAccess(
  supabase: SupabaseClient,
  tutorId: string
): Promise<boolean> {
  const { data: tutorProfile } = await supabase
    .from("profiles")
    .select("id, tier, plan")
    .eq("id", tutorId)
    .maybeSingle();

  if (!tutorProfile) return false;

  const plan = (tutorProfile.plan as PlatformBillingPlan | null) ?? "professional";
  return tutorProfile.tier === "studio" || hasStudioAccess(plan);
}

