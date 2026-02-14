export type ScorableExerciseType =
  | "fill_in_blank"
  | "multiple_choice"
  | "sentence_reorder"
  | "translation"
  | "error_correction"
  | "conjugation"
  | "vocabulary_match";

export type ScorableExercise = {
  id: string;
  type: ScorableExerciseType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type ScoreResult = {
  correct: boolean;
  score: number;
  feedback: string;
};

const SYNONYMS: Record<string, string[]> = {
  quick: ["fast", "rapid"],
  small: ["little", "tiny"],
  buy: ["purchase"],
  begin: ["start", "commence"],
  child: ["kid"],
  happy: ["glad", "pleased"],
};

function normaliseText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function similarityScore(a: string, b: string): number {
  const left = normaliseText(a);
  const right = normaliseText(b);
  if (!left && !right) return 1;
  if (!left || !right) return 0;

  const distance = levenshteinDistance(left, right);
  const maxLength = Math.max(left.length, right.length);
  if (maxLength === 0) return 1;

  return 1 - distance / maxLength;
}

function synonymMatch(studentAnswer: string, correctAnswer: string): boolean {
  const left = normaliseText(studentAnswer);
  const right = normaliseText(correctAnswer);
  if (!left || !right) return false;

  if (left === right) return true;

  const leftWords = left.split(" ");
  const rightWords = right.split(" ");
  if (leftWords.length !== rightWords.length) return false;

  return leftWords.every((word, index) => {
    const expected = rightWords[index];
    if (word === expected) return true;

    const variants = SYNONYMS[expected] ?? [];
    return variants.includes(word);
  });
}

function resolveMultipleChoiceAnswer(exercise: ScorableExercise, studentAnswer: string): string {
  const normalised = normaliseText(studentAnswer);
  if (!exercise.options || exercise.options.length === 0) {
    return normalised;
  }

  const optionLetter = normalised.match(/^[a-z]$/i)?.[0]?.toUpperCase();
  if (optionLetter) {
    const index = optionLetter.charCodeAt(0) - "A".charCodeAt(0);
    if (index >= 0 && index < exercise.options.length) {
      return normaliseText(exercise.options[index]);
    }
  }

  return normaliseText(studentAnswer);
}

function buildFeedback(exercise: ScorableExercise, score: number): string {
  if (score >= 0.99) {
    return `Correct. ${exercise.explanation}`;
  }

  if (score >= 0.75) {
    return `Nearly correct. ${exercise.explanation}`;
  }

  return `Not quite. ${exercise.explanation} Correct answer: ${exercise.correctAnswer}.`;
}

/**
 * Scores a student's exercise attempt without an AI call.
 * Uses deterministic matching (exact, fuzzy, synonym) for exercise types.
 */
export function scoreExerciseAttempt(
  exercise: ScorableExercise,
  studentAnswer: string
): ScoreResult {
  const expected = normaliseText(exercise.correctAnswer);
  const rawAnswer = studentAnswer ?? "";
  let attempt = normaliseText(rawAnswer);

  if (exercise.type === "multiple_choice") {
    attempt = resolveMultipleChoiceAnswer(exercise, rawAnswer);
  }

  let score = 0;

  if (attempt === expected) {
    score = 1;
  } else if (exercise.type === "sentence_reorder") {
    const attemptWords = attempt.split(" ").filter(Boolean);
    const expectedWords = expected.split(" ").filter(Boolean);

    const sameLength = attemptWords.length === expectedWords.length;
    const sameBag =
      sameLength
        && [...attemptWords].sort().join(" ") === [...expectedWords].sort().join(" ");

    if (sameBag) {
      const sequenceScore = similarityScore(attemptWords.join(" "), expectedWords.join(" "));
      score = sequenceScore >= 0.7 ? 0.85 : 0.6;
    }
  } else if (synonymMatch(attempt, expected)) {
    score = 0.8;
  } else {
    const fuzzy = similarityScore(attempt, expected);
    if (fuzzy >= 0.92) {
      score = 0.9;
    } else if (fuzzy >= 0.8) {
      score = 0.75;
    }
  }

  const roundedScore = Math.max(0, Math.min(1, Math.round(score * 100) / 100));

  return {
    correct: roundedScore >= 0.8,
    score: roundedScore,
    feedback: buildFeedback(exercise, roundedScore),
  };
}
