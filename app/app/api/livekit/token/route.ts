import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAccessToken, isLiveKitConfigured } from "@/lib/livekit";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";

// Force dynamic rendering - auth-dependent route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Check if LiveKit is configured
    if (!isLiveKitConfigured()) {
      return NextResponse.json(
        { error: "LiveKit is not configured" },
        { status: 503 }
      );
    }

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Handle test room requests (standalone studio access)
    if (roomType === "test") {
      // Fetch user's profile to check tier
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, tier, full_name")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: "Profile not found" },
          { status: 404 }
        );
      }

      // Check if user has Studio tier
      if (profile.tier !== "studio") {
        return NextResponse.json(
          { error: "Test Studio requires Studio tier subscription" },
          { status: 403 }
        );
      }

      // Generate token for test room
      const roomName = `test-${user.id}`;
      const token = await createAccessToken(user.id, roomName, {
        isTutor: true,
        participantName: profile.full_name || "Tutor",
      });

      return NextResponse.json({
        token,
        isTutor: true,
        isTestRoom: true,
        roomName,
        bookingInfo: null,
      });
    }

    // Regular booking-based flow requires booking_id
    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing booking_id parameter" },
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
      return NextResponse.json(
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
      return NextResponse.json(
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
      return NextResponse.json(
        { error: "Tutor profile not found" },
        { status: 404 }
      );
    }

    const tutorPlan = (tutorProfile.plan as PlatformBillingPlan) ?? "professional";
    const tutorHasStudio = tutorProfile.tier === "studio" || hasStudioAccess(tutorPlan);

    // Check if tutor has Studio tier/plan
    if (!tutorHasStudio) {
      return NextResponse.json(
        { error: "Upgrade to Studio to use the Native Classroom." },
        { status: 403 }
      );
    }

    // Generate participant name
    const participantName = isTutor
      ? tutorProfile.full_name || "Tutor"
      : student?.full_name || "Student";

    // Generate LiveKit token
    // Room name is the booking_id (UUID)
    // Identity is the user_id
    const token = await createAccessToken(user.id, bookingId, {
      isTutor,
      participantName,
    });

    // Extract service info
    const service = booking.services as unknown as { id: string; name: string } | null;

    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
