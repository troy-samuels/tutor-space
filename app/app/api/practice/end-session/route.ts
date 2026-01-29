import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPracticeChatCompletion } from "@/lib/practice/openai";
import { errorResponse } from "@/lib/api/error-responses";

export async function POST(request: Request) {
  const requestId = randomUUID();
  const respondError = (message: string, status: number, code: string) =>
    errorResponse(message, { status, code, extra: { requestId } });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return respondError("Session ID is required", 400, "INVALID_REQUEST");
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    // Get session with messages
    const { data: session } = await adminClient
      .from("student_practice_sessions")
      .select(`
        id,
        student_id,
        tutor_id,
        language,
        level,
        started_at,
        message_count,
        ended_at,
        ai_feedback
      `)
      .eq("id", sessionId)
      .single();

    if (!session) {
      return respondError("Session not found", 404, "SESSION_NOT_FOUND");
    }

    // Verify user owns this session
    const { data: student } = await adminClient
      .from("students")
      .select("id")
      .eq("id", session.student_id)
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return respondError("Unauthorized", 403, "UNAUTHORIZED");
    }

    // If already ended, avoid another OpenAI call and return existing feedback
    if (session.ended_at) {
      return NextResponse.json({
        success: true,
        feedback: session.ai_feedback || {
          overall_rating: 3,
          suggestions: ["Session already ended"],
          grammar_issues: [],
        },
      });
    }

    // Get all messages from the session
    const { data: messages } = await adminClient
      .from("student_practice_messages")
      .select("role, content, vocabulary_used")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(30); // bound transcript size to control AI cost

    // Calculate duration
    const startedAt = new Date(session.started_at);
    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    // Generate feedback using AI
    const feedback = await generateSessionFeedback(
      session.language,
      session.level,
      messages || []
    );

    // Update session with end time and feedback
    await adminClient
      .from("student_practice_sessions")
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        ai_feedback: feedback,
      })
      .eq("id", sessionId);

    // Aggregate grammar patterns from this session
    const { data: sessionErrors } = await adminClient
      .from("grammar_errors")
      .select("category_slug")
      .eq("session_id", sessionId);

    // Update grammar pattern counts for each category
    if (sessionErrors && sessionErrors.length > 0) {
      const categoryCount: Record<string, number> = {};
      for (const error of sessionErrors) {
        categoryCount[error.category_slug] = (categoryCount[error.category_slug] || 0) + 1;
      }

      for (const [category] of Object.entries(categoryCount)) {
        await adminClient.rpc("increment_grammar_pattern", {
          p_student_id: session.student_id,
          p_tutor_id: session.tutor_id,
          p_category_slug: category,
          p_language: session.language,
        });
      }
    }

    // Refresh practice summary for tutor dashboard
    await adminClient.rpc("refresh_practice_summary", {
      p_student_id: session.student_id,
      p_tutor_id: session.tutor_id,
    });

    // Collect all vocabulary used
    const allVocabulary = (messages || [])
      .flatMap((m) => m.vocabulary_used || [])
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Get grammar error breakdown for feedback
    const { data: grammarBreakdown } = await adminClient
      .from("grammar_errors")
      .select("category_slug")
      .eq("session_id", sessionId);

    const grammarCounts: Record<string, number> = {};
    if (grammarBreakdown) {
      for (const e of grammarBreakdown) {
        grammarCounts[e.category_slug] = (grammarCounts[e.category_slug] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      feedback: {
        ...feedback,
        vocabulary_used: allVocabulary,
        grammar_breakdown: grammarCounts,
        duration_seconds: durationSeconds,
        message_count: session.message_count,
      },
    });
  } catch (error) {
    console.error("[End Session] Error:", error);
    return respondError("Failed to end session", 500, "INTERNAL_ERROR");
  }
}

async function generateSessionFeedback(
  language: string,
  level: string | null,
  messages: Array<{ role: string; content: string }>
): Promise<{
  overall_rating: number;
  suggestions: string[];
  grammar_issues: string[];
}> {
  // Build conversation transcript
  const transcript = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role === "user" ? "Student" : "AI"}: ${m.content}`)
    .join("\n\n");

  if (!transcript || messages.length < 2) {
    return {
      overall_rating: 3,
      suggestions: ["Try having longer conversations to get more detailed feedback."],
      grammar_issues: [],
    };
  }

  try {
    const completion = await createPracticeChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a language learning assessment expert. Analyze the following ${language} practice conversation and provide feedback.

Return your response as JSON with this exact structure:
{
  "overall_rating": <number 1-5>,
  "suggestions": [<array of 2-3 specific suggestions for improvement>],
  "grammar_issues": [<array of any recurring grammar issues noticed>]
}

Consider:
- Effort and engagement
- Grammar accuracy
- Vocabulary range
- Response appropriateness
- Complexity of sentences

Be encouraging but honest. The student is at ${level || "unknown"} level.`,
        },
        {
          role: "user",
          content: `Conversation transcript:\n\n${transcript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        overall_rating: Math.min(5, Math.max(1, parsed.overall_rating || 3)),
        suggestions: parsed.suggestions || [],
        grammar_issues: parsed.grammar_issues || [],
      };
    }
  } catch (error) {
    console.error("[Generate Feedback] Error:", error);
  }

  return {
    overall_rating: 3,
    suggestions: ["Keep practicing regularly to improve!"],
    grammar_issues: [],
  };
}
