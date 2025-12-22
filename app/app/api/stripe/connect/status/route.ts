import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { refreshAccountStatus } from "@/lib/services/connect";
import { RateLimiters } from "@/lib/middleware/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await RateLimiters.api(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error || "Too many requests" },
        { status: 429 }
      );
    }

    // Authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get accountId from authenticated user's profile (ownership check)
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        { error: "No Stripe account found" },
        { status: 400 }
      );
    }

    // Use service role client for the status update
    const supabaseAdmin = createServiceRoleClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Admin client unavailable" },
        { status: 500 }
      );
    }

    // Use verified tutorId and accountId from authenticated session
    await refreshAccountStatus(user.id, profile.stripe_account_id, supabaseAdmin);

    // Fetch updated profile to return current status
    const { data: updatedProfile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_charges_enabled, stripe_payouts_enabled, stripe_onboarding_status")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      chargesEnabled: updatedProfile?.stripe_charges_enabled ?? false,
      payoutsEnabled: updatedProfile?.stripe_payouts_enabled ?? false,
      onboardingStatus: updatedProfile?.stripe_onboarding_status ?? "pending",
    });
  } catch (error) {
    console.error("Connect status refresh failed", error);
    return NextResponse.json(
      { error: "Failed to refresh status" },
      { status: 500 }
    );
  }
}


