import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { isReservedUsername } from "@/lib/constants/reserved-usernames";
import { RateLimiters } from "@/lib/middleware/rate-limit";

const USERNAME_PATTERN = /^[a-z0-9-]{3,32}$/;

export async function GET(request: NextRequest) {
  // SECURITY: Rate limit username checks to prevent enumeration attacks
  const rateLimitResult = await RateLimiters.api(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        available: false,
        status: "rate_limited",
        message: rateLimitResult.error,
      },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim().toLowerCase() ?? "";

  if (!username) {
    return NextResponse.json(
      {
        available: false,
        status: "invalid",
        message: "Please enter a username.",
      },
      { status: 400 }
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      {
        available: false,
        status: "invalid",
        message: "Usernames must be 3-32 characters using lowercase letters, numbers, or dashes.",
      },
      { status: 400 }
    );
  }

  // Check if username is reserved
  if (isReservedUsername(username)) {
    return NextResponse.json(
      {
        available: false,
        status: "reserved",
        message: "This username is reserved and cannot be used.",
      },
      { status: 400 }
    );
  }

  const adminClient = createServiceRoleClient();

  if (!adminClient) {
    console.error("[Username] Missing service role client while checking availability");
    return NextResponse.json(
      {
        available: false,
        status: "error",
        message: "Unable to verify username availability right now. Please try again.",
      },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[Username] Failed to check availability", error);
      return NextResponse.json(
        {
          available: false,
          status: "error",
          message: "Unable to verify username availability right now. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: !data,
      status: data ? "taken" : "available",
      username,
    });
  } catch (error) {
    console.error("[Username] Unexpected error while checking availability", error);
    return NextResponse.json(
      {
        available: false,
        status: "error",
        message: "Unable to verify username availability right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
