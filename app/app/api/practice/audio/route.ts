import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import {
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  FREE_AUDIO_SECONDS,
  FREE_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";
import { getTutorHasPracticeAccess } from "@/lib/practice/access";

// Azure Speech Services pricing: ~$0.022/minute = ~$0.000367/second
const AZURE_COST_PER_SECOND = 0.000367;
const BLOCK_PRICE_CENTS = AI_PRACTICE_BLOCK_PRICE_CENTS;

type ServiceRoleClient = SupabaseClient;

export async function POST(request: Request) {
  let studentId: string | null = null;
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
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    studentId = student?.id ?? null;

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Check if student has AI practice enabled (either free tier or legacy subscription)
    if (!student.ai_practice_enabled && !student.ai_practice_free_tier_enabled) {
      return NextResponse.json(
        { error: "AI Practice not enabled. Please enable it first." },
        { status: 403 }
      );
    }

    // MODE ENFORCEMENT: If sessionId provided, verify session is audio mode
    if (sessionId) {
      const { data: session } = await adminClient
        .from("student_practice_sessions")
        .select("mode")
        .eq("id", sessionId)
        .single();

      if (session && session.mode === "text") {
        return NextResponse.json(
          { error: "This session is text-only. Type your response instead.", code: "MODE_MISMATCH" },
          { status: 400 }
        );
      }
    }

    // FREEMIUM MODEL: Check if tutor has Studio tier (access gate)
    if (!student.tutor_id) {
      return NextResponse.json(
        { error: "No tutor assigned", code: "NO_TUTOR" },
        { status: 403 }
      );
    }

    const tutorHasStudio = await getTutorHasPracticeAccess(adminClient, student.tutor_id);
    if (!tutorHasStudio) {
      return NextResponse.json(
        { error: "AI Practice requires tutor Studio subscription", code: "TUTOR_NOT_STUDIO" },
        { status: 403 }
      );
    }

    // FREEMIUM MODEL: Get or create FREE usage period (no Stripe subscription required)
    const { data: usagePeriod, error: periodError } = await adminClient.rpc(
      "get_or_create_free_usage_period",
      {
        p_student_id: student.id,
        p_tutor_id: student.tutor_id,
      }
    );

    if (periodError || !usagePeriod) {
      console.error("[Audio] Failed to get/create usage period:", periodError);
      return NextResponse.json(
        { error: "Unable to track usage. Please try again or contact support." },
        { status: 500 }
      );
    }

    // Calculate current audio allowance (free tier + any purchased blocks)
    const freeAudioSeconds = usagePeriod.free_audio_seconds ?? FREE_AUDIO_SECONDS;
    const freeTextTurns = usagePeriod.free_text_turns ?? FREE_TEXT_TURNS;
    const currentAudioAllowance = freeAudioSeconds + (usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS);

    // Calculate audio duration (in seconds)
    // For simplicity, we estimate based on file size (rough approximation)
    // Better: Use Web Audio API on client to get exact duration
    const estimatedDuration = Math.ceil(audioFile.size / 16000); // Rough estimate for 16kHz audio
    const maxDuration = 30; // Cap individual recordings at 30 seconds
    const audioDuration = Math.min(estimatedDuration, maxDuration);

    // FREEMIUM MODEL: Check if this recording would exceed free allowance
    const willExceed = (usagePeriod.audio_seconds_used + audioDuration) > currentAudioAllowance;
    if (willExceed && !student.ai_practice_block_subscription_item_id) {
      return NextResponse.json(
        {
          error: "Free audio allowance exhausted",
          code: "FREE_TIER_EXHAUSTED",
          usage: {
            audio_seconds_used: usagePeriod.audio_seconds_used,
            audio_seconds_allowance: currentAudioAllowance,
            blocks_consumed: usagePeriod.blocks_consumed,
          },
          upgradeUrl: `/student/practice/buy-credits?student=${student.id}`,
        },
        { status: 402 } // Payment Required
      );
    }

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

      const { updatedUsage, blockPurchased } = await incrementAudioWithBillingFreemium({
        adminClient,
        usagePeriodId: usagePeriod.id,
        seconds: audioDuration,
        blockSubscriptionItemId: student.ai_practice_block_subscription_item_id,
        freeAudioSeconds,
      });

      // FREEMIUM: Calculate allowances using free tier + blocks
      const audioAllowance = freeAudioSeconds + (updatedUsage.blocks_consumed * BLOCK_AUDIO_SECONDS);
      const textAllowance = freeTextTurns + (updatedUsage.blocks_consumed * BLOCK_TEXT_TURNS);

      return NextResponse.json({
        success: true,
        mock: true,
        message: "Azure Speech not configured. Usage recorded but no pronunciation assessment.",
        assessment_id: assessment?.id,
        remaining_seconds: Math.max(0, audioAllowance - updatedUsage.audio_seconds_used),
        usage: {
          audio_seconds_used: updatedUsage.audio_seconds_used,
          audio_seconds_allowance: audioAllowance,
          audio_seconds_remaining: Math.max(0, audioAllowance - updatedUsage.audio_seconds_used),
          text_turns_used: updatedUsage.text_turns_used,
          text_turns_allowance: textAllowance,
          text_turns_remaining: Math.max(0, textAllowance - updatedUsage.text_turns_used),
          blocks_consumed: updatedUsage.blocks_consumed,
          block_purchased: blockPurchased,
          isFreeUser: updatedUsage.blocks_consumed === 0,
          canBuyBlocks: true,
          blockPriceCents: BLOCK_PRICE_CENTS,
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

    const { updatedUsage, blockPurchased } = await incrementAudioWithBillingFreemium({
      adminClient,
      usagePeriodId: usagePeriod.id,
      seconds: audioDuration,
      blockSubscriptionItemId: student.ai_practice_block_subscription_item_id,
      freeAudioSeconds,
    });

    // FREEMIUM: Calculate allowances using free tier + blocks
    const audioAllowance = freeAudioSeconds + (updatedUsage.blocks_consumed * BLOCK_AUDIO_SECONDS);
    const textAllowance = freeTextTurns + (updatedUsage.blocks_consumed * BLOCK_TEXT_TURNS);

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
        audio_seconds_remaining: Math.max(0, audioAllowance - updatedUsage.audio_seconds_used),
        text_turns_used: updatedUsage.text_turns_used,
        text_turns_allowance: textAllowance,
        text_turns_remaining: Math.max(0, textAllowance - updatedUsage.text_turns_used),
        blocks_consumed: updatedUsage.blocks_consumed,
        block_purchased: blockPurchased,
        isFreeUser: updatedUsage.blocks_consumed === 0,
        canBuyBlocks: true,
        blockPriceCents: BLOCK_PRICE_CENTS,
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

    if (errorCode === "BLOCK_REQUIRED") {
      return NextResponse.json(
        {
          error: "Free audio allowance exhausted",
          code: "FREE_TIER_EXHAUSTED",
          usage: (error as any).usage,
          upgradeUrl: `/student/practice/buy-credits?student=${studentId ?? ""}`,
        },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process audio" },
      { status: 500 }
    );
  }
}

// FREEMIUM MODEL: Get current audio budget for a student
export async function GET() {
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

    // Get student record - check both free tier and legacy subscription
    const { data: student } = await adminClient
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    // FREEMIUM: Check if student has any form of access
    if (!student || (!student.ai_practice_enabled && !student.ai_practice_free_tier_enabled)) {
      return NextResponse.json({
        enabled: false,
        remaining_seconds: 0,
        limit_seconds: 0,
        isFreeUser: true,
      });
    }

    // Check tutor has Studio access (required for freemium model)
    if (!student.tutor_id) {
      return NextResponse.json({
        enabled: false,
        remaining_seconds: 0,
        limit_seconds: 0,
        error: "No tutor assigned",
      });
    }

    const tutorHasStudio = await getTutorHasPracticeAccess(adminClient, student.tutor_id);
    if (!tutorHasStudio) {
      return NextResponse.json({
        enabled: false,
        remaining_seconds: 0,
        limit_seconds: 0,
        error: "Tutor needs Studio subscription",
      });
    }

    // FREEMIUM: Get or create FREE usage period
    const { data: usagePeriod } = await adminClient.rpc(
      "get_or_create_free_usage_period",
      {
        p_student_id: student.id,
        p_tutor_id: student.tutor_id,
      }
    );

    // Calculate allowances using free tier + blocks
    const freeAudioSeconds = usagePeriod?.free_audio_seconds ?? FREE_AUDIO_SECONDS;
    const freeTextTurns = usagePeriod?.free_text_turns ?? FREE_TEXT_TURNS;
    const blocks = usagePeriod?.blocks_consumed || 0;
    const audioAllowance = freeAudioSeconds + (blocks * BLOCK_AUDIO_SECONDS);
    const textAllowance = freeTextTurns + (blocks * BLOCK_TEXT_TURNS);
    const usedSeconds = usagePeriod?.audio_seconds_used || 0;
    const usedTurns = usagePeriod?.text_turns_used || 0;

    return NextResponse.json({
      enabled: true,
      remaining_seconds: Math.max(0, audioAllowance - usedSeconds),
      limit_seconds: audioAllowance,
      used_seconds: usedSeconds,
      blocks_consumed: blocks,
      text_turns_used: usedTurns,
      text_turns_allowance: textAllowance,
      text_turns_remaining: Math.max(0, textAllowance - usedTurns),
      period_end: usagePeriod?.period_end || student.ai_practice_current_period_end,
      // Freemium model additions
      isFreeUser: blocks === 0,
      canBuyBlocks: true,
      blockPriceCents: BLOCK_PRICE_CENTS,
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
 * FREEMIUM MODEL: Increment audio seconds and handle block billing if needed
 * - Uses increment_audio_seconds_freemium RPC which works with free tier allowances
 * - Only charges blocks via Stripe if student has set up block subscription
 * - Returns 402 at the API level if free tier exhausted without subscription
 */
async function incrementAudioWithBillingFreemium(params: {
  adminClient: ServiceRoleClient;
  usagePeriodId: string;
  seconds: number;
  blockSubscriptionItemId: string | null;
  freeAudioSeconds: number;
}): Promise<{
  updatedUsage: {
    id: string;
    audio_seconds_used: number;
    text_turns_used: number;
    blocks_consumed: number;
    current_tier_price_cents: number;
  };
  blockPurchased: boolean;
}> {
  const { adminClient, usagePeriodId, seconds, blockSubscriptionItemId } = params;

  // Use the freemium RPC which enforces free/block allowance and can signal block requirements
  const { data: incrementResult, error: incrementError } = await adminClient.rpc(
    "increment_audio_seconds_freemium",
    {
      p_usage_period_id: usagePeriodId,
      p_seconds: seconds,
      p_allow_block_overage: !!blockSubscriptionItemId,
    }
  );

  if (incrementError || !incrementResult?.success) {
    console.error("[Audio] increment_audio_seconds_freemium failed:", incrementError);

    if (incrementResult?.error === "BLOCK_REQUIRED") {
      const err = new Error("Block required");
      (err as any).code = "BLOCK_REQUIRED";
      (err as any).usage = {
        audio_seconds_used: incrementResult.audio_seconds_used,
        audio_seconds_allowance: incrementResult.audio_seconds_allowance,
        blocks_consumed: incrementResult.blocks_consumed,
      };
      throw err;
    }
    const err = new Error("Failed to increment audio seconds");
    (err as any).code = "AUDIO_INCREMENT_FAILED";
    throw err;
  }

  let blockPurchased = false;

  // If needs_block is true and student has block subscription, purchase via Stripe
  if (incrementResult.needs_block && blockSubscriptionItemId) {
    try {
      // Record metered usage on Stripe
      const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
        blockSubscriptionItemId,
        {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: "increment",
        }
      );

      // Record block purchase in our database
      const { error: blockError } = await adminClient.rpc("record_block_purchase", {
        p_usage_period_id: usagePeriodId,
        p_trigger_type: "audio_overflow",
        p_stripe_usage_record_id: usageRecord.id,
      });

      if (blockError) {
        console.error("[Audio] record_block_purchase failed:", blockError);
      } else {
        blockPurchased = true;
      }
    } catch (stripeError) {
      console.error("[Audio] Stripe usage record failed for audio overflow:", stripeError);
      // Don't throw - the increment already happened, just log the billing failure
      // The student still gets to use the service, we'll reconcile billing later
    }
  }

  // Fetch updated usage after increment (and possible block purchase)
  const { data: updatedUsage, error: fetchError } = await adminClient
    .from("practice_usage_periods")
    .select("id, audio_seconds_used, text_turns_used, blocks_consumed, current_tier_price_cents")
    .eq("id", usagePeriodId)
    .single();

  if (fetchError || !updatedUsage) {
    const err = new Error("Failed to fetch updated usage");
    (err as any).code = "AUDIO_INCREMENT_FAILED";
    throw err;
  }

  return { updatedUsage, blockPurchased };
}

// Note: getOrCreateUsagePeriod has been replaced by the get_or_create_free_usage_period RPC
// for the freemium model. The RPC is called directly in the POST and GET handlers above.

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
