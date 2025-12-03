import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Azure Speech Services pricing: ~$0.022/minute = ~$0.000367/second
const AZURE_COST_PER_SECOND = 0.000367;
const DEFAULT_AUDIO_LIMIT_SECONDS = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const sessionId = formData.get("sessionId") as string | null;
    const language = formData.get("language") as string || "en-US";

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    // Get student record
    const { data: student } = await adminClient
      .from("students")
      .select("id, tutor_id, ai_practice_enabled, ai_audio_enabled, ai_audio_seconds_limit, ai_practice_current_period_end")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    if (!student.ai_practice_enabled) {
      return NextResponse.json(
        { error: "AI Practice subscription required" },
        { status: 403 }
      );
    }

    // Check audio budget for current period
    const now = new Date();
    const periodEnd = student.ai_practice_current_period_end
      ? new Date(student.ai_practice_current_period_end)
      : now;
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 30);

    // Get or create audio budget for this period
    let { data: budget } = await adminClient
      .from("student_audio_budgets")
      .select("*")
      .eq("student_id", student.id)
      .gte("period_start", periodStart.toISOString())
      .lte("period_end", periodEnd.toISOString())
      .maybeSingle();

    if (!budget) {
      // Create new budget record for this period
      const { data: newBudget, error: budgetError } = await adminClient
        .from("student_audio_budgets")
        .insert({
          student_id: student.id,
          tutor_id: student.tutor_id,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          audio_seconds_limit: student.ai_audio_seconds_limit || DEFAULT_AUDIO_LIMIT_SECONDS,
          audio_seconds_used: 0,
          audio_cost_cents: 0,
        })
        .select()
        .single();

      if (budgetError) {
        console.error("[Audio] Failed to create budget:", budgetError);
        return NextResponse.json(
          { error: "Failed to initialize audio budget" },
          { status: 500 }
        );
      }

      budget = newBudget;
    }

    // Calculate audio duration (in seconds)
    // For simplicity, we estimate based on file size (rough approximation)
    // Better: Use Web Audio API on client to get exact duration
    const estimatedDuration = Math.ceil(audioFile.size / 16000); // Rough estimate for 16kHz audio
    const maxDuration = 30; // Cap individual recordings at 30 seconds
    const audioDuration = Math.min(estimatedDuration, maxDuration);

    // Check if budget allows this request
    const remainingSeconds = budget.audio_seconds_limit - budget.audio_seconds_used;
    if (audioDuration > remainingSeconds) {
      return NextResponse.json(
        {
          error: "Audio budget exceeded",
          remaining_seconds: remainingSeconds,
          limit: budget.audio_seconds_limit,
        },
        { status: 402 }
      );
    }

    // Check if Azure Speech is configured
    const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
    const azureSpeechRegion = process.env.AZURE_SPEECH_REGION;

    if (!azureSpeechKey || !azureSpeechRegion) {
      // Return mock response if Azure isn't configured
      console.warn("[Audio] Azure Speech not configured, returning mock response");

      const costCents = Math.ceil(audioDuration * AZURE_COST_PER_SECOND * 100);

      // Update budget
      await adminClient
        .from("student_audio_budgets")
        .update({
          audio_seconds_used: budget.audio_seconds_used + audioDuration,
          audio_cost_cents: budget.audio_cost_cents + costCents,
          updated_at: now.toISOString(),
        })
        .eq("id", budget.id);

      // Save mock assessment
      const { data: assessment } = await adminClient
        .from("pronunciation_assessments")
        .insert({
          session_id: sessionId || null,
          student_id: student.id,
          tutor_id: student.tutor_id,
          audio_duration_seconds: audioDuration,
          transcript: "(Azure Speech not configured)",
          accuracy_score: null,
          fluency_score: null,
          pronunciation_score: null,
          cost_cents: costCents,
          language,
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        mock: true,
        message: "Azure Speech not configured. Audio budget tracked but no pronunciation assessment.",
        assessment_id: assessment?.id,
        remaining_seconds: remainingSeconds - audioDuration,
      });
    }

    // Convert File to ArrayBuffer for Azure
    const audioBuffer = await audioFile.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    // Call Azure Pronunciation Assessment API
    const pronunciationResult = await assessPronunciation(
      audioData,
      language,
      azureSpeechKey,
      azureSpeechRegion
    );

    const costCents = Math.ceil(audioDuration * AZURE_COST_PER_SECOND * 100);

    // Update budget
    await adminClient
      .from("student_audio_budgets")
      .update({
        audio_seconds_used: budget.audio_seconds_used + audioDuration,
        audio_cost_cents: budget.audio_cost_cents + costCents,
        updated_at: now.toISOString(),
      })
      .eq("id", budget.id);

    // Save assessment
    const { data: assessment } = await adminClient
      .from("pronunciation_assessments")
      .insert({
        session_id: sessionId || null,
        student_id: student.id,
        tutor_id: student.tutor_id,
        audio_duration_seconds: audioDuration,
        transcript: pronunciationResult.transcript,
        accuracy_score: pronunciationResult.accuracy,
        fluency_score: pronunciationResult.fluency,
        pronunciation_score: pronunciationResult.pronunciation,
        completeness_score: pronunciationResult.completeness,
        word_scores: pronunciationResult.wordScores,
        problem_phonemes: pronunciationResult.problemPhonemes,
        cost_cents: costCents,
        language,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      assessment_id: assessment?.id,
      transcript: pronunciationResult.transcript,
      scores: {
        accuracy: pronunciationResult.accuracy,
        fluency: pronunciationResult.fluency,
        pronunciation: pronunciationResult.pronunciation,
        completeness: pronunciationResult.completeness,
      },
      word_scores: pronunciationResult.wordScores,
      problem_phonemes: pronunciationResult.problemPhonemes,
      remaining_seconds: remainingSeconds - audioDuration,
      cost_cents: costCents,
    });
  } catch (error) {
    console.error("[Audio] Error:", error);
    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}

// Get current audio budget for a student
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    // Get student record
    const { data: student } = await adminClient
      .from("students")
      .select("id, ai_practice_enabled, ai_audio_seconds_limit, ai_practice_current_period_end")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student || !student.ai_practice_enabled) {
      return NextResponse.json({
        enabled: false,
        remaining_seconds: 0,
        limit_seconds: 0,
      });
    }

    // Get current period budget
    const now = new Date();
    const periodEnd = student.ai_practice_current_period_end
      ? new Date(student.ai_practice_current_period_end)
      : now;
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 30);

    const { data: budget } = await adminClient
      .from("student_audio_budgets")
      .select("audio_seconds_used, audio_seconds_limit")
      .eq("student_id", student.id)
      .gte("period_start", periodStart.toISOString())
      .lte("period_end", periodEnd.toISOString())
      .maybeSingle();

    const limit = student.ai_audio_seconds_limit || DEFAULT_AUDIO_LIMIT_SECONDS;
    const used = budget?.audio_seconds_used || 0;

    return NextResponse.json({
      enabled: true,
      remaining_seconds: Math.max(0, limit - used),
      limit_seconds: limit,
      used_seconds: used,
    });
  } catch (error) {
    console.error("[Audio Budget] Error:", error);
    return NextResponse.json(
      { error: "Failed to get audio budget" },
      { status: 500 }
    );
  }
}

/**
 * Call Azure Pronunciation Assessment API
 * https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
 */
async function assessPronunciation(
  audioData: Uint8Array,
  language: string,
  apiKey: string,
  region: string
): Promise<{
  transcript: string;
  accuracy: number;
  fluency: number;
  pronunciation: number;
  completeness: number;
  wordScores: Array<{ word: string; accuracy: number; error_type?: string }>;
  problemPhonemes: string[];
}> {
  // Map language codes to Azure format
  const langMap: Record<string, string> = {
    "en": "en-US",
    "es": "es-ES",
    "fr": "fr-FR",
    "de": "de-DE",
    "pt": "pt-BR",
    "it": "it-IT",
    "zh": "zh-CN",
    "ja": "ja-JP",
    "ko": "ko-KR",
  };
  const azureLang = langMap[language.substring(0, 2)] || language;

  // Pronunciation Assessment configuration
  const pronunciationConfig = {
    referenceText: "", // Empty for free-form assessment
    gradingSystem: "HundredMark",
    granularity: "Word",
    dimension: "Comprehensive",
    enableMiscue: true,
  };

  const pronunciationConfigBase64 = Buffer.from(
    JSON.stringify(pronunciationConfig)
  ).toString("base64");

  try {
    const response = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${azureLang}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
          "Content-Type": "audio/wav",
          "Pronunciation-Assessment": pronunciationConfigBase64,
        },
        body: Buffer.from(audioData),
      }
    );

    if (!response.ok) {
      console.error("[Azure Speech] Error:", response.status, await response.text());
      throw new Error(`Azure Speech API error: ${response.status}`);
    }

    const result = await response.json();

    // Parse pronunciation assessment results
    const nbest = result.NBest?.[0];
    if (!nbest) {
      return {
        transcript: result.DisplayText || "",
        accuracy: 0,
        fluency: 0,
        pronunciation: 0,
        completeness: 0,
        wordScores: [],
        problemPhonemes: [],
      };
    }

    const assessment = nbest.PronunciationAssessment || {};
    const words = nbest.Words || [];

    // Extract word-level scores
    const wordScores = words.map((w: any) => ({
      word: w.Word,
      accuracy: w.PronunciationAssessment?.AccuracyScore || 0,
      error_type: w.PronunciationAssessment?.ErrorType,
    }));

    // Identify problem phonemes (words with accuracy < 60)
    const problemPhonemes = words
      .filter((w: any) => (w.PronunciationAssessment?.AccuracyScore || 0) < 60)
      .map((w: any) => w.Word);

    return {
      transcript: result.DisplayText || "",
      accuracy: assessment.AccuracyScore || 0,
      fluency: assessment.FluencyScore || 0,
      pronunciation: assessment.PronScore || 0,
      completeness: assessment.CompletenessScore || 0,
      wordScores,
      problemPhonemes,
    };
  } catch (error) {
    console.error("[Azure Speech] Assessment error:", error);
    // Return zeroed scores on error
    return {
      transcript: "",
      accuracy: 0,
      fluency: 0,
      pronunciation: 0,
      completeness: 0,
      wordScores: [],
      problemPhonemes: [],
    };
  }
}
