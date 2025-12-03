import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Dynamic import for OpenAI to avoid build errors if not installed
const getOpenAI = async () => {
  const OpenAI = (await import("openai")).default;
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Cost tracking (approximations for GPT-4o-mini)
const INPUT_TOKEN_COST = 0.00015 / 1000; // $0.15 per 1M tokens
const OUTPUT_TOKEN_COST = 0.0006 / 1000; // $0.60 per 1M tokens

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

// Budgeting: preserve 75% profitability on the $6/mo price
const AI_PRACTICE_PRICE_CENTS = 600;
const MIN_PROFIT_MARGIN = 0.75;
const MAX_PERIOD_SPEND_CENTS = Math.floor(
  AI_PRACTICE_PRICE_CENTS * (1 - MIN_PROFIT_MARGIN)
);
// Rough worst-case per-request spend guard (input + completion tokens)
const MAX_INPUT_TOKENS_PER_CALL = 4000;
const MAX_OUTPUT_TOKENS_PER_CALL = 600;
const MAX_REQUEST_COST_CENTS = Math.ceil(
  (MAX_INPUT_TOKENS_PER_CALL * INPUT_TOKEN_COST +
    MAX_OUTPUT_TOKENS_PER_CALL * OUTPUT_TOKEN_COST) *
  100
);

export async function POST(request: Request) {
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

    const adminClient = createServiceRoleClient();
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

    // Verify user owns this session via student record
    const { data: student } = await adminClient
      .from("students")
      .select("id, ai_practice_enabled, ai_practice_current_period_end")
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

    // Guard: stay within message and spend limits
    const scenario = Array.isArray(session.scenario) ? session.scenario[0] : session.scenario;
    const maxMessages = scenario?.max_messages || 20;
    if ((session.message_count || 0) + 2 > maxMessages) {
      return NextResponse.json(
        { error: "Message limit reached for this practice session" },
        { status: 400 }
      );
    }

    const now = new Date();
    const periodEnd = student.ai_practice_current_period_end
      ? new Date(student.ai_practice_current_period_end)
      : now;
    const periodStart = new Date(periodEnd);
    periodStart.setDate(periodStart.getDate() - 30);

    const { data: spendAgg } = await adminClient
      .from("student_practice_sessions")
      .select("total:sum(estimated_cost_cents)")
      .eq("student_id", student.id)
      .gte("started_at", periodStart.toISOString())
      .lte("started_at", periodEnd.toISOString())
      .maybeSingle();

    const costSoFar = spendAgg?.total || 0;
    const remainingBudgetCents = MAX_PERIOD_SPEND_CENTS - costSoFar;

    // If we don't have enough room even for a worst-case request, block the call
    if (remainingBudgetCents <= 0 || remainingBudgetCents < MAX_REQUEST_COST_CENTS) {
      return NextResponse.json(
        { error: "AI practice budget reached for this billing period" },
        { status: 402 }
      );
    }

    // Get previous messages for context
    const { data: previousMessages } = await adminClient
      .from("student_practice_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(20);

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
    if (previousMessages) {
      for (const msg of previousMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          openAIMessages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current user message
    openAIMessages.push({ role: "user", content: message });

    // Save user message first
    const { data: userMsg } = await adminClient
      .from("student_practice_messages")
      .insert({
        session_id: sessionId,
        role: "user",
        content: message,
      })
      .select()
      .single();

    // Call OpenAI
    const openai = await getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: openAIMessages,
      temperature: 0.8,
      max_tokens: 500,
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const tokensUsed = completion.usage?.total_tokens || 0;
    const inputTokens = completion.usage?.prompt_tokens || 0;
    const outputTokens = completion.usage?.completion_tokens || 0;

    // Calculate cost in cents
    const costCents = Math.ceil(
      (inputTokens * INPUT_TOKEN_COST + outputTokens * OUTPUT_TOKEN_COST) * 100
    );

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
    await adminClient
      .from("student_practice_sessions")
      .update({
        message_count: (session.message_count || 0) + 2,
        tokens_used: (session as any).tokens_used + tokensUsed || tokensUsed,
        estimated_cost_cents: (session as any).estimated_cost_cents + costCents || costCents,
        grammar_errors_count: (session as any).grammar_errors_count + corrections.length || corrections.length,
        phonetic_errors_count: (session as any).phonetic_errors_count + phoneticErrors.length || phoneticErrors.length,
      })
      .eq("id", sessionId);

    return NextResponse.json({
      messageId: assistantMsg?.id,
      content: cleanContent,
      corrections,
      phonetic_errors: phoneticErrors,
      vocabulary_used: vocabularyUsed,
      tokens_used: tokensUsed,
    });
  } catch (error) {
    console.error("[Practice Chat] Error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
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
    } catch (e) {
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
    } catch (e) {
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
