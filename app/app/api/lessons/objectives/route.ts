import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createBrowserClient } from "@/lib/supabase/client";

/**
 * POST /api/lessons/objectives
 *
 * Tutor pre-defines lesson objectives before or after a lesson.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, recordingId, objectives, focusVocabulary, focusGrammar } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId is required" },
        { status: 400 }
      );
    }

    if (!objectives || !Array.isArray(objectives)) {
      return NextResponse.json(
        { error: "objectives array is required" },
        { status: 400 }
      );
    }

    // Validate objectives format
    for (const obj of objectives) {
      if (!obj.type || !obj.topic) {
        return NextResponse.json(
          { error: "Each objective must have type and topic" },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    // Get booking details to verify tutor ownership
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("tutor_id, student_id")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Upsert lesson objectives
    const { data, error } = await supabase
      .from("lesson_objectives")
      .upsert(
        {
          booking_id: bookingId,
          recording_id: recordingId || null,
          tutor_id: booking.tutor_id,
          student_id: booking.student_id,
          source: "tutor_defined",
          tutor_objectives: objectives,
          tutor_focus_vocabulary: focusVocabulary || [],
          tutor_focus_grammar: focusGrammar || [],
        },
        {
          onConflict: "booking_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("[Lesson Objectives] Error:", error);
      return NextResponse.json(
        { error: "Failed to save objectives" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("[Lesson Objectives] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lessons/objectives?bookingId=xxx
 *
 * Get lesson objectives for a booking.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from("lesson_objectives")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("[Lesson Objectives] Error:", error);
      return NextResponse.json(
        { error: "Failed to fetch objectives" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    console.error("[Lesson Objectives] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
