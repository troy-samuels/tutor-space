import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { RateLimiters } from "@/lib/middleware/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  // SECURITY: Rate limit email checks to prevent enumeration attacks
  const rateLimitResult = await RateLimiters.api(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        exists: false,
        status: "rate_limited",
        message: rateLimitResult.error,
      },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!email) {
    return NextResponse.json(
      {
        exists: false,
        status: "invalid",
        message: "Please enter an email address.",
      },
      { status: 400 }
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json(
      {
        exists: false,
        status: "invalid",
        message: "Please enter a valid email address.",
      },
      { status: 400 }
    );
  }

  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    console.error("[Email] Missing service role client while checking email");
    return NextResponse.json(
      {
        exists: false,
        status: "error",
        message: "Unable to verify email right now. Please try again.",
      },
      { status: 500 }
    );
  }

  try {
    // Check if email exists in profiles (which links to auth.users)
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("username")
      .eq("email", email)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[Email] Failed to check email", error);
      return NextResponse.json(
        {
          exists: false,
          status: "error",
          message: "Unable to verify email right now. Please try again.",
        },
        { status: 500 }
      );
    }

    if (profile) {
      return NextResponse.json({
        exists: true,
        status: "taken",
        username: profile.username,
        message: `This email is already registered${profile.username ? ` as @${profile.username}` : ""}.`,
      });
    }

    return NextResponse.json({
      exists: false,
      status: "available",
    });
  } catch (error) {
    console.error("[Email] Unexpected error while checking email", error);
    return NextResponse.json(
      {
        exists: false,
        status: "error",
        message: "Unable to verify email right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
