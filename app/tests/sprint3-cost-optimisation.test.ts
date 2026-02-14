import { createHash } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { InferenceTask } from "@/lib/ai/model-router";
import { getModelForTask } from "@/lib/ai/model-router";
import { buildCacheKey } from "@/lib/ai/semantic-cache";
import type { Exercise } from "@/lib/practice/exercise-bank";
import { scoreExerciseAttempt, type ScorableExercise } from "@/lib/practice/exercise-scoring";
import { buildHybridPlanFromExercises } from "@/lib/practice/hybrid-session";

const TASK_EXPECTATIONS: Record<InferenceTask, { model: string; tier: "fast" | "standard" | "quality" }> = {
  practice_chat: { model: "gpt-4o-mini", tier: "fast" },
  practice_greeting: { model: "gpt-4o-mini", tier: "fast" },
  session_feedback: { model: "gpt-4o-mini", tier: "standard" },
  lesson_analysis: { model: "gpt-4o-mini", tier: "standard" },
  speech_analysis: { model: "gpt-4o-mini", tier: "standard" },
  exercise_generation: { model: "gpt-4o", tier: "quality" },
  grammar_explanation: { model: "gpt-4o-mini", tier: "fast" },
  copilot_suggestion: { model: "gpt-4o-mini", tier: "standard" },
  profile_analysis: { model: "gpt-4o-mini", tier: "standard" },
};

function createScorableExercise(
  overrides: Partial<ScorableExercise> = {}
): ScorableExercise {
  return {
    id: overrides.id ?? "exercise-1",
    type: overrides.type ?? "fill_in_blank",
    prompt: overrides.prompt ?? "Fill in the blank.",
    options: overrides.options,
    correctAnswer: overrides.correctAnswer ?? "we are",
    explanation: overrides.explanation ?? "Use the correct verb form.",
  };
}

function createExercise(index: number): Exercise {
  return {
    id: `exercise-${index}`,
    type: "fill_in_blank",
    language: "spanish",
    level: "intermediate",
    topic: "travel",
    prompt: `Exercise ${index}`,
    correctAnswer: `answer-${index}`,
    explanation: `Explanation ${index}`,
    difficulty: 2,
    generatedAt: "2026-02-13T00:00:00.000Z",
  };
}

describe("model-router", () => {
  it("returns the expected model and tier per inference task", () => {
    for (const [task, expectation] of Object.entries(TASK_EXPECTATIONS) as Array<
      [InferenceTask, (typeof TASK_EXPECTATIONS)[InferenceTask]]
    >) {
      const config = getModelForTask(task);

      assert.equal(config.model, expectation.model);
      assert.equal(config.tier, expectation.tier);
    }
  });
});

describe("semantic-cache", () => {
  it("buildCacheKey is deterministic for equivalent params", () => {
    const keyOne = buildCacheKey({
      namespace: "grammar",
      language: "Spanish",
      level: "B1",
      topic: "Verb Tense",
      extra: {
        slug: "past-simple",
        category: "verb-tense",
      },
    });

    const keyTwo = buildCacheKey({
      namespace: "grammar",
      language: " spanish ",
      level: "b1",
      topic: "verb tense",
      extra: {
        category: "verb-tense",
        slug: "past-simple",
      },
    });

    assert.equal(keyOne, keyTwo);
  });
});

describe("exercise-scoring", () => {
  it("scores exact match as fully correct", () => {
    const exercise = createScorableExercise({
      type: "translation",
      correctAnswer: "we are",
    });

    const result = scoreExerciseAttempt(exercise, "we are");
    assert.equal(result.correct, true);
    assert.equal(result.score, 1);
  });

  it("scores case-insensitive match as correct", () => {
    const exercise = createScorableExercise({
      type: "translation",
      correctAnswer: "we are",
    });

    const result = scoreExerciseAttempt(exercise, "We ARE");
    assert.equal(result.correct, true);
    assert.equal(result.score, 1);
  });

  it("scores close fuzzy matches as high-confidence answers", () => {
    const exercise = createScorableExercise({
      type: "translation",
      correctAnswer: "I am practising every day",
    });

    const result = scoreExerciseAttempt(exercise, "I am practisng every day");
    assert.equal(result.correct, true);
    assert.equal(result.score, 0.9);
  });
});

describe("hybrid-session", () => {
  it("creates the expected conversation/exercise block sequence", () => {
    const plan = buildHybridPlanFromExercises({
      totalTurns: 10,
      exercises: [createExercise(1), createExercise(2), createExercise(3), createExercise(4)],
    });

    assert.equal(plan.length, 10);
    assert.deepEqual(plan.map((block) => block.type), [
      "conversation",
      "conversation",
      "exercise",
      "exercise",
      "conversation",
      "conversation",
      "exercise",
      "exercise",
      "conversation",
      "conversation",
    ]);

    assert.equal(plan[2].type, "exercise");
    assert.equal(plan[2].type === "exercise" ? plan[2].exercise.id : "", "exercise-1");
    assert.equal(plan[3].type, "exercise");
    assert.equal(plan[3].type === "exercise" ? plan[3].exercise.id : "", "exercise-2");
  });
});

describe("grammar-cache", () => {
  it("generates deterministic grammar cache keys from correction pairs", () => {
    const pairHash = createHash("sha256")
      .update("I goed|I went")
      .digest("hex")
      .slice(0, 16);

    const keyOne = buildCacheKey({
      namespace: "grammar",
      language: "Spanish",
      level: "Intermediate",
      topic: "verb-tense",
      extra: { pair: pairHash },
    });

    const keyTwo = buildCacheKey({
      namespace: "grammar",
      language: "spanish",
      level: "intermediate",
      topic: "Verb Tense",
      extra: { pair: pairHash.toUpperCase() },
    });

    const differentPairHash = createHash("sha256")
      .update("I goed|I have gone")
      .digest("hex")
      .slice(0, 16);

    const keyThree = buildCacheKey({
      namespace: "grammar",
      language: "spanish",
      level: "intermediate",
      topic: "verb-tense",
      extra: { pair: differentPairHash },
    });

    assert.equal(keyOne, keyTwo);
    assert.notEqual(keyOne, keyThree);
    assert.match(keyOne, /^grammar:spanish:intermediate:verb-tense:/);
  });
});
