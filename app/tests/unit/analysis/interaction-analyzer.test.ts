/**
 * Interaction Analyzer Unit Tests
 *
 * Tests for the interaction analyzer module that analyzes tutor-student
 * interaction patterns including turn-taking, response latencies,
 * confusion indicators, and engagement metrics.
 *
 * @module tests/unit/analysis/interaction-analyzer
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// =============================================================================
// TYPES (mirroring production)
// =============================================================================

interface SpeakerSegment {
  speaker: number;
  text: string;
  start: number;
  end: number;
  words: unknown[];
  confidence: number;
  languages?: string[];
}

interface ConfusionIndicator {
  timestamp: number;
  type: "long_pause" | "repeated_correction" | "explicit_confusion" | "hesitation_cluster" | "slow_response";
  context: string;
  severity: "low" | "medium" | "high";
  suggestedAction?: string;
}

interface LearningMoment {
  timestamp: number;
  type: "breakthrough" | "struggle" | "practice" | "review" | "introduction";
  topic?: string;
  description: string;
  confidence: number;
}

interface TurnStatistics {
  totalTurns: number;
  tutorTurns: number;
  studentTurns: number;
  avgTutorTurnDuration: number;
  avgStudentTurnDuration: number;
  avgGapBetweenTurns: number;
  longestStudentTurn: number;
  shortestStudentTurn: number;
}

interface EngagementMetrics {
  score: number;
  factors: {
    responseSpeed: number;
    participationRatio: number;
    turnTakingBalance: number;
    sustainedAttention: number;
  };
  concerns: string[];
  strengths: string[];
}

interface InteractionMetrics {
  turnCount: number;
  avgStudentLatencyMs: number;
  speakingRatio: number;
  lessonDuration: number;
  turnStatistics: TurnStatistics;
  confusionIndicators: ConfusionIndicator[];
  engagementScore: number;
  engagementMetrics: EngagementMetrics;
  learningMoments: LearningMoment[];
  responseLatencies: number[];
  pauseDistribution: {
    short: number;
    medium: number;
    long: number;
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PAUSE_THRESHOLDS = {
  SHORT: 1.0,
  MEDIUM: 3.0,
  LONG: 5.0,
  CONCERNING: 8.0,
};

const CONFUSION_PHRASES = [
  /\b(i don't understand|what do you mean|i'm confused|sorry\?|huh\?|pardon)\b/i,
  /\b(can you repeat|say that again|one more time|what was that)\b/i,
  /\b(i'm not sure|i don't know|maybe|probably|i think|i guess)\b/i,
];

const BREAKTHROUGH_PHRASES = [
  /\b(oh|ah|aha|i see|i get it|now i understand|that makes sense)\b/i,
  /\b(so it's like|so you mean|oh so)\b/i,
];

// =============================================================================
// PURE FUNCTIONS FOR TESTING (mirroring production)
// =============================================================================

function calculateTurnStatistics(
  segments: SpeakerSegment[],
  tutorSpeakerId: number
): TurnStatistics {
  let tutorTurns = 0;
  let studentTurns = 0;
  let tutorTotalDuration = 0;
  let studentTotalDuration = 0;
  let totalGap = 0;
  let gapCount = 0;
  let longestStudentTurn = 0;
  let shortestStudentTurn = Infinity;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const duration = segment.end - segment.start;

    if (segment.speaker === tutorSpeakerId) {
      tutorTurns++;
      tutorTotalDuration += duration;
    } else {
      studentTurns++;
      studentTotalDuration += duration;
      longestStudentTurn = Math.max(longestStudentTurn, duration);
      shortestStudentTurn = Math.min(shortestStudentTurn, duration);
    }

    if (i < segments.length - 1) {
      const gap = segments[i + 1].start - segment.end;
      if (gap > 0 && gap < 30) {
        totalGap += gap;
        gapCount++;
      }
    }
  }

  return {
    totalTurns: tutorTurns + studentTurns,
    tutorTurns,
    studentTurns,
    avgTutorTurnDuration: tutorTurns > 0 ? tutorTotalDuration / tutorTurns : 0,
    avgStudentTurnDuration: studentTurns > 0 ? studentTotalDuration / studentTurns : 0,
    avgGapBetweenTurns: gapCount > 0 ? totalGap / gapCount : 0,
    longestStudentTurn,
    shortestStudentTurn: shortestStudentTurn === Infinity ? 0 : shortestStudentTurn,
  };
}

function calculateResponseLatencies(
  segments: SpeakerSegment[],
  tutorSpeakerId: number
): number[] {
  const latencies: number[] = [];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const previous = segments[i - 1];

    if (current.speaker !== tutorSpeakerId && previous.speaker === tutorSpeakerId) {
      const latency = current.start - previous.end;
      if (latency > 0 && latency < 30) {
        latencies.push(latency);
      }
    }
  }

  return latencies;
}

function calculatePauseDistribution(latencies: number[]): {
  short: number;
  medium: number;
  long: number;
} {
  let short = 0;
  let medium = 0;
  let long = 0;

  for (const latency of latencies) {
    if (latency < PAUSE_THRESHOLDS.SHORT) {
      short++;
    } else if (latency < PAUSE_THRESHOLDS.MEDIUM) {
      medium++;
    } else {
      long++;
    }
  }

  return { short, medium, long };
}

function calculateSpeakingTimes(
  segments: SpeakerSegment[],
  tutorSpeakerId: number
): { tutorTime: number; studentTime: number; totalDuration: number } {
  let tutorTime = 0;
  let studentTime = 0;

  for (const segment of segments) {
    const duration = segment.end - segment.start;
    if (segment.speaker === tutorSpeakerId) {
      tutorTime += duration;
    } else {
      studentTime += duration;
    }
  }

  const totalDuration =
    segments.length > 0 ? segments[segments.length - 1].end - segments[0].start : 0;

  return { tutorTime, studentTime, totalDuration };
}

function detectConfusionIndicators(
  segments: SpeakerSegment[],
  tutorSpeakerId: number,
  latencies: number[]
): ConfusionIndicator[] {
  const indicators: ConfusionIndicator[] = [];

  // Detect long pauses
  let latencyIndex = 0;
  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const previous = segments[i - 1];

    if (current.speaker !== tutorSpeakerId && previous.speaker === tutorSpeakerId) {
      const latency = latencies[latencyIndex++];
      if (latency !== undefined) {
        if (latency >= PAUSE_THRESHOLDS.CONCERNING) {
          indicators.push({
            timestamp: current.start,
            type: "long_pause",
            context: `${latency.toFixed(1)}s pause before response: "${current.text.substring(0, 50)}..."`,
            severity: "high",
            suggestedAction: "Review this topic - student may need more explanation",
          });
        } else if (latency >= PAUSE_THRESHOLDS.LONG) {
          indicators.push({
            timestamp: current.start,
            type: "slow_response",
            context: `${latency.toFixed(1)}s pause before response`,
            severity: "medium",
            suggestedAction: "Consider providing more examples",
          });
        }
      }
    }
  }

  // Detect explicit confusion phrases
  for (const segment of segments) {
    if (segment.speaker !== tutorSpeakerId) {
      for (const pattern of CONFUSION_PHRASES) {
        if (pattern.test(segment.text)) {
          indicators.push({
            timestamp: segment.start,
            type: "explicit_confusion",
            context: segment.text.substring(0, 100),
            severity: "medium",
            suggestedAction: "Student expressed uncertainty - consider revisiting",
          });
          break;
        }
      }
    }
  }

  // Detect hesitation clusters
  let consecutiveMediumPauses = 0;
  for (let i = 0; i < latencies.length; i++) {
    if (latencies[i] >= PAUSE_THRESHOLDS.SHORT && latencies[i] < PAUSE_THRESHOLDS.MEDIUM) {
      consecutiveMediumPauses++;
      if (consecutiveMediumPauses >= 3) {
        const segmentIndex = Math.min(i + 1, segments.length - 1);
        indicators.push({
          timestamp: segments[segmentIndex]?.start || 0,
          type: "hesitation_cluster",
          context: "Multiple hesitations in this section",
          severity: "low",
          suggestedAction: "Student may be processing new information",
        });
        consecutiveMediumPauses = 0;
      }
    } else {
      consecutiveMediumPauses = 0;
    }
  }

  return indicators.sort((a, b) => a.timestamp - b.timestamp);
}

function detectLearningMoments(
  segments: SpeakerSegment[],
  tutorSpeakerId: number
): LearningMoment[] {
  const moments: LearningMoment[] = [];

  for (const segment of segments) {
    // Student breakthroughs
    if (segment.speaker !== tutorSpeakerId) {
      for (const pattern of BREAKTHROUGH_PHRASES) {
        if (pattern.test(segment.text)) {
          moments.push({
            timestamp: segment.start,
            type: "breakthrough",
            description: "Student showed understanding",
            confidence: 0.7,
          });
          break;
        }
      }
    }

    // Tutor introductions, reviews, practice
    if (segment.speaker === tutorSpeakerId) {
      const introPatterns = [
        /\b(today we'll|let's learn|new word|new phrase|this is called)\b/i,
      ];
      const reviewPatterns = [
        /\b(remember|recall|we learned|last time|as we discussed)\b/i,
      ];
      const practicePatterns = [
        /\b(try|your turn|now you|say it|repeat|practice)\b/i,
      ];

      for (const pattern of introPatterns) {
        if (pattern.test(segment.text)) {
          moments.push({
            timestamp: segment.start,
            type: "introduction",
            description: "New concept introduced",
            confidence: 0.8,
          });
          break;
        }
      }

      for (const pattern of reviewPatterns) {
        if (pattern.test(segment.text)) {
          moments.push({
            timestamp: segment.start,
            type: "review",
            description: "Reviewing previous material",
            confidence: 0.6,
          });
          break;
        }
      }

      for (const pattern of practicePatterns) {
        if (pattern.test(segment.text)) {
          moments.push({
            timestamp: segment.start,
            type: "practice",
            description: "Active practice opportunity",
            confidence: 0.7,
          });
          break;
        }
      }
    }
  }

  return moments.sort((a, b) => a.timestamp - b.timestamp).slice(0, 20);
}

function calculateEngagementMetrics(
  segments: SpeakerSegment[],
  tutorSpeakerId: number,
  latencies: number[],
  confusionIndicators: ConfusionIndicator[]
): EngagementMetrics {
  const concerns: string[] = [];
  const strengths: string[] = [];

  const avgLatency =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 2.0;

  let responseSpeedScore: number;
  if (avgLatency < 0.5) {
    responseSpeedScore = 0.9;
    strengths.push("Quick response times");
  } else if (avgLatency < 1.5) {
    responseSpeedScore = 1.0;
    strengths.push("Excellent response timing");
  } else if (avgLatency < 3.0) {
    responseSpeedScore = 0.7;
  } else if (avgLatency < 5.0) {
    responseSpeedScore = 0.4;
    concerns.push("Slow response times may indicate difficulty");
  } else {
    responseSpeedScore = 0.2;
    concerns.push("Very slow responses - student may be struggling");
  }

  const { studentTime, totalDuration } = calculateSpeakingTimes(segments, tutorSpeakerId);
  const participationRatio = totalDuration > 0 ? studentTime / totalDuration : 0;

  if (participationRatio > 0.4) {
    strengths.push("High student participation");
  } else if (participationRatio < 0.2) {
    concerns.push("Low student participation - encourage more speaking");
  }

  const stats = calculateTurnStatistics(segments, tutorSpeakerId);
  const turnBalance =
    stats.totalTurns > 0
      ? Math.min(stats.studentTurns, stats.tutorTurns) / Math.max(stats.studentTurns, stats.tutorTurns)
      : 0;

  if (turnBalance > 0.7) {
    strengths.push("Well-balanced conversation");
  } else if (turnBalance < 0.3) {
    concerns.push("Unbalanced turn-taking");
  }

  const confusionScore = Math.max(0, 1 - confusionIndicators.length * 0.1);
  if (confusionIndicators.length === 0) {
    strengths.push("Student maintained focus throughout");
  } else if (confusionIndicators.length > 5) {
    concerns.push("Multiple confusion points detected");
  }

  const overallScore =
    responseSpeedScore * 0.3 +
    Math.min(participationRatio * 2, 1) * 0.25 +
    turnBalance * 0.2 +
    confusionScore * 0.25;

  return {
    score: Math.round(overallScore * 100) / 100,
    factors: {
      responseSpeed: responseSpeedScore,
      participationRatio: Math.min(participationRatio * 2, 1),
      turnTakingBalance: turnBalance,
      sustainedAttention: confusionScore,
    },
    concerns,
    strengths,
  };
}

function createEmptyMetrics(): InteractionMetrics {
  return {
    turnCount: 0,
    avgStudentLatencyMs: 0,
    speakingRatio: 0,
    lessonDuration: 0,
    turnStatistics: {
      totalTurns: 0,
      tutorTurns: 0,
      studentTurns: 0,
      avgTutorTurnDuration: 0,
      avgStudentTurnDuration: 0,
      avgGapBetweenTurns: 0,
      longestStudentTurn: 0,
      shortestStudentTurn: 0,
    },
    confusionIndicators: [],
    engagementScore: 0,
    engagementMetrics: {
      score: 0,
      factors: {
        responseSpeed: 0,
        participationRatio: 0,
        turnTakingBalance: 0,
        sustainedAttention: 0,
      },
      concerns: ["No interaction data available"],
      strengths: [],
    },
    learningMoments: [],
    responseLatencies: [],
    pauseDistribution: { short: 0, medium: 0, long: 0 },
  };
}

function analyzeInteraction(
  allSegments: SpeakerSegment[],
  tutorSpeakerId: number
): InteractionMetrics {
  if (allSegments.length === 0) {
    return createEmptyMetrics();
  }

  const turnStatistics = calculateTurnStatistics(allSegments, tutorSpeakerId);
  const responseLatencies = calculateResponseLatencies(allSegments, tutorSpeakerId);
  const pauseDistribution = calculatePauseDistribution(responseLatencies);
  const confusionIndicators = detectConfusionIndicators(allSegments, tutorSpeakerId, responseLatencies);
  const engagementMetrics = calculateEngagementMetrics(
    allSegments,
    tutorSpeakerId,
    responseLatencies,
    confusionIndicators
  );
  const learningMoments = detectLearningMoments(allSegments, tutorSpeakerId);
  const { studentTime, totalDuration } = calculateSpeakingTimes(allSegments, tutorSpeakerId);
  const speakingRatio = totalDuration > 0 ? studentTime / totalDuration : 0;
  const avgLatency =
    responseLatencies.length > 0
      ? responseLatencies.reduce((a, b) => a + b, 0) / responseLatencies.length
      : 0;

  return {
    turnCount: turnStatistics.totalTurns,
    avgStudentLatencyMs: Math.round(avgLatency * 1000),
    speakingRatio: Math.round(speakingRatio * 100) / 100,
    lessonDuration: totalDuration,
    turnStatistics,
    confusionIndicators,
    engagementScore: engagementMetrics.score,
    engagementMetrics,
    learningMoments,
    responseLatencies,
    pauseDistribution,
  };
}

// =============================================================================
// TEST HELPERS
// =============================================================================

function createMockSegment(overrides: Partial<SpeakerSegment> = {}): SpeakerSegment {
  return {
    speaker: 0,
    text: "Hello",
    start: 0,
    end: 1,
    words: [],
    confidence: 0.95,
    ...overrides,
  };
}

function createTutorSegment(start: number, end: number, text: string): SpeakerSegment {
  return createMockSegment({ speaker: 0, start, end, text });
}

function createStudentSegment(start: number, end: number, text: string): SpeakerSegment {
  return createMockSegment({ speaker: 1, start, end, text });
}

// =============================================================================
// TESTS
// =============================================================================

describe("Interaction Analyzer", () => {
  describe("analyzeInteraction", () => {
    it("returns empty metrics for empty segments", () => {
      const result = analyzeInteraction([], 0);
      assert.equal(result.turnCount, 0);
      assert.equal(result.speakingRatio, 0);
      assert.equal(result.lessonDuration, 0);
      assert.equal(result.confusionIndicators.length, 0);
      assert.equal(result.learningMoments.length, 0);
    });

    it("calculates turn count correctly", () => {
      const segments = [
        createTutorSegment(0, 5, "Hello, how are you?"),
        createStudentSegment(6, 8, "I'm fine, thank you"),
        createTutorSegment(9, 15, "Great! Let's practice."),
        createStudentSegment(16, 18, "Okay!"),
      ];

      const result = analyzeInteraction(segments, 0);
      assert.equal(result.turnCount, 4);
      assert.equal(result.turnStatistics.tutorTurns, 2);
      assert.equal(result.turnStatistics.studentTurns, 2);
    });

    it("calculates speaking ratio correctly", () => {
      const segments = [
        createTutorSegment(0, 10, "Long tutor speech"),
        createStudentSegment(11, 21, "Equal length response"),
      ];

      const result = analyzeInteraction(segments, 0);
      // Student speaks 10s out of 21s total
      assert.ok(result.speakingRatio > 0.4 && result.speakingRatio < 0.5);
    });

    it("calculates lesson duration correctly", () => {
      const segments = [
        createTutorSegment(0, 30, "Start"),
        createStudentSegment(35, 40, "Middle"),
        createTutorSegment(45, 60, "End"),
      ];

      const result = analyzeInteraction(segments, 0);
      assert.equal(result.lessonDuration, 60);
    });

    it("calculates average student latency", () => {
      const segments = [
        createTutorSegment(0, 5, "Question?"),
        createStudentSegment(7, 10, "Answer"), // 2s latency
        createTutorSegment(11, 15, "Another question?"),
        createStudentSegment(16, 20, "Another answer"), // 1s latency
      ];

      const result = analyzeInteraction(segments, 0);
      // Average: (2 + 1) / 2 = 1.5s = 1500ms
      assert.equal(result.avgStudentLatencyMs, 1500);
    });
  });

  describe("calculateTurnStatistics", () => {
    it("counts tutor and student turns", () => {
      const segments = [
        createTutorSegment(0, 5, "Tutor 1"),
        createStudentSegment(6, 8, "Student 1"),
        createTutorSegment(9, 12, "Tutor 2"),
        createStudentSegment(13, 15, "Student 2"),
        createStudentSegment(16, 18, "Student 3"),
      ];

      const stats = calculateTurnStatistics(segments, 0);
      assert.equal(stats.totalTurns, 5);
      assert.equal(stats.tutorTurns, 2);
      assert.equal(stats.studentTurns, 3);
    });

    it("calculates average turn durations", () => {
      const segments = [
        createTutorSegment(0, 10, "Long tutor"),
        createTutorSegment(11, 21, "Another long tutor"),
        createStudentSegment(22, 27, "Short student"),
        createStudentSegment(28, 33, "Another short student"),
      ];

      const stats = calculateTurnStatistics(segments, 0);
      assert.equal(stats.avgTutorTurnDuration, 10);
      assert.equal(stats.avgStudentTurnDuration, 5);
    });

    it("tracks longest and shortest student turns", () => {
      const segments = [
        createStudentSegment(0, 2, "Short"),
        createStudentSegment(5, 20, "Very long response"),
        createStudentSegment(25, 30, "Medium"),
      ];

      const stats = calculateTurnStatistics(segments, 0);
      assert.equal(stats.longestStudentTurn, 15);
      assert.equal(stats.shortestStudentTurn, 2);
    });

    it("calculates average gap between turns", () => {
      const segments = [
        createTutorSegment(0, 5, "First"),
        createStudentSegment(7, 10, "Second"), // 2s gap
        createTutorSegment(12, 15, "Third"), // 2s gap
      ];

      const stats = calculateTurnStatistics(segments, 0);
      assert.equal(stats.avgGapBetweenTurns, 2);
    });

    it("handles single segment", () => {
      const segments = [createTutorSegment(0, 10, "Only tutor")];
      const stats = calculateTurnStatistics(segments, 0);
      assert.equal(stats.totalTurns, 1);
      assert.equal(stats.tutorTurns, 1);
      assert.equal(stats.studentTurns, 0);
    });
  });

  describe("calculateResponseLatencies", () => {
    it("measures student response time after tutor", () => {
      const segments = [
        createTutorSegment(0, 10, "Question?"),
        createStudentSegment(12, 15, "Answer"), // 2s latency
      ];

      const latencies = calculateResponseLatencies(segments, 0);
      assert.equal(latencies.length, 1);
      assert.equal(latencies[0], 2);
    });

    it("ignores tutor-to-tutor transitions", () => {
      const segments = [
        createTutorSegment(0, 5, "First"),
        createTutorSegment(7, 10, "Second"),
      ];

      const latencies = calculateResponseLatencies(segments, 0);
      assert.equal(latencies.length, 0);
    });

    it("ignores student-to-student transitions", () => {
      const segments = [
        createStudentSegment(0, 5, "First"),
        createStudentSegment(7, 10, "Second"),
      ];

      const latencies = calculateResponseLatencies(segments, 0);
      assert.equal(latencies.length, 0);
    });

    it("ignores student-to-tutor transitions", () => {
      const segments = [
        createStudentSegment(0, 5, "Student speaks"),
        createTutorSegment(7, 10, "Tutor responds"),
      ];

      const latencies = calculateResponseLatencies(segments, 0);
      assert.equal(latencies.length, 0);
    });

    it("ignores unreasonably long pauses (>30s)", () => {
      const segments = [
        createTutorSegment(0, 5, "Question"),
        createStudentSegment(40, 45, "Answer after long break"),
      ];

      const latencies = calculateResponseLatencies(segments, 0);
      assert.equal(latencies.length, 0);
    });

    it("handles multiple student responses", () => {
      const segments = [
        createTutorSegment(0, 5, "Q1"),
        createStudentSegment(6, 8, "A1"), // 1s
        createTutorSegment(9, 12, "Q2"),
        createStudentSegment(15, 18, "A2"), // 3s
        createTutorSegment(19, 22, "Q3"),
        createStudentSegment(24, 27, "A3"), // 2s
      ];

      const latencies = calculateResponseLatencies(segments, 0);
      assert.equal(latencies.length, 3);
      assert.deepEqual(latencies, [1, 3, 2]);
    });
  });

  describe("calculatePauseDistribution", () => {
    it("categorizes short pauses (<1s)", () => {
      const latencies = [0.5, 0.3, 0.8];
      const dist = calculatePauseDistribution(latencies);
      assert.equal(dist.short, 3);
      assert.equal(dist.medium, 0);
      assert.equal(dist.long, 0);
    });

    it("categorizes medium pauses (1-3s)", () => {
      const latencies = [1.5, 2.0, 2.5];
      const dist = calculatePauseDistribution(latencies);
      assert.equal(dist.short, 0);
      assert.equal(dist.medium, 3);
      assert.equal(dist.long, 0);
    });

    it("categorizes long pauses (>3s)", () => {
      const latencies = [4.0, 5.5, 8.0];
      const dist = calculatePauseDistribution(latencies);
      assert.equal(dist.short, 0);
      assert.equal(dist.medium, 0);
      assert.equal(dist.long, 3);
    });

    it("handles mixed pause durations", () => {
      const latencies = [0.5, 2.0, 5.0, 0.3, 1.5];
      const dist = calculatePauseDistribution(latencies);
      assert.equal(dist.short, 2);
      assert.equal(dist.medium, 2);
      assert.equal(dist.long, 1);
    });

    it("handles empty latencies", () => {
      const dist = calculatePauseDistribution([]);
      assert.equal(dist.short, 0);
      assert.equal(dist.medium, 0);
      assert.equal(dist.long, 0);
    });
  });

  describe("detectConfusionIndicators", () => {
    it("detects long pauses (>=8s) as high severity", () => {
      const segments = [
        createTutorSegment(0, 5, "Question?"),
        createStudentSegment(13, 18, "Answer"), // 8s pause
      ];
      const latencies = [8];

      const indicators = detectConfusionIndicators(segments, 0, latencies);
      assert.ok(indicators.some((i) => i.type === "long_pause"));
      assert.ok(indicators.some((i) => i.severity === "high"));
    });

    it("detects slow responses (5-8s) as medium severity", () => {
      const segments = [
        createTutorSegment(0, 5, "Question?"),
        createStudentSegment(11, 15, "Answer"), // 6s pause
      ];
      const latencies = [6];

      const indicators = detectConfusionIndicators(segments, 0, latencies);
      assert.ok(indicators.some((i) => i.type === "slow_response"));
      assert.ok(indicators.some((i) => i.severity === "medium"));
    });

    it("detects explicit confusion phrases", () => {
      const segments = [
        createStudentSegment(0, 5, "I don't understand what you mean"),
      ];

      const indicators = detectConfusionIndicators(segments, 0, []);
      assert.ok(indicators.some((i) => i.type === "explicit_confusion"));
    });

    it("detects 'can you repeat' as confusion", () => {
      const segments = [
        createStudentSegment(0, 5, "Can you repeat that please?"),
      ];

      const indicators = detectConfusionIndicators(segments, 0, []);
      assert.ok(indicators.some((i) => i.type === "explicit_confusion"));
    });

    it("detects 'I'm not sure' as confusion", () => {
      const segments = [
        createStudentSegment(0, 5, "I'm not sure about this"),
      ];

      const indicators = detectConfusionIndicators(segments, 0, []);
      assert.ok(indicators.some((i) => i.type === "explicit_confusion"));
    });

    it("detects hesitation clusters (3+ consecutive medium pauses)", () => {
      const segments = [
        createTutorSegment(0, 5, "Q1"),
        createStudentSegment(7, 10, "A1"),
        createTutorSegment(11, 15, "Q2"),
        createStudentSegment(17, 20, "A2"),
        createTutorSegment(21, 25, "Q3"),
        createStudentSegment(27, 30, "A3"),
        createTutorSegment(31, 35, "Q4"),
        createStudentSegment(37, 40, "A4"),
      ];
      const latencies = [2, 2, 2, 2]; // All in 1-3s range

      const indicators = detectConfusionIndicators(segments, 0, latencies);
      assert.ok(indicators.some((i) => i.type === "hesitation_cluster"));
    });

    it("does not flag tutor confusion phrases", () => {
      const segments = [
        createTutorSegment(0, 5, "I don't understand your question"),
      ];

      const indicators = detectConfusionIndicators(segments, 0, []);
      assert.equal(indicators.filter((i) => i.type === "explicit_confusion").length, 0);
    });

    it("returns empty array when no confusion detected", () => {
      const segments = [
        createTutorSegment(0, 5, "Good question"),
        createStudentSegment(6, 10, "Thank you"),
      ];
      const latencies = [1]; // Normal latency

      const indicators = detectConfusionIndicators(segments, 0, latencies);
      assert.equal(indicators.length, 0);
    });
  });

  describe("detectLearningMoments", () => {
    it("detects breakthrough phrases from student", () => {
      const segments = [
        createStudentSegment(10, 15, "Oh I see! Now I understand!"),
      ];

      const moments = detectLearningMoments(segments, 0);
      assert.ok(moments.some((m) => m.type === "breakthrough"));
    });

    it("detects 'aha' moment", () => {
      const segments = [
        createStudentSegment(10, 15, "Aha, that makes sense now"),
      ];

      const moments = detectLearningMoments(segments, 0);
      assert.ok(moments.some((m) => m.type === "breakthrough"));
    });

    it("detects introduction of new concepts by tutor", () => {
      const segments = [
        createTutorSegment(0, 10, "Today we'll learn about verb conjugation"),
      ];

      const moments = detectLearningMoments(segments, 0);
      assert.ok(moments.some((m) => m.type === "introduction"));
    });

    it("detects review moments by tutor", () => {
      const segments = [
        createTutorSegment(0, 10, "Remember what we learned last time?"),
      ];

      const moments = detectLearningMoments(segments, 0);
      assert.ok(moments.some((m) => m.type === "review"));
    });

    it("detects practice opportunities", () => {
      const segments = [
        createTutorSegment(0, 10, "Now you try saying this phrase"),
      ];

      const moments = detectLearningMoments(segments, 0);
      assert.ok(moments.some((m) => m.type === "practice"));
    });

    it("does not detect breakthrough from tutor", () => {
      const segments = [
        createTutorSegment(0, 10, "I see what you mean"),
      ];

      const moments = detectLearningMoments(segments, 0);
      assert.equal(moments.filter((m) => m.type === "breakthrough").length, 0);
    });

    it("returns empty array for neutral conversation", () => {
      const segments = [
        createTutorSegment(0, 5, "Hello"),
        createStudentSegment(6, 10, "Hello, how are you?"),
      ];

      const moments = detectLearningMoments(segments, 0);
      assert.equal(moments.length, 0);
    });

    it("limits to 20 moments maximum", () => {
      const segments: SpeakerSegment[] = [];
      for (let i = 0; i < 30; i++) {
        segments.push(createTutorSegment(i * 10, i * 10 + 5, "Now you try this"));
      }

      const moments = detectLearningMoments(segments, 0);
      assert.ok(moments.length <= 20);
    });
  });

  describe("calculateEngagementMetrics", () => {
    it("rewards quick response times", () => {
      const segments = [
        createTutorSegment(0, 5, "Q"),
        createStudentSegment(5.5, 10, "A"),
      ];
      const latencies = [0.5];

      const metrics = calculateEngagementMetrics(segments, 0, latencies, []);
      assert.ok(metrics.factors.responseSpeed >= 0.9);
      assert.ok(metrics.strengths.some((s) => s.includes("Quick") || s.includes("Excellent")));
    });

    it("penalizes very slow response times", () => {
      const segments = [
        createTutorSegment(0, 5, "Q"),
        createStudentSegment(12, 15, "A"),
      ];
      const latencies = [7];

      const metrics = calculateEngagementMetrics(segments, 0, latencies, []);
      assert.ok(metrics.factors.responseSpeed <= 0.4);
      assert.ok(metrics.concerns.some((c) => c.includes("slow") || c.includes("Slow")));
    });

    it("rewards high student participation", () => {
      const segments = [
        createTutorSegment(0, 5, "Short"),
        createStudentSegment(6, 20, "Long student response"),
      ];

      const metrics = calculateEngagementMetrics(segments, 0, [], []);
      assert.ok(metrics.strengths.some((s) => s.includes("participation")));
    });

    it("flags low student participation", () => {
      const segments = [
        createTutorSegment(0, 50, "Very long tutor monologue"),
        createStudentSegment(51, 52, "Ok"),
      ];

      const metrics = calculateEngagementMetrics(segments, 0, [], []);
      assert.ok(metrics.concerns.some((c) => c.includes("participation")));
    });

    it("rewards balanced turn-taking", () => {
      const segments = [
        createTutorSegment(0, 5, "T1"),
        createStudentSegment(6, 10, "S1"),
        createTutorSegment(11, 15, "T2"),
        createStudentSegment(16, 20, "S2"),
      ];

      const metrics = calculateEngagementMetrics(segments, 0, [], []);
      assert.ok(metrics.factors.turnTakingBalance >= 0.7);
      assert.ok(metrics.strengths.some((s) => s.includes("balanced")));
    });

    it("flags unbalanced turn-taking", () => {
      const segments = [
        createTutorSegment(0, 5, "T1"),
        createTutorSegment(6, 10, "T2"),
        createTutorSegment(11, 15, "T3"),
        createTutorSegment(16, 20, "T4"),
        createStudentSegment(21, 25, "S1"),
      ];

      const metrics = calculateEngagementMetrics(segments, 0, [], []);
      assert.ok(metrics.factors.turnTakingBalance <= 0.3);
      assert.ok(metrics.concerns.some((c) => c.includes("Unbalanced")));
    });

    it("penalizes many confusion indicators", () => {
      const confusionIndicators: ConfusionIndicator[] = Array(7)
        .fill(null)
        .map((_, i) => ({
          timestamp: i * 10,
          type: "explicit_confusion" as const,
          context: `Confusion ${i}`,
          severity: "medium" as const,
        }));

      const metrics = calculateEngagementMetrics([], 0, [], confusionIndicators);
      assert.ok(metrics.factors.sustainedAttention <= 0.3);
      assert.ok(metrics.concerns.some((c) => c.includes("confusion")));
    });

    it("rewards no confusion indicators", () => {
      const segments = [
        createTutorSegment(0, 5, "Q"),
        createStudentSegment(6, 10, "A"),
      ];

      const metrics = calculateEngagementMetrics(segments, 0, [], []);
      assert.ok(metrics.factors.sustainedAttention === 1);
      assert.ok(metrics.strengths.some((s) => s.includes("focus")));
    });

    it("returns score between 0 and 1", () => {
      const segments = [
        createTutorSegment(0, 5, "Hello"),
        createStudentSegment(6, 10, "Hi"),
      ];

      const metrics = calculateEngagementMetrics(segments, 0, [1], []);
      assert.ok(metrics.score >= 0 && metrics.score <= 1);
    });
  });

  describe("calculateSpeakingTimes", () => {
    it("calculates tutor and student speaking times", () => {
      const segments = [
        createTutorSegment(0, 10, "Tutor speaks"),
        createStudentSegment(11, 21, "Student speaks"),
        createTutorSegment(22, 32, "Tutor again"),
      ];

      const times = calculateSpeakingTimes(segments, 0);
      assert.equal(times.tutorTime, 20);
      assert.equal(times.studentTime, 10);
      assert.equal(times.totalDuration, 32);
    });

    it("handles empty segments", () => {
      const times = calculateSpeakingTimes([], 0);
      assert.equal(times.tutorTime, 0);
      assert.equal(times.studentTime, 0);
      assert.equal(times.totalDuration, 0);
    });
  });

  describe("Integration scenarios", () => {
    it("analyzes a complete lesson interaction", () => {
      const segments = [
        createTutorSegment(0, 10, "Today we'll learn new vocabulary"),
        createStudentSegment(11, 15, "Okay, I'm ready"),
        createTutorSegment(16, 30, "The word for 'house' is 'casa'. Now you try"),
        createStudentSegment(31.5, 35, "Casa"),
        createTutorSegment(36, 45, "Good! Remember we learned 'perro' last time?"),
        createStudentSegment(47, 52, "Oh yes, I remember! Perro means dog"),
        createTutorSegment(53, 60, "Excellent! Now let's practice more"),
      ];

      const result = analyzeInteraction(segments, 0);

      // Should have all metrics populated
      assert.ok(result.turnCount > 0);
      assert.ok(result.lessonDuration > 0);
      assert.ok(result.speakingRatio > 0);
      assert.ok(result.engagementScore > 0);

      // Should detect learning moments
      assert.ok(result.learningMoments.some((m) => m.type === "introduction"));
      assert.ok(result.learningMoments.some((m) => m.type === "practice"));
      assert.ok(result.learningMoments.some((m) => m.type === "review"));
      assert.ok(result.learningMoments.some((m) => m.type === "breakthrough"));
    });

    it("handles confused student scenario", () => {
      const segments = [
        createTutorSegment(0, 10, "Explain complex grammar rule"),
        createStudentSegment(19, 25, "I don't understand..."), // 9s pause
        createTutorSegment(26, 40, "Let me explain again"),
        createStudentSegment(48, 53, "Can you repeat that?"), // 8s pause
      ];

      const result = analyzeInteraction(segments, 0);

      // Should detect confusion
      assert.ok(result.confusionIndicators.length > 0);
      assert.ok(result.confusionIndicators.some((c) => c.type === "long_pause" || c.type === "slow_response"));
      assert.ok(result.confusionIndicators.some((c) => c.type === "explicit_confusion"));

      // Engagement should be affected
      assert.ok(result.engagementMetrics.concerns.length > 0);
    });

    it("handles engaged student scenario", () => {
      const segments = [
        createTutorSegment(0, 5, "Let's try this phrase"),
        createStudentSegment(5.5, 10, "Sure!"),
        createTutorSegment(10.5, 15, "Good! What about this word?"),
        createStudentSegment(16, 22, "Ah I see! That makes sense now!"),
        createTutorSegment(22.5, 28, "Excellent! Your turn again"),
        createStudentSegment(28.5, 35, "I got it!"),
      ];

      const result = analyzeInteraction(segments, 0);

      // Should have high engagement
      assert.ok(result.engagementScore > 0.6);
      assert.ok(result.engagementMetrics.strengths.length > 0);

      // Should detect breakthrough
      assert.ok(result.learningMoments.some((m) => m.type === "breakthrough"));

      // Minimal or no confusion
      assert.ok(result.confusionIndicators.length <= 1);
    });
  });
});
