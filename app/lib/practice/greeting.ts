"use server";

import type { ServiceRoleClient } from "@/lib/supabase/admin";
import { isPracticeOpenAIConfigured, createPracticeChatCompletion } from "./openai";

export interface GreetingContext {
  language: string;
  level: string | null;
  topic: string | null;
  vocabularyFocus: string[];
  grammarFocus: string[];
  studentName?: string;
}

/**
 * Generates a personalized AI greeting for practice sessions.
 * Uses lesson analysis data to create relevant, engaging openers.
 */
export async function generatePracticeGreeting(context: GreetingContext): Promise<string> {
  // If OpenAI not configured, use template fallback
  const isConfigured = await isPracticeOpenAIConfigured();
  if (!isConfigured) {
    return generateTemplateGreeting(context);
  }

  try {
    const prompt = buildGreetingPrompt(context);

    const completion = await createPracticeChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a friendly ${context.language} language tutor starting a practice conversation. Generate a warm, personalized greeting that:
1. Is 2-3 sentences maximum
2. References specific vocabulary or topics from their recent lesson (if provided)
3. Ends with an open-ended question to start the conversation
4. Uses simple ${context.level || "intermediate"}-level language
5. Includes 1-2 words in the target language naturally
6. Is encouraging but not overly enthusiastic

Important: Be conversational and natural, not formal or stiff.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const greeting = completion.choices[0]?.message?.content?.trim();

    if (!greeting) {
      return generateTemplateGreeting(context);
    }

    return greeting;
  } catch (error) {
    console.error("[Greeting] Failed to generate AI greeting:", error);
    return generateTemplateGreeting(context);
  }
}

function buildGreetingPrompt(context: GreetingContext): string {
  const parts: string[] = [];

  parts.push(`Target language: ${context.language}`);

  if (context.level) {
    parts.push(`Student level: ${context.level}`);
  }

  if (context.studentName) {
    parts.push(`Student name: ${context.studentName}`);
  }

  if (context.topic) {
    parts.push(`Practice topic: ${context.topic}`);
  }

  if (context.vocabularyFocus.length > 0) {
    parts.push(`Key vocabulary from lesson: ${context.vocabularyFocus.slice(0, 5).join(", ")}`);
  }

  if (context.grammarFocus.length > 0) {
    parts.push(`Grammar focus: ${context.grammarFocus.slice(0, 3).join(", ")}`);
  }

  return parts.join("\n");
}

function generateTemplateGreeting(context: GreetingContext): string {
  const { language, topic, vocabularyFocus, level } = context;

  // Language-specific greetings
  const greetings: Record<string, string> = {
    Spanish: "Hola",
    French: "Bonjour",
    German: "Hallo",
    Italian: "Ciao",
    Portuguese: "Olá",
    Japanese: "こんにちは",
    Korean: "안녕하세요",
    Chinese: "你好",
    Arabic: "مرحبا",
    Russian: "Привет",
    Dutch: "Hallo",
    Polish: "Cześć",
    Turkish: "Merhaba",
    Hindi: "नमस्ते",
    English: "Hello",
  };

  const greeting = greetings[language] || "Hello";
  const vocabList = vocabularyFocus.slice(0, 3);

  // Build a personalized template greeting
  if (topic && vocabList.length > 0) {
    return `${greeting}! Great to practice with you today. We'll focus on "${topic}" and work with vocabulary like ${vocabList.join(", ")}. How would you like to start our conversation?`;
  }

  if (topic) {
    return `${greeting}! Welcome to your practice session on "${topic}". Let's have a conversation! How would you like to begin?`;
  }

  if (vocabList.length > 0) {
    return `${greeting}! Ready to practice? We'll work with words like ${vocabList.join(", ")}. What would you like to talk about?`;
  }

  // Generic fallback
  const levelText = level ? ` at the ${level} level` : "";
  return `${greeting}! Welcome to your ${language} practice session${levelText}. I'm here to help you practice through conversation. What would you like to talk about today?`;
}

export async function createPracticeGreetingMessage(params: {
  adminClient: ServiceRoleClient;
  sessionId: string;
  context: GreetingContext;
}): Promise<{ status: "created" | "skipped" | "failed"; messageId?: string }> {
  const { adminClient, sessionId, context } = params;

  const { data: existingMessage, error: existingError } = await adminClient
    .from("student_practice_messages")
    .select("id")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("[Greeting] Failed to check existing messages:", existingError);
    return { status: "failed" };
  }

  if (existingMessage) {
    await syncSessionMessageCount(adminClient, sessionId);
    return { status: "skipped" };
  }

  const { data: reservedSession, error: reserveError } = await adminClient
    .from("student_practice_sessions")
    .update({ message_count: 1 })
    .eq("id", sessionId)
    .eq("message_count", 0)
    .select("message_count")
    .maybeSingle();

  if (reserveError) {
    console.error("[Greeting] Failed to reserve greeting slot:", reserveError);
    return { status: "failed" };
  }

  if (!reservedSession) {
    return { status: "skipped" };
  }

  try {
    const greeting = await generatePracticeGreeting(context);

    const { data: insertedMessage, error: insertError } = await adminClient
      .from("student_practice_messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content: greeting,
      })
      .select("id")
      .single();

    if (insertError) {
      throw insertError;
    }

    await syncSessionMessageCount(adminClient, sessionId);

    return { status: "created", messageId: insertedMessage?.id };
  } catch (error) {
    await adminClient
      .from("student_practice_sessions")
      .update({ message_count: 0 })
      .eq("id", sessionId)
      .eq("message_count", 1);

    console.error("[Greeting] Failed to persist greeting:", error);
    return { status: "failed" };
  }
}

async function syncSessionMessageCount(
  adminClient: ServiceRoleClient,
  sessionId: string
): Promise<void> {
  const { count } = await adminClient
    .from("student_practice_messages")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (typeof count !== "number") return;

  const { data: session } = await adminClient
    .from("student_practice_sessions")
    .select("message_count")
    .eq("id", sessionId)
    .maybeSingle();

  const currentCount = session?.message_count ?? 0;
  if (count > currentCount) {
    await adminClient
      .from("student_practice_sessions")
      .update({ message_count: count })
      .eq("id", sessionId);
  }
}
