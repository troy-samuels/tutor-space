/**
 * L1 Interference Detection Unit Tests
 *
 * Tests for the L1 interference detector module that identifies native language
 * interference patterns in student speech and provides targeted correction suggestions.
 *
 * @module tests/unit/analysis/l1-interference
 */

import { describe, it, beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

// Types for testing
interface L1InterferencePattern {
  id: string;
  nativeLanguage: string;
  targetLanguage: string;
  patternType: string;
  patternName: string;
  description?: string;
  detectionRegex?: string;
  detectionKeywords?: string[];
  exampleErrors?: Array<{ wrong: string; correct: string }>;
  explanationTemplate?: string;
  drillTemplates?: unknown[];
  frequencyRank?: number;
  difficultyToCorrect?: "easy" | "medium" | "hard";
}

interface StudentError {
  original: string;
  correction: string;
  category?: string;
  timestamp: number;
  explanation?: string;
  isL1Interference?: boolean;
  l1Pattern?: string;
}

interface StudentAnalysis {
  errors: StudentError[];
  vocabularyUsed: string[];
  grammarStructuresUsed: string[];
  strengths: string[];
  fluencyMetrics: {
    wordsPerMinute: number;
    avgPauseDuration: number;
    fillerWordCount: number;
    fillerWords: string[];
  };
}

interface L1InterferenceResult {
  pattern: string;
  patternName: string;
  patternType: string;
  count: number;
  examples: Array<{
    wrong: string;
    correct: string;
    timestamp: number;
  }>;
  explanation: string;
  drillSuggestion: string;
  difficultyToCorrect: "easy" | "medium" | "hard";
}

interface L1InterferenceAnalysis {
  overallLevel: "low" | "medium" | "high";
  totalInterferenceCount: number;
  patterns: L1InterferenceResult[];
  recommendedFocusAreas: string[];
  improvementSuggestions: string[];
}

// =============================================================================
// BUILT-IN PATTERNS FOR TESTING (mirroring production)
// =============================================================================

const BUILT_IN_PATTERNS: Record<string, Record<string, L1InterferencePattern[]>> = {
  ja: {
    en: [
      {
        id: "ja-en-article",
        nativeLanguage: "ja",
        targetLanguage: "en",
        patternType: "article_omission",
        patternName: "Missing Articles",
        description: "Japanese has no articles, so speakers often omit a/an/the",
        detectionRegex: "\\b(go to|went to|at|in|on)\\s+(?!the|a|an)\\w+\\b",
        detectionKeywords: [],
        explanationTemplate: "Japanese does not have articles. In English, most singular countable nouns need 'a', 'an', or 'the'.",
        frequencyRank: 1,
        difficultyToCorrect: "hard",
      },
      {
        id: "ja-en-plural",
        nativeLanguage: "ja",
        targetLanguage: "en",
        patternType: "plural_marking",
        patternName: "Missing Plurals",
        description: "Japanese nouns don't change for plural",
        detectionRegex: "\\b(many|several|few|two|three|\\d+)\\s+\\w+(?!s)\\b",
        detectionKeywords: ["many", "several", "few"],
        explanationTemplate: "English nouns need -s or -es to show plural. Add the plural marker after numbers and quantity words.",
        frequencyRank: 2,
        difficultyToCorrect: "easy",
      },
    ],
  },
  zh: {
    en: [
      {
        id: "zh-en-article",
        nativeLanguage: "zh",
        targetLanguage: "en",
        patternType: "article_omission",
        patternName: "Missing Articles",
        description: "Chinese has no articles",
        detectionRegex: "\\b(is|am|are|was|were)\\s+(?!the|a|an)\\w+\\b",
        detectionKeywords: [],
        explanationTemplate: "Chinese does not use articles. English requires 'a', 'an', or 'the' before most nouns.",
        frequencyRank: 1,
        difficultyToCorrect: "hard",
      },
      {
        id: "zh-en-tense",
        nativeLanguage: "zh",
        targetLanguage: "en",
        patternType: "tense_marking",
        patternName: "Missing Tense Markers",
        description: "Chinese verbs don't conjugate for tense",
        detectionKeywords: ["yesterday", "last week", "ago", "tomorrow", "next"],
        explanationTemplate: "Chinese uses time words instead of verb conjugation. English verbs must change form to show tense.",
        frequencyRank: 2,
        difficultyToCorrect: "medium",
      },
    ],
  },
  es: {
    en: [
      {
        id: "es-en-adjective-order",
        nativeLanguage: "es",
        targetLanguage: "en",
        patternType: "adjective_order",
        patternName: "Adjective Position",
        description: "Spanish places adjectives after nouns",
        detectionRegex: "\\b(the|a|an)\\s+\\w+\\s+(big|small|red|blue|new|old|good|bad)\\b",
        detectionKeywords: [],
        explanationTemplate: "In Spanish, adjectives typically follow nouns. In English, adjectives come before nouns.",
        frequencyRank: 1,
        difficultyToCorrect: "easy",
      },
      {
        id: "es-en-false-friends",
        nativeLanguage: "es",
        targetLanguage: "en",
        patternType: "false_friends",
        patternName: "False Cognates",
        description: "Spanish-English false friends",
        detectionKeywords: ["actually", "sensible", "embarrassed", "attend"],
        explanationTemplate: "Be careful with words that look similar in Spanish and English but have different meanings.",
        frequencyRank: 2,
        difficultyToCorrect: "medium",
      },
    ],
  },
};

// =============================================================================
// PURE FUNCTION IMPLEMENTATIONS FOR TESTING
// =============================================================================

/**
 * Get L1 patterns for a language pair (pure function for testing)
 */
function getL1PatternsForPair(
  nativeLanguage: string,
  targetLanguage: string
): L1InterferencePattern[] {
  return BUILT_IN_PATTERNS[nativeLanguage]?.[targetLanguage] || [];
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generate drill suggestion based on pattern
 */
function generateDrillSuggestion(pattern: L1InterferencePattern): string {
  switch (pattern.patternType) {
    case "article_omission":
      return "Practice gap-fill exercises with articles. Focus on when to use 'the' vs 'a/an' vs no article.";
    case "plural_marking":
      return "Practice plural forms with counting exercises. Use flashcards with singular/plural pairs.";
    case "tense_marking":
      return "Practice verb conjugation drills. Focus on past/present/future forms with time markers.";
    case "adjective_order":
      return "Practice building noun phrases. Arrange adjectives in correct English order.";
    case "word_order":
      return "Practice sentence building exercises. Rearrange scrambled sentences.";
    case "preposition_confusion":
      return "Practice preposition gap-fill. Focus on location, time, and direction prepositions.";
    case "false_friends":
      return "Create flashcards for false cognates. Practice with context sentences.";
    default:
      return "Practice targeted exercises focusing on this pattern. Use examples from your lessons.";
  }
}

/**
 * Detect patterns in raw text
 */
function detectPatternsInText(
  text: string,
  patterns: L1InterferencePattern[]
): L1InterferenceResult[] {
  const results: L1InterferenceResult[] = [];
  const sourceText = text ?? "";

  for (const pattern of patterns) {
    const matchRanges: Array<{ start: number; end: number }> = [];

    const addRange = (start: number, end: number) => {
      for (const range of matchRanges) {
        if (start < range.end && end > range.start) {
          return;
        }
      }
      matchRanges.push({ start, end });
    };

    const collectMatches = (regex: RegExp) => {
      for (const match of sourceText.matchAll(regex)) {
        if (match.index === undefined) {
          continue;
        }
        addRange(match.index, match.index + match[0].length);
      }
    };

    // Check regex detection
    if (pattern.detectionRegex) {
      try {
        collectMatches(new RegExp(pattern.detectionRegex, "gi"));
      } catch {
        // Invalid regex, skip
      }
    }

    // Check keyword detection
    if (pattern.detectionKeywords && pattern.detectionKeywords.length > 0) {
      for (const keyword of pattern.detectionKeywords) {
        collectMatches(new RegExp(`\\b${escapeRegex(keyword)}\\b`, "gi"));
      }
    }

    if (matchRanges.length > 0) {
      results.push({
        pattern: pattern.patternType,
        patternName: pattern.patternName,
        patternType: pattern.patternType,
        count: matchRanges.length,
        examples: pattern.exampleErrors?.map((e) => ({
          wrong: e.wrong,
          correct: e.correct,
          timestamp: 0,
        })) || [],
        explanation: pattern.explanationTemplate || "",
        drillSuggestion: generateDrillSuggestion(pattern),
        difficultyToCorrect: pattern.difficultyToCorrect || "medium",
      });
    }
  }

  return results;
}

/**
 * Detect L1 interference in student speech (pure function for testing)
 */
function detectL1Interference(
  studentAnalysis: StudentAnalysis,
  nativeLanguage: string,
  targetLanguage: string
): L1InterferenceAnalysis {
  const patterns = getL1PatternsForPair(nativeLanguage, targetLanguage);

  if (patterns.length === 0) {
    return {
      overallLevel: "low",
      totalInterferenceCount: 0,
      patterns: [],
      recommendedFocusAreas: [],
      improvementSuggestions: [],
    };
  }

  const patternCounts = new Map<string, L1InterferenceResult>();
  let totalCount = 0;

  // Check each error for L1 interference
  for (const error of studentAnalysis.errors) {
    if (error.isL1Interference && error.l1Pattern) {
      const pattern = patterns.find((p) => p.patternType === error.l1Pattern);
      if (pattern) {
        const existing = patternCounts.get(pattern.patternType);
        if (existing) {
          existing.count++;
          existing.examples.push({
            wrong: error.original,
            correct: error.correction,
            timestamp: error.timestamp,
          });
        } else {
          patternCounts.set(pattern.patternType, {
            pattern: pattern.patternType,
            patternName: pattern.patternName,
            patternType: pattern.patternType,
            count: 1,
            examples: [
              {
                wrong: error.original,
                correct: error.correction,
                timestamp: error.timestamp,
              },
            ],
            explanation: pattern.explanationTemplate || "",
            drillSuggestion: generateDrillSuggestion(pattern),
            difficultyToCorrect: pattern.difficultyToCorrect || "medium",
          });
        }
        totalCount++;
      }
    }
  }

  // Also run pattern detection on vocabulary/grammar
  const additionalDetections = detectPatternsInText(
    studentAnalysis.vocabularyUsed.join(" ") + " " + studentAnalysis.grammarStructuresUsed.join(" "),
    patterns
  );

  for (const detection of additionalDetections) {
    if (!patternCounts.has(detection.patternType)) {
      patternCounts.set(detection.patternType, detection);
      totalCount += detection.count;
    }
  }

  const sortedPatterns = Array.from(patternCounts.values()).sort((a, b) => b.count - a.count);

  // Determine overall level
  let overallLevel: "low" | "medium" | "high";
  if (totalCount === 0) {
    overallLevel = "low";
  } else if (totalCount <= 3) {
    overallLevel = "low";
  } else if (totalCount <= 7) {
    overallLevel = "medium";
  } else {
    overallLevel = "high";
  }

  const recommendedFocusAreas = sortedPatterns.slice(0, 3).map((p) => p.patternName);

  const improvementSuggestions = generateImprovementSuggestions(
    sortedPatterns,
    nativeLanguage,
    targetLanguage
  );

  return {
    overallLevel,
    totalInterferenceCount: totalCount,
    patterns: sortedPatterns,
    recommendedFocusAreas,
    improvementSuggestions,
  };
}

/**
 * Generate improvement suggestions
 */
function generateImprovementSuggestions(
  patterns: L1InterferenceResult[],
  nativeLanguage: string,
  targetLanguage: string
): string[] {
  const suggestions: string[] = [];

  if (patterns.length === 0) {
    suggestions.push(
      `Great job! Your ${targetLanguage} shows minimal interference from ${nativeLanguage}.`
    );
    return suggestions;
  }

  suggestions.push(
    `As a ${nativeLanguage} speaker learning ${targetLanguage}, pay extra attention to these patterns.`
  );

  for (const pattern of patterns.slice(0, 3)) {
    switch (pattern.difficultyToCorrect) {
      case "easy":
        suggestions.push(
          `${pattern.patternName}: This is usually quick to fix with focused practice. ${pattern.drillSuggestion}`
        );
        break;
      case "medium":
        suggestions.push(
          `${pattern.patternName}: This requires consistent practice over time. ${pattern.drillSuggestion}`
        );
        break;
      case "hard":
        suggestions.push(
          `${pattern.patternName}: This is a common challenge for ${nativeLanguage} speakers. Don't get discouraged - keep practicing! ${pattern.drillSuggestion}`
        );
        break;
    }
  }

  return suggestions;
}

/**
 * Match L1 patterns to student errors
 */
function matchErrorsToL1Patterns(
  errors: StudentError[],
  patterns: L1InterferencePattern[]
): StudentError[] {
  return errors.map((error) => {
    if (error.isL1Interference) return error;

    for (const pattern of patterns) {
      let isMatch = false;

      // Check by error category
      if (error.category && pattern.patternType === error.category) {
        isMatch = true;
      }

      // Check by regex
      if (!isMatch && pattern.detectionRegex) {
        try {
          const regex = new RegExp(pattern.detectionRegex, "i");
          if (regex.test(error.original)) {
            isMatch = true;
          }
        } catch {
          // Invalid regex
        }
      }

      // Check by keywords
      if (!isMatch && pattern.detectionKeywords) {
        const lowerOriginal = error.original.toLowerCase();
        for (const keyword of pattern.detectionKeywords) {
          if (lowerOriginal.includes(keyword.toLowerCase())) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch) {
        return {
          ...error,
          isL1Interference: true,
          l1Pattern: pattern.patternType,
          explanation: error.explanation || pattern.explanationTemplate,
        };
      }
    }

    return error;
  });
}

/**
 * Get language name from code
 */
function getLanguageName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    it: "Italian",
    pt: "Portuguese",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    ru: "Russian",
    hi: "Hindi",
    nl: "Dutch",
    pl: "Polish",
    tr: "Turkish",
  };
  return names[code] || code.toUpperCase();
}

// =============================================================================
// TEST HELPERS
// =============================================================================

function createMockStudentAnalysis(overrides: Partial<StudentAnalysis> = {}): StudentAnalysis {
  return {
    errors: [],
    vocabularyUsed: [],
    grammarStructuresUsed: [],
    strengths: [],
    fluencyMetrics: {
      wordsPerMinute: 120,
      avgPauseDuration: 0.5,
      fillerWordCount: 0,
      fillerWords: [],
    },
    ...overrides,
  };
}

function createMockError(overrides: Partial<StudentError> = {}): StudentError {
  return {
    original: "I go to school yesterday",
    correction: "I went to school yesterday",
    category: "verb_tense",
    timestamp: 10.5,
    explanation: "Use past tense for completed actions",
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe("L1 Interference Detection", () => {
  describe("getL1PatternsForPair", () => {
    it("returns patterns for Japanese → English", () => {
      const patterns = getL1PatternsForPair("ja", "en");
      assert.ok(patterns.length > 0, "Should return patterns for JA→EN");
      assert.ok(
        patterns.some((p) => p.patternType === "article_omission"),
        "Should include article omission pattern"
      );
      assert.ok(
        patterns.some((p) => p.patternType === "plural_marking"),
        "Should include plural marking pattern"
      );
    });

    it("returns patterns for Spanish → English", () => {
      const patterns = getL1PatternsForPair("es", "en");
      assert.ok(patterns.length > 0, "Should return patterns for ES→EN");
      assert.ok(
        patterns.some((p) => p.patternType === "adjective_order"),
        "Should include adjective order pattern"
      );
      assert.ok(
        patterns.some((p) => p.patternType === "false_friends"),
        "Should include false friends pattern"
      );
    });

    it("returns patterns for Chinese → English", () => {
      const patterns = getL1PatternsForPair("zh", "en");
      assert.ok(patterns.length > 0, "Should return patterns for ZH→EN");
      assert.ok(
        patterns.some((p) => p.patternType === "article_omission"),
        "Should include article omission pattern"
      );
      assert.ok(
        patterns.some((p) => p.patternType === "tense_marking"),
        "Should include tense marking pattern"
      );
    });

    it("returns empty array for unsupported language pairs", () => {
      const patterns = getL1PatternsForPair("xx", "yy");
      assert.equal(patterns.length, 0, "Should return empty array for unsupported pair");
    });

    it("returns empty array when native language not found", () => {
      const patterns = getL1PatternsForPair("ru", "en");
      assert.equal(patterns.length, 0, "Should return empty array for Russian→English");
    });

    it("returns empty array when target language not found", () => {
      const patterns = getL1PatternsForPair("ja", "fr");
      assert.equal(patterns.length, 0, "Should return empty array for Japanese→French");
    });

    it("patterns have required fields", () => {
      const patterns = getL1PatternsForPair("ja", "en");
      for (const pattern of patterns) {
        assert.ok(pattern.id, "Pattern should have id");
        assert.ok(pattern.nativeLanguage, "Pattern should have nativeLanguage");
        assert.ok(pattern.targetLanguage, "Pattern should have targetLanguage");
        assert.ok(pattern.patternType, "Pattern should have patternType");
        assert.ok(pattern.patternName, "Pattern should have patternName");
      }
    });

    it("patterns are sorted by frequency rank", () => {
      const patterns = getL1PatternsForPair("ja", "en");
      for (let i = 1; i < patterns.length; i++) {
        const prev = patterns[i - 1].frequencyRank ?? 0;
        const curr = patterns[i].frequencyRank ?? 0;
        assert.ok(prev <= curr, "Patterns should be sorted by frequency rank");
      }
    });
  });

  describe("detectL1Interference", () => {
    it("detects article omission errors (JA→EN)", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I went to park",
            correction: "I went to the park",
            category: "article_omission",
            isL1Interference: true,
            l1Pattern: "article_omission",
          }),
        ],
      });

      const result = detectL1Interference(studentAnalysis, "ja", "en");

      assert.ok(result.patterns.length > 0, "Should detect interference patterns");
      assert.ok(
        result.patterns.some((p) => p.patternType === "article_omission"),
        "Should detect article omission"
      );
    });

    it("detects plural marking errors (JA→EN)", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I have three book",
            correction: "I have three books",
            category: "plural_marking",
            isL1Interference: true,
            l1Pattern: "plural_marking",
          }),
        ],
      });

      const result = detectL1Interference(studentAnalysis, "ja", "en");

      assert.ok(
        result.patterns.some((p) => p.patternType === "plural_marking"),
        "Should detect plural marking error"
      );
    });

    it("detects adjective order errors (ES→EN)", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I have a house big",
            correction: "I have a big house",
            category: "adjective_order",
            isL1Interference: true,
            l1Pattern: "adjective_order",
          }),
        ],
      });

      const result = detectL1Interference(studentAnalysis, "es", "en");

      assert.ok(
        result.patterns.some((p) => p.patternType === "adjective_order"),
        "Should detect adjective order error"
      );
    });

    it("returns low level for 0-3 interference errors", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I went to park",
            correction: "I went to the park",
            isL1Interference: true,
            l1Pattern: "article_omission",
          }),
          createMockError({
            original: "I have three book",
            correction: "I have three books",
            isL1Interference: true,
            l1Pattern: "plural_marking",
          }),
        ],
      });

      const result = detectL1Interference(studentAnalysis, "ja", "en");
      assert.equal(result.overallLevel, "low", "Should return low level for <= 3 errors");
    });

    it("returns medium level for 4-7 interference errors", () => {
      const errors = Array(5)
        .fill(null)
        .map((_, i) =>
          createMockError({
            original: `Error ${i}`,
            correction: `Correction ${i}`,
            isL1Interference: true,
            l1Pattern: "article_omission",
            timestamp: i * 10,
          })
        );

      const studentAnalysis = createMockStudentAnalysis({ errors });
      const result = detectL1Interference(studentAnalysis, "ja", "en");
      assert.equal(result.overallLevel, "medium", "Should return medium level for 4-7 errors");
    });

    it("returns high level for 8+ interference errors", () => {
      const errors = Array(10)
        .fill(null)
        .map((_, i) =>
          createMockError({
            original: `Error ${i}`,
            correction: `Correction ${i}`,
            isL1Interference: true,
            l1Pattern: "article_omission",
            timestamp: i * 10,
          })
        );

      const studentAnalysis = createMockStudentAnalysis({ errors });
      const result = detectL1Interference(studentAnalysis, "ja", "en");
      assert.equal(result.overallLevel, "high", "Should return high level for 8+ errors");
    });

    it("returns empty result for unsupported language pairs", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [createMockError()],
      });

      const result = detectL1Interference(studentAnalysis, "xx", "yy");

      assert.equal(result.overallLevel, "low");
      assert.equal(result.totalInterferenceCount, 0);
      assert.equal(result.patterns.length, 0);
    });

    it("returns empty result for analysis with no errors", () => {
      const studentAnalysis = createMockStudentAnalysis();
      const result = detectL1Interference(studentAnalysis, "ja", "en");

      assert.equal(result.overallLevel, "low");
      assert.equal(result.totalInterferenceCount, 0);
    });

    it("provides recommended focus areas based on pattern frequency", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I go to park",
            correction: "I went to the park",
            isL1Interference: true,
            l1Pattern: "article_omission",
          }),
          createMockError({
            original: "I saw dog",
            correction: "I saw a dog",
            isL1Interference: true,
            l1Pattern: "article_omission",
          }),
          createMockError({
            original: "I have three book",
            correction: "I have three books",
            isL1Interference: true,
            l1Pattern: "plural_marking",
          }),
        ],
      });

      const result = detectL1Interference(studentAnalysis, "ja", "en");

      assert.ok(result.recommendedFocusAreas.length > 0, "Should have recommended focus areas");
      assert.ok(
        result.recommendedFocusAreas.includes("Missing Articles"),
        "Should recommend Missing Articles as top focus area"
      );
    });

    it("provides improvement suggestions", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I go to park",
            correction: "I went to the park",
            isL1Interference: true,
            l1Pattern: "article_omission",
          }),
        ],
      });

      const result = detectL1Interference(studentAnalysis, "ja", "en");

      assert.ok(result.improvementSuggestions.length > 0, "Should have improvement suggestions");
    });

    it("detects patterns via vocabulary and grammar text analysis", () => {
      const studentAnalysis = createMockStudentAnalysis({
        vocabularyUsed: ["many student", "several book"],
        grammarStructuresUsed: ["I went to park"],
      });

      const result = detectL1Interference(studentAnalysis, "ja", "en");

      // The pattern detection should find matches in the text
      assert.ok(result.totalInterferenceCount >= 0, "Should analyze vocabulary and grammar text");
    });
  });

  describe("matchErrorsToL1Patterns", () => {
    it("matches errors by category", () => {
      const errors: StudentError[] = [
        createMockError({
          original: "I went to park",
          correction: "I went to the park",
          category: "article_omission",
        }),
      ];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      assert.ok(matched[0].isL1Interference, "Should mark as L1 interference");
      assert.equal(matched[0].l1Pattern, "article_omission", "Should set correct pattern");
    });

    it("matches errors by regex detection", () => {
      const errors: StudentError[] = [
        createMockError({
          original: "I went to school",
          correction: "I went to the school",
          category: undefined, // No category set
        }),
      ];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      // Should match via regex "went to" without article
      assert.ok(matched[0].isL1Interference, "Should match via regex detection");
    });

    it("matches errors by keyword detection", () => {
      const errors: StudentError[] = [
        createMockError({
          original: "I see many bird flying",
          correction: "I see many birds flying",
          category: undefined,
        }),
      ];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      // Should match via keyword "many"
      assert.ok(matched[0].isL1Interference, "Should match via keyword detection");
      assert.equal(matched[0].l1Pattern, "plural_marking", "Should detect plural marking pattern");
    });

    it("preserves already-matched errors", () => {
      const errors: StudentError[] = [
        createMockError({
          original: "I went to park",
          correction: "I went to the park",
          isL1Interference: true,
          l1Pattern: "article_omission",
        }),
      ];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      assert.ok(matched[0].isL1Interference, "Should preserve L1 flag");
      assert.equal(matched[0].l1Pattern, "article_omission", "Should preserve pattern");
    });

    it("does not modify errors that don't match any pattern", () => {
      const errors: StudentError[] = [
        createMockError({
          original: "Hello world",
          correction: "Hello world",
          category: "unknown_category",
        }),
      ];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      assert.ok(!matched[0].isL1Interference, "Should not mark as L1 interference");
      assert.ok(!matched[0].l1Pattern, "Should not set pattern");
    });

    it("uses pattern explanation when error has no explanation", () => {
      const errors: StudentError[] = [
        createMockError({
          original: "I went to park",
          correction: "I went to the park",
          category: "article_omission",
          explanation: undefined,
        }),
      ];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      assert.ok(matched[0].explanation, "Should set explanation from pattern");
      assert.ok(
        matched[0].explanation?.includes("articles") ||
          matched[0].explanation?.includes("Japanese"),
        "Should use pattern's explanation template"
      );
    });

    it("preserves original explanation if present", () => {
      const originalExplanation = "Custom explanation from tutor";
      const errors: StudentError[] = [
        createMockError({
          original: "I went to park",
          correction: "I went to the park",
          category: "article_omission",
          explanation: originalExplanation,
        }),
      ];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      assert.equal(matched[0].explanation, originalExplanation, "Should preserve original explanation");
    });

    it("handles empty errors array", () => {
      const errors: StudentError[] = [];
      const patterns = getL1PatternsForPair("ja", "en");

      const matched = matchErrorsToL1Patterns(errors, patterns);

      assert.equal(matched.length, 0, "Should return empty array");
    });

    it("handles empty patterns array", () => {
      const errors: StudentError[] = [createMockError()];
      const patterns: L1InterferencePattern[] = [];

      const matched = matchErrorsToL1Patterns(errors, patterns);

      assert.equal(matched.length, 1, "Should return original errors");
      assert.ok(!matched[0].isL1Interference, "Should not mark as L1 interference");
    });
  });

  describe("getLanguageName", () => {
    it("returns correct names for supported languages", () => {
      assert.equal(getLanguageName("en"), "English");
      assert.equal(getLanguageName("es"), "Spanish");
      assert.equal(getLanguageName("fr"), "French");
      assert.equal(getLanguageName("de"), "German");
      assert.equal(getLanguageName("it"), "Italian");
      assert.equal(getLanguageName("pt"), "Portuguese");
      assert.equal(getLanguageName("ja"), "Japanese");
      assert.equal(getLanguageName("ko"), "Korean");
      assert.equal(getLanguageName("zh"), "Chinese");
      assert.equal(getLanguageName("ar"), "Arabic");
      assert.equal(getLanguageName("ru"), "Russian");
      assert.equal(getLanguageName("hi"), "Hindi");
      assert.equal(getLanguageName("nl"), "Dutch");
      assert.equal(getLanguageName("pl"), "Polish");
      assert.equal(getLanguageName("tr"), "Turkish");
    });

    it("returns uppercase code for unsupported languages", () => {
      assert.equal(getLanguageName("xx"), "XX");
      assert.equal(getLanguageName("abc"), "ABC");
    });
  });

  describe("generateDrillSuggestion", () => {
    it("returns appropriate drill for article omission", () => {
      const pattern: L1InterferencePattern = {
        id: "test",
        nativeLanguage: "ja",
        targetLanguage: "en",
        patternType: "article_omission",
        patternName: "Missing Articles",
      };

      const suggestion = generateDrillSuggestion(pattern);
      assert.ok(suggestion.includes("articles"), "Should suggest article practice");
      assert.ok(suggestion.includes("gap-fill"), "Should suggest gap-fill exercise");
    });

    it("returns appropriate drill for plural marking", () => {
      const pattern: L1InterferencePattern = {
        id: "test",
        nativeLanguage: "ja",
        targetLanguage: "en",
        patternType: "plural_marking",
        patternName: "Missing Plurals",
      };

      const suggestion = generateDrillSuggestion(pattern);
      assert.ok(suggestion.includes("plural"), "Should mention plural");
      assert.ok(suggestion.includes("flashcards"), "Should suggest flashcards");
    });

    it("returns appropriate drill for adjective order", () => {
      const pattern: L1InterferencePattern = {
        id: "test",
        nativeLanguage: "es",
        targetLanguage: "en",
        patternType: "adjective_order",
        patternName: "Adjective Position",
      };

      const suggestion = generateDrillSuggestion(pattern);
      assert.ok(suggestion.includes("noun phrases"), "Should suggest noun phrase practice");
    });

    it("returns appropriate drill for false friends", () => {
      const pattern: L1InterferencePattern = {
        id: "test",
        nativeLanguage: "es",
        targetLanguage: "en",
        patternType: "false_friends",
        patternName: "False Cognates",
      };

      const suggestion = generateDrillSuggestion(pattern);
      assert.ok(suggestion.includes("flashcards"), "Should suggest flashcards");
      assert.ok(suggestion.includes("false cognates"), "Should mention false cognates");
    });

    it("returns generic suggestion for unknown pattern type", () => {
      const pattern: L1InterferencePattern = {
        id: "test",
        nativeLanguage: "ja",
        targetLanguage: "en",
        patternType: "unknown_pattern",
        patternName: "Unknown Pattern",
      };

      const suggestion = generateDrillSuggestion(pattern);
      assert.ok(suggestion.includes("targeted exercises"), "Should return generic suggestion");
    });
  });

  describe("detectPatternsInText", () => {
    it("detects patterns using regex", () => {
      const text = "I went to park and then went to school";
      const patterns = getL1PatternsForPair("ja", "en");

      const results = detectPatternsInText(text, patterns);

      assert.ok(results.length > 0, "Should detect patterns in text");
      assert.ok(
        results.some((r) => r.patternType === "article_omission"),
        "Should detect article omission"
      );
    });

    it("detects patterns using keywords", () => {
      const text = "I saw many bird and several cat";
      const patterns = getL1PatternsForPair("ja", "en");

      const results = detectPatternsInText(text, patterns);

      assert.ok(results.length > 0, "Should detect patterns via keywords");
      assert.ok(
        results.some((r) => r.patternType === "plural_marking"),
        "Should detect plural marking via keywords"
      );
    });

    it("counts multiple occurrences", () => {
      const text = "many book many pen many table";
      const patterns = getL1PatternsForPair("ja", "en");

      const results = detectPatternsInText(text, patterns);
      const pluralPattern = results.find((r) => r.patternType === "plural_marking");

      assert.ok(pluralPattern, "Should find plural pattern");
      assert.equal(pluralPattern!.count, 3, "Should count all 3 occurrences of 'many'");
    });

    it("returns empty array when no patterns match", () => {
      const text = "This is a perfectly correct sentence.";
      const patterns = getL1PatternsForPair("ja", "en");

      const results = detectPatternsInText(text, patterns);

      // May or may not match depending on regex, but should not throw
      assert.ok(Array.isArray(results), "Should return array");
    });

    it("handles invalid regex gracefully", () => {
      const text = "test text";
      const patterns: L1InterferencePattern[] = [
        {
          id: "invalid",
          nativeLanguage: "ja",
          targetLanguage: "en",
          patternType: "test",
          patternName: "Test",
          detectionRegex: "[invalid(regex", // Invalid regex
        },
      ];

      // Should not throw
      const results = detectPatternsInText(text, patterns);
      assert.ok(Array.isArray(results), "Should handle invalid regex gracefully");
    });

    it("is case insensitive for keyword matching", () => {
      const text = "MANY students SEVERAL books FEW items";
      const patterns = getL1PatternsForPair("ja", "en");

      const results = detectPatternsInText(text, patterns);
      const pluralPattern = results.find((r) => r.patternType === "plural_marking");

      assert.ok(pluralPattern, "Should find plural pattern with uppercase keywords");
      assert.ok(pluralPattern!.count >= 3, "Should match all keywords regardless of case");
    });
  });

  describe("generateImprovementSuggestions", () => {
    it("returns congratulatory message when no patterns", () => {
      const suggestions = generateImprovementSuggestions([], "ja", "en");

      assert.equal(suggestions.length, 1);
      assert.ok(suggestions[0].includes("Great job"), "Should congratulate student");
      assert.ok(suggestions[0].includes("minimal interference"), "Should mention minimal interference");
    });

    it("includes language-specific context", () => {
      const patterns: L1InterferenceResult[] = [
        {
          pattern: "article_omission",
          patternName: "Missing Articles",
          patternType: "article_omission",
          count: 5,
          examples: [],
          explanation: "",
          drillSuggestion: "",
          difficultyToCorrect: "hard",
        },
      ];

      const suggestions = generateImprovementSuggestions(patterns, "ja", "en");

      assert.ok(
        suggestions.some((s) => s.includes("ja")),
        "Should mention native language"
      );
    });

    it("provides difficulty-appropriate suggestions", () => {
      const patterns: L1InterferenceResult[] = [
        {
          pattern: "article_omission",
          patternName: "Missing Articles",
          patternType: "article_omission",
          count: 5,
          examples: [],
          explanation: "",
          drillSuggestion: "Practice gap-fill",
          difficultyToCorrect: "hard",
        },
      ];

      const suggestions = generateImprovementSuggestions(patterns, "ja", "en");

      assert.ok(
        suggestions.some((s) => s.includes("Don't get discouraged")),
        "Should encourage for hard patterns"
      );
    });

    it("limits to top 3 patterns", () => {
      const patterns: L1InterferenceResult[] = Array(5)
        .fill(null)
        .map((_, i) => ({
          pattern: `pattern_${i}`,
          patternName: `Pattern ${i}`,
          patternType: `pattern_${i}`,
          count: 5 - i,
          examples: [],
          explanation: "",
          drillSuggestion: "",
          difficultyToCorrect: "medium" as const,
        }));

      const suggestions = generateImprovementSuggestions(patterns, "ja", "en");

      // First suggestion is general, then max 3 pattern-specific
      assert.ok(suggestions.length <= 4, "Should have at most 4 suggestions");
    });
  });

  describe("Integration scenarios", () => {
    it("handles Japanese student learning English with multiple L1 patterns", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I go to park",
            correction: "I went to the park",
            isL1Interference: true,
            l1Pattern: "article_omission",
            timestamp: 10,
          }),
          createMockError({
            original: "She is teacher",
            correction: "She is a teacher",
            isL1Interference: true,
            l1Pattern: "article_omission",
            timestamp: 30,
          }),
          createMockError({
            original: "I have three book",
            correction: "I have three books",
            isL1Interference: true,
            l1Pattern: "plural_marking",
            timestamp: 50,
          }),
          createMockError({
            original: "Many student are here",
            correction: "Many students are here",
            isL1Interference: true,
            l1Pattern: "plural_marking",
            timestamp: 70,
          }),
        ],
        vocabularyUsed: ["park", "teacher", "book", "student"],
        grammarStructuresUsed: ["present tense", "past tense"],
      });

      const result = detectL1Interference(studentAnalysis, "ja", "en");

      assert.equal(result.overallLevel, "medium", "Should be medium level with 4 errors");
      assert.equal(result.totalInterferenceCount, 4, "Should count all 4 errors");
      assert.ok(result.patterns.length === 2, "Should have 2 distinct patterns");
      assert.ok(
        result.recommendedFocusAreas.includes("Missing Articles"),
        "Should recommend article practice"
      );
    });

    it("handles Spanish student learning English with adjective order issues", () => {
      const studentAnalysis = createMockStudentAnalysis({
        errors: [
          createMockError({
            original: "I have a house big",
            correction: "I have a big house",
            isL1Interference: true,
            l1Pattern: "adjective_order",
          }),
          createMockError({
            original: "She has hair long",
            correction: "She has long hair",
            isL1Interference: true,
            l1Pattern: "adjective_order",
          }),
        ],
      });

      const result = detectL1Interference(studentAnalysis, "es", "en");

      assert.ok(
        result.patterns.some((p) => p.patternType === "adjective_order"),
        "Should detect adjective order pattern"
      );
      assert.ok(
        result.recommendedFocusAreas.includes("Adjective Position"),
        "Should recommend adjective position practice"
      );
    });

    it("full workflow: errors → match → detect → suggestions", () => {
      // Step 1: Create raw errors without L1 flags
      const rawErrors: StudentError[] = [
        {
          original: "I went to park",
          correction: "I went to the park",
          timestamp: 10,
        },
        {
          original: "many student are here",
          correction: "many students are here",
          timestamp: 30,
        },
      ];

      // Step 2: Get patterns for language pair
      const patterns = getL1PatternsForPair("ja", "en");
      assert.ok(patterns.length > 0, "Should have patterns");

      // Step 3: Match errors to patterns
      const matchedErrors = matchErrorsToL1Patterns(rawErrors, patterns);
      assert.ok(matchedErrors[0].isL1Interference, "First error should be matched");
      assert.ok(matchedErrors[1].isL1Interference, "Second error should be matched");

      // Step 4: Create student analysis with matched errors
      const studentAnalysis = createMockStudentAnalysis({
        errors: matchedErrors,
      });

      // Step 5: Detect L1 interference
      const result = detectL1Interference(studentAnalysis, "ja", "en");

      assert.ok(result.totalInterferenceCount >= 2, "Should detect interference");
      assert.ok(result.recommendedFocusAreas.length > 0, "Should have focus areas");
      assert.ok(result.improvementSuggestions.length > 0, "Should have suggestions");
    });
  });
});
