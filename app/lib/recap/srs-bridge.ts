/**
 * Recap → SRS Bridge
 *
 * Converts recap exercise results into spaced repetition items.
 * When a student submits a recap attempt, each exercise answer creates
 * or updates an SRS item, closing the learning loop.
 */

import { createSRItem, recordReview } from "@/lib/spaced-repetition/scheduler";
import { estimateQuality } from "@/lib/spaced-repetition/sm2";
import type { RecapExercise, AttemptAnswer } from "@/lib/recap/types";

// =============================================================================
// TYPES
// =============================================================================

export interface IngestRecapParams {
  recapId: string;
  tutorId: string; // tutor_id (auth'd) or tutor_fingerprint
  studentFingerprint: string;
  studentId: string | null; // null for unauthenticated recap students
  exercises: RecapExercise[];
  answers: AttemptAnswer[];
  language: string;
  level: string | null;
}

export interface IngestResult {
  processed: number;
  created: number;
  reviewed: number;
  errors: number;
}

// =============================================================================
// MAIN INGESTION
// =============================================================================

/**
 * Ingest a completed recap attempt into the SRS system.
 *
 * For each answered exercise:
 * - Creates an SRS item if it doesn't exist (keyed by concept)
 * - Records a review with quality derived from correctness + response time
 */
export async function ingestRecapAttempt(
  params: IngestRecapParams
): Promise<IngestResult> {
  const {
    exercises,
    answers,
    tutorId,
    studentFingerprint,
    studentId,
    recapId,
    language,
  } = params;

  // Use authenticated student ID if available, else fingerprint-based pseudo-ID
  const srsStudentId = studentId ?? `fp:${studentFingerprint}`;

  const result: IngestResult = {
    processed: 0,
    created: 0,
    reviewed: 0,
    errors: 0,
  };

  for (const answer of answers) {
    const exercise = exercises[answer.exerciseIndex];
    if (!exercise) continue;

    result.processed++;

    try {
      // Build a stable, deduplicatable key for this concept
      const itemKey = buildItemKey(exercise, language);

      // Determine item type for SM-2 modifiers
      const itemType = exercise.targetVocab ? "vocabulary" : "grammar";

      // Extract the correct answer text for the SRS item
      const correctAnswer = getCorrectAnswer(exercise);

      // Create or find existing SRS item
      const itemId = await createSRItem({
        studentId: srsStudentId,
        tutorId,
        itemType,
        itemContent: {
          type: exercise.type,
          question: exercise.question,
          answer: correctAnswer,
          explanation: exercise.explanation,
          hint: ("hint" in exercise ? exercise.hint : null) ?? null,
          targetVocab: exercise.targetVocab ?? null,
          sourceRecapId: recapId,
          language,
        },
        itemKey,
        sourceLessonId: recapId,
      });

      // createSRItem returns existing ID if item_key already exists (dedup)
      result.created++; // Counts items touched (created or found)

      // Record the review using SM-2 quality estimation
      // expectedTimeMs = 8000ms for language exercises (generous for thinking time)
      const quality = estimateQuality(answer.correct, answer.timeMs, 8000);
      await recordReview(itemId, quality, answer.timeMs);

      result.reviewed++;
    } catch (err) {
      console.error(
        `[SRS Bridge] Error processing exercise ${answer.exerciseIndex}:`,
        err
      );
      result.errors++;
    }
  }

  console.log(
    `[SRS Bridge] Ingested recap ${recapId}: ${result.processed} processed, ` +
      `${result.created} items, ${result.reviewed} reviews, ${result.errors} errors`
  );

  return result;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Build a stable, deduplicatable key for an exercise.
 *
 * Same concept tested across multiple recaps should map to the same SRS item.
 * Priority: targetVocab (most stable) > correct answer text (fallback).
 */
function buildItemKey(exercise: RecapExercise, language: string): string {
  // Use targetVocab if available — it's the most stable identifier
  if (exercise.targetVocab) {
    return `recap:${language.toLowerCase()}:vocab:${exercise.targetVocab.toLowerCase().trim()}`;
  }

  // For grammar/structural exercises, use the correct answer as the key
  const answer = getCorrectAnswer(exercise);
  // Truncate to keep keys manageable (and stable across minor rephrasing)
  const normalised = answer.toLowerCase().trim().slice(0, 80);

  return `recap:${language.toLowerCase()}:exercise:${normalised}`;
}

/**
 * Extract the correct answer text from any exercise type.
 */
function getCorrectAnswer(exercise: RecapExercise): string {
  switch (exercise.type) {
    case "fillBlank":
      return exercise.answer ?? "";
    case "multipleChoice":
      return exercise.options?.[exercise.correct ?? 0] ?? "";
    case "wordOrder":
      return exercise.correctSentence ?? "";
    default:
      return exercise.question;
  }
}
