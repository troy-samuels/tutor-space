import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { errorResponse } from "@/lib/api/error-responses";
import { createPracticeChatCompletion, isPracticeOpenAIConfigured } from "@/lib/practice/openai";
import {
  GRAMMAR_CATEGORY_SLUGS,
  type GrammarCategorySlug,
  normalizeGrammarCategorySlug,
} from "@/lib/practice/grammar-categories";
import { getStudentPracticeAccess } from "@/lib/practice/access";
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

type ServiceRoleClient = SupabaseClient;

type PracticeChatRequest = {
  sessionId?: string;
  message?: string;
};

type PracticeError = Error & {
  code?: string;
  retryable?: boolean;
};

type SessionRow = {
  id: string;
  student_id: string;
  tutor_id: string | null;
  language: string;
  level: string | null;
  topic: string | null;
  mode: "text" | "audio" | null;
  message_count: number | null;
  ended_at: string | null;
  scenario:
    | {
        system_prompt: string | null;
        vocabulary_focus: unknown;
        grammar_focus: unknown;
        max_messages: number | null;
      }
    | Array<{
        system_prompt: string | null;
        vocabulary_focus: unknown;
        grammar_focus: unknown;
        max_messages: number | null;
      }>
    | null;
  tokens_used: number | null;
  grammar_errors_count: number | null;
  phonetic_errors_count: number | null;
};

const MAX_INPUT_MESSAGES = 10;
const MAX_USER_MESSAGE_CHARS = 800;
const MAX_OUTPUT_TOKENS_PER_CALL = 200;

/**
 * Extracts typed metadata from unknown error values.
 *
 * @param error - Unknown error payload.
 * @returns Optional error code and retryability flags.
 */
function getPracticeErrorMeta(error: unknown): { code?: string; retryable?: boolean } {
  if (!error || typeof error !== "object") {
    return {};
  }

  const metadata = error as { code?: unknown; retryable?: unknown };
  const code = typeof metadata.code === "string" ? metadata.code : undefined;
  const retryable = typeof metadata.retryable === "boolean" ? metadata.retryable : undefined;

  return { code, retryable };
}

/**
 * Validates string values after JSON parsing.
 *
 * @param value - Input value to validate.
 * @returns `true` if value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Normalizes scenario focus arrays to clean string lists.
 *
 * @param value - Raw JSON field from Supabase.
 * @returns Non-empty string list.
 */
function normalizeFocusList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

/**
 * Handles practice text chat requests with tier-based text turn limits.
 */
export async function POST(request: Request) {
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { data: sessionRaw, error: sessionError } = await adminClient
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

    if (sessionError || !sessionRaw) {
      return respondError("Session not found", 404, "SESSION_NOT_FOUND");
    }

    const session = sessionRaw as SessionRow;
    if (session.ended_at) {
      return respondError("Session has ended", 400, "SESSION_ENDED");
    }

    if (session.mode === "audio") {
      return respondError("This session is audio-only. Use the microphone to speak.", 400, "MODE_MISMATCH");
    }

    sessionIdForCleanup = sessionIdValue;
    initialMessageCount = session.message_count || 0;

    const { data: student, error: studentError } = await adminClient
      .from("students")
      .select("id, tutor_id")
      .eq("id", session.student_id)
      .eq("user_id", user.id)
      .single();

    if (studentError || !student) {
      return respondError("Unauthorized", 403, "UNAUTHORIZED");
    }

    const practiceAccess = await getStudentPracticeAccess(adminClient, student.id);
    if (!practiceAccess.hasAccess) {
      const status = practiceAccess.reason === "student_not_found" ? 404 : 500;
      return respondError(practiceAccess.message, status, practiceAccess.reason.toUpperCase());
    }

    if (practiceAccess.textTurnsPerSession !== -1) {
      const textTurnsUsedThisSession = Math.floor((session.message_count ?? 0) / 2);
      if (textTurnsUsedThisSession >= practiceAccess.textTurnsPerSession) {
        return respondError("Text turn limit reached for this session", 402, "SESSION_TEXT_LIMIT_REACHED", {
          extra: {
            tier: practiceAccess.tier,
            textTurnsUsedThisSession,
            textTurnsAllowance: practiceAccess.textTurnsPerSession,
            showUpgradePrompt: practiceAccess.showUpgradePrompt,
            upgradePriceCents: practiceAccess.upgradePrice,
          },
        });
      }
    }

    if (!await isPracticeOpenAIConfigured()) {
      return respondError("AI practice is temporarily unavailable. Please try again later.", 503, "OPENAI_NOT_CONFIGURED", {
        extra: { retryable: false },
      });
    }

    if (student.tutor_id) {
      const usageCap = await checkMonthlyUsageCap(adminClient, student.id, student.tutor_id);
      if (!usageCap.allowed) {
        return respondError("Monthly practice limit reached. Contact support to continue.", 403, "MONTHLY_LIMIT_EXCEEDED", {
          extra: { usage: { used: usageCap.used, cap: usageCap.cap } },
        });
      }
    }

    const hasHighRateLimit = practiceAccess.tier !== "free";
    const rateLimit = await checkAIPracticeRateLimit(student.id, hasHighRateLimit);
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

    const { data: previousMessages } = await adminClient
      .from("student_practice_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionIdValue)
      .order("created_at", { ascending: false })
      .limit(MAX_INPUT_MESSAGES);

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

    const history = (previousMessages || []).slice().reverse();
    for (const msg of history) {
      if (msg.role === "user" || msg.role === "assistant") {
        const content = typeof msg.content === "string" ? msg.content : "";
        if (content) {
          openAIMessages.push({ role: msg.role, content });
        }
      }
    }

    const clippedMessage = trimmedMessage.length > MAX_USER_MESSAGE_CHARS
      ? trimmedMessage.slice(0, MAX_USER_MESSAGE_CHARS)
      : trimmedMessage;

    openAIMessages.push({ role: "user", content: clippedMessage });

    const { error: userMsgError } = await adminClient.from("student_practice_messages").insert({
      session_id: sessionIdValue,
      role: "user",
      content: sanitizedMessage,
    });

    if (userMsgError) {
      const err: PracticeError = Object.assign(new Error("Failed to save message"), {
        code: "DATABASE_ERROR",
        retryable: true,
      });
      throw err;
    }

    let completion;
    try {
      completion = await createPracticeChatCompletion({
        model: "gpt-4o-mini",
        messages: openAIMessages,
        temperature: 0.8,
        max_tokens: MAX_OUTPUT_TOKENS_PER_CALL,
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
    const { cleanContent, corrections, phoneticErrors } = parseStructuredResponse(rawContent);
    const vocabularyUsed = parseVocabulary(rawContent, vocabularyFocus);

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
      const err: PracticeError = Object.assign(new Error("Failed to save AI response"), {
        code: "DATABASE_ERROR",
        retryable: true,
      });
      throw err;
    }

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
        console.error("[Practice Chat] Failed to save grammar errors:", grammarInsertError);
      }
    }

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
        console.error("[Practice Chat] Failed to save phonetic errors:", phoneticInsertError);
      }
    }

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

    const textTurnsUsedThisSession = Math.floor((reservedMessageCount ?? (session.message_count || 0)) / 2);
    const textTurnsAllowance = practiceAccess.textTurnsPerSession;

    return NextResponse.json({
      messageId: assistantMsg?.id,
      content: cleanContent,
      corrections,
      phonetic_errors: phoneticErrors,
      vocabulary_used: vocabularyUsed,
      tokens_used: tokensUsed,
      usage: {
        tier: practiceAccess.tier,
        text_turns_used_this_session: textTurnsUsedThisSession,
        text_turns_allowance: textTurnsAllowance,
        text_turns_remaining:
          textTurnsAllowance === -1 ? -1 : Math.max(0, textTurnsAllowance - textTurnsUsedThisSession),
      },
      features: {
        audioEnabled: practiceAccess.audioEnabled,
        adaptiveEnabled: practiceAccess.adaptiveEnabled,
        voiceInputEnabled: practiceAccess.voiceInputEnabled,
      },
      upgrade: {
        canUpgrade: practiceAccess.showUpgradePrompt,
        upgradePriceCents: practiceAccess.upgradePrice,
      },
    });
  } catch (error) {
    console.error("[Practice Chat] Error:", { requestId, sessionIdForCleanup, error });

    await rollbackReservedMessageCount({
      adminClient,
      sessionId: sessionIdForCleanup,
      reservedMessageCount,
      initialMessageCount,
    });

    const { code: errorCode, retryable: isRetryable = false } = getPracticeErrorMeta(error);

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

    return respondError(
      error instanceof Error ? error.message : "Failed to process message",
      500,
      errorCode || "UNKNOWN_ERROR",
      { extra: { retryable: isRetryable } }
    );
  }
}

/**
 * Best-effort rollback for reserved message slots on downstream failures.
 *
 * @param params - Session and reservation rollback parameters.
 */
async function rollbackReservedMessageCount(params: {
  adminClient: ServiceRoleClient | null;
  sessionId: string | null;
  reservedMessageCount: number | null;
  initialMessageCount: number;
}) {
  const { adminClient, sessionId, reservedMessageCount, initialMessageCount } = params;

  if (!adminClient || !sessionId || reservedMessageCount === null) {
    return;
  }

  try {
    await adminClient
      .from("student_practice_sessions")
      .update({ message_count: initialMessageCount })
      .eq("id", sessionId)
      .eq("message_count", reservedMessageCount);
  } catch (rollbackError) {
    console.error("[Practice Chat] Failed to rollback message_count:", rollbackError);
  }
}

/**
 * Builds fallback system prompt when the scenario has no custom prompt.
 */
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
 * Parses structured corrections and phonetic feedback from model output.
 *
 * @param content - Raw assistant message content.
 * @returns Clean display content plus parsed metadata arrays.
 */
function parseStructuredResponse(content: string): {
  cleanContent: string;
  corrections: StructuredCorrection[];
  phoneticErrors: PhoneticError[];
} {
  const corrections: StructuredCorrection[] = [];
  const phoneticErrors: PhoneticError[] = [];

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
      corrections.push(...parseFallbackCorrections(content));
    }
  } else {
    corrections.push(...parseFallbackCorrections(content));
  }

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
      // Ignore parsing failures for optional phonetic block.
    }
  }

  const cleanContent = content
    .replace(/<corrections>[\s\S]*?<\/corrections>/gi, "")
    .replace(/<phonetic_errors>[\s\S]*?<\/phonetic_errors>/gi, "")
    .replace(/\[Correction:[^\]]+\]/gi, "")
    .trim();

  return { cleanContent, corrections, phoneticErrors };
}

/**
 * Fallback parser for legacy correction format.
 */
function parseFallbackCorrections(content: string): StructuredCorrection[] {
  const corrections: StructuredCorrection[] = [];
  const regex = /\[Correction:\s*['"]?([^'"]+)['"]?\s*should be\s*['"]?([^'"]+)['"]?\s*-?\s*([^\]]*)\]/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    corrections.push({
      original: match[1].trim(),
      corrected: match[2].trim(),
      category: "vocabulary",
      explanation: match[3].trim() || "Grammar correction",
    });
  }

  return corrections;
}

/**
 * Extracts focus vocabulary that appears in assistant output.
 */
function parseVocabulary(content: string, focusWords: string[]): string[] {
  if (!focusWords || focusWords.length === 0) return [];
  const contentLower = content.toLowerCase();
  return focusWords.filter((word) => contentLower.includes(word.toLowerCase()));
}
