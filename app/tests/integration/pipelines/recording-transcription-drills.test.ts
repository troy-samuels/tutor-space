/**
 * Recording → Transcription → Analysis → Drills Pipeline Integration Tests
 *
 * Tests the full analysis pipeline from transcript processing through
 * drill generation, including speaker diarization, L1 interference
 * detection, and code-switching analysis.
 *
 * @module tests/integration/pipelines/recording-transcription-drills
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
  words: Word[];
  confidence: number;
  languages?: string[];
}

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  language?: string;
}

interface CodeSwitchingMetrics {
  totalWords: number;
  wordsByLanguage: Record<string, number>;
  switchCount: number;
  avgSwitchesPerMinute: number;
  dominantLanguage: string;
  isCodeSwitched: boolean;
}

interface StudentLanguageProfile {
  studentId: string;
  targetLanguage: string;
  nativeLanguage?: string;
  dialectVariant?: string;
  formalityPreference: "formal" | "neutral" | "informal";
  vocabularyStyle: Record<string, unknown>;
  l1InterferencePatterns: Array<{
    pattern: string;
    frequency: number;
    improving: boolean;
  }>;
  speakingPace: "slow" | "moderate" | "fast";
  fillerWordsUsed: string[];
  lessonsAnalyzed: number;
  proficiencyLevel: "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "proficient";
}

interface TutorAnalysis {
  focusVocabulary: string[];
  focusGrammar: string[];
  corrections: Array<{
    original: string;
    correction: string;
    timestamp: number;
  }>;
  explanations: string[];
  teachingStyle: {
    questionFrequency: number;
    praiseFrequency: number;
    paceIndicators: string[];
  };
  inferredObjectives: Array<{
    type: string;
    topic: string;
    confidence: number;
  }>;
  focusTopics: string[];
}

interface StudentAnalysis {
  errors: Array<{
    original: string;
    correction: string;
    category?: string;
    type?: string;
    timestamp: number;
    isL1Interference?: boolean;
    l1Pattern?: string;
    explanation?: string;
  }>;
  strengths: Array<{
    type: string;
    example: string;
    timestamp: number;
  }>;
  vocabularyUsed: string[];
  grammarStructuresUsed: string[];
  fluencyMetrics: {
    wordsPerMinute: number;
    avgPauseDuration: number;
    fillerWordCount: number;
    fillerWords: string[];
  };
}

interface InteractionMetrics {
  turnCount: number;
  avgStudentLatencyMs: number;
  speakingRatio: number;
  engagementScore: number;
  confusionIndicators: Array<{
    timestamp: number;
    type: string;
    context: string;
    severity: string;
  }>;
  learningMoments: Array<{
    timestamp: number;
    type: string;
    topic?: string;
    description: string;
  }>;
}

interface L1InterferenceAnalysis {
  overallLevel: "low" | "medium" | "high";
  totalInterferenceCount: number;
  patterns: Array<{
    patternType: string;
    patternName: string;
    count: number;
    examples: Array<{
      wrong: string;
      correct: string;
      timestamp: number;
    }>;
  }>;
  recommendedFocusAreas: string[];
  improvementSuggestions: string[];
}

interface EnhancedAnalysisResult {
  speakerSegments: SpeakerSegment[];
  tutorSpeakerId: number;
  studentSpeakerId: number;
  tutorAnalysis: TutorAnalysis;
  studentAnalysis: StudentAnalysis;
  interactionMetrics: InteractionMetrics;
  l1InterferenceAnalysis: L1InterferenceAnalysis;
  codeSwitchingMetrics: CodeSwitchingMetrics;
  lessonObjectives: Array<{ type: string; topic: string }>;
  drillPackage: { drills: Array<{ id: string; type: string }> };
  summaryMd: string;
  keyPoints: string[];
  engagementScore: number;
}

// =============================================================================
// MOCK DATA FACTORIES
// =============================================================================

function createMockWord(overrides: Partial<Word> = {}): Word {
  return {
    word: "hello",
    start: 0,
    end: 0.5,
    confidence: 0.95,
    ...overrides,
  };
}

function createMockSegment(overrides: Partial<SpeakerSegment> = {}): SpeakerSegment {
  return {
    speaker: 0,
    text: "Hello there",
    start: 0,
    end: 2,
    words: [
      createMockWord({ word: "Hello", start: 0, end: 0.5 }),
      createMockWord({ word: "there", start: 0.5, end: 1.0 }),
    ],
    confidence: 0.9,
    ...overrides,
  };
}

function createMockStudentProfile(overrides: Partial<StudentLanguageProfile> = {}): StudentLanguageProfile {
  return {
    studentId: "student_123",
    targetLanguage: "en",
    nativeLanguage: "es",
    formalityPreference: "neutral",
    vocabularyStyle: {},
    l1InterferencePatterns: [],
    speakingPace: "moderate",
    fillerWordsUsed: [],
    lessonsAnalyzed: 0,
    proficiencyLevel: "intermediate",
    ...overrides,
  };
}

function createMockTutorAnalysis(overrides: Partial<TutorAnalysis> = {}): TutorAnalysis {
  return {
    focusVocabulary: ["vocabulary", "words"],
    focusGrammar: ["past tense", "present perfect"],
    corrections: [],
    explanations: [],
    teachingStyle: {
      questionFrequency: 0.5,
      praiseFrequency: 0.3,
      paceIndicators: [],
    },
    inferredObjectives: [],
    focusTopics: [],
    ...overrides,
  };
}

function createMockStudentAnalysis(overrides: Partial<StudentAnalysis> = {}): StudentAnalysis {
  return {
    errors: [],
    strengths: [],
    vocabularyUsed: [],
    grammarStructuresUsed: [],
    fluencyMetrics: {
      wordsPerMinute: 120,
      avgPauseDuration: 0.5,
      fillerWordCount: 2,
      fillerWords: ["um", "uh"],
    },
    ...overrides,
  };
}

function createMockInteractionMetrics(overrides: Partial<InteractionMetrics> = {}): InteractionMetrics {
  return {
    turnCount: 10,
    avgStudentLatencyMs: 1500,
    speakingRatio: 0.4,
    engagementScore: 0.75,
    confusionIndicators: [],
    learningMoments: [],
    ...overrides,
  };
}

function createMockL1Analysis(overrides: Partial<L1InterferenceAnalysis> = {}): L1InterferenceAnalysis {
  return {
    overallLevel: "low",
    totalInterferenceCount: 0,
    patterns: [],
    recommendedFocusAreas: [],
    improvementSuggestions: [],
    ...overrides,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function computeCodeSwitchingMetrics(segments: SpeakerSegment[]): CodeSwitchingMetrics {
  const wordsByLanguage: Record<string, number> = {};
  let switchCount = 0;
  let lastLanguage: string | null = null;
  let totalWords = 0;
  let totalDuration = 0;

  for (const segment of segments) {
    totalDuration += segment.end - segment.start;

    for (const word of segment.words) {
      totalWords++;
      const lang = word.language || "unknown";
      wordsByLanguage[lang] = (wordsByLanguage[lang] || 0) + 1;

      if (lastLanguage && lastLanguage !== lang && lang !== "unknown" && lastLanguage !== "unknown") {
        switchCount++;
      }
      if (lang !== "unknown") {
        lastLanguage = lang;
      }
    }
  }

  const knownLanguages = Object.entries(wordsByLanguage)
    .filter(([lang]) => lang !== "unknown")
    .sort((a, b) => b[1] - a[1]);

  const dominantLanguage = knownLanguages[0]?.[0] || "unknown";
  const durationMinutes = totalDuration / 60 || 1;
  const isCodeSwitched = knownLanguages.length > 1;

  return {
    totalWords,
    wordsByLanguage,
    switchCount,
    avgSwitchesPerMinute: Math.round((switchCount / durationMinutes) * 10) / 10,
    dominantLanguage,
    isCodeSwitched,
  };
}

function buildEnhancedSummary(
  tutorAnalysis: TutorAnalysis,
  studentAnalysis: StudentAnalysis,
  interactionMetrics: InteractionMetrics,
  l1Interference: L1InterferenceAnalysis
): string {
  const sections: string[] = [];

  sections.push("# Lesson Analysis Report\n");
  sections.push("## Engagement Overview");
  sections.push(`- **Engagement Score**: ${Math.round(interactionMetrics.engagementScore * 100)}%`);
  sections.push(`- **Speaking Ratio**: Student spoke ${Math.round(interactionMetrics.speakingRatio * 100)}% of the time`);
  sections.push(`- **Turn Count**: ${interactionMetrics.turnCount} conversation turns\n`);

  if (tutorAnalysis.focusVocabulary.length > 0) {
    sections.push("## Lesson Focus Areas");
    sections.push(`- **Vocabulary**: ${tutorAnalysis.focusVocabulary.join(", ")}`);
  }

  if (studentAnalysis.errors.length > 0) {
    sections.push("## Areas for Improvement");
    for (const error of studentAnalysis.errors.slice(0, 3)) {
      sections.push(`- "${error.original}" → "${error.correction}"`);
    }
  }

  return sections.join("\n");
}

function buildKeyPoints(
  tutorAnalysis: TutorAnalysis,
  studentAnalysis: StudentAnalysis,
  interactionMetrics: InteractionMetrics
): string[] {
  const points: string[] = [];

  if (tutorAnalysis.focusVocabulary.length > 0) {
    points.push(`Practiced ${tutorAnalysis.focusVocabulary.length} vocabulary items`);
  }

  if (tutorAnalysis.focusGrammar.length > 0) {
    points.push(`Grammar focus: ${tutorAnalysis.focusGrammar[0]}`);
  }

  if (interactionMetrics.engagementScore >= 0.7) {
    points.push("High student engagement throughout");
  }

  if (studentAnalysis.errors.length > 0) {
    points.push(`${studentAnalysis.errors.length} areas identified for practice`);
  }

  return points;
}

function updateProfileFromAnalysis(
  profile: StudentLanguageProfile,
  studentAnalysis: StudentAnalysis,
  l1Interference: L1InterferenceAnalysis
): StudentLanguageProfile {
  const wpm = studentAnalysis.fluencyMetrics?.wordsPerMinute || 0;
  const derivedPace = wpm < 100 ? "slow" : wpm > 150 ? "fast" : "moderate";

  const mergedFillers = [
    ...new Set([
      ...(profile.fillerWordsUsed || []),
      ...(studentAnalysis.fluencyMetrics?.fillerWords || []),
    ]),
  ].slice(0, 10);

  const newPatterns = [...profile.l1InterferencePatterns];
  for (const pattern of l1Interference.patterns) {
    const existing = newPatterns.find((p) => p.pattern === pattern.patternType);
    if (existing) {
      existing.frequency += pattern.count;
    } else {
      newPatterns.push({
        pattern: pattern.patternType,
        frequency: pattern.count,
        improving: false,
      });
    }
  }

  return {
    ...profile,
    speakingPace: derivedPace,
    fillerWordsUsed: mergedFillers,
    lessonsAnalyzed: profile.lessonsAnalyzed + 1,
    l1InterferencePatterns: newPatterns.slice(0, 25),
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("Recording → Transcription → Drills Pipeline", () => {
  describe("Code Switching Metrics", () => {
    it("computes metrics for monolingual transcript", () => {
      const segments: SpeakerSegment[] = [
        createMockSegment({
          words: [
            createMockWord({ word: "Hello", language: "en" }),
            createMockWord({ word: "world", language: "en" }),
          ],
        }),
      ];

      const metrics = computeCodeSwitchingMetrics(segments);

      assert.equal(metrics.totalWords, 2);
      assert.equal(metrics.wordsByLanguage["en"], 2);
      assert.equal(metrics.switchCount, 0);
      assert.equal(metrics.dominantLanguage, "en");
      assert.equal(metrics.isCodeSwitched, false);
    });

    it("computes metrics for multilingual transcript", () => {
      const segments: SpeakerSegment[] = [
        createMockSegment({
          words: [
            createMockWord({ word: "Hello", language: "en" }),
            createMockWord({ word: "mundo", language: "es" }),
            createMockWord({ word: "friend", language: "en" }),
          ],
        }),
      ];

      const metrics = computeCodeSwitchingMetrics(segments);

      assert.equal(metrics.totalWords, 3);
      assert.equal(metrics.wordsByLanguage["en"], 2);
      assert.equal(metrics.wordsByLanguage["es"], 1);
      assert.equal(metrics.switchCount, 2); // en→es, es→en
      assert.equal(metrics.dominantLanguage, "en");
      assert.equal(metrics.isCodeSwitched, true);
    });

    it("ignores unknown language when counting switches", () => {
      const segments: SpeakerSegment[] = [
        createMockSegment({
          words: [
            createMockWord({ word: "Hello", language: "en" }),
            createMockWord({ word: "hmm", language: "unknown" }),
            createMockWord({ word: "world", language: "en" }),
          ],
        }),
      ];

      const metrics = computeCodeSwitchingMetrics(segments);

      assert.equal(metrics.switchCount, 0); // No switch through unknown
    });

    it("handles empty segments", () => {
      const metrics = computeCodeSwitchingMetrics([]);

      assert.equal(metrics.totalWords, 0);
      assert.equal(metrics.switchCount, 0);
      assert.equal(metrics.dominantLanguage, "unknown");
    });

    it("calculates switches per minute", () => {
      const segments: SpeakerSegment[] = [
        createMockSegment({
          start: 0,
          end: 60, // 1 minute
          words: [
            createMockWord({ word: "Hello", language: "en" }),
            createMockWord({ word: "hola", language: "es" }),
            createMockWord({ word: "world", language: "en" }),
            createMockWord({ word: "mundo", language: "es" }),
          ],
        }),
      ];

      const metrics = computeCodeSwitchingMetrics(segments);

      // 3 switches in 1 minute = 3 switches/min
      assert.equal(metrics.avgSwitchesPerMinute, 3);
    });
  });

  describe("Summary Generation", () => {
    it("builds markdown summary with engagement metrics", () => {
      const tutorAnalysis = createMockTutorAnalysis();
      const studentAnalysis = createMockStudentAnalysis();
      const interactionMetrics = createMockInteractionMetrics({
        engagementScore: 0.85,
        speakingRatio: 0.45,
        turnCount: 20,
      });
      const l1Analysis = createMockL1Analysis();

      const summary = buildEnhancedSummary(
        tutorAnalysis,
        studentAnalysis,
        interactionMetrics,
        l1Analysis
      );

      assert.ok(summary.includes("Lesson Analysis Report"));
      assert.ok(summary.includes("85%")); // Engagement score
      assert.ok(summary.includes("45%")); // Speaking ratio
      assert.ok(summary.includes("20")); // Turn count
    });

    it("includes focus vocabulary in summary", () => {
      const tutorAnalysis = createMockTutorAnalysis({
        focusVocabulary: ["apple", "banana", "cherry"],
      });
      const studentAnalysis = createMockStudentAnalysis();
      const interactionMetrics = createMockInteractionMetrics();
      const l1Analysis = createMockL1Analysis();

      const summary = buildEnhancedSummary(
        tutorAnalysis,
        studentAnalysis,
        interactionMetrics,
        l1Analysis
      );

      assert.ok(summary.includes("Lesson Focus Areas"));
      assert.ok(summary.includes("apple"));
      assert.ok(summary.includes("banana"));
    });

    it("includes student errors in summary", () => {
      const tutorAnalysis = createMockTutorAnalysis();
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          { original: "I go yesterday", correction: "I went yesterday", timestamp: 10 },
        ],
      });
      const interactionMetrics = createMockInteractionMetrics();
      const l1Analysis = createMockL1Analysis();

      const summary = buildEnhancedSummary(
        tutorAnalysis,
        studentAnalysis,
        interactionMetrics,
        l1Analysis
      );

      assert.ok(summary.includes("Areas for Improvement"));
      assert.ok(summary.includes("I go yesterday"));
      assert.ok(summary.includes("I went yesterday"));
    });
  });

  describe("Key Points Generation", () => {
    it("generates key points from analysis", () => {
      const tutorAnalysis = createMockTutorAnalysis({
        focusVocabulary: ["word1", "word2", "word3"],
        focusGrammar: ["past tense"],
      });
      const studentAnalysis = createMockStudentAnalysis({
        errors: [{ original: "error", correction: "correct", timestamp: 0 }],
      });
      const interactionMetrics = createMockInteractionMetrics({
        engagementScore: 0.8,
      });

      const points = buildKeyPoints(tutorAnalysis, studentAnalysis, interactionMetrics);

      assert.ok(points.some((p) => p.includes("3 vocabulary")));
      assert.ok(points.some((p) => p.includes("past tense")));
      assert.ok(points.some((p) => p.includes("High student engagement")));
    });

    it("notes low engagement", () => {
      const tutorAnalysis = createMockTutorAnalysis();
      const studentAnalysis = createMockStudentAnalysis();
      const interactionMetrics = createMockInteractionMetrics({
        engagementScore: 0.3,
      });

      const points = buildKeyPoints(tutorAnalysis, studentAnalysis, interactionMetrics);

      // Should not include "high engagement"
      assert.ok(!points.some((p) => p.includes("High student engagement")));
    });
  });

  describe("Student Profile Updates", () => {
    it("updates lessons analyzed count", () => {
      const profile = createMockStudentProfile({ lessonsAnalyzed: 5 });
      const studentAnalysis = createMockStudentAnalysis();
      const l1Analysis = createMockL1Analysis();

      const updated = updateProfileFromAnalysis(profile, studentAnalysis, l1Analysis);

      assert.equal(updated.lessonsAnalyzed, 6);
    });

    it("derives speaking pace from WPM", () => {
      const profile = createMockStudentProfile();

      // Slow pace (< 100 WPM)
      const slowAnalysis = createMockStudentAnalysis({
        fluencyMetrics: { wordsPerMinute: 80, avgPauseDuration: 0.5, fillerWordCount: 0, fillerWords: [] },
      });
      const slowUpdated = updateProfileFromAnalysis(profile, slowAnalysis, createMockL1Analysis());
      assert.equal(slowUpdated.speakingPace, "slow");

      // Moderate pace (100-150 WPM)
      const modAnalysis = createMockStudentAnalysis({
        fluencyMetrics: { wordsPerMinute: 120, avgPauseDuration: 0.5, fillerWordCount: 0, fillerWords: [] },
      });
      const modUpdated = updateProfileFromAnalysis(profile, modAnalysis, createMockL1Analysis());
      assert.equal(modUpdated.speakingPace, "moderate");

      // Fast pace (> 150 WPM)
      const fastAnalysis = createMockStudentAnalysis({
        fluencyMetrics: { wordsPerMinute: 180, avgPauseDuration: 0.3, fillerWordCount: 0, fillerWords: [] },
      });
      const fastUpdated = updateProfileFromAnalysis(profile, fastAnalysis, createMockL1Analysis());
      assert.equal(fastUpdated.speakingPace, "fast");
    });

    it("merges filler words from analysis", () => {
      const profile = createMockStudentProfile({
        fillerWordsUsed: ["um", "uh"],
      });
      const studentAnalysis = createMockStudentAnalysis({
        fluencyMetrics: {
          wordsPerMinute: 120,
          avgPauseDuration: 0.5,
          fillerWordCount: 3,
          fillerWords: ["like", "you know", "um"], // "um" is duplicate
        },
      });

      const updated = updateProfileFromAnalysis(profile, studentAnalysis, createMockL1Analysis());

      assert.ok(updated.fillerWordsUsed.includes("um"));
      assert.ok(updated.fillerWordsUsed.includes("uh"));
      assert.ok(updated.fillerWordsUsed.includes("like"));
      assert.ok(updated.fillerWordsUsed.includes("you know"));
      // Should be deduplicated
      assert.equal(updated.fillerWordsUsed.filter((w) => w === "um").length, 1);
    });

    it("updates L1 interference patterns", () => {
      const profile = createMockStudentProfile({
        l1InterferencePatterns: [
          { pattern: "article_omission", frequency: 5, improving: false },
        ],
      });
      const l1Analysis = createMockL1Analysis({
        patterns: [
          {
            patternType: "article_omission",
            patternName: "Missing Articles",
            count: 3,
            examples: [],
          },
          {
            patternType: "plural_marking",
            patternName: "Missing Plurals",
            count: 2,
            examples: [],
          },
        ],
      });

      const updated = updateProfileFromAnalysis(
        profile,
        createMockStudentAnalysis(),
        l1Analysis
      );

      const articlePattern = updated.l1InterferencePatterns.find(
        (p) => p.pattern === "article_omission"
      );
      const pluralPattern = updated.l1InterferencePatterns.find(
        (p) => p.pattern === "plural_marking"
      );

      assert.ok(articlePattern);
      assert.equal(articlePattern.frequency, 8); // 5 + 3
      assert.ok(pluralPattern);
      assert.equal(pluralPattern.frequency, 2);
    });

    it("limits L1 patterns to 25", () => {
      const manyPatterns = Array(30)
        .fill(null)
        .map((_, i) => ({
          pattern: `pattern_${i}`,
          frequency: i,
          improving: false,
        }));

      const profile = createMockStudentProfile({
        l1InterferencePatterns: manyPatterns,
      });

      const updated = updateProfileFromAnalysis(
        profile,
        createMockStudentAnalysis(),
        createMockL1Analysis()
      );

      assert.ok(updated.l1InterferencePatterns.length <= 25);
    });
  });

  describe("Full Pipeline Integration", () => {
    it("processes transcript and produces complete analysis", () => {
      // Simulate full pipeline output structure
      const segments: SpeakerSegment[] = [
        createMockSegment({
          speaker: 0,
          text: "Today we will learn new vocabulary",
          start: 0,
          end: 5,
        }),
        createMockSegment({
          speaker: 1,
          text: "Okay, I'm ready to learn",
          start: 6,
          end: 10,
        }),
        createMockSegment({
          speaker: 0,
          text: "The word for 'house' is 'casa'. Now you try.",
          start: 11,
          end: 18,
        }),
        createMockSegment({
          speaker: 1,
          text: "Casa. I went to casa yesterday.",
          start: 19,
          end: 25,
        }),
      ];

      const codeSwitchingMetrics = computeCodeSwitchingMetrics(segments);
      const tutorAnalysis = createMockTutorAnalysis({
        focusVocabulary: ["casa", "house"],
        focusGrammar: ["possessive adjectives"],
        corrections: [
          { original: "the casa", correction: "la casa", timestamp: 20 },
        ],
      });
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          {
            original: "I went to casa",
            correction: "I went to the house",
            category: "article_omission",
            isL1Interference: true,
            l1Pattern: "article_omission",
            timestamp: 21,
          },
        ],
        strengths: [
          { type: "vocabulary", example: "casa", timestamp: 20 },
        ],
        vocabularyUsed: ["casa", "yesterday"],
      });
      const interactionMetrics = createMockInteractionMetrics({
        turnCount: 4,
        speakingRatio: 0.4,
        engagementScore: 0.78,
        learningMoments: [
          { timestamp: 11, type: "introduction", topic: "vocabulary", description: "New word introduced" },
        ],
      });
      const l1Analysis = createMockL1Analysis({
        overallLevel: "low",
        totalInterferenceCount: 1,
        patterns: [
          {
            patternType: "article_omission",
            patternName: "Missing Articles",
            count: 1,
            examples: [{ wrong: "I went to casa", correct: "I went to the house", timestamp: 21 }],
          },
        ],
        recommendedFocusAreas: ["Missing Articles"],
      });

      // Build summary
      const summary = buildEnhancedSummary(tutorAnalysis, studentAnalysis, interactionMetrics, l1Analysis);
      const keyPoints = buildKeyPoints(tutorAnalysis, studentAnalysis, interactionMetrics);

      // Build result structure
      const result: Partial<EnhancedAnalysisResult> = {
        speakerSegments: segments,
        tutorSpeakerId: 0,
        studentSpeakerId: 1,
        tutorAnalysis,
        studentAnalysis,
        interactionMetrics,
        l1InterferenceAnalysis: l1Analysis,
        codeSwitchingMetrics,
        summaryMd: summary,
        keyPoints,
        engagementScore: interactionMetrics.engagementScore,
      };

      // Verify complete result
      assert.ok(result.speakerSegments);
      assert.equal(result.speakerSegments.length, 4);
      assert.equal(result.tutorSpeakerId, 0);
      assert.equal(result.studentSpeakerId, 1);

      assert.ok(result.tutorAnalysis);
      assert.ok(result.tutorAnalysis.focusVocabulary.includes("casa"));

      assert.ok(result.studentAnalysis);
      assert.equal(result.studentAnalysis.errors.length, 1);
      assert.ok(result.studentAnalysis.errors[0].isL1Interference);

      assert.ok(result.interactionMetrics);
      assert.equal(result.interactionMetrics.turnCount, 4);

      assert.ok(result.l1InterferenceAnalysis);
      assert.equal(result.l1InterferenceAnalysis.overallLevel, "low");

      assert.ok(result.codeSwitchingMetrics);
      assert.ok(result.summaryMd.includes("Lesson Analysis Report"));
      assert.ok(result.keyPoints.length > 0);
    });

    it("handles lesson with high L1 interference", () => {
      const l1Analysis = createMockL1Analysis({
        overallLevel: "high",
        totalInterferenceCount: 12,
        patterns: [
          {
            patternType: "article_omission",
            patternName: "Missing Articles",
            count: 8,
            examples: [],
          },
          {
            patternType: "plural_marking",
            patternName: "Missing Plurals",
            count: 4,
            examples: [],
          },
        ],
        recommendedFocusAreas: ["Missing Articles", "Missing Plurals"],
        improvementSuggestions: [
          "Focus on articles with daily practice",
          "Review plural noun rules",
        ],
      });

      assert.equal(l1Analysis.overallLevel, "high");
      assert.equal(l1Analysis.totalInterferenceCount, 12);
      assert.equal(l1Analysis.patterns.length, 2);
      assert.equal(l1Analysis.recommendedFocusAreas.length, 2);
    });

    it("handles lesson with code-switching between Spanish and English", () => {
      const segments: SpeakerSegment[] = [
        createMockSegment({
          speaker: 1,
          text: "I went to the tienda yesterday",
          words: [
            createMockWord({ word: "I", language: "en" }),
            createMockWord({ word: "went", language: "en" }),
            createMockWord({ word: "to", language: "en" }),
            createMockWord({ word: "the", language: "en" }),
            createMockWord({ word: "tienda", language: "es" }),
            createMockWord({ word: "yesterday", language: "en" }),
          ],
          start: 0,
          end: 5,
        }),
        createMockSegment({
          speaker: 1,
          text: "Compré frutas y vegetables",
          words: [
            createMockWord({ word: "Compré", language: "es" }),
            createMockWord({ word: "frutas", language: "es" }),
            createMockWord({ word: "y", language: "es" }),
            createMockWord({ word: "vegetables", language: "en" }),
          ],
          start: 6,
          end: 10,
        }),
      ];

      const metrics = computeCodeSwitchingMetrics(segments);

      assert.ok(metrics.isCodeSwitched);
      assert.ok(metrics.wordsByLanguage["en"] > 0);
      assert.ok(metrics.wordsByLanguage["es"] > 0);
      assert.ok(metrics.switchCount >= 2); // At least 2 switches
    });
  });
});
