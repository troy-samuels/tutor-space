import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalError, rateLimited } from "@/lib/api/error-responses";
import { requireServiceRoleClient } from "@/lib/api/require-service-role-client";
import { isReservedUsername } from "@/lib/constants/reserved-usernames";
import { RateLimiters } from "@/lib/middleware/rate-limit";

const USERNAME_PATTERN = /^[a-z0-9-]{3,32}$/;

export async function GET(request: NextRequest) {
  // SECURITY: Rate limit username checks to prevent enumeration attacks
  const rateLimitResult = await RateLimiters.api(request);
  if (!rateLimitResult.success) {
    return rateLimited(rateLimitResult.error || "Too many requests", {
      extra: {
        available: false,
        status: "rate_limited",
        message: rateLimitResult.error,
      },
    });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim().toLowerCase() ?? "";

  if (!username) {
    return badRequest("Please enter a username.", {
      extra: {
        available: false,
        status: "invalid",
        message: "Please enter a username.",
      },
    });
  }

  if (!USERNAME_PATTERN.test(username)) {
    return badRequest("Usernames must be 3-32 characters using lowercase letters, numbers, or dashes.", {
      extra: {
        available: false,
        status: "invalid",
        message: "Usernames must be 3-32 characters using lowercase letters, numbers, or dashes.",
      },
    });
  }

  // Check if username is reserved
  if (isReservedUsername(username)) {
    return badRequest("This username is reserved and cannot be used.", {
      extra: {
        available: false,
        status: "reserved",
        message: "This username is reserved and cannot be used.",
      },
    });
  }

  const unavailableMessage = "Unable to verify username availability right now. Please try again.";
  const serviceRoleResult = requireServiceRoleClient("Username check", {
    message: unavailableMessage,
    extra: {
      available: false,
      status: "error",
      message: unavailableMessage,
    },
  });
  if ("error" in serviceRoleResult) {
    return serviceRoleResult.error;
  }

  try {
    const { data, error } = await serviceRoleResult.client
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[Username] Failed to check availability", error);
      return internalError(unavailableMessage, {
        extra: {
          available: false,
          status: "error",
          message: unavailableMessage,
        },
      });
    }

    return NextResponse.json({
      available: !data,
      status: data ? "taken" : "available",
      username,
    });
  } catch (error) {
    console.error("[Username] Unexpected error while checking availability", error);
    return internalError(unavailableMessage, {
      extra: {
        available: false,
        status: "error",
        message: unavailableMessage,
      },
    });
  }
}
