import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PlatformBillingPlan } from "@/lib/types/payments";

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

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const planName =
    (subscriptions?.[0]?.plan_name as PlatformBillingPlan | undefined) ??
    (profile?.plan as PlatformBillingPlan | null) ??
    "professional";
  const entitlements = {
    plan: planName,
    growth: planName === "growth" || planName === "studio" || planName === "founder_lifetime",
    studio: planName === "studio",
  };

  return NextResponse.json({ user, profile, entitlements });
}
