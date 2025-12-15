/**
 * Interaction Analyzer
 *
 * Analyzes tutor-student interaction patterns to extract:
 * - Turn-taking statistics
 * - Response latencies (hesitation indicators)
 * - Confusion indicators
 * - Engagement metrics
 * - Learning moments
 */

import type { SpeakerSegment } from "./speaker-diarization";

// =============================================================================
// TYPES
// =============================================================================

export interface ConfusionIndicator {
  timestamp: number;
  type: "long_pause" | "repeated_correction" | "explicit_confusion" | "hesitation_cluster" | "slow_response";
  context: string;
  severity: "low" | "medium" | "high";
  suggestedAction?: string;
}

export interface LearningMoment {
  timestamp: number;
  type: "breakthrough" | "struggle" | "practice" | "review" | "introduction";
  topic?: string;
  description: string;
  confidence: number;
}

export interface TurnStatistics {
  totalTurns: number;
  tutorTurns: number;
  studentTurns: number;
  avgTutorTurnDuration: number;
  avgStudentTurnDuration: number;
  avgGapBetweenTurns: number;
  longestStudentTurn: number;
  shortestStudentTurn: number;
}

export interface EngagementMetrics {
  score: number; // 0-1
  factors: {
    responseSpeed: number; // 0-1, faster = higher
    participationRatio: number; // 0-1, more student speaking = higher
    turnTakingBalance: number; // 0-1, more balanced = higher
    sustainedAttention: number; // 0-1, consistent engagement = higher
  };
  concerns: string[];
  strengths: string[];
}

export interface InteractionMetrics {
  turnCount: number;
  avgStudentLatencyMs: number;
  speakingRatio: number; // Student speaking time / Total lesson time
  lessonDuration: number;

  turnStatistics: TurnStatistics;
  confusionIndicators: ConfusionIndicator[];
  engagementScore: number;
  engagementMetrics: EngagementMetrics;
  learningMoments: LearningMoment[];

  responseLatencies: number[]; // All student response latencies in seconds
  pauseDistribution: {
    short: number; // < 1s
    medium: number; // 1-3s
    long: number; // > 3s
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PAUSE_THRESHOLDS = {
  SHORT: 1.0, // seconds
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
// MAIN FUNCTION
// =============================================================================

/**
 * Analyze tutor-student interaction patterns
 */
export function analyzeInteraction(
  allSegments: SpeakerSegment[],
  tutorSpeakerId: number
): InteractionMetrics {
  if (allSegments.length === 0) {
    return createEmptyMetrics();
  }

  // Calculate turn statistics
  const turnStatistics = calculateTurnStatistics(allSegments, tutorSpeakerId);

  // Calculate response latencies
  const responseLatencies = calculateResponseLatencies(allSegments, tutorSpeakerId);

  // Calculate pause distribution
  const pauseDistribution = calculatePauseDistribution(responseLatencies);

  // Detect confusion indicators
  const confusionIndicators = detectConfusionIndicators(allSegments, tutorSpeakerId, responseLatencies);

  // Calculate engagement metrics
  const engagementMetrics = calculateEngagementMetrics(
    allSegments,
    tutorSpeakerId,
    responseLatencies,
    confusionIndicators
  );

  // Detect learning moments
  const learningMoments = detectLearningMoments(allSegments, tutorSpeakerId);

  // Calculate speaking ratio
  const { tutorTime, studentTime, totalDuration } = calculateSpeakingTimes(allSegments, tutorSpeakerId);
  const speakingRatio = totalDuration > 0 ? studentTime / totalDuration : 0;

  // Calculate average latency
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
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate turn-taking statistics
 */
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

    // Calculate gap to next segment
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

/**
 * Calculate student response latencies
 */
function calculateResponseLatencies(
  segments: SpeakerSegment[],
  tutorSpeakerId: number
): number[] {
  const latencies: number[] = [];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const previous = segments[i - 1];

    // Student responding to tutor
    if (current.speaker !== tutorSpeakerId && previous.speaker === tutorSpeakerId) {
      const latency = current.start - previous.end;
      if (latency > 0 && latency < 30) {
        latencies.push(latency);
      }
    }
  }

  return latencies;
}

/**
 * Calculate pause distribution
 */
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

/**
 * Calculate speaking times
 */
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

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

/**
 * Detect confusion indicators
 */
function detectConfusionIndicators(
  segments: SpeakerSegment[],
  tutorSpeakerId: number,
  latencies: number[]
): ConfusionIndicator[] {
  const indicators: ConfusionIndicator[] = [];

  // 1. Detect long pauses before student responses
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

  // 2. Detect explicit confusion phrases
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

  // 3. Detect hesitation clusters (multiple short pauses in succession)
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

  // 4. Detect repeated corrections (tutor correcting same thing multiple times)
  const corrections = new Map<string, number>();
  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const previous = segments[i - 1];

    if (
      current.speaker === tutorSpeakerId &&
      previous.speaker !== tutorSpeakerId
    ) {
      // Check for correction patterns
      const correctionPatterns = [
        /\b(no|not)\s+["']?([^"']+)["']?\s*[,.]?\s*(it's|say|we say)/i,
        /\b(actually|instead)\s+/i,
      ];

      for (const pattern of correctionPatterns) {
        if (pattern.test(current.text)) {
          // Extract what's being corrected
          const match = current.text.match(/["']([^"']+)["']/);
          const topic = match?.[1] || "topic";
          const count = (corrections.get(topic) || 0) + 1;
          corrections.set(topic, count);

          if (count >= 2) {
            indicators.push({
              timestamp: current.start,
              type: "repeated_correction",
              context: `Tutor corrected "${topic}" multiple times`,
              severity: count >= 3 ? "high" : "medium",
              suggestedAction: "Add targeted practice for this pattern",
            });
          }
          break;
        }
      }
    }
  }

  // Sort by timestamp
  return indicators.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Detect learning moments
 */
function detectLearningMoments(
  segments: SpeakerSegment[],
  tutorSpeakerId: number
): LearningMoment[] {
  const moments: LearningMoment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Detect breakthroughs from student
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

    // Detect introductions from tutor
    if (segment.speaker === tutorSpeakerId) {
      const introPatterns = [
        /\b(today we'll|let's learn|new word|new phrase|this is called)\b/i,
        /\b(in \w+, we say|the word for|how to say)\b/i,
      ];

      for (const pattern of introPatterns) {
        if (pattern.test(segment.text)) {
          // Try to extract the topic
          const topicMatch = segment.text.match(/["']([^"']+)["']/);
          moments.push({
            timestamp: segment.start,
            type: "introduction",
            topic: topicMatch?.[1],
            description: "New concept introduced",
            confidence: 0.8,
          });
          break;
        }
      }

      // Detect review moments
      const reviewPatterns = [
        /\b(remember|recall|we learned|last time|as we discussed)\b/i,
      ];

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

      // Detect practice moments
      const practicePatterns = [
        /\b(try|your turn|now you|say it|repeat|practice)\b/i,
      ];

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

  // Limit to top moments, sorted by timestamp
  return moments.sort((a, b) => a.timestamp - b.timestamp).slice(0, 20);
}

/**
 * Calculate engagement metrics
 */
function calculateEngagementMetrics(
  segments: SpeakerSegment[],
  tutorSpeakerId: number,
  latencies: number[],
  confusionIndicators: ConfusionIndicator[]
): EngagementMetrics {
  const concerns: string[] = [];
  const strengths: string[] = [];

  // 1. Response speed score (faster is better, but not too fast)
  const avgLatency =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 2.0;

  let responseSpeedScore: number;
  if (avgLatency < 0.5) {
    responseSpeedScore = 0.9; // Very quick
    strengths.push("Quick response times");
  } else if (avgLatency < 1.5) {
    responseSpeedScore = 1.0; // Ideal
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

  // 2. Participation ratio
  const { studentTime, totalDuration } = calculateSpeakingTimes(segments, tutorSpeakerId);
  const participationRatio = totalDuration > 0 ? studentTime / totalDuration : 0;

  if (participationRatio > 0.4) {
    strengths.push("High student participation");
  } else if (participationRatio < 0.2) {
    concerns.push("Low student participation - encourage more speaking");
  }

  // 3. Turn-taking balance
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

  // 4. Sustained attention (lack of confusion indicators)
  const confusionScore = Math.max(0, 1 - confusionIndicators.length * 0.1);
  if (confusionIndicators.length === 0) {
    strengths.push("Student maintained focus throughout");
  } else if (confusionIndicators.length > 5) {
    concerns.push("Multiple confusion points detected");
  }

  // Calculate overall score
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

/**
 * Create empty metrics for edge cases
 */
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
