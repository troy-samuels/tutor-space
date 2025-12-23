import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "Student ID is required" },
        { status: 400 }
      );
    }

    // Verify tutor owns this student
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .eq("tutor_id", user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Fetch cached summary if available
    const { data: summary } = await supabase
      .from("student_practice_summaries")
      .select("*")
      .eq("student_id", studentId)
      .eq("tutor_id", user.id)
      .single();

    // If no summary exists, compute basic stats
    if (!summary) {
      // Get basic session stats
      const { data: sessions } = await supabase
        .from("student_practice_sessions")
        .select("id, ended_at, duration_seconds, message_count, ai_feedback, grammar_errors_count, started_at")
        .eq("student_id", studentId)
        .eq("tutor_id", user.id);

      if (!sessions || sessions.length === 0) {
        return NextResponse.json({
          isSubscribed: Boolean(student.ai_practice_enabled || student.ai_practice_free_tier_enabled),
          summary: null,
        });
      }

      const totalSessions = sessions.length;
      const completedSessions = sessions.filter((s) => s.ended_at).length;
      const totalMinutes = sessions.reduce(
        (sum, s) => sum + (s.duration_seconds || 0) / 60,
        0
      );
      const totalMessages = sessions.reduce(
        (sum, s) => sum + (s.message_count || 0),
        0
      );
      const totalErrors = sessions.reduce(
        (sum, s) => sum + (s.grammar_errors_count || 0),
        0
      );

      // Calculate average rating from ai_feedback
      const ratings = sessions
        .filter((s) => s.ai_feedback?.overall_rating)
        .map((s) => (s.ai_feedback as { overall_rating: number }).overall_rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : null;

      // Get last practice
      const lastSession = sessions.sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )[0];

      return NextResponse.json({
        isSubscribed: Boolean(student.ai_practice_enabled || student.ai_practice_free_tier_enabled),
        summary: {
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          total_messages_sent: totalMessages,
          total_practice_minutes: Math.round(totalMinutes),
          total_grammar_errors: totalErrors,
          total_phonetic_errors: 0,
          top_grammar_issues: [],
          avg_session_rating: avgRating,
          last_practice_at: lastSession?.started_at || null,
          weekly_activity: [],
        },
      });
    }

    return NextResponse.json({
      isSubscribed: Boolean(student.ai_practice_enabled || student.ai_practice_free_tier_enabled),
      summary: {
        total_sessions: summary.total_sessions || 0,
        completed_sessions: summary.completed_sessions || 0,
        total_messages_sent: summary.total_messages_sent || 0,
        total_practice_minutes: summary.total_practice_minutes || 0,
        total_grammar_errors: summary.total_grammar_errors || 0,
        total_phonetic_errors: summary.total_phonetic_errors || 0,
        top_grammar_issues: summary.top_grammar_issues || [],
        avg_session_rating: summary.avg_session_rating,
        last_practice_at: summary.last_practice_at,
        weekly_activity: summary.weekly_activity || [],
      },
    });
  } catch (error) {
    console.error("[Practice Progress] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice progress" },
      { status: 500 }
    );
  }
}
