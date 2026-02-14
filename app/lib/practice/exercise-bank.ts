import type { SupabaseClient } from "@supabase/supabase-js";

export type ExerciseBankInput = {
  tutorId: string;
  title: string;
  description?: string | null;
  language: string;
  level?: string | null;
  topic?: string | null;
  vocabularyFocus: string[];
  grammarFocus: string[];
  systemPrompt: string;
  exampleConversation?: Record<string, unknown> | null;
};

export type StoredExerciseBank = {
  id: string;
};

/** A single exercise within a bank. */
export type Exercise = {
  id: string;
  type: string;
  prompt: string;
  answer?: string;
  options?: string[];
  hint?: string;
  bankId?: string;
};

/** Result of looking up an exercise bank for a session. */
export type ExerciseBankResult = {
  id: string;
  exercises: Exercise[];
} | null;

/**
 * Retrieve exercises for a given practice session from the exercise bank.
 * Returns null if no bank is linked or the session has no exercises.
 */
export async function getExerciseBankForSession(
  client: SupabaseClient,
  params: {
    studentId: string;
    language: string;
    level: string;
    topic?: string;
  }
): Promise<ExerciseBankResult> {
  // For now, return null — exercises are generated dynamically via AI chat.
  // This function exists for future structured exercise support where
  // exercise banks can be pre-generated from lesson transcripts.
  return null;
}

/**
 * Stores a generated exercise bank.
 *
 * Exercise banks are persisted in `practice_scenarios`, which is the backing
 * store used by AI practice assignments.
 */
export async function storeExerciseBank(
  client: SupabaseClient,
  input: ExerciseBankInput
): Promise<StoredExerciseBank> {
  const { data, error } = await client
    .from("practice_scenarios")
    .insert({
      tutor_id: input.tutorId,
      title: input.title,
      description: input.description ?? null,
      language: input.language,
      level: input.level ?? null,
      topic: input.topic ?? null,
      system_prompt: input.systemPrompt,
      vocabulary_focus: input.vocabularyFocus,
      grammar_focus: input.grammarFocus,
      example_conversation: input.exampleConversation ?? null,
      is_active: true,
      is_public: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to store exercise bank");
  }

  return {
    id: data.id,
  };
}
