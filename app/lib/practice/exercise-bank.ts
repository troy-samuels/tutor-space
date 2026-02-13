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
