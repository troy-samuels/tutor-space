import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  BASE_AUDIO_SECONDS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
  BASE_TEXT_TURNS,
} from "@/lib/practice/constants";

// Azure Speech Services pricing: ~$0.022/minute = ~$0.000367/second
const AZURE_COST_PER_SECOND = 0.000367;

type ServiceRoleClient = SupabaseClient;

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
    const mimeType = formData.get("mimeType") as string || audioFile?.type || "audio/webm";

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
      .select("id, tutor_id, ai_practice_enabled, ai_audio_enabled, ai_audio_seconds_limit, ai_practice_current_period_end, ai_practice_subscription_id, ai_practice_block_subscription_item_id")
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

    if (!student.ai_practice_subscription_id) {
      return NextResponse.json(
        { error: "AI Practice subscription not found" },
        { status: 403 }
      );
    }

    const now = new Date();

    // Get or create the current usage period (billing cycle)
    const usagePeriod = await getOrCreateUsagePeriod(
      adminClient,
      student.id,
      student.tutor_id,
      student.ai_practice_subscription_id
    );

    if (!usagePeriod) {
      return NextResponse.json(
        { error: "Unable to track usage. Please contact support." },
        { status: 500 }
      );
    }

    // Calculate audio duration (in seconds)
    // For simplicity, we estimate based on file size (rough approximation)
    // Better: Use Web Audio API on client to get exact duration
    const estimatedDuration = Math.ceil(audioFile.size / 16000); // Rough estimate for 16kHz audio
    const maxDuration = 30; // Cap individual recordings at 30 seconds
    const audioDuration = Math.min(estimatedDuration, maxDuration);

    // Check if Azure Speech is configured
    const azureSpeechKey = process.env.AZURE_SPEECH_KEY;
    const azureSpeechRegion = process.env.AZURE_SPEECH_REGION;

    if (!azureSpeechKey || !azureSpeechRegion) {
      // Return mock response if Azure isn't configured
      console.warn("[Audio] Azure Speech not configured, returning mock response");

      const costCents = Math.ceil(audioDuration * AZURE_COST_PER_SECOND * 100);

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

      const { updatedUsage, blockPurchased } = await incrementAudioWithBilling({
        adminClient,
        usagePeriodId: usagePeriod.id,
        seconds: audioDuration,
        blockSubscriptionItemId: student.ai_practice_block_subscription_item_id,
      });

      const audioAllowance = BASE_AUDIO_SECONDS + (updatedUsage.blocks_consumed * BLOCK_AUDIO_SECONDS);
      const textAllowance = BASE_TEXT_TURNS + (updatedUsage.blocks_consumed * BLOCK_TEXT_TURNS);

      return NextResponse.json({
        success: true,
        mock: true,
        message: "Azure Speech not configured. Usage recorded but no pronunciation assessment.",
        assessment_id: assessment?.id,
        remaining_seconds: Math.max(0, audioAllowance - updatedUsage.audio_seconds_used),
        usage: {
          audio_seconds_used: updatedUsage.audio_seconds_used,
          audio_seconds_allowance: audioAllowance,
          text_turns_used: updatedUsage.text_turns_used,
          text_turns_allowance: textAllowance,
          blocks_consumed: updatedUsage.blocks_consumed,
          block_purchased: blockPurchased,
        },
        cost_cents: costCents,
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
      azureSpeechRegion,
      mimeType
    );

    const costCents = Math.ceil(audioDuration * AZURE_COST_PER_SECOND * 100);

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

    const { updatedUsage, blockPurchased } = await incrementAudioWithBilling({
      adminClient,
      usagePeriodId: usagePeriod.id,
      seconds: audioDuration,
      blockSubscriptionItemId: student.ai_practice_block_subscription_item_id,
    });

    const audioAllowance = BASE_AUDIO_SECONDS + (updatedUsage.blocks_consumed * BLOCK_AUDIO_SECONDS);
    const textAllowance = BASE_TEXT_TURNS + (updatedUsage.blocks_consumed * BLOCK_TEXT_TURNS);

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
      remaining_seconds: Math.max(0, audioAllowance - updatedUsage.audio_seconds_used),
      cost_cents: costCents,
      usage: {
        audio_seconds_used: updatedUsage.audio_seconds_used,
        audio_seconds_allowance: audioAllowance,
        text_turns_used: updatedUsage.text_turns_used,
        text_turns_allowance: textAllowance,
        blocks_consumed: updatedUsage.blocks_consumed,
        block_purchased: blockPurchased,
      },
    });
  } catch (error) {
    console.error("[Audio] Error:", error);

    const errorCode = (error as any)?.code;
    if (errorCode === "BLOCK_SUBSCRIPTION_ITEM_MISSING") {
      return NextResponse.json(
        { error: "Subscription is missing a metered block item. Please re-subscribe to continue." },
        { status: 400 }
      );
    }

    if (errorCode === "STRIPE_USAGE_FAILED") {
      return NextResponse.json(
        { error: "Unable to bill the add-on block right now. Please try again." },
        { status: 502 }
      );
    }

    if (errorCode === "AUDIO_INCREMENT_FAILED") {
      return NextResponse.json(
        { error: "Unable to track audio usage right now. Please retry." },
        { status: 409 }
      );
    }

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
      .select("id, ai_practice_enabled, ai_practice_subscription_id, ai_practice_current_period_end, tutor_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!student || !student.ai_practice_enabled || !student.ai_practice_subscription_id) {
      return NextResponse.json({
        enabled: false,
        remaining_seconds: 0,
        limit_seconds: 0,
      });
    }

    const { data: usagePeriod } = await adminClient
      .from("practice_usage_periods")
      .select("audio_seconds_used, text_turns_used, blocks_consumed, period_end")
      .eq("student_id", student.id)
      .eq("subscription_id", student.ai_practice_subscription_id)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .maybeSingle();

    const blocks = usagePeriod?.blocks_consumed || 0;
    const audioAllowance = BASE_AUDIO_SECONDS + (blocks * BLOCK_AUDIO_SECONDS);
    const textAllowance = BASE_TEXT_TURNS + (blocks * BLOCK_TEXT_TURNS);
    const usedSeconds = usagePeriod?.audio_seconds_used || 0;

    return NextResponse.json({
      enabled: true,
      remaining_seconds: Math.max(0, audioAllowance - usedSeconds),
      limit_seconds: audioAllowance,
      used_seconds: usedSeconds,
      blocks_consumed: blocks,
      text_turns_used: usagePeriod?.text_turns_used || 0,
      text_turns_allowance: textAllowance,
      period_end: usagePeriod?.period_end || student.ai_practice_current_period_end,
    });
  } catch (error) {
    console.error("[Audio Budget] Error:", error);
    return NextResponse.json(
      { error: "Failed to get audio budget" },
      { status: 500 }
    );
  }
}

async function incrementAudioWithBilling(params: {
  adminClient: ServiceRoleClient;
  usagePeriodId: string;
  seconds: number;
  blockSubscriptionItemId: string | null;
}) {
  const { adminClient, usagePeriodId, seconds, blockSubscriptionItemId } = params;

  const { data: currentUsage, error: currentUsageError } = await adminClient
    .from("practice_usage_periods")
    .select("audio_seconds_used, text_turns_used, blocks_consumed")
    .eq("id", usagePeriodId)
    .single();

  if (currentUsageError || !currentUsage) {
    const err = new Error("Unable to load current usage");
    (err as any).code = "AUDIO_INCREMENT_FAILED";
    throw err;
  }

  const audioAllowance = BASE_AUDIO_SECONDS + (currentUsage.blocks_consumed * BLOCK_AUDIO_SECONDS);
  const willUse = currentUsage.audio_seconds_used + seconds;
  const blocksNeeded = willUse > audioAllowance
    ? Math.ceil((willUse - audioAllowance) / BLOCK_AUDIO_SECONDS)
    : 0;

  if (blocksNeeded > 0 && !blockSubscriptionItemId) {
    const err = new Error("Missing Stripe metered item for AI Practice blocks");
    (err as any).code = "BLOCK_SUBSCRIPTION_ITEM_MISSING";
    throw err;
  }

  const { data: incrementResult, error: incrementError } = await adminClient.rpc("increment_audio_seconds", {
    p_usage_period_id: usagePeriodId,
    p_seconds: seconds,
    p_base_audio_seconds: BASE_AUDIO_SECONDS,
    p_block_audio_seconds: BLOCK_AUDIO_SECONDS,
  });

  if (incrementError || !incrementResult?.success) {
    const err = new Error("Failed to increment audio seconds");
    (err as any).code = "AUDIO_INCREMENT_FAILED";
    throw err;
  }

  const blockPurchased = !!incrementResult.block_purchased;
  const blocksAdded = Number(incrementResult.blocks_added || 0);

  if (blockPurchased && !blockSubscriptionItemId) {
      await adminClient
        .from("practice_usage_periods")
        .update({
          audio_seconds_used: incrementResult.new_audio_seconds - seconds,
          blocks_consumed: Math.max(0, incrementResult.new_blocks - (blocksAdded || 1)),
          current_tier_price_cents: AI_PRACTICE_BASE_PRICE_CENTS +
            (Math.max(0, incrementResult.new_blocks - (blocksAdded || 1)) * AI_PRACTICE_BLOCK_PRICE_CENTS),
        })
        .eq("id", usagePeriodId)
        .eq("audio_seconds_used", incrementResult.new_audio_seconds);

    const err = new Error("Missing Stripe metered item for AI Practice blocks");
    (err as any).code = "BLOCK_SUBSCRIPTION_ITEM_MISSING";
    throw err;
  }

  if (blockPurchased && blockSubscriptionItemId) {
    try {
      const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
        blockSubscriptionItemId,
        {
          quantity: Math.max(1, blocksAdded || 1),
          timestamp: Math.floor(Date.now() / 1000),
          action: "increment",
        }
      );

      await adminClient.from("practice_block_ledger").insert({
        usage_period_id: usagePeriodId,
        blocks_consumed: Math.max(1, blocksAdded || 1),
        trigger_type: "audio_overflow",
        usage_at_trigger: {
          audio_seconds: currentUsage.audio_seconds_used,
          text_turns: currentUsage.text_turns_used,
        },
        stripe_usage_record_id: usageRecord.id,
      });
    } catch (stripeError) {
      await adminClient
        .from("practice_usage_periods")
        .update({
          audio_seconds_used: incrementResult.new_audio_seconds - seconds,
          blocks_consumed: Math.max(0, incrementResult.new_blocks - (blocksAdded || 1)),
          current_tier_price_cents: AI_PRACTICE_BASE_PRICE_CENTS +
            (Math.max(0, incrementResult.new_blocks - (blocksAdded || 1)) * AI_PRACTICE_BLOCK_PRICE_CENTS),
        })
        .eq("id", usagePeriodId)
        .eq("audio_seconds_used", incrementResult.new_audio_seconds);

      const err = new Error("Stripe usage record failed");
      (err as any).code = "STRIPE_USAGE_FAILED";
      throw err;
    }
  }

  const { data: updatedUsage, error: fetchError } = await adminClient
    .from("practice_usage_periods")
    .select("id, audio_seconds_used, text_turns_used, blocks_consumed, current_tier_price_cents, period_end")
    .eq("id", usagePeriodId)
    .single();

  if (fetchError || !updatedUsage) {
    const err = new Error("Failed to fetch updated usage");
    (err as any).code = "AUDIO_INCREMENT_FAILED";
    throw err;
  }

  return { updatedUsage, blockPurchased };
}

async function getOrCreateUsagePeriod(
  adminClient: ServiceRoleClient,
  studentId: string,
  tutorId: string,
  subscriptionId: string
): Promise<{
  id: string;
  audio_seconds_used: number;
  text_turns_used: number;
  blocks_consumed: number;
  period_end: string;
} | null> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
    const periodStart = new Date(subscription.current_period_start * 1000);
    const periodEnd = new Date(subscription.current_period_end * 1000);

    const { data: existingPeriod } = await adminClient
      .from("practice_usage_periods")
      .select("id, audio_seconds_used, text_turns_used, blocks_consumed, period_end")
      .eq("student_id", studentId)
      .eq("subscription_id", subscriptionId)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .maybeSingle();

    if (existingPeriod) {
      return existingPeriod;
    }

    const { data: newPeriod } = await adminClient
      .from("practice_usage_periods")
      .insert({
        student_id: studentId,
        tutor_id: tutorId,
        subscription_id: subscriptionId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        audio_seconds_used: 0,
        text_turns_used: 0,
        blocks_consumed: 0,
        current_tier_price_cents: AI_PRACTICE_BASE_PRICE_CENTS,
      })
      .select("id, audio_seconds_used, text_turns_used, blocks_consumed, period_end")
      .single();

    return newPeriod;
  } catch (error) {
    console.error("[Audio] Error getting usage period:", error);
    return null;
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
  region: string,
  mimeType: string
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

  // Map browser mimeType to Azure-compatible content type
  // Azure Speech supports: audio/wav, audio/ogg, audio/webm, audio/mp4
  const contentTypeMap: Record<string, string> = {
    "audio/webm": "audio/webm",
    "audio/mp4": "audio/mp4",
    "audio/ogg": "audio/ogg",
    "audio/wav": "audio/wav",
  };
  const contentType = contentTypeMap[mimeType] || "audio/webm";

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
          "Content-Type": contentType,
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
