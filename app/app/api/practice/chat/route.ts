import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  BASE_TEXT_TURNS,
  BLOCK_TEXT_TURNS,
  BASE_AUDIO_SECONDS,
  BLOCK_AUDIO_SECONDS,
} from "@/lib/practice/constants";

// Dynamic import for OpenAI to avoid build errors if not installed
const getOpenAI = async () => {
  const OpenAI = (await import("openai")).default;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Usage allowance constants (in seconds for audio)
const BLOCK_PRICE_CENTS = AI_PRACTICE_BLOCK_PRICE_CENTS;

// Valid grammar error categories (must match database)
const GRAMMAR_CATEGORIES = [
  "verb_tense",
  "subject_verb_agreement",
  "preposition",
  "article",
  "word_order",
  "gender_agreement",
  "conjugation",
  "pronoun",
  "plural_singular",
  "spelling",
  "vocabulary",
] as const;

type GrammarCategory = typeof GRAMMAR_CATEGORIES[number];

interface StructuredCorrection {
  original: string;
  corrected: string;
  category: GrammarCategory;
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

export async function POST(request: Request) {
  let adminClient: ServiceRoleClient | null = null;
  let reservedMessageCount: number | null = null;
  let initialMessageCount = 0;
  let sessionIdForCleanup: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, message } = await request.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      );
    }

    adminClient = createServiceRoleClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
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
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.ended_at) {
      return NextResponse.json(
        { error: "Session has ended" },
        { status: 400 }
      );
    }

    sessionIdForCleanup = sessionId;
    initialMessageCount = session.message_count || 0;

    // Verify user owns this session via student record
    const { data: student } = await adminClient
      .from("students")
      .select("id, ai_practice_enabled, ai_practice_subscription_id, ai_practice_block_subscription_item_id, tutor_id")
      .eq("id", session.student_id)
      .eq("user_id", user.id)
      .single();

    if (!student) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (!student.ai_practice_enabled) {
      return NextResponse.json(
        { error: "AI Practice subscription required" },
        { status: 403 }
      );
    }

    // Guard: stay within message limits per session
    const scenario = Array.isArray(session.scenario) ? session.scenario[0] : session.scenario;
    const maxMessages = scenario?.max_messages || 20;
    if ((session.message_count || 0) + 2 > maxMessages) {
      return NextResponse.json(
        { error: "Message limit reached for this practice session" },
        { status: 400 }
      );
    }

    // Atomically reserve two message slots to prevent concurrent overruns
    const { data: reservedSession, error: reserveError } = await adminClient
      .from("student_practice_sessions")
      .update({ message_count: (session.message_count || 0) + 2 })
      .eq("id", sessionId)
      .eq("message_count", session.message_count || 0)
      .select("message_count")
      .maybeSingle();

    if (reserveError || !reservedSession) {
      return NextResponse.json(
        { error: "Message limit reached or session is busy, please retry" },
        { status: 409 }
      );
    }

    reservedMessageCount = reservedSession.message_count;

    // Get or create usage period for this billing cycle
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

    // Check text turns allowance and auto-purchase block if needed (atomic via RPC)
    let updatedUsage = usagePeriod;
    let blockPurchased = false;

    // Get previous messages for context
    const { data: previousMessages } = await adminClient
      .from("student_practice_messages")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(MAX_INPUT_MESSAGES);

    // Build messages array for OpenAI
    const systemPrompt = scenario?.system_prompt || buildDefaultSystemPrompt(
      session.language,
      session.level,
      session.topic,
      scenario?.vocabulary_focus,
      scenario?.grammar_focus
    );

    const openAIMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add previous messages
    const history = (previousMessages || []).slice().reverse();
    for (const msg of history) {
      if (msg.role === "user" || msg.role === "assistant") {
        openAIMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message (clipped to reduce prompt cost)
    const clippedMessage = message.length > MAX_USER_MESSAGE_CHARS
      ? message.slice(0, MAX_USER_MESSAGE_CHARS)
      : message;

    openAIMessages.push({ role: "user", content: clippedMessage });

    // Save user message first
    await adminClient.from("student_practice_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    // Call OpenAI
    const openai = await getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAIMessages,
      temperature: 0.8,
      max_tokens: MAX_OUTPUT_TOKENS_PER_CALL,
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Parse structured corrections and phonetic errors from the response
    const { cleanContent, corrections, phoneticErrors } = parseStructuredResponse(rawContent);
    const vocabularyUsed = parseVocabulary(rawContent, scenario?.vocabulary_focus || []);

    // Save assistant message with structured data
    const { data: assistantMsg } = await adminClient
      .from("student_practice_messages")
      .insert({
        session_id: sessionId,
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

    // Save individual grammar errors to the tracking table
    if (corrections.length > 0 && assistantMsg) {
      const grammarErrorRecords = corrections.map((c) => ({
        message_id: assistantMsg.id,
        session_id: sessionId,
        student_id: session.student_id,
        tutor_id: session.tutor_id,
        category_slug: c.category,
        original_text: c.original,
        corrected_text: c.corrected,
        explanation: c.explanation,
        language: session.language,
      }));

      await adminClient.from("grammar_errors").insert(grammarErrorRecords);
    }

    // Save phonetic errors to the tracking table
    if (phoneticErrors.length > 0 && assistantMsg) {
      const phoneticErrorRecords = phoneticErrors.map((p) => ({
        message_id: assistantMsg.id,
        session_id: sessionId,
        student_id: session.student_id,
        tutor_id: session.tutor_id,
        misspelled_word: p.misspelled,
        intended_word: p.intended,
        phonetic_pattern: p.pattern || null,
        language: session.language,
      }));

      await adminClient.from("phonetic_errors").insert(phoneticErrorRecords);
    }

    // Update session stats including error counts
    const currentTokens = (session as any).tokens_used || 0;
    const currentGrammar = (session as any).grammar_errors_count || 0;
    const currentPhonetic = (session as any).phonetic_errors_count || 0;

    await adminClient
      .from("student_practice_sessions")
      .update({
        message_count: reservedSession.message_count,
        tokens_used: currentTokens + tokensUsed,
        grammar_errors_count: currentGrammar + corrections.length,
        phonetic_errors_count: currentPhonetic + phoneticErrors.length,
      })
      .eq("id", sessionId);

    const incrementResult = await incrementTextTurnWithBilling({
      adminClient,
      usagePeriodId: usagePeriod.id,
      blockSubscriptionItemId: student.ai_practice_block_subscription_item_id,
    });

    updatedUsage = incrementResult.updatedUsage;
    blockPurchased = incrementResult.blockPurchased;

    // Calculate remaining allowance for response
    const updatedTextAllowance = BASE_TEXT_TURNS + (updatedUsage.blocks_consumed * BLOCK_TEXT_TURNS);
    const updatedAudioAllowance = BASE_AUDIO_SECONDS + (updatedUsage.blocks_consumed * BLOCK_AUDIO_SECONDS);

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
        audio_seconds_used: updatedUsage.audio_seconds_used,
        audio_seconds_allowance: updatedAudioAllowance,
        blocks_consumed: updatedUsage.blocks_consumed,
        block_purchased: blockPurchased,
      },
    });
  } catch (error) {
    console.error("[Practice Chat] Error:", error);

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

    if (errorCode === "TEXT_INCREMENT_FAILED") {
      return NextResponse.json(
        { error: "Unable to track usage at the moment. Please retry." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

async function getOrCreateUsagePeriod(
  adminClient: ServiceRoleClient,
  studentId: string,
  tutorId: string,
  subscriptionId: string | null
): Promise<{
  id: string;
  audio_seconds_used: number;
  text_turns_used: number;
  blocks_consumed: number;
} | null> {
  if (!subscriptionId) return null;

  try {
    // Get subscription period from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
    const periodStart = new Date(subscription.current_period_start * 1000);
    const periodEnd = new Date(subscription.current_period_end * 1000);

    // Try to find existing period
    const { data: existingPeriod } = await adminClient
      .from("practice_usage_periods")
      .select("id, audio_seconds_used, text_turns_used, blocks_consumed")
      .eq("student_id", studentId)
      .eq("subscription_id", subscriptionId)
      .gte("period_end", new Date().toISOString())
      .lte("period_start", new Date().toISOString())
      .maybeSingle();

    if (existingPeriod) {
      return existingPeriod;
    }

    // Create new period
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
      .select("id, audio_seconds_used, text_turns_used, blocks_consumed")
      .single();

    return newPeriod;
  } catch (error) {
    console.error("[Practice Chat] Error getting usage period:", error);
    return null;
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

Valid categories: verb_tense, subject_verb_agreement, preposition, article, word_order, gender_agreement, conjugation, pronoun, plural_singular, spelling, vocabulary

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
          // Validate category
          const category = GRAMMAR_CATEGORIES.includes(c.category as GrammarCategory)
            ? (c.category as GrammarCategory)
            : "vocabulary";
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

async function incrementTextTurnWithBilling(params: {
  adminClient: ServiceRoleClient;
  usagePeriodId: string;
  blockSubscriptionItemId: string | null;
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
  const { adminClient, usagePeriodId, blockSubscriptionItemId } = params;

  const { data: currentUsage, error: currentUsageError } = await adminClient
    .from("practice_usage_periods")
    .select("audio_seconds_used, text_turns_used, blocks_consumed")
    .eq("id", usagePeriodId)
    .single();

  if (currentUsageError || !currentUsage) {
    const err = new Error("Unable to load current usage");
    (err as any).code = "TEXT_INCREMENT_FAILED";
    throw err;
  }

  const textAllowance = BASE_TEXT_TURNS + (currentUsage.blocks_consumed * BLOCK_TEXT_TURNS);
  const needsBlock = currentUsage.text_turns_used >= textAllowance;

  if (needsBlock && !blockSubscriptionItemId) {
    const err = new Error("Missing Stripe metered item for AI Practice blocks");
    (err as any).code = "BLOCK_SUBSCRIPTION_ITEM_MISSING";
    throw err;
  }

  const usageAtTrigger = {
    audio_seconds: currentUsage.audio_seconds_used,
    text_turns: currentUsage.text_turns_used,
  };

  const { data: incrementResult, error: incrementError } = await adminClient.rpc("increment_text_turn", {
    p_usage_period_id: usagePeriodId,
    p_base_text_turns: BASE_TEXT_TURNS,
    p_block_text_turns: BLOCK_TEXT_TURNS,
  });

  if (incrementError || !incrementResult?.success) {
    const err = new Error("Failed to increment text turn");
    (err as any).code = "TEXT_INCREMENT_FAILED";
    throw err;
  }

  const blockPurchased = !!incrementResult.block_purchased;

  if (blockPurchased && !blockSubscriptionItemId) {
    await adminClient
      .from("practice_usage_periods")
      .update({
        text_turns_used: incrementResult.new_text_turns - 1,
        blocks_consumed: Math.max(0, incrementResult.new_blocks - 1),
        current_tier_price_cents: AI_PRACTICE_BASE_PRICE_CENTS +
          (Math.max(0, incrementResult.new_blocks - 1) * BLOCK_PRICE_CENTS),
      })
      .eq("id", usagePeriodId)
      .eq("text_turns_used", incrementResult.new_text_turns);

    const err = new Error("Missing Stripe metered item for AI Practice blocks");
    (err as any).code = "BLOCK_SUBSCRIPTION_ITEM_MISSING";
    throw err;
  }

  // If a block was auto-purchased, record metered usage and ledger entry
  if (blockPurchased && blockSubscriptionItemId) {
    try {
      const usageRecord = await (stripe.subscriptionItems as any).createUsageRecord(
        blockSubscriptionItemId,
        {
          quantity: 1,
          timestamp: Math.floor(Date.now() / 1000),
          action: "increment",
        }
      );

      await adminClient.from("practice_block_ledger").insert({
        usage_period_id: usagePeriodId,
        blocks_consumed: 1,
        trigger_type: "text_overflow",
        usage_at_trigger: usageAtTrigger,
        stripe_usage_record_id: usageRecord.id,
      });
    } catch (stripeError) {
      console.error("Stripe usage record failed for text overflow", stripeError);
      // Roll back the block + text increment so billing stays aligned
      await adminClient
        .from("practice_usage_periods")
        .update({
          text_turns_used: incrementResult.new_text_turns - 1,
          blocks_consumed: Math.max(0, incrementResult.new_blocks - 1),
          current_tier_price_cents: AI_PRACTICE_BASE_PRICE_CENTS +
            (Math.max(0, incrementResult.new_blocks - 1) * BLOCK_PRICE_CENTS),
        })
        .eq("id", usagePeriodId)
        .eq("text_turns_used", incrementResult.new_text_turns);

      const err = new Error("Stripe usage record failed");
      (err as any).code = "STRIPE_USAGE_FAILED";
      throw err;
    }
  }

  const { data: updatedUsage, error: fetchError } = await adminClient
    .from("practice_usage_periods")
    .select("id, audio_seconds_used, text_turns_used, blocks_consumed, current_tier_price_cents")
    .eq("id", usagePeriodId)
    .single();

  if (fetchError || !updatedUsage) {
    const err = new Error("Failed to fetch updated usage");
    (err as any).code = "TEXT_INCREMENT_FAILED";
    throw err;
  }

  return { updatedUsage, blockPurchased };
}
