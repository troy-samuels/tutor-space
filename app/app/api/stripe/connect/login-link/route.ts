import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createDashboardLoginLink } from "@/lib/services/connect";
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
      .select("stripe_account_id, stripe_charges_enabled")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return NextResponse.json(
        { error: "No Stripe account found. Please complete Stripe onboarding first." },
        { status: 400 }
      );
    }

    // Login links require an active account
    if (!profile.stripe_charges_enabled) {
      return NextResponse.json(
        { error: "Stripe account is not fully activated. Please complete onboarding." },
        { status: 400 }
      );
    }

    const url = await createDashboardLoginLink(profile.stripe_account_id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Connect login link failed", error);
    return NextResponse.json(
      { error: "Failed to create login link" },
      { status: 500 }
    );
  }
}


