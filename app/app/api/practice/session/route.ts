import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * POST /api/practice/session
 * Creates a new practice session with specified mode
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { assignmentId, mode } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignmentId" },
        { status: 400 }
      );
    }

    if (!mode || !["text", "audio"].includes(mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'text' or 'audio'" },
        { status: 400 }
      );
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get student record
    const { data: student } = await adminClient
      .from("students")
      .select("id, tutor_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get assignment with scenario
    const { data: assignment } = await adminClient
      .from("practice_assignments")
      .select(`
        id,
        title,
        scenario:practice_scenarios (
          id,
          language,
          level,
          topic
        )
      `)
      .eq("id", assignmentId)
      .eq("student_id", student.id)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Check for existing active session
    const { data: existingSession } = await adminClient
      .from("student_practice_sessions")
      .select("id, mode, message_count, started_at, ended_at")
      .eq("assignment_id", assignmentId)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingSession) {
      // Return existing session (mode already set)
      return NextResponse.json({
        session: existingSession,
        isExisting: true,
      });
    }

    // Create new session with mode
    const scenario = assignment.scenario as any;
    const { data: newSession, error } = await adminClient
      .from("student_practice_sessions")
      .insert({
        student_id: student.id,
        tutor_id: student.tutor_id,
        assignment_id: assignmentId,
        scenario_id: scenario?.id || null,
        language: scenario?.language || "English",
        level: scenario?.level || null,
        topic: scenario?.topic || null,
        mode: mode,
      })
      .select("id, mode, message_count, started_at, ended_at")
      .single();

    if (error) {
      console.error("[Session API] Failed to create session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Update assignment status to in_progress
    await adminClient
      .from("practice_assignments")
      .update({ status: "in_progress" })
      .eq("id", assignmentId);

    return NextResponse.json({
      session: newSession,
      isExisting: false,
    });
  } catch (error) {
    console.error("[Session API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
