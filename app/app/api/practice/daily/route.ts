import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/practice/daily
 *
 * Returns today's daily drill for the authenticated student.
 * If no drill exists yet for today, generates one based on the student's
 * most recent practice language and level.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorised" },
        { status: 401 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if today's drill already exists
    const { data: existing } = await supabase
      .from("daily_practice_queue")
      .select("*")
      .eq("student_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        drill: existing,
        isNew: false,
      });
    }

    // Find student's most recent practice to determine language & level
    const { data: recentSession } = await supabase
      .from("student_practice_sessions")
      .select("language, level")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const language = recentSession?.language || "Spanish";
    const level = recentSession?.level || "Intermediate";

    // Create today's drill
    const { data: newDrill, error: insertError } = await supabase
      .from("daily_practice_queue")
      .insert({
        student_id: user.id,
        date: today,
        language,
        level,
        exercises: generateDailyExercises(language, level),
        completed: false,
      })
      .select()
      .single();

    if (insertError) {
      // Likely a race condition — another request created it
      const { data: raceResult } = await supabase
        .from("daily_practice_queue")
        .select("*")
        .eq("student_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (raceResult) {
        return NextResponse.json({ drill: raceResult, isNew: false });
      }

      return NextResponse.json(
        { error: "Failed to create daily drill" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      drill: newDrill,
      isNew: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Exercise generator (lightweight — no AI needed for daily drills)
// ---------------------------------------------------------------------------

type DailyExercise = {
  type: "vocab_recall" | "grammar_fix" | "translate" | "fill_blank";
  prompt: string;
  answer: string;
  hint?: string;
};

/**
 * Generates a set of quick exercises for a 3-minute daily drill.
 * These are template-based, not AI-generated, for speed.
 */
function generateDailyExercises(language: string, level: string): DailyExercise[] {
  // Template exercises — in production, these would pull from a question bank
  // or be generated based on the student's weak areas
  const exercises: DailyExercise[] = [
    {
      type: "vocab_recall",
      prompt: `What is the ${language} word for "thank you"?`,
      answer: getThankYou(language),
      hint: "A common polite expression",
    },
    {
      type: "grammar_fix",
      prompt: `Fix this sentence if needed`,
      answer: "corrected",
    },
    {
      type: "fill_blank",
      prompt: `Complete the sentence`,
      answer: "answer",
    },
  ];

  return exercises;
}

function getThankYou(language: string): string {
  const map: Record<string, string> = {
    Spanish: "Gracias",
    French: "Merci",
    German: "Danke",
    Italian: "Grazie",
    Portuguese: "Obrigado",
    Japanese: "ありがとう",
    Korean: "감사합니다",
    Chinese: "谢谢",
    Dutch: "Dank je",
  };
  return map[language] || "Thank you";
}
