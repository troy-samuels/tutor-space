import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAccessToken, isLiveKitConfigured } from "@/lib/livekit";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";

// Force dynamic rendering - auth-dependent route
export const dynamic = "force-dynamic";

const DEFAULT_MAX_TOKEN_TTL_SECONDS = 6 * 60 * 60;
const DEFAULT_TEST_TOKEN_TTL_SECONDS = 2 * 60 * 60;
const MIN_TOKEN_TTL_SECONDS = 15 * 60;
const TOKEN_BUFFER_MINUTES = 30;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parsePositiveInt(value?: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getMaxTokenTtlSeconds(): number {
  return parsePositiveInt(process.env.LIVEKIT_TOKEN_TTL_SECONDS) ?? DEFAULT_MAX_TOKEN_TTL_SECONDS;
}

function resolveTokenTtlSeconds(durationMinutes?: number | null): number {
  const maxTtlSeconds = getMaxTokenTtlSeconds();

  if (!durationMinutes || durationMinutes <= 0) {
    return maxTtlSeconds;
  }

  const ttlSeconds = Math.round((durationMinutes + TOKEN_BUFFER_MINUTES) * 60);
  return Math.min(Math.max(ttlSeconds, MIN_TOKEN_TTL_SECONDS), maxTtlSeconds);
}

function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("booking_id");
    const roomType = searchParams.get("room_type");

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle test room requests (standalone studio access)
    if (roomType === "test") {
      // Fetch user's profile to check tier
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, tier, plan, full_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return jsonResponse(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      // Check if user has Studio tier
      const tutorPlan = (profile.plan as PlatformBillingPlan) ?? "professional";
      const tutorHasStudio = profile.tier === "studio" || hasStudioAccess(tutorPlan);

      if (!tutorHasStudio) {
        return jsonResponse(
          { error: "Test Studio requires Studio tier subscription" },
          { status: 403 }
        );
      }

      if (!isLiveKitConfigured()) {
        return jsonResponse(
          { error: "LiveKit is not configured" },
          { status: 503 }
        );
      }

      // Generate token for test room
      const roomName = `test-${user.id}`;
      const testTokenTtlSeconds = Math.min(
        DEFAULT_TEST_TOKEN_TTL_SECONDS,
        getMaxTokenTtlSeconds()
      );
      const token = await createAccessToken(user.id, roomName, {
        isTutor: true,
        participantName: profile.full_name || "Tutor",
        tokenTtlSeconds: testTokenTtlSeconds,
      });

      return jsonResponse({
        token,
        isTutor: true,
        isTestRoom: true,
        roomName,
        bookingInfo: null,
      });
    }

    // Regular booking-based flow requires booking_id
    if (!bookingId) {
      return jsonResponse(
        { error: "Missing booking_id parameter" },
        { status: 400 }
      );
    }

    if (!isUuid(bookingId)) {
      return jsonResponse(
        { error: "Invalid booking_id parameter" },
        { status: 400 }
      );
    }

    // Fetch the booking with student info and service
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        tutor_id,
        student_id,
        scheduled_at,
        duration_minutes,
        students!inner (
          id,
          user_id,
          full_name
        ),
        services (
          id,
          name
        )
      `
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return jsonResponse(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Determine if user is tutor or student for this booking
    const isTutor = booking.tutor_id === user.id;
    // students is returned as an object due to !inner and .single()
    const student = booking.students as unknown as { id: string; user_id: string | null; full_name: string } | null;
    const isStudent = student?.user_id === user.id;

    if (!isTutor && !isStudent) {
      return jsonResponse(
        { error: "You are not authorized to join this lesson" },
        { status: 403 }
      );
    }

    // Fetch tutor's profile to check tier/plan
    const { data: tutorProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, tier, plan, full_name")
      .eq("id", booking.tutor_id)
      .single();

    if (profileError || !tutorProfile) {
      return jsonResponse(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    const tutorPlan = (tutorProfile.plan as PlatformBillingPlan) ?? "professional";
    const tutorHasStudio = tutorProfile.tier === "studio" || hasStudioAccess(tutorPlan);

    // Check if tutor has Studio tier/plan
    if (!tutorHasStudio) {
      return jsonResponse(
        { error: "Upgrade to Studio to use the Native Classroom." },
        { status: 403 }
      );
    }

    // E2E Test Mode: Return mock token when LiveKit isn't configured
    const isE2ETestMode = process.env.E2E_TEST_MODE === "true";
    if (isE2ETestMode && !isLiveKitConfigured()) {
      const participantName = isTutor
        ? tutorProfile.full_name || "Tutor"
        : student?.full_name || "Student";

      return jsonResponse({
        token: "e2e-test-mode-mock-token",
        isTutor,
        roomName: bookingId,
        isTestMode: true,
        bookingInfo: {
          studentId: student?.id,
          studentName: student?.full_name || "Student",
          participantName,
          serviceName: (booking.services as any)?.name,
          scheduledAt: booking.scheduled_at,
          durationMinutes: booking.duration_minutes,
        },
      });
    }

    if (!isLiveKitConfigured()) {
      return jsonResponse(
        { error: "LiveKit is not configured" },
        { status: 503 }
      );
    }

    // Generate participant name
    const participantName = isTutor
      ? tutorProfile.full_name || "Tutor"
      : student?.full_name || "Student";

    // Generate LiveKit token
    // Room name is the booking_id (UUID)
    // Identity is the user_id
    const tokenTtlSeconds = resolveTokenTtlSeconds(booking.duration_minutes);
    const token = await createAccessToken(user.id, bookingId, {
      isTutor,
      participantName,
      tokenTtlSeconds,
    });

    // Extract service info
    const service = booking.services as unknown as { id: string; name: string } | null;

    return jsonResponse({
      token,
      isTutor,
      roomName: bookingId,
      bookingInfo: {
        studentId: student?.id || booking.student_id,
        studentName: student?.full_name || "Student",
        tutorName: tutorProfile.full_name || "Tutor",
        serviceName: service?.name || null,
        scheduledAt: booking.scheduled_at,
        durationMinutes: booking.duration_minutes,
      },
    });
  } catch (error) {
    console.error("[LiveKit] Token generation error:", error);
    return jsonResponse(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
