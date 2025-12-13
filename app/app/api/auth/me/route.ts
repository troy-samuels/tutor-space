import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlatformBillingPlan } from "@/lib/types/payments";
import {
  getPlanTier,
  hasProAccess,
  hasStudioAccess,
} from "@/lib/payments/subscriptions";

// Force dynamic rendering and disable caching to prevent stale auth data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, subscription_status, avatar_url, plan, username"
    )
    .eq("id", user.id)
    .single();

  const profilePlan = (profile?.plan as PlatformBillingPlan | null) ?? "professional";
  const resolvedPlan =
    profile?.subscription_status === "paused" ? ("professional" as const) : profilePlan;
  const entitlements = {
    plan: resolvedPlan,
    tier: getPlanTier(resolvedPlan),
    isPaid: hasProAccess(resolvedPlan),
    hasProAccess: hasProAccess(resolvedPlan),
    hasStudioAccess: hasStudioAccess(resolvedPlan),
  };

  return NextResponse.json({ user, profile, entitlements });
}
