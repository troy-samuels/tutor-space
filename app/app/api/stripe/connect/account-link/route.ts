import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAccountLink } from "@/lib/services/connect";
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
        { error: "No Stripe account found. Please complete Stripe onboarding first." },
        { status: 400 }
      );
    }

    const accountId = profile.stripe_account_id;
    const refreshUrl =
      process.env.STRIPE_CONNECT_REFRESH_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/payments`;
    const returnUrl =
      process.env.STRIPE_CONNECT_RETURN_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/settings/payments`;

    const url = await createAccountLink(accountId, refreshUrl, returnUrl);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Connect account link failed", error);
    return NextResponse.json(
      { error: "Failed to create account link" },
      { status: 500 }
    );
  }
}


