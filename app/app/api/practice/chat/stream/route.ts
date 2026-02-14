import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createPracticeChatStream, isPracticeOpenAIConfigured } from "@/lib/practice/openai";
import {
  GRAMMAR_CATEGORY_SLUGS,
  type GrammarCategorySlug,
  normalizeGrammarCategorySlug,
} from "@/lib/practice/grammar-categories";
import { getStudentPracticeAccess } from "@/lib/practice/access";
import { parseSanitizedJson } from "@/lib/utils/sanitize";
import { createStreamParser, createSSEEncoder } from "@/lib/practice/stream-parser";
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

const MAX_INPUT_MESSAGES = 10;
const MAX_USER_MESSAGE_CHARS = 800;
const MAX_OUTPUT_TOKENS_PER_CALL = 200;

type ServiceRoleClient = SupabaseClient;

type PracticeChatRequest = {
  sessionId?: string;
  message?: string;
};

type StreamSession = {
  id: string;
  student_id: string;
  tutor_id: string | null;
  language: string;
  level: string | null;
  topic: string | null;
  mode: "text" | "audio" | null;
  has_audio_input: boolean | null;
  message_count: number | null;
  ended_at: string | null;
  tokens_used: number | null;
  grammar_errors_count: number | null;
  phonetic_errors_count: number | null;
  scenario:
    | {
        system_prompt: string | null;
        vocabulary_focus: unknown;
        grammar_focus: unknown;
      }
    | Array<{
        system_prompt: string | null;
        vocabulary_focus: unknown;
        grammar_focus: unknown;
      }>
    | null;
};

/**
 * Checks whether a value is a non-empty string.
 *
 * @param value - Input value.
 * @returns `true` when the value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Normalizes focus arrays to clean string lists.
 *
 * @param value - Raw JSON field from Supabase.
 * @returns Non-empty string array.
 */
function normalizeFocusList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

/**
 * Streams assistant chat completions while enforcing tier-based usage limits.
 */
export async function POST(request: Request) {
  const requestId = randomUUID();
  let adminClient: ServiceRoleClient | null = null;
  let sessionIdValue: string | null = null;
  let reservedMessageCount: number | null = null;
  let initialMessageCount = 0;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonError("Unauthorized", "UNAUTHORIZED", requestId, 401);
    }

    const body = await parseSanitizedJson<PracticeChatRequest>(request);
    if (!body) {
      return jsonError("Invalid request", "INVALID_REQUEST", requestId, 400);
    }

    const { sessionId, message } = body;
    if (!isNonEmptyString(sessionId) || !isNonEmptyString(message)) {
      return jsonError("Session ID and message are required", "INVALID_INPUT", requestId, 400);
    }

    sessionIdValue = sessionId.trim();
    const sanitizedMessage = message.replace(/\u0000/g, "");
    const trimmedMessage = sanitizedMessage.trim();
    if (!trimmedMessage) {
      return jsonError("Message is required", "INVALID_INPUT", requestId, 400);
    }

    adminClient = createServiceRoleClient();
    if (!adminClient) {
      return jsonError("Service unavailable", "SERVICE_UNAVAILABLE", requestId, 503);
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
        has_audio_input,
        message_count,
        ended_at,
        tokens_used,
        grammar_errors_count,
        phonetic_errors_count,
        scenario:practice_scenarios (
          system_prompt,
          vocabulary_focus,
          grammar_focus
        )
      `)
      .eq("id", sessionIdValue)
      .single();

    if (sessionError || !sessionRaw) {
      return jsonError("Session not found", "SESSION_NOT_FOUND", requestId, 404);
    }

    const session = sessionRaw as StreamSession;
    if (session.ended_at) {
      return jsonError("Session has ended", "SESSION_ENDED", requestId, 400);
    }

    if (session.mode === "audio" || session.has_audio_input === true) {
      return jsonError("This session is audio-only. Use the microphone to speak.", "MODE_MISMATCH", requestId, 400);
    }

    const { data: student, error: studentError } = await adminClient
      .from("students")
      .select("id, tutor_id")
      .eq("id", session.student_id)
      .eq("user_id", user.id)
      .single();

    if (studentError || !student) {
      return jsonError("Unauthorized", "UNAUTHORIZED", requestId, 403);
    }

    const practiceAccess = await getStudentPracticeAccess(adminClient, student.id);
    if (!practiceAccess.hasAccess) {
      const status = practiceAccess.reason === "student_not_found" ? 404 : 500;
      return jsonError(practiceAccess.message, practiceAccess.reason.toUpperCase(), requestId, status);
    }

    if (practiceAccess.textTurnsPerSession !== -1) {
      const textTurnsUsedThisSession = Math.floor((session.message_count ?? 0) / 2);
      if (textTurnsUsedThisSession >= practiceAccess.textTurnsPerSession) {
        return jsonError("Text turn limit reached for this session", "SESSION_TEXT_LIMIT_REACHED", requestId, 402, {
          tier: practiceAccess.tier,
          textTurnsUsedThisSession,
          textTurnsAllowance: practiceAccess.textTurnsPerSession,
          showUpgradePrompt: practiceAccess.showUpgradePrompt,
          upgradePriceCents: practiceAccess.upgradePrice,
        });
      }
    }

    if (!await isPracticeOpenAIConfigured()) {
      return jsonError(
        "AI practice is temporarily unavailable. Please try again later.",
        "OPENAI_NOT_CONFIGURED",
        requestId,
        503,
        { retryable: false }
      );
    }

    if (student.tutor_id) {
      const usageCap = await checkMonthlyUsageCap(adminClient, student.id, student.tutor_id);
      if (!usageCap.allowed) {
        return jsonError("Monthly practice limit reached. Contact support to continue.", "MONTHLY_LIMIT_EXCEEDED", requestId, 403, {
          usage: { used: usageCap.used, cap: usageCap.cap },
        });
      }
    }

    const hasHighRateLimit = practiceAccess.tier !== "free";
    const rateLimit = await checkAIPracticeRateLimit(student.id, hasHighRateLimit);
    if (!rateLimit.success) {
      return jsonError(
        "Rate limit exceeded. Please wait before sending more messages.",
        "RATE_LIMIT_EXCEEDED",
        requestId,
        429,
        undefined,
        rateLimitHeaders(rateLimit)
      );
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
        return jsonError("Message limit reached", "MESSAGE_LIMIT_REACHED", requestId, 400);
      }
      if (reservationError === "SESSION_ENDED") {
        return jsonError("Session has ended", "SESSION_ENDED", requestId, 400);
      }
      if (reservationError === "SESSION_NOT_FOUND") {
        return jsonError("Session not found", "SESSION_NOT_FOUND", requestId, 404);
      }
      return jsonError("Session busy, please retry", "SESSION_BUSY", requestId, 409);
    }

    if (typeof reservationResult.message_count !== "number") {
      return jsonError("Session busy, please retry", "SESSION_BUSY", requestId, 409);
    }

    reservedMessageCount = reservationResult.message_count;
    initialMessageCount = session.message_count || 0;

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

    void adminClient
      .from("student_practice_messages")
      .insert({
        session_id: sessionIdValue,
        role: "user",
        content: sanitizedMessage,
      })
      .then(({ error }) => {
        if (error) {
          console.error("[Stream] Failed to save user message:", error);
        }
      });

    let stream;
    try {
      stream = await createPracticeChatStream({
        model: "gpt-4o-mini",
        messages: openAIMessages,
        temperature: 0.8,
        max_tokens: MAX_OUTPUT_TOKENS_PER_CALL,
      });
    } catch (error) {
      console.error("[Stream] OpenAI error:", error);
      await rollbackReservedMessageCount({
        adminClient,
        sessionId: sessionIdValue,
        reservedMessageCount,
        initialMessageCount,
      });
      return jsonError(
        "AI service temporarily unavailable. Please try again.",
        "OPENAI_ERROR",
        requestId,
        503,
        { retryable: true }
      );
    }

    const parser = createStreamParser();
    const sseEncoder = createSSEEncoder();

    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          let tokensUsed = 0;

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              const parsed = parser.addChunk(content);
              controller.enqueue(
                sseEncoder.encode({
                  type: "content",
                  content: parsed.content,
                  corrections: parsed.corrections,
                  phoneticErrors: parsed.phoneticErrors,
                })
              );
            }

            if (chunk.usage) {
              tokensUsed = chunk.usage.total_tokens || 0;
            }
          }

          const finalData = parser.finalize();
          controller.enqueue(
            sseEncoder.encode({
              type: "done",
              content: finalData.content,
              corrections: finalData.corrections,
              phoneticErrors: finalData.phoneticErrors,
              features: {
                audioEnabled: practiceAccess.audioEnabled,
                adaptiveEnabled: practiceAccess.adaptiveEnabled,
                voiceInputEnabled: practiceAccess.voiceInputEnabled,
              },
            })
          );

          if (adminClient) {
            void saveAssistantDataInBackground({
              adminClient,
              sessionId: sessionIdValue || session.id,
              session,
              finalData,
              tokensUsed,
              vocabularyFocus,
              reservedMessageCount: reservedMessageCount ?? (session.message_count || 0),
            });
          }

          controller.enqueue(sseEncoder.encodeDone());
          controller.close();
        } catch (error) {
          console.error("[Stream] Error during streaming:", error);
          await rollbackReservedMessageCount({
            adminClient,
            sessionId: sessionIdValue,
            reservedMessageCount,
            initialMessageCount,
          });
          controller.enqueue(
            sseEncoder.encode({
              type: "error",
              error: "Stream interrupted",
            })
          );
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Stream] Error:", error);
    await rollbackReservedMessageCount({
      adminClient,
      sessionId: sessionIdValue,
      reservedMessageCount,
      initialMessageCount,
    });
    return jsonError(
      error instanceof Error ? error.message : "Failed to process message",
      "UNKNOWN_ERROR",
      requestId,
      500
    );
  }
}

/**
 * Saves assistant response and tracking records after stream completion.
 *
 * @param params - Post-processing payload for assistant output persistence.
 */
async function saveAssistantDataInBackground(params: {
  adminClient: ServiceRoleClient;
  sessionId: string;
  session: StreamSession;
  finalData: {
    content: string;
    corrections: Array<{ original: string; corrected: string; category: string; explanation: string }>;
    phoneticErrors: Array<{ misspelled: string; intended: string; pattern?: string }>;
  };
  tokensUsed: number;
  vocabularyFocus: string[];
  reservedMessageCount: number;
}) {
  const {
    adminClient,
    sessionId,
    session,
    finalData,
    tokensUsed,
    vocabularyFocus,
    reservedMessageCount,
  } = params;

  try {
    const corrections: StructuredCorrection[] = finalData.corrections.map((c) => ({
      ...c,
      category: normalizeGrammarCategorySlug(c.category) as GrammarCategorySlug,
    }));

    const vocabularyUsed = parseVocabulary(finalData.content, vocabularyFocus);

    const { data: assistantMsg, error: assistantMsgError } = await adminClient
      .from("student_practice_messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content: finalData.content,
        corrections: corrections.length > 0 ? corrections : null,
        grammar_errors: corrections.length > 0 ? corrections : null,
        phonetic_errors: finalData.phoneticErrors.length > 0 ? finalData.phoneticErrors : null,
        vocabulary_used: vocabularyUsed.length > 0 ? vocabularyUsed : null,
        tokens_used: tokensUsed,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error("[Stream Background] Failed to save assistant message:", assistantMsgError);
      return;
    }

    await Promise.all([
      corrections.length > 0 && assistantMsg
        ? adminClient.from("grammar_errors").insert(
            corrections.map((c) => ({
              message_id: assistantMsg.id,
              session_id: sessionId,
              student_id: session.student_id,
              tutor_id: session.tutor_id,
              category_slug: c.category,
              original_text: c.original,
              corrected_text: c.corrected,
              explanation: c.explanation,
              language: session.language,
            }))
          )
        : Promise.resolve(),
      finalData.phoneticErrors.length > 0 && assistantMsg
        ? adminClient.from("phonetic_errors").insert(
            finalData.phoneticErrors.map((p) => ({
              message_id: assistantMsg.id,
              session_id: sessionId,
              student_id: session.student_id,
              tutor_id: session.tutor_id,
              misspelled_word: p.misspelled,
              intended_word: p.intended,
              phonetic_pattern: p.pattern || null,
              language: session.language,
            }))
          )
        : Promise.resolve(),
      adminClient
        .from("student_practice_sessions")
        .update({
          message_count: reservedMessageCount,
          tokens_used: (session.tokens_used || 0) + tokensUsed,
          grammar_errors_count: (session.grammar_errors_count || 0) + corrections.length,
          phonetic_errors_count: (session.phonetic_errors_count || 0) + finalData.phoneticErrors.length,
        })
        .eq("id", sessionId),
    ]);
  } catch (error) {
    console.error("[Stream Background] Error saving data:", error);
  }
}

/**
 * Rolls back reserved message count when processing fails.
 *
 * @param params - Rollback state.
 */
async function rollbackReservedMessageCount(params: {
  adminClient: ServiceRoleClient | null;
  sessionId: string | null;
  reservedMessageCount: number | null;
  initialMessageCount: number;
}) {
  const { adminClient, sessionId, reservedMessageCount, initialMessageCount } = params;
  if (!adminClient || !sessionId || reservedMessageCount === null) return;

  try {
    await adminClient
      .from("student_practice_sessions")
      .update({ message_count: initialMessageCount })
      .eq("id", sessionId)
      .eq("message_count", reservedMessageCount);
  } catch (error) {
    console.error("[Stream] Failed to rollback message_count:", error);
  }
}

/**
 * Builds the fallback system prompt for practice chat.
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
 * Collects focused vocabulary that appears in response content.
 *
 * @param content - Assistant message content.
 * @param focusWords - Vocabulary focus list.
 * @returns Words from focus list that appear in content.
 */
function parseVocabulary(content: string, focusWords: string[]): string[] {
  if (!focusWords || focusWords.length === 0) return [];
  const contentLower = content.toLowerCase();
  return focusWords.filter((word) => contentLower.includes(word.toLowerCase()));
}

/**
 * Creates a structured JSON error response for the stream endpoint.
 *
 * @param error - Human-readable error message.
 * @param code - Machine-readable error code.
 * @param requestId - Correlation ID.
 * @param status - HTTP status code.
 * @param extra - Optional extra payload fields.
 * @param headers - Optional response headers.
 * @returns JSON response.
 */
function jsonError(
  error: string,
  code: string,
  requestId: string,
  status: number,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      error,
      code,
      requestId,
      ...(extra || {}),
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
      },
    }
  );
}
