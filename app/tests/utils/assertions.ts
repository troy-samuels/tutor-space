/**
 * Custom Test Assertions for Enterprise-Grade Testing
 *
 * Provides domain-specific assertions for:
 * - Speaker segments and diarization
 * - L1 interference detection results
 * - Homework status workflows
 * - Engagement and interaction metrics
 * - Code-switching analysis
 */

import assert from "node:assert/strict";

// ============================================
// SPEAKER DIARIZATION ASSERTIONS
// ============================================

/**
 * Assert that a value is a valid SpeakerSegment
 */
export function assertValidSpeakerSegment(
  segment: unknown,
  message?: string
): asserts segment is {
  speaker: number;
  text: string;
  start: number;
  end: number;
  words: unknown[];
  confidence: number;
  languages?: string[];
} {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof segment === "object" && segment !== null, `${prefix}Segment must be an object`);

  const seg = segment as Record<string, unknown>;

  assert.ok(typeof seg.speaker === "number", `${prefix}speaker must be a number`);
  assert.ok(seg.speaker >= 0, `${prefix}speaker must be non-negative`);

  assert.ok(typeof seg.start === "number", `${prefix}start must be a number`);
  assert.ok(seg.start >= 0, `${prefix}start must be non-negative`);

  assert.ok(typeof seg.end === "number", `${prefix}end must be a number`);
  assert.ok(seg.end >= seg.start, `${prefix}end must be >= start`);

  assert.ok(typeof seg.text === "string", `${prefix}text must be a string`);

  assert.ok(Array.isArray(seg.words), `${prefix}words must be an array`);

  assert.ok(typeof seg.confidence === "number", `${prefix}confidence must be a number`);
  assert.ok(seg.confidence >= 0 && seg.confidence <= 1, `${prefix}confidence must be between 0 and 1`);

  if (seg.languages !== undefined) {
    assert.ok(Array.isArray(seg.languages), `${prefix}languages must be an array if present`);
    for (const lang of seg.languages as string[]) {
      assert.ok(typeof lang === "string", `${prefix}each language must be a string`);
    }
  }
}

/**
 * Assert that segments are properly ordered by time
 */
export function assertSegmentsOrdered(
  segments: Array<{ start: number; end: number }>,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  for (let i = 1; i < segments.length; i++) {
    assert.ok(
      segments[i].start >= segments[i - 1].start,
      `${prefix}Segment ${i} starts before segment ${i - 1}`
    );
  }
}

/**
 * Assert that diarization identified multiple speakers
 */
export function assertMultipleSpeakers(
  segments: Array<{ speaker: number }>,
  expectedCount?: number,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";
  const speakers = new Set(segments.map((s) => s.speaker));

  if (expectedCount !== undefined) {
    assert.equal(
      speakers.size,
      expectedCount,
      `${prefix}Expected ${expectedCount} speakers, got ${speakers.size}`
    );
  } else {
    assert.ok(speakers.size > 1, `${prefix}Expected multiple speakers, got ${speakers.size}`);
  }
}

// ============================================
// L1 INTERFERENCE ASSERTIONS
// ============================================

/**
 * Assert that a value is a valid L1 interference result
 */
export function assertL1InterferenceResult(result: unknown, message?: string): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof result === "object" && result !== null, `${prefix}Result must be an object`);

  const r = result as Record<string, unknown>;

  assert.ok(
    ["low", "medium", "high"].includes(r.overallLevel as string),
    `${prefix}overallLevel must be 'low', 'medium', or 'high'`
  );

  assert.ok(
    typeof r.totalInterferenceCount === "number",
    `${prefix}totalInterferenceCount must be a number`
  );
  assert.ok(
    (r.totalInterferenceCount as number) >= 0,
    `${prefix}totalInterferenceCount must be non-negative`
  );

  assert.ok(Array.isArray(r.patterns), `${prefix}patterns must be an array`);
  assert.ok(Array.isArray(r.recommendedFocusAreas), `${prefix}recommendedFocusAreas must be an array`);
}

/**
 * Assert that L1 patterns were correctly detected
 */
export function assertL1PatternDetected(
  result: { patterns: Array<{ patternType: string }> },
  expectedPattern: string,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";
  const found = result.patterns.some((p) => p.patternType === expectedPattern);
  assert.ok(found, `${prefix}Expected L1 pattern '${expectedPattern}' to be detected`);
}

/**
 * Assert interference level matches expected
 */
export function assertInterferenceLevel(
  result: { overallLevel: string },
  expectedLevel: "low" | "medium" | "high",
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";
  assert.equal(
    result.overallLevel,
    expectedLevel,
    `${prefix}Expected interference level '${expectedLevel}', got '${result.overallLevel}'`
  );
}

// ============================================
// HOMEWORK STATUS ASSERTIONS
// ============================================

const VALID_HOMEWORK_STATUSES = [
  "assigned",
  "in_progress",
  "submitted",
  "completed",
  "cancelled",
] as const;

type HomeworkStatus = (typeof VALID_HOMEWORK_STATUSES)[number];

const VALID_STATUS_TRANSITIONS: Record<HomeworkStatus, HomeworkStatus[]> = {
  assigned: ["in_progress", "cancelled"],
  in_progress: ["submitted", "cancelled"],
  submitted: ["completed", "needs_revision" as any], // Allow needs_revision
  completed: [],
  cancelled: [],
};

/**
 * Assert that a homework status is valid
 */
export function assertHomeworkStatus(
  status: string,
  message?: string
): asserts status is HomeworkStatus {
  const prefix = message ? `${message}: ` : "";
  const validStatuses = [...VALID_HOMEWORK_STATUSES, "needs_revision"];
  assert.ok(
    validStatuses.includes(status as any),
    `${prefix}Invalid homework status: '${status}'. Valid: ${validStatuses.join(", ")}`
  );
}

/**
 * Assert that a homework status transition is valid
 */
export function assertValidStatusTransition(
  fromStatus: HomeworkStatus,
  toStatus: HomeworkStatus,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";
  const allowed = VALID_STATUS_TRANSITIONS[fromStatus] || [];
  assert.ok(
    allowed.includes(toStatus),
    `${prefix}Invalid transition from '${fromStatus}' to '${toStatus}'. Allowed: ${allowed.join(", ") || "none"}`
  );
}

/**
 * Assert homework is in terminal state
 */
export function assertHomeworkTerminal(
  status: HomeworkStatus,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";
  const terminalStates: HomeworkStatus[] = ["completed", "cancelled"];
  assert.ok(
    terminalStates.includes(status),
    `${prefix}Expected terminal status, got '${status}'`
  );
}

// ============================================
// ENGAGEMENT & INTERACTION ASSERTIONS
// ============================================

/**
 * Assert that engagement score is valid (0-1)
 */
export function assertEngagementScore(score: number, message?: string): void {
  const prefix = message ? `${message}: ` : "";
  assert.ok(typeof score === "number", `${prefix}Engagement score must be a number`);
  assert.ok(score >= 0, `${prefix}Engagement score must be >= 0, got ${score}`);
  assert.ok(score <= 1, `${prefix}Engagement score must be <= 1, got ${score}`);
}

/**
 * Assert that interaction metrics are valid
 */
export function assertInteractionMetrics(
  metrics: unknown,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof metrics === "object" && metrics !== null, `${prefix}Metrics must be an object`);

  const m = metrics as Record<string, unknown>;

  assert.ok(typeof m.turnCount === "number", `${prefix}turnCount must be a number`);
  assert.ok((m.turnCount as number) >= 0, `${prefix}turnCount must be non-negative`);

  if (m.speakingRatio !== undefined) {
    assert.ok(typeof m.speakingRatio === "number", `${prefix}speakingRatio must be a number`);
    assert.ok(
      (m.speakingRatio as number) >= 0 && (m.speakingRatio as number) <= 1,
      `${prefix}speakingRatio must be between 0 and 1`
    );
  }

  if (m.engagementScore !== undefined) {
    assertEngagementScore(m.engagementScore as number, `${prefix}engagementScore`);
  }
}

/**
 * Assert that confusion indicators were detected
 */
export function assertConfusionDetected(
  metrics: { confusionIndicators: unknown[] },
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";
  assert.ok(
    metrics.confusionIndicators.length > 0,
    `${prefix}Expected confusion indicators to be detected`
  );
}

/**
 * Assert that learning moments were identified
 */
export function assertLearningMomentsDetected(
  metrics: { learningMoments?: unknown[] },
  expectedType?: "breakthrough" | "struggle" | "practice" | "review",
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(
    metrics.learningMoments && metrics.learningMoments.length > 0,
    `${prefix}Expected learning moments to be detected`
  );

  if (expectedType) {
    const found = metrics.learningMoments.some(
      (m: any) => m.type === expectedType
    );
    assert.ok(found, `${prefix}Expected learning moment of type '${expectedType}'`);
  }
}

// ============================================
// CODE-SWITCHING ASSERTIONS
// ============================================

/**
 * Assert that code-switching metrics are valid
 */
export function assertCodeSwitchingMetrics(
  metrics: unknown,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof metrics === "object" && metrics !== null, `${prefix}Metrics must be an object`);

  const m = metrics as Record<string, unknown>;

  assert.ok(typeof m.totalWords === "number", `${prefix}totalWords must be a number`);
  assert.ok((m.totalWords as number) >= 0, `${prefix}totalWords must be non-negative`);

  assert.ok(
    typeof m.wordsByLanguage === "object" && m.wordsByLanguage !== null,
    `${prefix}wordsByLanguage must be an object`
  );

  assert.ok(typeof m.switchCount === "number", `${prefix}switchCount must be a number`);
  assert.ok((m.switchCount as number) >= 0, `${prefix}switchCount must be non-negative`);

  assert.ok(typeof m.isCodeSwitched === "boolean", `${prefix}isCodeSwitched must be a boolean`);

  if (m.dominantLanguage !== undefined) {
    assert.ok(
      typeof m.dominantLanguage === "string",
      `${prefix}dominantLanguage must be a string`
    );
  }
}

/**
 * Assert that code-switching was detected
 */
export function assertCodeSwitchingDetected(
  metrics: { isCodeSwitched: boolean; switchCount: number },
  minSwitches?: number,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(metrics.isCodeSwitched, `${prefix}Expected code-switching to be detected`);

  if (minSwitches !== undefined) {
    assert.ok(
      metrics.switchCount >= minSwitches,
      `${prefix}Expected at least ${minSwitches} switches, got ${metrics.switchCount}`
    );
  }
}

/**
 * Assert that specific languages were detected
 */
export function assertLanguagesDetected(
  metrics: { wordsByLanguage: Record<string, number> },
  expectedLanguages: string[],
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";
  const detected = Object.keys(metrics.wordsByLanguage);

  for (const lang of expectedLanguages) {
    assert.ok(
      detected.includes(lang),
      `${prefix}Expected language '${lang}' to be detected. Found: ${detected.join(", ")}`
    );
  }
}

// ============================================
// FLUENCY METRICS ASSERTIONS
// ============================================

/**
 * Assert that fluency metrics are valid
 */
export function assertFluencyMetrics(
  metrics: unknown,
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof metrics === "object" && metrics !== null, `${prefix}Metrics must be an object`);

  const m = metrics as Record<string, unknown>;

  assert.ok(typeof m.wordsPerMinute === "number", `${prefix}wordsPerMinute must be a number`);
  assert.ok((m.wordsPerMinute as number) >= 0, `${prefix}wordsPerMinute must be non-negative`);

  assert.ok(typeof m.avgPauseDuration === "number", `${prefix}avgPauseDuration must be a number`);
  assert.ok((m.avgPauseDuration as number) >= 0, `${prefix}avgPauseDuration must be non-negative`);

  assert.ok(typeof m.fillerWordCount === "number", `${prefix}fillerWordCount must be a number`);
  assert.ok((m.fillerWordCount as number) >= 0, `${prefix}fillerWordCount must be non-negative`);

  assert.ok(Array.isArray(m.fillerWords), `${prefix}fillerWords must be an array`);
}

/**
 * Assert that filler words were detected
 */
export function assertFillerWordsDetected(
  metrics: { fillerWords: string[]; fillerWordCount: number },
  expectedWords?: string[],
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(
    metrics.fillerWordCount > 0,
    `${prefix}Expected filler words to be detected`
  );

  if (expectedWords) {
    for (const word of expectedWords) {
      assert.ok(
        metrics.fillerWords.includes(word),
        `${prefix}Expected filler word '${word}' to be detected`
      );
    }
  }
}

// ============================================
// DRILL ASSERTIONS
// ============================================

/**
 * Assert that drill content is valid
 */
export function assertDrillContent(
  drill: unknown,
  expectedType?: "match" | "gap_fill" | "scramble",
  message?: string
): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof drill === "object" && drill !== null, `${prefix}Drill must be an object`);

  const d = drill as Record<string, unknown>;

  assert.ok(typeof d.type === "string", `${prefix}type must be a string`);

  if (expectedType) {
    assert.equal(d.type, expectedType, `${prefix}Expected drill type '${expectedType}'`);
  }

  assert.ok(typeof d.instructions === "string", `${prefix}instructions must be a string`);
}

// ============================================
// ANALYSIS RESULT ASSERTIONS
// ============================================

/**
 * Assert that a tutor analysis result is valid
 */
export function assertTutorAnalysis(analysis: unknown, message?: string): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof analysis === "object" && analysis !== null, `${prefix}Analysis must be an object`);

  const a = analysis as Record<string, unknown>;

  assert.ok(Array.isArray(a.explanations), `${prefix}explanations must be an array`);
  assert.ok(Array.isArray(a.corrections), `${prefix}corrections must be an array`);
  assert.ok(Array.isArray(a.focusTopics), `${prefix}focusTopics must be an array`);
  assert.ok(Array.isArray(a.focusVocabulary), `${prefix}focusVocabulary must be an array`);

  if (a.teachingStyle) {
    const style = a.teachingStyle as Record<string, unknown>;
    assert.ok(typeof style.questionFrequency === "number", `${prefix}questionFrequency must be a number`);
  }
}

/**
 * Assert that a student analysis result is valid
 */
export function assertStudentAnalysis(analysis: unknown, message?: string): void {
  const prefix = message ? `${message}: ` : "";

  assert.ok(typeof analysis === "object" && analysis !== null, `${prefix}Analysis must be an object`);

  const a = analysis as Record<string, unknown>;

  assert.ok(Array.isArray(a.errors), `${prefix}errors must be an array`);
  assert.ok(Array.isArray(a.strengths), `${prefix}strengths must be an array`);
  assert.ok(Array.isArray(a.vocabularyUsed), `${prefix}vocabularyUsed must be an array`);

  if (a.fluencyMetrics) {
    assertFluencyMetrics(a.fluencyMetrics, `${prefix}fluencyMetrics`);
  }
}
