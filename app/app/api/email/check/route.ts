import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalError, rateLimited } from "@/lib/api/error-responses";
import { requireServiceRoleClient } from "@/lib/api/require-service-role-client";
import { RateLimiters } from "@/lib/middleware/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: NextRequest) {
  // SECURITY: Rate limit email checks to prevent enumeration attacks
  const rateLimitResult = await RateLimiters.api(request);
  if (!rateLimitResult.success) {
    return rateLimited(rateLimitResult.error || "Too many requests", {
      extra: {
        exists: false,
        status: "rate_limited",
        message: rateLimitResult.error,
      },
    });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim().toLowerCase() ?? "";

  if (!email) {
    return badRequest("Please enter an email address.", {
      extra: {
        exists: false,
        status: "invalid",
        message: "Please enter an email address.",
      },
    });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return badRequest("Please enter a valid email address.", {
      extra: {
        exists: false,
        status: "invalid",
        message: "Please enter a valid email address.",
      },
    });
  }

  const unavailableMessage = "Unable to verify email right now. Please try again.";
  const serviceRoleResult = requireServiceRoleClient("Email check", {
    message: unavailableMessage,
    extra: {
      exists: false,
      status: "error",
      message: unavailableMessage,
    },
  });
  if ("error" in serviceRoleResult) {
    return serviceRoleResult.error;
  }

  const adminClient = serviceRoleResult.client;

  try {
    // Check if email exists in profiles (which links to auth.users)
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("username")
      .eq("email", email)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("[Email] Failed to check email", error);
      return internalError(unavailableMessage, {
        extra: {
          exists: false,
          status: "error",
          message: unavailableMessage,
        },
      });
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
    return internalError(unavailableMessage, {
      extra: {
        exists: false,
        status: "error",
        message: unavailableMessage,
      },
    });
  }
}
