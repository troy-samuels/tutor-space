import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = {
  params: Promise<{ assignmentId: string }>;
};

/**
 * GET /api/practice/stats/[assignmentId]
 * Returns aggregated practice statistics for a specific assignment.
 * Only accessible by the tutor who owns the assignment.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { assignmentId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the assignment and verify ownership
    const { data: assignment, error: assignmentError } = await supabase
      .from("practice_assignments")
      .select("id, tutor_id, status, sessions_completed")
      .eq("id", assignmentId)
      .eq("tutor_id", user.id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Fetch all sessions for this assignment (minimal columns)
    const { data: sessions, error: sessionsError } = await supabase
      .from("student_practice_sessions")
      .select(`
        id,
        message_count,
        duration_seconds,
        ai_feedback->grammar_issues,
        ended_at
      `)
      .eq("assignment_id", assignmentId)
      .order("ended_at", { ascending: false });

    if (sessionsError) {
      console.error("[Practice Stats] Sessions error:", sessionsError);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Aggregate stats
    const completedSessions = sessions?.filter(s => s.ended_at) || [];

    const totalMessages = completedSessions.reduce(
      (sum, s) => sum + (s.message_count || 0),
      0
    );

    const totalSeconds = completedSessions.reduce(
      (sum, s) => sum + (s.duration_seconds || 0),
      0
    );
    const totalMinutes = Math.round(totalSeconds / 60);

    // Count grammar issues from AI feedback
    const grammarIssues = completedSessions.reduce((sum, s) => {
      const feedback = s.ai_feedback as { grammar_issues?: unknown[] } | null;
      return sum + (feedback?.grammar_issues?.length || 0);
    }, 0);

    // Get last session time
    const lastSession = completedSessions[0];
    const lastSessionAt = lastSession?.ended_at || null;

    const stats = {
      assignmentId,
      sessionsCompleted: assignment.sessions_completed || completedSessions.length,
      totalMessages,
      totalMinutes,
      grammarIssues,
      lastSessionAt,
      status: assignment.status,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Practice Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice stats" },
      { status: 500 }
    );
  }
}
