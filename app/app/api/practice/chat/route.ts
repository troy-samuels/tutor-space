import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import {
  FREE_TEXT_TURNS,
  FREE_AUDIO_SECONDS,
  BLOCK_TEXT_TURNS,
  BLOCK_AUDIO_SECONDS,
} from "@/lib/practice/constants";
import { errorResponse } from "@/lib/api/error-responses";
import { createPracticeChatCompletion, isPracticeOpenAIConfigured } from "@/lib/practice/openai";
import {
  GRAMMAR_CATEGORY_SLUGS,
  type GrammarCategorySlug,
  normalizeGrammarCategorySlug,
} from "@/lib/practice/grammar-categories";
import { getTutorHasPracticeAccess } from "@/lib/practice/access";
import { parseSanitizedJson } from "@/lib/utils/sanitize";
import {
  checkAIPracticeRateLimit,
  checkMonthlyUsageCap,
  rateLimitHeaders,
} from "@/lib/security/limiter";

interface StructuredCorrection {
  original: string;
  corrected: string;
  category: GrammarCategorySlug;
  explanation: string;
}

interface PhoneticError {
  misspelled: string;
  intended: string;
  pattern?: string;
}

// Hard per-request guardrails
const MAX_INPUT_MESSAGES = 10; // last 10 messages for context
const MAX_USER_MESSAGE_CHARS = 800; // clip very long user inputs
const MAX_OUTPUT_TOKENS_PER_CALL = 200;

type ServiceRoleClient = SupabaseClient;

type PracticeChatRequest = {
  sessionId?: string;
  message?: string;
};

type PracticeUsage = {
  text_turns_used?: number;
  text_turns_allowance?: number;
  audio_seconds_used?: number;
  audio_seconds_allowance?: number;
  blocks_consumed?: number;
};

type PracticeError = Error & {
  code?: string;
  retryable?: boolean;
  usage?: PracticeUsage;
};

function getPracticeErrorMeta(error: unknown): { code?: string; retryable?: boolean; usage?: PracticeUsage } {
  if (!error || typeof error !== "object") {
    return {};
  }

  const metadata = error as { code?: unknown; retryable?: unknown; usage?: unknown };
  const code = typeof metadata.code === "string" ? metadata.code : undefined;
  const retryable = typeof metadata.retryable === "boolean" ? metadata.retryable : undefined;
  const usage = metadata.usage && typeof metadata.usage === "object" ? (metadata.usage as PracticeUsage) : undefined;

  return { code, retryable, usage };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeFocusList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

export async function POST(request: Request) {
  let studentId: string | null = null;
  let adminClient: ServiceRoleClient | null = null;
  let reservedMessageCount: number | null = null;
  let initialMessageCount = 0;
  let sessionIdForCleanup: string | null = null;
  const requestId = randomUUID();
  const respondError = (
    message: string,
    status: number,
    code: string,
    options: {
      details?: Record<string, unknown>;
      headers?: HeadersInit;
      extra?: Record<string, unknown>;
    } = {}
  ) =>
    errorResponse(message, {
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

    const body = await parseSanitizedJson<PracticeChatRequest>(request);
    if (!body) {
      return respondError("Invalid request", 400, "INVALID_REQUEST");
    }

    const { sessionId, message } = body;

    if (!isNonEmptyString(sessionId) || !isNonEmptyString(message)) {
      return respondError("Session ID and message are required", 400, "INVALID_INPUT");
    }

    const sessionIdValue = sessionId.trim();
    const sanitizedMessage = message.replace(/\u0000/g, "");
    const trimmedMessage = sanitizedMessage.trim();
    if (!trimmedMessage) {
      return respondError("Message is required", 400, "INVALID_INPUT");
    }

    adminClient = createServiceRoleClient();
    if (!adminClient) {
      return respondError("Service unavailable", 503, "SERVICE_UNAVAILABLE");
    }

    // Verify session exists and user has access
    const { data: session, error: sessionError } = await adminClient
      .from("student_practice_sessions")
      .select(`
        id,
        student_id,
        tutor_id,
        language,
        level,
        topic,
        mode,
        message_count,
        ended_at,
        scenario_id,
        scenario:practice_scenarios (
          system_prompt,
          vocabulary_focus,
          grammar_focus,
          max_messages
        ),
        tokens_used,
        grammar_errors_count,
        phonetic_errors_count
      `)
      .eq("id", sessionIdValue)
      .single();

    if (sessionError || !session) {
      return respondError("Session not found", 404, "SESSION_NOT_FOUND");
    }

    if (session.ended_at) {
      return respondError("Session has ended", 400, "SESSION_ENDED");
    }

    // MODE ENFORCEMENT: This endpoint only accepts text mode sessions
    // Audio mode sessions must use /api/practice/audio for speech input
    if (session.mode === "audio") {
      return respondError("This session is audio-only. Use the microphone to speak.", 400, "MODE_MISMATCH");
    }

    sessionIdForCleanup = sessionIdValue;
    initialMessageCount = session.message_count || 0;

    // Verify user owns this session via student record
    const { data: student } = await adminClient
      .from("students")
      .select("*")
      .eq("id", session.student_id)
      .eq("user_id", user.id)
      .single();

    studentId = student?.id ?? null;

    if (!student) {
      return respondError("Unauthorized", 403, "UNAUTHORIZED");
    }

    // Check if student has AI practice enabled (either free tier or legacy subscription)
    if (!student.ai_practice_enabled && !student.ai_practice_free_tier_enabled) {
      return respondError("AI Practice not enabled. Please enable it first.", 403, "PRACTICE_DISABLED");
    }

    // FREEMIUM MODEL: Check if tutor has Studio tier (access gate)
    if (!student.tutor_id) {
      return respondError("No tutor assigned", 403, "NO_TUTOR");
    }

    const tutorHasStudio = await getTutorHasPracticeAccess(adminClient, student.tutor_id);
    if (!tutorHasStudio) {
      return respondError("AI Practice requires tutor Studio subscription", 403, "TUTOR_NOT_STUDIO");
    }

    if (!await isPracticeOpenAIConfigured()) {
      return respondError("AI practice is temporarily unavailable. Please try again later.", 503, "OPENAI_NOT_CONFIGURED", {
        extra: { retryable: false },
      });
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

    const scenario = Array.isArray(session.scenario) ? session.scenario[0] : session.scenario;
    const { data: reservation, error: reserveError } = await adminClient.rpc(
      "reserve_practice_message_slots",
      { p_session_id: sessionIdValue, p_increment: 2 }
    );

    const reservationResult = reservation as {
      success?: boolean;
      error?: string;
      message_count?: number;
      max_messages?: number;
    } | null;

    if (reserveError || !reservationResult?.success) {
      const reservationError = reservationResult?.error;

      if (reservationError === "MESSAGE_LIMIT_REACHED") {
        return respondError("Message limit reached for this practice session", 400, "MESSAGE_LIMIT_REACHED");
      }

      if (reservationError === "SESSION_ENDED") {
        return respondError("Session has ended", 400, "SESSION_ENDED");
      }

      if (reservationError === "SESSION_NOT_FOUND") {
        return respondError("Session not found", 404, "SESSION_NOT_FOUND");
      }

      return respondError("Message limit reached or session is busy, please retry", 409, "SESSION_BUSY");
    }

    if (typeof reservationResult.message_count !== "number") {
      return respondError("Unable to reserve message slots", 409, "SESSION_BUSY");
    }

    reservedMessageCount = reservationResult.message_count;

    // FREEMIUM MODEL: Get or create FREE usage period (no Stripe subscription required)
    const { data: usagePeriod, error: periodError } = await adminClient.rpc(
      "get_or_create_free_usage_period",
      {
        p_student_id: student.id,
        p_tutor_id: student.tutor_id,
      }
    );

    if (periodError || !usagePeriod) {
      console.error("[Practice Chat] Failed to get/create usage period:", periodError);
      return respondError("Unable to track usage. Please try again or contact support.", 500, "USAGE_PERIOD_ERROR");
    }

    // Calculate current allowance (free tier + any purchased blocks)
    const freeAudioSeconds = usagePeriod.free_audio_seconds ?? FREE_AUDIO_SECONDS;
    const freeTextTurns = usagePeriod.free_text_turns ?? FREE_TEXT_TURNS;
    const currentTextAllowance = freeTextTurns + (usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS);

    // FREEMIUM MODEL: Check if free allowance is exhausted
    if (usagePeriod.text_turns_used >= currentTextAllowance) {
      return respondError("Free allowance exhausted", 402, "FREE_TIER_EXHAUSTED", {
        extra: {
          usage: {
            text_turns_used: usagePeriod.text_turns_used,
            text_turns_allowance: currentTextAllowance,
            blocks_consumed: usagePeriod.blocks_consumed,
          },
        },
      });
    }

    // Track usage updates
    let updatedUsage = usagePeriod;
    let blockPurchased = false;

    // Get previous messages for context
    const { data: previousMessages } = await adminClient
      .from("student_practice_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionIdValue)
      .order("created_at", { ascending: false })
      .limit(MAX_INPUT_MESSAGES);

    // Build messages array for OpenAI
    const vocabularyFocus = normalizeFocusList(scenario?.vocabulary_focus);
    const grammarFocus = normalizeFocusList(scenario?.grammar_focus);

    const systemPrompt = scenario?.system_prompt || buildDefaultSystemPrompt(
      session.language,
      session.level,
      session.topic,
      vocabularyFocus,
      grammarFocus
    );

    const openAIMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add previous messages
    const history = (previousMessages || []).slice().reverse();
    for (const msg of history) {
      if (msg.role === "user" || msg.role === "assistant") {
        const content = typeof msg.content === "string" ? msg.content : "";
        if (content) {
          openAIMessages.push({ role: msg.role, content });
        }
      }
    }

    // Add current user message (clipped to reduce prompt cost)
    const clippedMessage = trimmedMessage.length > MAX_USER_MESSAGE_CHARS
      ? trimmedMessage.slice(0, MAX_USER_MESSAGE_CHARS)
      : trimmedMessage;

    openAIMessages.push({ role: "user", content: clippedMessage });

    // Save user message first
    const { error: userMsgError } = await adminClient.from("student_practice_messages").insert({
      session_id: sessionIdValue,
      role: "user",
      content: sanitizedMessage,
    });

    if (userMsgError) {
      console.error("[Practice Chat] Failed to save user message:", userMsgError);
      const err: PracticeError = Object.assign(new Error("Failed to save message"), {
        code: "DATABASE_ERROR",
        retryable: true,
      });
      throw err;
    }

    // Call OpenAI with retry/backoff
    let completion;
    try {
      completion = await createPracticeChatCompletion({
        model: "gpt-4o-mini",
        messages: openAIMessages,
        temperature: 0.8,
        max_tokens: MAX_OUTPUT_TOKENS_PER_CALL,
      });
      console.log("[Practice Chat] OpenAI success:", {
        model: "gpt-4o-mini",
        tokens: completion.usage?.total_tokens,
        finish_reason: completion.choices[0]?.finish_reason,
      });
    } catch (openaiError) {
      console.error("[Practice Chat] OpenAI API error:", openaiError);
      const err: PracticeError = Object.assign(new Error("AI service temporarily unavailable"), {
        code: "OPENAI_ERROR",
        retryable: true,
      });
      throw err;
    }

    const rawContent = Array.isArray(completion.choices)
      ? completion.choices[0]?.message?.content
      : null;
    if (!rawContent) {
      const err: PracticeError = Object.assign(new Error("AI service returned an empty response"), {
        code: "OPENAI_EMPTY_RESPONSE",
        retryable: true,
      });
      throw err;
    }
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Parse structured corrections and phonetic errors from the response
    const { cleanContent, corrections, phoneticErrors } = parseStructuredResponse(rawContent);
    const vocabularyUsed = parseVocabulary(rawContent, vocabularyFocus);

    // Save assistant message with structured data
    const { data: assistantMsg, error: assistantMsgError } = await adminClient
      .from("student_practice_messages")
      .insert({
        session_id: sessionIdValue,
        role: "assistant",
        content: cleanContent,
        corrections: corrections.length > 0 ? corrections : null,
        grammar_errors: corrections.length > 0 ? corrections : null,
        phonetic_errors: phoneticErrors.length > 0 ? phoneticErrors : null,
        vocabulary_used: vocabularyUsed.length > 0 ? vocabularyUsed : null,
        tokens_used: tokensUsed,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error("[Practice Chat] Failed to save assistant message:", assistantMsgError);
      const err: PracticeError = Object.assign(new Error("Failed to save AI response"), {
        code: "DATABASE_ERROR",
        retryable: true,
      });
      throw err;
    }

    // Save individual grammar errors to the tracking table
    if (corrections.length > 0 && assistantMsg) {
      const grammarErrorRecords = corrections.map((c) => ({
        message_id: assistantMsg.id,
        session_id: sessionIdValue,
        student_id: session.student_id,
        tutor_id: session.tutor_id,
        category_slug: c.category,
        original_text: c.original,
        corrected_text: c.corrected,
        explanation: c.explanation,
        language: session.language,
      }));

      const { error: grammarInsertError } = await adminClient.from("grammar_errors").insert(grammarErrorRecords);
      if (grammarInsertError) {
        // Log but don't fail - grammar tracking is non-critical
        console.error("[Practice Chat] Failed to save grammar errors:", grammarInsertError);
      }
    }

    // Save phonetic errors to the tracking table
    if (phoneticErrors.length > 0 && assistantMsg) {
      const phoneticErrorRecords = phoneticErrors.map((p) => ({
        message_id: assistantMsg.id,
        session_id: sessionIdValue,
        student_id: session.student_id,
        tutor_id: session.tutor_id,
        misspelled_word: p.misspelled,
        intended_word: p.intended,
        phonetic_pattern: p.pattern || null,
        language: session.language,
      }));

      const { error: phoneticInsertError } = await adminClient.from("phonetic_errors").insert(phoneticErrorRecords);
      if (phoneticInsertError) {
        // Log but don't fail - phonetic tracking is non-critical
        console.error("[Practice Chat] Failed to save phonetic errors:", phoneticInsertError);
      }
    }

    // Update session stats including error counts
    const currentTokens = session.tokens_used ?? 0;
    const currentGrammar = session.grammar_errors_count ?? 0;
    const currentPhonetic = session.phonetic_errors_count ?? 0;

    await adminClient
      .from("student_practice_sessions")
      .update({
        message_count: reservedMessageCount ?? (session.message_count || 0),
        tokens_used: currentTokens + tokensUsed,
        grammar_errors_count: currentGrammar + corrections.length,
        phonetic_errors_count: currentPhonetic + phoneticErrors.length,
      })
      .eq("id", sessionIdValue);

    const incrementResult = await incrementTextTurnWithBillingFreemium({
      adminClient,
      usagePeriodId: usagePeriod.id,
      blockSubscriptionItemId: null,
      freeTextTurns,
      freeAudioSeconds,
    });

    updatedUsage = incrementResult.updatedUsage;
    blockPurchased = incrementResult.blockPurchased;

    // FREEMIUM: Calculate remaining allowance using free tier + blocks
    const updatedTextAllowance = freeTextTurns + (updatedUsage.blocks_consumed * BLOCK_TEXT_TURNS);
    const updatedAudioAllowance = freeAudioSeconds + (updatedUsage.blocks_consumed * BLOCK_AUDIO_SECONDS);

    return NextResponse.json({
      messageId: assistantMsg?.id,
      content: cleanContent,
      corrections,
      phonetic_errors: phoneticErrors,
      vocabulary_used: vocabularyUsed,
      tokens_used: tokensUsed,
      usage: {
        text_turns_used: updatedUsage.text_turns_used,
        text_turns_allowance: updatedTextAllowance,
        text_turns_remaining: Math.max(0, updatedTextAllowance - updatedUsage.text_turns_used),
        audio_seconds_used: updatedUsage.audio_seconds_used,
        audio_seconds_allowance: updatedAudioAllowance,
        audio_seconds_remaining: Math.max(0, updatedAudioAllowance - updatedUsage.audio_seconds_used),
        blocks_consumed: updatedUsage.blocks_consumed,
        block_purchased: blockPurchased,
        // Freemium model additions
        isFreeUser: updatedUsage.blocks_consumed === 0,
        canBuyBlocks: false,
      },
    });
  } catch (error) {
    console.error("[Practice Chat] Error:", {
      requestId,
      sessionId: sessionIdForCleanup,
      error,
    });

    // Best-effort rollback of reserved message slots on failure
    if (adminClient && sessionIdForCleanup && reservedMessageCount !== null) {
      try {
        await adminClient
          .from("student_practice_sessions")
          .update({ message_count: initialMessageCount })
          .eq("id", sessionIdForCleanup)
          .eq("message_count", reservedMessageCount);
      } catch (rollbackError) {
        console.error("[Practice Chat] Failed to rollback message_count:", rollbackError);
      }
    }

    const { code: errorCode, retryable: isRetryable = false, usage } = getPracticeErrorMeta(error);

    if (errorCode === "OPENAI_ERROR") {
      return respondError("AI service temporarily unavailable", 503, "OPENAI_ERROR", {
        extra: { retryable: true },
      });
    }

    if (errorCode === "OPENAI_EMPTY_RESPONSE") {
      return respondError("AI service temporarily unavailable", 503, "OPENAI_EMPTY_RESPONSE", {
        extra: { retryable: true },
      });
    }

    if (errorCode === "DATABASE_ERROR") {
      return respondError("Failed to save message. Please try again.", 500, "DATABASE_ERROR", {
        extra: { retryable: true },
      });
    }

    if (errorCode === "BLOCK_SUBSCRIPTION_ITEM_MISSING") {
      return respondError(
        "Subscription is missing a metered block item. Please re-subscribe to continue.",
        400,
        "BLOCK_SUBSCRIPTION_ITEM_MISSING",
        { extra: { retryable: false } }
      );
    }

    if (errorCode === "STRIPE_USAGE_FAILED") {
      return respondError("Unable to bill the add-on block right now. Please try again.", 502, "STRIPE_USAGE_FAILED", {
        extra: { retryable: true },
      });
    }

    if (errorCode === "TEXT_INCREMENT_FAILED") {
      return respondError("Unable to track usage at the moment. Please retry.", 409, "TEXT_INCREMENT_FAILED", {
        extra: { retryable: true },
      });
    }

    if (errorCode === "BLOCK_REQUIRED") {
      return respondError("Free allowance exhausted", 402, "FREE_TIER_EXHAUSTED", {
        extra: { usage, retryable: false },
      });
    }

    // Generic fallback with retryable context preserved
    return respondError(
      error instanceof Error ? error.message : "Failed to process message",
      500,
      errorCode || "UNKNOWN_ERROR",
      { extra: { retryable: isRetryable } }
    );
  }
}

// Note: getOrCreateUsagePeriod has been replaced by the get_or_create_free_usage_period RPC
// for the freemium model. The RPC is called directly in the POST handler above.

function buildDefaultSystemPrompt(
  language: string,
  level: string | null,
  topic: string | null,
  vocabularyFocus?: string[],
  grammarFocus?: string[]
): string {
  const levelInstruction = level
    ? `The student is at ${level} level. Adjust your vocabulary and sentence complexity accordingly.`
    : "";

  const topicInstruction = topic
    ? `Today's conversation topic is: ${topic}. Try to keep the conversation focused on this topic.`
    : "";

  const vocabInstruction =
    vocabularyFocus && vocabularyFocus.length > 0
      ? `Try to naturally incorporate these vocabulary words: ${vocabularyFocus.join(", ")}`
      : "";

  const grammarInstruction =
    grammarFocus && grammarFocus.length > 0
      ? `Focus on practicing these grammar concepts: ${grammarFocus.join(", ")}`
      : "";

  return `You are a friendly ${language} language practice partner helping a student improve their conversational skills.

${levelInstruction}

${topicInstruction}

Your role:
1. Respond naturally in ${language} to keep the conversation flowing
2. Gently correct any significant errors the student makes
3. Ask follow-up questions to encourage the student to speak more
4. Be encouraging and supportive

${vocabInstruction}

${grammarInstruction}

IMPORTANT: After your conversational response, if you noticed any errors in the student's message, include structured feedback using the exact formats below.

For grammar/spelling errors, add at the very end:
<corrections>
[{"original": "exact text with error", "corrected": "corrected text", "category": "category_slug", "explanation": "brief explanation"}]
</corrections>

Valid categories: ${GRAMMAR_CATEGORY_SLUGS.join(", ")}

For spelling errors that suggest pronunciation confusion (e.g., phonetic misspellings), also add:
<phonetic_errors>
[{"misspelled": "becouse", "intended": "because", "pattern": "au->o confusion"}]
</phonetic_errors>

Keep your conversational response natural and concise (2-4 sentences). The correction tags should come AFTER your response.`;
}

/**
 * Parse structured corrections and phonetic errors from AI response.
 * Returns cleaned content (without the XML tags) and parsed data.
 */
function parseStructuredResponse(content: string): {
  cleanContent: string;
  corrections: StructuredCorrection[];
  phoneticErrors: PhoneticError[];
} {
  const corrections: StructuredCorrection[] = [];
  const phoneticErrors: PhoneticError[] = [];

  // Parse structured corrections
  const correctionsMatch = content.match(/<corrections>([\s\S]*?)<\/corrections>/i);
  if (correctionsMatch) {
    try {
      const parsed = JSON.parse(correctionsMatch[1].trim());
      if (Array.isArray(parsed)) {
        for (const c of parsed) {
          const category = normalizeGrammarCategorySlug(c.category);
          corrections.push({
            original: String(c.original || "").trim(),
            corrected: String(c.corrected || "").trim(),
            category,
            explanation: String(c.explanation || "").trim(),
          });
        }
      }
    } catch {
      // If JSON parsing fails, try fallback regex parsing
      const fallbackCorrections = parseFallbackCorrections(content);
      corrections.push(...fallbackCorrections);
    }
  } else {
    // Try legacy format if no structured tags
    const fallbackCorrections = parseFallbackCorrections(content);
    corrections.push(...fallbackCorrections);
  }

  // Parse phonetic errors
  const phoneticMatch = content.match(/<phonetic_errors>([\s\S]*?)<\/phonetic_errors>/i);
  if (phoneticMatch) {
    try {
      const parsed = JSON.parse(phoneticMatch[1].trim());
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          phoneticErrors.push({
            misspelled: String(p.misspelled || "").trim(),
            intended: String(p.intended || "").trim(),
            pattern: p.pattern ? String(p.pattern).trim() : undefined,
          });
        }
      }
    } catch {
      // Ignore phonetic parsing errors
    }
  }

  // Remove the structured tags from the response for clean display
  const cleanContent = content
    .replace(/<corrections>[\s\S]*?<\/corrections>/gi, "")
    .replace(/<phonetic_errors>[\s\S]*?<\/phonetic_errors>/gi, "")
    .replace(/\[Correction:[^\]]+\]/gi, "") // Also remove legacy format
    .trim();

  return { cleanContent, corrections, phoneticErrors };
}

/**
 * Fallback parser for legacy [Correction: 'X' should be 'Y'] format
 */
function parseFallbackCorrections(content: string): StructuredCorrection[] {
  const corrections: StructuredCorrection[] = [];
  const regex = /\[Correction:\s*['"]?([^'"]+)['"]?\s*should be\s*['"]?([^'"]+)['"]?\s*-?\s*([^\]]*)\]/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    corrections.push({
      original: match[1].trim(),
      corrected: match[2].trim(),
      category: "vocabulary", // Default category for legacy format
      explanation: match[3].trim() || "Grammar correction",
    });
  }

  return corrections;
}

function parseVocabulary(content: string, focusWords: string[]): string[] {
  if (!focusWords || focusWords.length === 0) return [];

  const contentLower = content.toLowerCase();
  return focusWords.filter((word) => contentLower.includes(word.toLowerCase()));
}

/**
 * FREEMIUM MODEL: Increment text turn and handle block billing if needed
 * - Uses increment_text_turn_freemium RPC which works with free tier allowances
 * - Only charges blocks via Stripe if student has set up block subscription
 * - Returns 402 at the API level if free tier exhausted without subscription
 */
async function incrementTextTurnWithBillingFreemium(params: {
  adminClient: ServiceRoleClient;
  usagePeriodId: string;
  blockSubscriptionItemId: string | null;
  freeTextTurns: number;
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
  const { adminClient, usagePeriodId, blockSubscriptionItemId, freeTextTurns } = params;

  // Use the freemium RPC which enforces free/block allowance and can signal block requirements
  const { data: incrementResult, error: incrementError } = await adminClient.rpc(
    "increment_text_turn_freemium",
    { p_usage_period_id: usagePeriodId, p_allow_block_overage: !!blockSubscriptionItemId }
  );

  if (incrementError || !incrementResult?.success) {
    console.error("[Practice Chat] increment_text_turn_freemium failed:", incrementError);

    // If the RPC explicitly signals block required, bubble a typed error
    if (incrementResult?.error === "BLOCK_REQUIRED") {
      const err: PracticeError = Object.assign(new Error("Block required"), {
        code: "BLOCK_REQUIRED",
        usage: {
          text_turns_used: incrementResult.text_turns_used,
          text_turns_allowance: incrementResult.text_turns_allowance,
          blocks_consumed: incrementResult.blocks_consumed,
        },
      });
      throw err;
    }

    const err: PracticeError = Object.assign(new Error("Failed to increment text turn"), {
      code: "TEXT_INCREMENT_FAILED",
    });
    throw err;
  }

  let blockPurchased = false;

  // If needs_block is true and student has block subscription, purchase via Stripe
  if (incrementResult.needs_block && blockSubscriptionItemId) {
    const usageAtTrigger = {
      audio_seconds: 0, // Will be fetched if needed
      text_turns: incrementResult.text_turns_used - 1,
    };

    try {
      // Record metered usage on Stripe
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
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
        p_trigger_type: "text_overflow",
        p_stripe_usage_record_id: usageRecord.id,
      });

      if (blockError) {
        console.error("[Practice Chat] record_block_purchase failed:", blockError);
      } else {
        blockPurchased = true;
      }
    } catch (stripeError) {
      console.error("[Practice Chat] Stripe usage record failed for text overflow:", stripeError);
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
      code: "TEXT_INCREMENT_FAILED",
    });
    throw err;
  }

  return { updatedUsage, blockPurchased };
}
