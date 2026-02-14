import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { assertGoogleDataIsolation } from "@/lib/ai/google-compliance";
import {
  FREE_AUDIO_SECONDS,
  FREE_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";
import { getTutorHasPracticeAccess } from "@/lib/practice/access";
import {
  checkAIPracticeRateLimit,
  checkMonthlyUsageCap,
  rateLimitHeaders,
} from "@/lib/security/limiter";
import { errorResponse } from "@/lib/api/error-responses";

// Azure Speech Services pricing: ~$0.022/minute = ~$0.000367/second
const AZURE_COST_PER_SECOND = 0.000367;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 30;
const SESSION_ID_SCHEMA = z.string().uuid();

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
]);

const LANGUAGE_NAME_MAP: Record<string, string> = {
  english: "en-US",
  spanish: "es-ES",
  french: "fr-FR",
  german: "de-DE",
  portuguese: "pt-BR",
  italian: "it-IT",
  japanese: "ja-JP",
  korean: "ko-KR",
  chinese: "zh-CN",
  mandarin: "zh-CN",
};

const LANGUAGE_ALIASES: Record<string, string> = {
  en: "en-US",
  "en-us": "en-US",
  "en-gb": "en-GB",
  "american english": "en-US",
  "british english": "en-GB",
  es: "es-ES",
  "es-es": "es-ES",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  de: "de-DE",
  "de-de": "de-DE",
  pt: "pt-BR",
  "pt-br": "pt-BR",
  it: "it-IT",
  "it-it": "it-IT",
  ja: "ja-JP",
  "ja-jp": "ja-JP",
  ko: "ko-KR",
  "ko-kr": "ko-KR",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  "zh-tw": "zh-TW",
};

const SUPPORTED_AUDIO_LOCALES = new Set(Object.values({
  ...LANGUAGE_NAME_MAP,
  ...LANGUAGE_ALIASES,
}));

type ServiceRoleClient = SupabaseClient;

type PracticeUsage = {
  audio_seconds_used?: number;
  audio_seconds_allowance?: number;
  text_turns_used?: number;
  text_turns_allowance?: number;
  blocks_consumed?: number;
};

type PracticeError = Error & {
  code?: string;
  usage?: PracticeUsage;
};

function getPracticeErrorMeta(error: unknown): { code?: string; usage?: PracticeUsage } {
  if (!error || typeof error !== "object") {
    return {};
  }

  const metadata = error as { code?: unknown; usage?: unknown };
  const code = typeof metadata.code === "string" ? metadata.code : undefined;
  const usage = metadata.usage && typeof metadata.usage === "object" ? (metadata.usage as PracticeUsage) : undefined;

  return { code, usage };
}

function normalizeMimeType(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.replace(/\u0000/g, "").trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.split(";")[0];
}

function normalizeAudioLanguage(value: string): string | null {
  const trimmed = value.replace(/\u0000/g, "").trim();
  if (!trimmed) return null;
  const normalized = trimmed.toLowerCase().replace(/_/g, "-");

  const directAlias = LANGUAGE_ALIASES[normalized] || LANGUAGE_NAME_MAP[normalized];
  if (directAlias) return directAlias;

  const withoutParens = normalized.replace(/\(.*?\)/g, "").trim();
  const alias = LANGUAGE_ALIASES[withoutParens] || LANGUAGE_NAME_MAP[withoutParens];
  if (alias) return alias;

  for (const [name, locale] of Object.entries(LANGUAGE_NAME_MAP)) {
    if (withoutParens.includes(name)) {
      return locale;
    }
  }

  if (SUPPORTED_AUDIO_LOCALES.has(trimmed)) {
    return trimmed;
  }

  return null;
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const respondError = (
    message: string,
    status: number,
    code: string,
    options: { details?: Record<string, unknown>; headers?: HeadersInit; extra?: Record<string, unknown> } = {}
  ) => errorResponse(message, {
    status,
    code,
    details: options.details,
    headers: options.headers,
    extra: { requestId, ...options.extra },
  });

  let studentId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const formData = await request.formData();
    const audioEntry = formData.get("audio");
    const sessionIdEntry = formData.get("sessionId");
    const languageEntry = formData.get("language");
    const mimeTypeEntry = formData.get("mimeType");

    if (!(audioEntry instanceof File)) {
      return respondError("Audio file is required", 400, "AUDIO_REQUIRED");
    }

    const audioFile = audioEntry;

    if (audioFile.size === 0) {
      return respondError("Audio file is empty", 400, "AUDIO_EMPTY");
    }

    if (audioFile.size > MAX_AUDIO_BYTES) {
      return respondError("Audio file is too large", 413, "AUDIO_TOO_LARGE");
    }

    const rawSessionId = typeof sessionIdEntry === "string" ? sessionIdEntry.trim() : "";
    const sessionId = rawSessionId.length > 0 ? rawSessionId : null;

    if (sessionId && !SESSION_ID_SCHEMA.safeParse(sessionId).success) {
      return respondError("Invalid sessionId", 400, "INVALID_SESSION_ID");
    }

    if (typeof languageEntry !== "string") {
      return respondError("Language is required", 400, "LANGUAGE_REQUIRED");
    }

    const normalizedLanguage = normalizeAudioLanguage(languageEntry);
    if (!normalizedLanguage) {
      return respondError("Unsupported language", 400, "UNSUPPORTED_LANGUAGE", {
        details: { language: languageEntry },
      });
    }

    const normalizedMimeType = normalizeMimeType(
      typeof mimeTypeEntry === "string" ? mimeTypeEntry : null
    ) ?? normalizeMimeType(audioFile.type);

    if (!normalizedMimeType || !ALLOWED_AUDIO_MIME_TYPES.has(normalizedMimeType)) {
      return respondError("Invalid audio format", 400, "INVALID_AUDIO_FORMAT", {
        details: { mimeType: normalizedMimeType ?? null },
      });
    }

    const fileMimeType = normalizeMimeType(audioFile.type);
    if (fileMimeType && fileMimeType !== normalizedMimeType) {
      return respondError("MIME type mismatch", 400, "MIME_TYPE_MISMATCH", {
        details: { fileMimeType, mimeType: normalizedMimeType },
      });
    }

    const language = normalizedLanguage;
    const mimeType = normalizedMimeType;

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
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
      return respondError("Student not found", 404, "STUDENT_NOT_FOUND");
    }

    // Check if student has AI practice enabled (either free tier or legacy subscription)
    if (!student.ai_practice_enabled && !student.ai_practice_free_tier_enabled) {
      return respondError("AI Practice not enabled. Please enable it first.", 403, "PRACTICE_DISABLED");
    }

    // MODE ENFORCEMENT: If sessionId provided, verify session is audio mode
    if (sessionId) {
      const { data: session } = await adminClient
        .from("student_practice_sessions")
        .select("id, student_id, mode")
        .eq("id", sessionId)
        .maybeSingle();

      if (!session) {
        return respondError("Session not found", 404, "SESSION_NOT_FOUND");
      }

      if (session.student_id !== student.id) {
        return respondError("Unauthorized", 403, "UNAUTHORIZED");
      }

      if (session && session.mode === "text") {
        return respondError("This session is text-only. Type your response instead.", 400, "MODE_MISMATCH");
      }
    }

    // FREEMIUM MODEL: Check if tutor has Studio tier (access gate)
    if (!student.tutor_id) {
      return respondError("No tutor assigned", 403, "NO_TUTOR");
    }

    const tutorHasStudio = await getTutorHasPracticeAccess(adminClient, student.tutor_id);
    if (!tutorHasStudio) {
      return respondError("AI Practice requires tutor Studio subscription", 403, "TUTOR_NOT_STUDIO");
    }

    // RATE LIMITING: Check monthly cap (Margin Guard)
    const usageCap = await checkMonthlyUsageCap(adminClient, student.id, student.tutor_id);
    if (!usageCap.allowed) {
      return respondError("Monthly practice limit reached. Contact your tutor to upgrade your plan.", 403, "MONTHLY_LIMIT_EXCEEDED", {
        extra: { usage: { used: usageCap.used, cap: usageCap.cap } },
      });
    }

    // RATE LIMITING: Check per-minute rate limit (tier-based)
    const rateLimit = await checkAIPracticeRateLimit(student.id, tutorHasStudio);
    if (!rateLimit.success) {
      return respondError("Rate limit exceeded. Please wait before sending more messages.", 429, "RATE_LIMIT_EXCEEDED", {
        headers: rateLimitHeaders(rateLimit),
      });
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
      return respondError("Unable to track usage. Please try again or contact support.", 500, "USAGE_PERIOD_ERROR");
    }

    // Calculate current audio allowance (free tier + any purchased blocks)
    const freeAudioSeconds = usagePeriod.free_audio_seconds ?? FREE_AUDIO_SECONDS;
    const freeTextTurns = usagePeriod.free_text_turns ?? FREE_TEXT_TURNS;
    const currentAudioAllowance = freeAudioSeconds + (usagePeriod.blocks_consumed * BLOCK_AUDIO_SECONDS);

    // Calculate audio duration (in seconds)
    // For simplicity, we estimate based on file size (rough approximation)
    // Better: Use Web Audio API on client to get exact duration
    const estimatedDuration = Math.ceil(audioFile.size / 16000); // Rough estimate for 16kHz audio
    const audioDuration = Math.min(estimatedDuration, MAX_AUDIO_SECONDS);

    // FREEMIUM MODEL: Check if this recording would exceed free allowance
    const willExceed = (usagePeriod.audio_seconds_used + audioDuration) > currentAudioAllowance;
    if (willExceed) {
      return respondError("Free audio allowance exhausted", 402, "FREE_TIER_EXHAUSTED", {
        extra: {
          usage: {
            audio_seconds_used: usagePeriod.audio_seconds_used,
            audio_seconds_allowance: currentAudioAllowance,
            blocks_consumed: usagePeriod.blocks_consumed,
          },
        },
      });
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
        blockSubscriptionItemId: null,
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
          canBuyBlocks: false,
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
      blockSubscriptionItemId: null,
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
        canBuyBlocks: false,
      },
    });
  } catch (error) {
    console.error("[Audio] Error:", error);

    const { code: errorCode, usage } = getPracticeErrorMeta(error);
    if (errorCode === "BLOCK_SUBSCRIPTION_ITEM_MISSING") {
      return respondError(
        "Subscription is missing a metered block item. Please re-subscribe to continue.",
        400,
        "BLOCK_SUBSCRIPTION_ITEM_MISSING"
      );
    }

    if (errorCode === "STRIPE_USAGE_FAILED") {
      return respondError("Unable to bill the add-on block right now. Please try again.", 502, "STRIPE_USAGE_FAILED");
    }

    if (errorCode === "AUDIO_INCREMENT_FAILED") {
      return respondError("Unable to track audio usage right now. Please retry.", 409, "AUDIO_INCREMENT_FAILED");
    }

    if (errorCode === "BLOCK_REQUIRED") {
      return respondError("Free audio allowance exhausted", 402, "FREE_TIER_EXHAUSTED", {
        extra: {
          usage,
        },
      });
    }

    return respondError("Failed to process audio", 500, "AUDIO_PROCESSING_FAILED");
  }
}

// FREEMIUM MODEL: Get current audio budget for a student
export async function GET() {
  const requestId = randomUUID();
  const respondError = (
    message: string,
    status: number,
    code: string,
    options: { details?: Record<string, unknown>; headers?: HeadersInit; extra?: Record<string, unknown> } = {}
  ) => errorResponse(message, {
    status,
    code,
    details: options.details,
    headers: options.headers,
    extra: { requestId, ...options.extra },
  });

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return respondError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
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
      canBuyBlocks: false,
    });
  } catch (error) {
    console.error("[Audio Budget] Error:", error);
    return respondError("Failed to get audio budget", 500, "AUDIO_BUDGET_FAILED");
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
      const err: PracticeError = Object.assign(new Error("Block required"), {
        code: "BLOCK_REQUIRED",
        usage: {
          audio_seconds_used: incrementResult.audio_seconds_used,
          audio_seconds_allowance: incrementResult.audio_seconds_allowance,
          blocks_consumed: incrementResult.blocks_consumed,
        },
      });
      throw err;
    }
    const err: PracticeError = Object.assign(new Error("Failed to increment audio seconds"), {
      code: "AUDIO_INCREMENT_FAILED",
    });
    throw err;
  }

  let blockPurchased = false;

  // If needs_block is true and student has block subscription, purchase via Stripe
  if (incrementResult.needs_block && blockSubscriptionItemId) {
    try {
      // Record metered usage on Stripe
      const usageRecord = await (stripe.subscriptionItems as unknown as { createUsageRecord: (id: string, params: Record<string, unknown>) => Promise<{ id: string }> }).createUsageRecord(
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
    const err: PracticeError = Object.assign(new Error("Failed to fetch updated usage"), {
      code: "AUDIO_INCREMENT_FAILED",
    });
    throw err;
  }

  return { updatedUsage, blockPurchased };
}

// Note: getOrCreateUsagePeriod has been replaced by the get_or_create_free_usage_period RPC
// for the freemium model. The RPC is called directly in the POST and GET handlers above.

/**
 * Call Azure Pronunciation Assessment API
 * https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
 *
 * @google-compliance
 * Azure Speech receives only user-provided practice audio.
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
    "en-us": "en-US",
    "en-gb": "en-GB",
    "es": "es-ES",
    "es-es": "es-ES",
    "fr": "fr-FR",
    "fr-fr": "fr-FR",
    "de": "de-DE",
    "de-de": "de-DE",
    "pt": "pt-BR",
    "pt-br": "pt-BR",
    "it": "it-IT",
    "it-it": "it-IT",
    "zh": "zh-CN",
    "zh-cn": "zh-CN",
    "zh-tw": "zh-TW",
    "ja": "ja-JP",
    "ja-jp": "ja-JP",
    "ko": "ko-KR",
    "ko-kr": "ko-KR",
  };
  const normalizedLanguage = language.trim();
  const languageKey = normalizedLanguage.toLowerCase().replace(/_/g, "-");
  const baseLanguage = languageKey.split("-")[0];
  const azureLang = langMap[languageKey] || langMap[baseLanguage] || normalizedLanguage;

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
    assertGoogleDataIsolation({
      provider: "azure_speech",
      context: "practice.audio.assessPronunciation",
      data: { language, mimeType },
      sources: ["user_provided_audio"],
    });

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
