import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isLiveKitConfigured,
  isS3Configured,
  startRoomRecording,
  stopRoomRecording,
  listRoomEgress,
} from "@/lib/livekit";
import { hasStudioAccess } from "@/lib/payments/subscriptions";
import type { PlatformBillingPlan } from "@/lib/types/payments";

// Force dynamic rendering - auth-dependent route
export const dynamic = "force-dynamic";

const LIVEKIT_URL =
  process.env.LIVEKIT_URL ??
  process.env.LIVEKIT_SERVER_URL ??
  process.env.NEXT_PUBLIC_LIVEKIT_URL;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(request: NextRequest) {
  try {
    // Check if LiveKit is configured
    if (!isLiveKitConfigured()) {
      console.error("[LiveKit Recording] LiveKit not configured");
      return NextResponse.json(
        { error: "LiveKit is not configured" },
        { status: 503 }
      );
    }
    console.log("[LiveKit Recording] LiveKit URL:", LIVEKIT_URL);

    // Parse request body
    const body = await request.json();
    const { roomName, action, egressId } = body as {
      roomName: string;
      action: "start" | "stop" | "status";
      egressId?: string;
    };

    console.log("[LiveKit Recording] Request received:", { roomName, action, egressId });

    if (!roomName) {
      return NextResponse.json(
        { error: "Missing roomName parameter" },
        { status: 400 }
      );
    }

    // Recording is only supported for booking-based rooms (UUID booking_id).
    if (!isUuid(roomName)) {
      return NextResponse.json(
        { error: "Recording is only available for booking rooms" },
        { status: 400 }
      );
    }

    if (!action || !["start", "stop", "status"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'start', 'stop', or 'status'" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the booking to validate access (roomName is booking_id)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        tutor_id,
        students (
          user_id
        )
      `
      )
      .eq("id", roomName)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const isTutor = booking.tutor_id === user.id;
    const studentsRelation = booking.students as unknown;
    const studentUserId = Array.isArray(studentsRelation)
      ? (studentsRelation[0] as { user_id?: string | null } | undefined)?.user_id ?? null
      : (studentsRelation as { user_id?: string | null } | null)?.user_id ?? null;
    const isStudent = studentUserId === user.id;

    // Allow both tutor and student to view recording status (student needs REC indicator).
    if (action === "status") {
      if (!isTutor && !isStudent) {
        return NextResponse.json(
          { error: "Not authorized to view recording status" },
          { status: 403 }
        );
      }

      const egresses = await listRoomEgress(roomName);
      const activeRecording = egresses.find(
        (e) => e.status === 1 || e.status === 2
      );

      return NextResponse.json({
        isRecording: !!activeRecording,
        egressId: activeRecording?.egressId || null,
        egresses: egresses,
      });
    }

    // Only the tutor can control recording
    if (!isTutor) {
      return NextResponse.json(
        { error: "Only the tutor can control recording" },
        { status: 403 }
      );
    }

    // Fetch tutor's profile to check tier/plan
    const { data: tutorProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, tier, plan")
      .eq("id", user.id)
      .single();

    if (profileError || !tutorProfile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const tutorPlan = (tutorProfile.plan as PlatformBillingPlan) ?? "professional";
    const tutorHasStudio = tutorProfile.tier === "studio" || hasStudioAccess(tutorPlan);

    // Check if tutor has Studio tier/plan
    if (!tutorHasStudio) {
      return NextResponse.json(
        { error: "Recording requires Studio tier subscription" },
        { status: 403 }
      );
    }

    // Handle actions
    switch (action) {
      case "start": {
        // Check if S3 is configured
        if (!isS3Configured()) {
          return NextResponse.json(
            { error: "Recording storage is not configured" },
            { status: 503 }
          );
        }

        // Check if there's already an active recording
        const activeEgresses = await listRoomEgress(roomName);
        const activeRecording = activeEgresses.find(
          (e) => e.status === 1 || e.status === 2 // EGRESS_STARTING or EGRESS_ACTIVE
        );

        if (activeRecording) {
          return NextResponse.json({
            message: "Recording already in progress",
            egressId: activeRecording.egressId,
            status: "recording",
          });
        }

        // Start recording
        console.log("[LiveKit Recording] Attempting to start egress for room:", roomName);
        const result = await startRoomRecording(roomName);
        console.log("[LiveKit Recording] Egress Started! Egress ID:", result.egressId);

        return NextResponse.json({
          message: "Recording started",
          egressId: result.egressId,
          filepath: result.filepath,
          status: "recording",
        });
      }

      case "stop": {
        if (!egressId) {
          // Try to find active egress
          const activeEgresses = await listRoomEgress(roomName);
          const activeRecording = activeEgresses.find(
            (e) => e.status === 1 || e.status === 2
          );

          if (!activeRecording) {
            return NextResponse.json(
              { error: "No active recording found" },
              { status: 404 }
            );
          }

          const result = await stopRoomRecording(activeRecording.egressId);
          return NextResponse.json({
            message: "Recording stopped",
            egressId: result.egressId,
            status: "stopped",
          });
        }

        const roomEgresses = await listRoomEgress(roomName);
        const matchesRoom = roomEgresses.some((egress) => egress.egressId === egressId);
        if (!matchesRoom) {
          return NextResponse.json(
            { error: "Recording not found for this room" },
            { status: 404 }
          );
        }

        const result = await stopRoomRecording(egressId);
        return NextResponse.json({
          message: "Recording stopped",
          egressId: result.egressId,
          status: "stopped",
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[LiveKit Recording] Error:", error);
    console.error("[LiveKit Recording] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: "Failed to process recording request" },
      { status: 500 }
    );
  }
}
