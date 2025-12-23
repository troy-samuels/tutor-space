/**
 * L1 Interference Detector
 *
 * Detects native language interference patterns in student speech
 * and provides targeted correction suggestions.
 */

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { StudentAnalysis, StudentError } from "./student-speech-analyzer";

// =============================================================================
// TYPES
// =============================================================================

export interface L1InterferencePattern {
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

export interface L1InterferenceResult {
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

export interface L1InterferenceAnalysis {
  overallLevel: "low" | "medium" | "high";
  totalInterferenceCount: number;
  patterns: L1InterferenceResult[];
  recommendedFocusAreas: string[];
  improvementSuggestions: string[];
}

// =============================================================================
// BUILT-IN DETECTION PATTERNS
// =============================================================================

/**
 * Built-in detection patterns for common L1→L2 interference
 * Used as fallback when database patterns are not available
 */
const BUILT_IN_PATTERNS: Record<string, Record<string, L1InterferencePattern[]>> = {
  // Japanese → English
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
  // Chinese → English
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
  // Spanish → English
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
// MAIN FUNCTIONS
// =============================================================================

/**
 * Get L1 interference patterns for a language pair
 */
export async function getL1PatternsForPair(
  nativeLanguage: string,
  targetLanguage: string
): Promise<L1InterferencePattern[]> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    // Return built-in patterns if no database connection
    return BUILT_IN_PATTERNS[nativeLanguage]?.[targetLanguage] || [];
  }

  try {
    const { data, error } = await supabase
      .from("l1_interference_patterns")
      .select("*")
      .eq("native_language", nativeLanguage)
      .eq("target_language", targetLanguage)
      .order("frequency_rank", { ascending: true });

    if (error) {
      console.error("[L1Interference] Database error:", error);
      return BUILT_IN_PATTERNS[nativeLanguage]?.[targetLanguage] || [];
    }

    if (!data || data.length === 0) {
      return BUILT_IN_PATTERNS[nativeLanguage]?.[targetLanguage] || [];
    }

    return data.map((row) => ({
      id: row.id,
      nativeLanguage: row.native_language,
      targetLanguage: row.target_language,
      patternType: row.pattern_type,
      patternName: row.pattern_name,
      description: row.description,
      detectionRegex: row.detection_regex,
      detectionKeywords: row.detection_keywords || [],
      exampleErrors: row.example_errors || [],
      explanationTemplate: row.explanation_template,
      drillTemplates: row.drill_templates || [],
      frequencyRank: row.frequency_rank,
      difficultyToCorrect: row.difficulty_to_correct || "medium",
    }));
  } catch (err) {
    console.error("[L1Interference] Error fetching patterns:", err);
    return BUILT_IN_PATTERNS[nativeLanguage]?.[targetLanguage] || [];
  }
}

/**
 * Detect L1 interference in student speech
 */
export async function detectL1Interference(
  studentAnalysis: StudentAnalysis,
  nativeLanguage: string,
  targetLanguage: string
): Promise<L1InterferenceAnalysis> {
  // Get patterns for this language pair
  const patterns = await getL1PatternsForPair(nativeLanguage, targetLanguage);

  if (patterns.length === 0) {
    return {
      overallLevel: "low",
      totalInterferenceCount: 0,
      patterns: [],
      recommendedFocusAreas: [],
      improvementSuggestions: [],
    };
  }

  // Count interference by pattern from student errors
  const patternCounts = new Map<string, L1InterferenceResult>();
  let totalCount = 0;

  // Check each error in student analysis for L1 interference
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

  // Also run pattern detection on vocabulary/grammar data
  // This catches patterns that weren't already flagged as L1 interference
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

  // Convert to array and sort by count
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

  // Generate recommendations
  const recommendedFocusAreas = sortedPatterns.slice(0, 3).map((p) => p.patternName);

  const improvementSuggestions = generateImprovementSuggestions(sortedPatterns, nativeLanguage, targetLanguage);

  return {
    overallLevel,
    totalInterferenceCount: totalCount,
    patterns: sortedPatterns,
    recommendedFocusAreas,
    improvementSuggestions,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

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
      } catch (e) {
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

  // General suggestion
  suggestions.push(
    `As a ${nativeLanguage} speaker learning ${targetLanguage}, pay extra attention to these patterns.`
  );

  // Pattern-specific suggestions
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
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Match L1 patterns to student errors
 */
export function matchErrorsToL1Patterns(
  errors: StudentError[],
  patterns: L1InterferencePattern[]
): StudentError[] {
  return errors.map((error) => {
    // Skip if already marked as L1 interference
    if (error.isL1Interference) return error;

    // Try to match error to known patterns
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
export function getLanguageName(code: string): string {
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
