import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { FREE_TEXT_TURNS, BLOCK_TEXT_TURNS } from "@/lib/practice/constants";
import { createPracticeChatStream, isPracticeOpenAIConfigured } from "@/lib/practice/openai";
import {
  GRAMMAR_CATEGORY_SLUGS,
  type GrammarCategorySlug,
  normalizeGrammarCategorySlug,
} from "@/lib/practice/grammar-categories";
import { getTutorHasPracticeAccess } from "@/lib/practice/access";
import { parseSanitizedJson } from "@/lib/utils/sanitize";
import { createStreamParser, createSSEEncoder } from "@/lib/practice/stream-parser";

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

const MAX_INPUT_MESSAGES = 10;
const MAX_USER_MESSAGE_CHARS = 800;
const MAX_OUTPUT_TOKENS_PER_CALL = 200;

type ServiceRoleClient = SupabaseClient;

type PracticeChatRequest = {
  sessionId?: string;
  message?: string;
};

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
  const requestId = randomUUID();
  let adminClient: ServiceRoleClient | null = null;
  let sessionIdValue: string | null = null;
  let reservedMessageCount: number | null = null;
  let initialMessageCount = 0;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED", requestId }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await parseSanitizedJson<PracticeChatRequest>(request);
    if (!body) {
      return new Response(
        JSON.stringify({ error: "Invalid request", code: "INVALID_REQUEST", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { sessionId, message } = body;

    if (!isNonEmptyString(sessionId) || !isNonEmptyString(message)) {
      return new Response(
        JSON.stringify({ error: "Session ID and message are required", code: "INVALID_INPUT", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const sessionIdValueLocal = sessionId.trim();
    sessionIdValue = sessionIdValueLocal;
    const sanitizedMessage = message.replace(/\u0000/g, "");
    const trimmedMessage = sanitizedMessage.trim();

    adminClient = createServiceRoleClient();
    if (!adminClient) {
      return new Response(
        JSON.stringify({ error: "Service unavailable", code: "SERVICE_UNAVAILABLE", requestId }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch session and student in parallel for faster startup
    const sessionResult = await adminClient
      .from("student_practice_sessions")
      .select(`
        id,
        student_id,
        tutor_id,
        language,
        level,
        topic,
        has_audio_input,
        message_count,
        ended_at,
        scenario_id,
        scenario:practice_scenarios (
          system_prompt,
          vocabulary_focus,
          grammar_focus,
          max_messages
        )
      `)
        .eq("id", sessionIdValueLocal)
        .single();

    if (sessionResult.error || !sessionResult.data) {
      return new Response(
        JSON.stringify({ error: "Session not found", code: "SESSION_NOT_FOUND", requestId }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = sessionResult.data;

    if (session.ended_at) {
      return new Response(
        JSON.stringify({ error: "Session has ended", code: "SESSION_ENDED", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (session.has_audio_input === true) {
      return new Response(
        JSON.stringify({ error: "This session is audio-only. Use the microphone to speak.", code: "MODE_MISMATCH", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify student ownership
    const { data: student } = await adminClient
      .from("students")
      .select("*")
      .eq("id", session.student_id)
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", code: "UNAUTHORIZED", requestId }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!student.ai_practice_enabled && !student.ai_practice_free_tier_enabled) {
      return new Response(
        JSON.stringify({ error: "AI Practice not enabled", code: "PRACTICE_DISABLED", requestId }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!student.tutor_id) {
      return new Response(
        JSON.stringify({ error: "No tutor assigned", code: "NO_TUTOR", requestId }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const tutorHasStudio = await getTutorHasPracticeAccess(adminClient, student.tutor_id);
    if (!tutorHasStudio) {
      return new Response(
        JSON.stringify({ error: "AI Practice requires tutor Studio subscription", code: "TUTOR_NOT_STUDIO", requestId }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!await isPracticeOpenAIConfigured()) {
      return new Response(
        JSON.stringify({
          error: "AI practice is temporarily unavailable. Please try again later.",
          code: "OPENAI_NOT_CONFIGURED",
          retryable: false,
          requestId,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const scenario = Array.isArray(session.scenario) ? session.scenario[0] : session.scenario;
    const maxMessages = scenario?.max_messages || 20;
    if ((session.message_count || 0) + 2 > maxMessages) {
      return new Response(
        JSON.stringify({ error: "Message limit reached", code: "MESSAGE_LIMIT_REACHED", requestId }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Reserve message slots atomically
    const { data: reservedSession, error: reserveError } = await adminClient
      .from("student_practice_sessions")
      .update({ message_count: (session.message_count || 0) + 2 })
      .eq("id", sessionIdValueLocal)
      .eq("message_count", session.message_count || 0)
      .select("message_count")
      .maybeSingle();

    if (reserveError || !reservedSession) {
      return new Response(
        JSON.stringify({ error: "Session busy, please retry", code: "SESSION_BUSY", requestId }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    reservedMessageCount = reservedSession.message_count;
    initialMessageCount = session.message_count || 0;

    // Get usage period and context messages in parallel
    const [usagePeriodResult, previousMessagesResult] = await Promise.all([
      adminClient.rpc("get_or_create_free_usage_period", {
        p_student_id: student.id,
        p_tutor_id: student.tutor_id,
      }),
      adminClient
        .from("student_practice_messages")
        .select("role, content, created_at")
        .eq("session_id", sessionIdValueLocal)
        .order("created_at", { ascending: false })
        .limit(MAX_INPUT_MESSAGES),
    ]);

    if (usagePeriodResult.error || !usagePeriodResult.data) {
      await rollbackReservedMessageCount({
        adminClient,
        sessionId: sessionIdValue,
        reservedMessageCount,
        initialMessageCount,
      });
      return new Response(
        JSON.stringify({ error: "Unable to track usage", code: "USAGE_PERIOD_ERROR", requestId }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const usagePeriod = usagePeriodResult.data;
    const freeTextTurns = usagePeriod.free_text_turns ?? FREE_TEXT_TURNS;
    const currentTextAllowance = freeTextTurns + (usagePeriod.blocks_consumed * BLOCK_TEXT_TURNS);

    if (usagePeriod.text_turns_used >= currentTextAllowance) {
      if (!student.ai_practice_block_subscription_item_id) {
        await rollbackReservedMessageCount({
          adminClient,
          sessionId: sessionIdValue,
          reservedMessageCount,
          initialMessageCount,
        });
        return new Response(
          JSON.stringify({
            error: "Free allowance exhausted",
            code: "FREE_TIER_EXHAUSTED",
            usage: {
              text_turns_used: usagePeriod.text_turns_used,
              text_turns_allowance: currentTextAllowance,
              blocks_consumed: usagePeriod.blocks_consumed,
            },
            upgradeUrl: `/student/practice/buy-credits?student=${student.id}`,
            requestId,
          }),
          { status: 402, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const { data: incrementResult, error: incrementError } = await adminClient.rpc(
      "increment_text_turn_freemium",
      {
        p_usage_period_id: usagePeriod.id,
        p_allow_block_overage: !!student.ai_practice_block_subscription_item_id,
      }
    );

    if (incrementError || !incrementResult?.success) {
      const isBlockRequired = incrementResult?.error === "BLOCK_REQUIRED";
      const usage = incrementResult
        ? {
            text_turns_used: incrementResult.text_turns_used,
            text_turns_allowance: incrementResult.text_turns_allowance,
            blocks_consumed: incrementResult.blocks_consumed,
          }
        : {
            text_turns_used: usagePeriod.text_turns_used,
            text_turns_allowance: currentTextAllowance,
            blocks_consumed: usagePeriod.blocks_consumed,
          };

      await rollbackReservedMessageCount({
        adminClient,
        sessionId: sessionIdValue,
        reservedMessageCount,
        initialMessageCount,
      });
      return new Response(
        JSON.stringify({
          error: isBlockRequired ? "Free allowance exhausted" : "Unable to track usage",
          code: isBlockRequired ? "FREE_TIER_EXHAUSTED" : "USAGE_PERIOD_ERROR",
          usage,
          upgradeUrl: `/student/practice/buy-credits?student=${student.id}`,
          requestId,
        }),
        { status: isBlockRequired ? 402 : 409, headers: { "Content-Type": "application/json" } }
      );
    }

    if (incrementResult?.needs_block && student.ai_practice_block_subscription_item_id) {
      try {
        const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
          student.ai_practice_block_subscription_item_id,
          {
            quantity: 1,
            timestamp: Math.floor(Date.now() / 1000),
            action: "increment",
          }
        );

        await adminClient.rpc("record_block_purchase", {
          p_usage_period_id: usagePeriod.id,
          p_trigger_type: "text_overflow",
          p_stripe_usage_record_id: usageRecord.id,
        });
      } catch (stripeError) {
        console.error("[Stream] Stripe usage record failed:", stripeError);
      }
    }

    // Build OpenAI messages
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

    const history = (previousMessagesResult.data || []).slice().reverse();
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

    // Save user message (fire and forget - don't block streaming)
    void adminClient.from("student_practice_messages").insert({
      session_id: sessionIdValueLocal,
      role: "user",
      content: sanitizedMessage,
    }).then(({ error }) => {
      if (error) console.error("[Stream] Failed to save user message:", error);
    });

    // Create streaming response
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
        sessionId: sessionIdValueLocal,
        reservedMessageCount,
        initialMessageCount,
      });
      return new Response(
        JSON.stringify({
          error: "AI service temporarily unavailable. Please try again.",
          code: "OPENAI_ERROR",
          retryable: true,
          requestId,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
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

              // Send the clean content chunk to client
              controller.enqueue(sseEncoder.encode({
                type: "content",
                content: parsed.content,
                corrections: parsed.corrections,
                phoneticErrors: parsed.phoneticErrors,
              }));
            }

            // Track token usage from stream
            if (chunk.usage) {
              tokensUsed = chunk.usage.total_tokens || 0;
            }
          }

          // Finalize parsing
          const finalData = parser.finalize();

          // Send final message with complete data
          controller.enqueue(sseEncoder.encode({
            type: "done",
            content: finalData.content,
            corrections: finalData.corrections,
            phoneticErrors: finalData.phoneticErrors,
          }));

          // Background: Save assistant message and update stats
          if (adminClient) {
            void saveAssistantDataInBackground({
              adminClient,
              sessionId: sessionIdValueLocal,
              session,
              finalData,
              tokensUsed,
              vocabularyFocus,
              reservedMessageCount: reservedSession.message_count,
            });
          }

          controller.enqueue(sseEncoder.encodeDone());
          controller.close();
        } catch (error) {
          console.error("[Stream] Error during streaming:", error);
          await rollbackReservedMessageCount({
            adminClient,
            sessionId: sessionIdValueLocal,
            reservedMessageCount,
            initialMessageCount,
          });
          controller.enqueue(sseEncoder.encode({
            type: "error",
            error: "Stream interrupted",
          }));
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to process message",
        code: "UNKNOWN_ERROR",
        requestId,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

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
 * Save assistant message and update stats in background (non-blocking)
 */
async function saveAssistantDataInBackground(params: {
  adminClient: ServiceRoleClient;
  sessionId: string;
  session: any;
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
    // Normalize corrections categories
    const corrections: StructuredCorrection[] = finalData.corrections.map((c) => ({
      ...c,
      category: normalizeGrammarCategorySlug(c.category) as GrammarCategorySlug,
    }));

    const vocabularyUsed = parseVocabulary(finalData.content, vocabularyFocus);

    // Save assistant message
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

    // Save errors and update stats in parallel
    await Promise.all([
      // Save grammar errors
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

      // Save phonetic errors
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

      // Update session stats
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

function parseVocabulary(content: string, focusWords: string[]): string[] {
  if (!focusWords || focusWords.length === 0) return [];
  const contentLower = content.toLowerCase();
  return focusWords.filter((word) => contentLower.includes(word.toLowerCase()));
}

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
