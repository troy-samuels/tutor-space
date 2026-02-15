/**
 * Recap Context Provider
 *
 * Fetches a student's SRS history and recent recap topics to provide
 * context for adaptive recap generation. Exercises become a mix of
 * review (prior weak spots) and new (today's lesson).
 */

import { createServiceRoleClient } from "@/lib/supabase/admin";

// =============================================================================
// TYPES
// =============================================================================

export interface WeakItem {
  itemKey: string;
  itemType: string;
  content: Record<string, unknown>;
  correctRate: number; // 0–1
  totalReviews: number;
  lastReviewAt: string;
}

export interface RecapContext {
  weakItems: WeakItem[];
  recentRecapTopics: string[];
  studentLevel: string | null;
}

// =============================================================================
// MAIN
// =============================================================================

/**
 * Build context from a student's SRS history for adaptive recap generation.
 *
 * @param studentFingerprint - The student's localStorage fingerprint
 * @param tutorFingerprint - The tutor's fingerprint (to scope queries)
 * @param limit - Max weak items to return
 */
export async function getStudentRecapContext(
  studentFingerprint: string,
  tutorFingerprint: string,
  limit: number = 10
): Promise<RecapContext> {
  const supabase = createServiceRoleClient();
  if (!supabase) {
    return { weakItems: [], recentRecapTopics: [], studentLevel: null };
  }

  const srsStudentId = `fp:${studentFingerprint}`;

  // Run both queries in parallel
  const [weakItemsResult, recentRecapsResult] = await Promise.all([
    // 1. Weakest SRS items (lowest ease factor = hardest for this student)
    supabase
      .from("spaced_repetition_items")
      .select(
        "item_key, item_type, item_content, correct_count, incorrect_count, total_reviews, last_review_at, ease_factor"
      )
      .eq("student_id", srsStudentId)
      .gt("total_reviews", 0)
      .order("ease_factor", { ascending: true }) // Hardest first
      .limit(limit),

    // 2. Recent recap topics from this tutor (last 3 recaps)
    supabase
      .from("recaps")
      .select("summary")
      .eq("tutor_fingerprint", tutorFingerprint)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  // Process weak items
  const weakItems: WeakItem[] = (weakItemsResult.data ?? []).map((item) => ({
    itemKey: item.item_key,
    itemType: item.item_type,
    content: item.item_content as Record<string, unknown>,
    correctRate:
      item.total_reviews > 0
        ? item.correct_count / item.total_reviews
        : 0,
    totalReviews: item.total_reviews,
    lastReviewAt: item.last_review_at,
  }));

  // Extract recent topics
  const recentRecapTopics = (recentRecapsResult.data ?? []).flatMap(
    (r) =>
      ((r.summary as Record<string, unknown>)?.covered as string[]) ?? []
  );

  return {
    weakItems,
    recentRecapTopics,
    studentLevel: null, // Could be enriched from recap_students in the future
  };
}

// =============================================================================
// PROMPT BUILDER
// =============================================================================

/**
 * Build a context block for the LLM prompt based on student SRS history.
 *
 * Returns an empty string if no prior data exists (first recap for this student).
 */
export function buildContextBlock(context: RecapContext): string {
  if (context.weakItems.length === 0) {
    return "";
  }

  // Filter to items the student gets wrong >40% of the time
  const struggling = context.weakItems
    .filter((w) => w.correctRate < 0.6)
    .slice(0, 5);

  if (struggling.length === 0) {
    return "";
  }

  const weakSummary = struggling
    .map((w) => {
      const content = w.content as Record<string, unknown>;
      const concept =
        (content.targetVocab as string) ??
        (content.answer as string) ??
        (content.question as string) ??
        w.itemKey;
      return `- "${concept}" (correct ${Math.round(w.correctRate * 100)}% of the time, type: ${w.itemType}, reviewed ${w.totalReviews} times)`;
    })
    .join("\n");

  const topicsList =
    context.recentRecapTopics.length > 0
      ? context.recentRecapTopics.join(", ")
      : "none recorded";

  return `

STUDENT HISTORY (from previous recaps):
This student has struggled with these items in past lessons:
${weakSummary}

Recent topics already covered: ${topicsList}

INSTRUCTIONS FOR REVIEW:
- Include 1-2 exercises that revisit the weak spots above (rephrased, not identical)
- The remaining exercises should cover NEW material from today's lesson
- Do NOT repeat the exact same questions — test the same concept differently
- Mark review exercises with "targetVocab" matching the weak item if applicable
- If the student is improving on a weak spot (>60% correct), deprioritise it`;
}
