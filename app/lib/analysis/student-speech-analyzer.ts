/**
 * Student Speech Analyzer
 *
 * Analyzes student speech from lesson recordings to extract:
 * - Grammar and vocabulary errors
 * - Hesitation patterns (potential struggle indicators)
 * - Strengths (correctly used structures)
 * - L1 interference markers
 */

import OpenAI from "openai";
import type { SpeakerSegment } from "./speaker-diarization";

// =============================================================================
// TYPES
// =============================================================================

export interface StudentError {
  type: "grammar" | "vocabulary" | "pronunciation" | "syntax" | "other";
  category?: string; // More specific category (e.g., "article_omission", "verb_tense")
  original: string;
  correction: string;
  timestamp: number;
  isL1Interference: boolean;
  l1Pattern?: string; // Reference to l1_interference_patterns.pattern_type
  confidence: number;
  explanation?: string;
}

export interface Hesitation {
  timestamp: number;
  duration: number;
  context: string; // Text around the hesitation
  possibleCause: "vocabulary_gap" | "grammar_uncertainty" | "pronunciation_difficulty" | "thinking" | "unknown";
  severity: "low" | "medium" | "high";
  beforeText?: string;
  afterText?: string;
}

export interface StudentStrength {
  type: "grammar" | "vocabulary" | "pronunciation" | "fluency" | "other";
  example: string;
  timestamp: number;
  description: string;
}

export interface StudentLanguageProfile {
  id?: string;
  studentId: string;
  targetLanguage: string;
  nativeLanguage?: string;
  dialectVariant?: string;
  formalityPreference?: "formal" | "neutral" | "informal";
  speakingPace?: "slow" | "moderate" | "fast";
  fillerWordsUsed?: string[];
  l1InterferencePatterns?: Array<{
    pattern: string;
    frequency: number;
    improving: boolean;
  }>;
  proficiencyLevel?: "beginner" | "elementary" | "intermediate" | "upper_intermediate" | "advanced" | "proficient";
  vocabularyStyle?: Record<string, unknown>;
  lessonsAnalyzed?: number;
}

export interface L1InterferencePattern {
  id?: string;
  nativeLanguage: string;
  targetLanguage: string;
  patternType: string;
  patternName: string;
  description?: string;
  detectionKeywords?: string[];
  exampleErrors?: Array<{ wrong: string; correct: string }>;
  explanationTemplate?: string;
  frequencyRank?: number;
  difficultyToCorrect?: "easy" | "medium" | "hard";
}

export interface StudentAnalysis {
  errors: StudentError[];
  hesitations: Hesitation[];
  strengths: StudentStrength[];
  vocabularyUsed: string[];
  grammarStructuresUsed: string[];
  fluencyMetrics: {
    wordsPerMinute: number;
    avgPauseDuration: number;
    fillerWordCount: number;
    fillerWords: string[];
    selfCorrectionCount: number;
  };
  l1InterferenceSummary: {
    overallLevel: "low" | "medium" | "high";
    topPatterns: Array<{ pattern: string; count: number }>;
  };
  overallAssessment: {
    confidenceLevel: number; // 0-1
    primaryStruggleAreas: string[];
    primaryStrengthAreas: string[];
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FILLER_WORDS: Record<string, string[]> = {
  en: ["um", "uh", "like", "you know", "kind of", "sort of", "basically", "actually", "right", "well"],
  es: ["eh", "este", "o sea", "pues", "bueno", "entonces", "como", "digamos"],
  fr: ["euh", "ben", "genre", "en fait", "quoi", "donc", "voilà"],
  de: ["äh", "ähm", "also", "halt", "sozusagen", "irgendwie", "na ja"],
  pt: ["é", "tipo", "né", "assim", "então", "bom", "tipo assim"],
  it: ["ehm", "cioè", "allora", "praticamente", "insomma", "tipo"],
  ja: ["えーと", "あの", "その", "なんか", "まあ"],
  ko: ["음", "어", "그", "저", "이제"],
  zh: ["那个", "嗯", "就是", "然后"],
};

// =============================================================================
// OPENAI ANALYSIS
// =============================================================================

const STUDENT_ANALYSIS_PROMPT = `You are analyzing a language learner's speech from a lesson to identify errors and learning patterns.

STUDENT'S SPEECH (with timestamps in seconds):
{student_segments}

CONTEXT:
- Student's native language (L1): {native_language}
- Target language (L2): {target_language}
- Student's proficiency level: {proficiency_level}
- Known L1→L2 interference patterns to watch for:
{l1_patterns}

Analyze the student's speech to identify:

1. ERRORS: Grammar, vocabulary, and pronunciation mistakes
   - For each error, determine if it matches a known L1 interference pattern
   - Provide the correct form and brief explanation

2. HESITATIONS: Points where student struggled (long pauses, self-corrections)
   - Estimate the cause of hesitation

3. STRENGTHS: Correctly used vocabulary, grammar structures, or fluent passages
   - Note particularly good uses of complex structures

4. VOCABULARY & GRAMMAR: Track what structures the student successfully used

Return JSON only:
{
  "errors": [
    {
      "type": "grammar|vocabulary|pronunciation|syntax|other",
      "category": "specific error category (e.g., article_omission, verb_tense)",
      "original": "what student said",
      "correction": "correct form",
      "timestamp": 123.45,
      "is_l1_interference": true/false,
      "l1_pattern": "pattern_type if L1 interference",
      "confidence": 0.0-1.0,
      "explanation": "brief explanation"
    }
  ],
  "hesitations": [
    {
      "timestamp": 123.45,
      "context": "text around hesitation",
      "possible_cause": "vocabulary_gap|grammar_uncertainty|pronunciation_difficulty|thinking|unknown",
      "severity": "low|medium|high"
    }
  ],
  "strengths": [
    {
      "type": "grammar|vocabulary|pronunciation|fluency|other",
      "example": "exact quote showing strength",
      "timestamp": 123.45,
      "description": "what was done well"
    }
  ],
  "vocabulary_used": ["word1", "word2"],
  "grammar_structures_used": ["past_tense", "conditional", etc.],
  "l1_interference_summary": {
    "overall_level": "low|medium|high",
    "top_patterns": [{"pattern": "pattern_type", "count": number}]
  },
  "primary_struggle_areas": ["area1", "area2"],
  "primary_strength_areas": ["area1", "area2"]
}`;

/**
 * Analyze student speech using OpenAI
 */
export async function analyzeStudentSpeech(
  studentSegments: SpeakerSegment[],
  languageProfile?: StudentLanguageProfile,
  l1Patterns?: L1InterferencePattern[]
): Promise<StudentAnalysis> {
  // Format segments with timestamps
  const formattedSegments = studentSegments
    .map((s) => `[${s.start.toFixed(1)}s] ${s.text}`)
    .join("\n");

  // Format L1 patterns
  const l1PatternsText = l1Patterns?.length
    ? l1Patterns
        .map((p) => `- ${p.patternType}: ${p.patternName} (${p.description || "no description"})`)
        .join("\n")
    : "No specific patterns provided";

  const prompt = STUDENT_ANALYSIS_PROMPT.replace("{student_segments}", formattedSegments)
    .replace("{native_language}", languageProfile?.nativeLanguage || "unknown")
    .replace("{target_language}", languageProfile?.targetLanguage || "unknown")
    .replace("{proficiency_level}", "intermediate")
    .replace("{l1_patterns}", l1PatternsText);

  // Calculate fluency metrics regardless of OpenAI
  const fluencyMetrics = calculateFluencyMetrics(
    studentSegments,
    languageProfile?.targetLanguage || "en"
  );

  // If no OpenAI key or short transcript, use heuristic analysis
  if (!process.env.OPENAI_API_KEY || formattedSegments.length < 50) {
    return analyzeWithHeuristics(studentSegments, languageProfile, l1Patterns, fluencyMetrics);
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a language learning analyst." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return analyzeWithHeuristics(studentSegments, languageProfile, l1Patterns, fluencyMetrics);
    }

    const parsed = JSON.parse(content);
    return transformOpenAIResponse(parsed, fluencyMetrics, studentSegments);
  } catch (error) {
    console.error("[StudentSpeechAnalyzer] OpenAI error:", error);
    return analyzeWithHeuristics(studentSegments, languageProfile, l1Patterns, fluencyMetrics);
  }
}

/**
 * Transform OpenAI response to StudentAnalysis format
 */
function transformOpenAIResponse(
  parsed: Record<string, unknown>,
  fluencyMetrics: StudentAnalysis["fluencyMetrics"],
  segments: SpeakerSegment[]
): StudentAnalysis {
  const errors: StudentError[] = Array.isArray(parsed.errors)
    ? parsed.errors.map((e: Record<string, unknown>) => ({
        type: validateErrorType(e.type),
        category: e.category ? String(e.category) : undefined,
        original: String(e.original || ""),
        correction: String(e.correction || ""),
        timestamp: Number(e.timestamp) || 0,
        isL1Interference: Boolean(e.is_l1_interference),
        l1Pattern: e.l1_pattern ? String(e.l1_pattern) : undefined,
        confidence: Number(e.confidence) || 0.7,
        explanation: e.explanation ? String(e.explanation) : undefined,
      }))
    : [];

  const hesitations: Hesitation[] = Array.isArray(parsed.hesitations)
    ? parsed.hesitations.map((h: Record<string, unknown>) => ({
        timestamp: Number(h.timestamp) || 0,
        duration: 0,
        context: String(h.context || ""),
        possibleCause: validateHesitationCause(h.possible_cause),
        severity: validateSeverity(h.severity),
      }))
    : [];

  const strengths: StudentStrength[] = Array.isArray(parsed.strengths)
    ? parsed.strengths.map((s: Record<string, unknown>) => ({
        type: validateStrengthType(s.type),
        example: String(s.example || ""),
        timestamp: Number(s.timestamp) || 0,
        description: String(s.description || ""),
      }))
    : [];

  const vocabularyUsed = Array.isArray(parsed.vocabulary_used)
    ? parsed.vocabulary_used.map(String)
    : extractVocabulary(segments);

  const grammarStructuresUsed = Array.isArray(parsed.grammar_structures_used)
    ? parsed.grammar_structures_used.map(String)
    : [];

  const l1Summary = parsed.l1_interference_summary as Record<string, unknown> | undefined;
  const l1InterferenceSummary = {
    overallLevel: validateL1Level(l1Summary?.overall_level) || "low",
    topPatterns: Array.isArray(l1Summary?.top_patterns)
      ? l1Summary.top_patterns.map((p: Record<string, unknown>) => ({
          pattern: String(p.pattern || ""),
          count: Number(p.count) || 0,
        }))
      : [],
  };

  const primaryStruggleAreas = Array.isArray(parsed.primary_struggle_areas)
    ? parsed.primary_struggle_areas.map(String)
    : errors.slice(0, 3).map((e) => e.type);

  const primaryStrengthAreas = Array.isArray(parsed.primary_strength_areas)
    ? parsed.primary_strength_areas.map(String)
    : strengths.slice(0, 3).map((s) => s.type);

  return {
    errors,
    hesitations,
    strengths,
    vocabularyUsed,
    grammarStructuresUsed,
    fluencyMetrics,
    l1InterferenceSummary,
    overallAssessment: {
      confidenceLevel: errors.length > 0 ? errors.reduce((sum, e) => sum + e.confidence, 0) / errors.length : 0.7,
      primaryStruggleAreas,
      primaryStrengthAreas,
    },
  };
}

// =============================================================================
// HEURISTIC ANALYSIS
// =============================================================================

/**
 * Analyze student speech using pattern matching (fallback)
 */
function analyzeWithHeuristics(
  segments: SpeakerSegment[],
  languageProfile?: StudentLanguageProfile,
  l1Patterns?: L1InterferencePattern[],
  fluencyMetrics?: StudentAnalysis["fluencyMetrics"]
): StudentAnalysis {
  const errors: StudentError[] = [];
  const hesitations: Hesitation[] = [];
  const strengths: StudentStrength[] = [];

  // Detect hesitations from speech patterns
  for (const segment of segments) {
    // Check for self-corrections ("I mean", "no wait", "sorry,")
    const selfCorrectionPatterns = [
      /\b(I mean|no wait|sorry|I meant|actually)\b/gi,
      /\b(\w+)\s+(\1)\b/gi, // Word repetition
    ];

    for (const pattern of selfCorrectionPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(segment.text)) !== null) {
        hesitations.push({
          timestamp: segment.start,
          duration: 0,
          context: segment.text.substring(Math.max(0, match.index - 20), match.index + 50),
          possibleCause: "grammar_uncertainty",
          severity: "medium",
        });
      }
    }

    // Detect long sentences as potential strengths
    if (segment.text.split(" ").length > 15 && !segment.text.includes("...")) {
      strengths.push({
        type: "fluency",
        example: segment.text.substring(0, 100),
        timestamp: segment.start,
        description: "Extended fluent speech",
      });
    }
  }

  // Check for L1 interference patterns
  if (l1Patterns && l1Patterns.length > 0) {
    for (const segment of segments) {
      for (const pattern of l1Patterns) {
        if (pattern.detectionKeywords) {
          for (const keyword of pattern.detectionKeywords) {
            if (segment.text.toLowerCase().includes(keyword.toLowerCase())) {
              errors.push({
                type: "grammar",
                category: pattern.patternType,
                original: segment.text.substring(0, 50),
                correction: "",
                timestamp: segment.start,
                isL1Interference: true,
                l1Pattern: pattern.patternType,
                confidence: 0.5,
                explanation: pattern.explanationTemplate,
              });
            }
          }
        }
      }
    }
  }

  const calculatedFluency =
    fluencyMetrics || calculateFluencyMetrics(segments, languageProfile?.targetLanguage || "en");

  return {
    errors,
    hesitations,
    strengths,
    vocabularyUsed: extractVocabulary(segments),
    grammarStructuresUsed: [],
    fluencyMetrics: calculatedFluency,
    l1InterferenceSummary: {
      overallLevel: errors.filter((e) => e.isL1Interference).length > 3 ? "high" : errors.filter((e) => e.isL1Interference).length > 1 ? "medium" : "low",
      topPatterns: [],
    },
    overallAssessment: {
      confidenceLevel: 0.5,
      primaryStruggleAreas: [],
      primaryStrengthAreas: strengths.length > 0 ? ["fluency"] : [],
    },
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateFluencyMetrics(
  segments: SpeakerSegment[],
  language: string
): StudentAnalysis["fluencyMetrics"] {
  const fillerList = FILLER_WORDS[language] || FILLER_WORDS["en"];
  let totalWords = 0;
  let totalDuration = 0;
  let fillerCount = 0;
  const fillerWordsFound: string[] = [];
  let selfCorrectionCount = 0;
  const pauseDurations: number[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const words = segment.text.split(/\s+/).filter(Boolean);
    totalWords += words.length;
    totalDuration += segment.end - segment.start;

    // Count filler words
    for (const word of words) {
      const wordLower = word.toLowerCase().replace(/[.,!?]/g, "");
      if (fillerList.some((f) => f.toLowerCase() === wordLower)) {
        fillerCount++;
        if (!fillerWordsFound.includes(wordLower)) {
          fillerWordsFound.push(wordLower);
        }
      }
    }

    // Count self-corrections
    if (/\b(I mean|no wait|sorry|I meant)\b/i.test(segment.text)) {
      selfCorrectionCount++;
    }

    // Calculate pause between segments
    if (i > 0) {
      const pause = segment.start - segments[i - 1].end;
      if (pause > 0.3 && pause < 10) {
        pauseDurations.push(pause);
      }
    }
  }

  const durationMinutes = totalDuration / 60 || 1;
  const avgPause =
    pauseDurations.length > 0
      ? pauseDurations.reduce((a, b) => a + b, 0) / pauseDurations.length
      : 0;

  return {
    wordsPerMinute: Math.round(totalWords / durationMinutes),
    avgPauseDuration: Math.round(avgPause * 100) / 100,
    fillerWordCount: fillerCount,
    fillerWords: fillerWordsFound,
    selfCorrectionCount,
  };
}

function extractVocabulary(segments: SpeakerSegment[]): string[] {
  const vocabulary = new Set<string>();
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "must", "and", "or", "but", "if", "then", "so", "because",
    "this", "that", "these", "those", "it", "its", "i", "you", "he", "she",
    "we", "they", "me", "him", "her", "us", "them", "my", "your", "his",
    "to", "of", "in", "on", "at", "for", "with", "about", "from", "by",
  ]);

  for (const segment of segments) {
    const words = segment.text
      .toLowerCase()
      .replace(/[.,!?;:"']/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    for (const word of words) {
      vocabulary.add(word);
    }
  }

  return Array.from(vocabulary).slice(0, 50);
}

function validateErrorType(
  type: unknown
): "grammar" | "vocabulary" | "pronunciation" | "syntax" | "other" {
  const validTypes = ["grammar", "vocabulary", "pronunciation", "syntax", "other"];
  return validTypes.includes(String(type))
    ? (type as "grammar" | "vocabulary" | "pronunciation" | "syntax" | "other")
    : "other";
}

function validateHesitationCause(
  cause: unknown
): "vocabulary_gap" | "grammar_uncertainty" | "pronunciation_difficulty" | "thinking" | "unknown" {
  const validCauses = [
    "vocabulary_gap",
    "grammar_uncertainty",
    "pronunciation_difficulty",
    "thinking",
    "unknown",
  ];
  return validCauses.includes(String(cause))
    ? (cause as
        | "vocabulary_gap"
        | "grammar_uncertainty"
        | "pronunciation_difficulty"
        | "thinking"
        | "unknown")
    : "unknown";
}

function validateSeverity(severity: unknown): "low" | "medium" | "high" {
  const validSeverities = ["low", "medium", "high"];
  return validSeverities.includes(String(severity))
    ? (severity as "low" | "medium" | "high")
    : "medium";
}

function validateStrengthType(
  type: unknown
): "grammar" | "vocabulary" | "pronunciation" | "fluency" | "other" {
  const validTypes = ["grammar", "vocabulary", "pronunciation", "fluency", "other"];
  return validTypes.includes(String(type))
    ? (type as "grammar" | "vocabulary" | "pronunciation" | "fluency" | "other")
    : "other";
}

function validateL1Level(level: unknown): "low" | "medium" | "high" {
  const validLevels = ["low", "medium", "high"];
  return validLevels.includes(String(level)) ? (level as "low" | "medium" | "high") : "low";
}

/**
 * Update a student language profile based on analysis results
 */
export function updateLanguageProfile(
  currentProfile: StudentLanguageProfile,
  analysis: StudentAnalysis
): Partial<StudentLanguageProfile> {
  const updates: Partial<StudentLanguageProfile> = {};

  // Update filler words
  if (analysis.fluencyMetrics.fillerWords.length > 0) {
    const existingFillers = currentProfile.fillerWordsUsed || [];
    const allFillers = [...new Set([...existingFillers, ...analysis.fluencyMetrics.fillerWords])];
    updates.fillerWordsUsed = allFillers.slice(0, 10);
  }

  // Update speaking pace
  const wpm = analysis.fluencyMetrics.wordsPerMinute;
  if (wpm < 100) {
    updates.speakingPace = "slow";
  } else if (wpm > 150) {
    updates.speakingPace = "fast";
  } else {
    updates.speakingPace = "moderate";
  }

  // Update L1 interference patterns
  if (analysis.l1InterferenceSummary.topPatterns.length > 0) {
    const existingPatterns = currentProfile.l1InterferencePatterns || [];

    for (const newPattern of analysis.l1InterferenceSummary.topPatterns) {
      const existing = existingPatterns.find((p) => p.pattern === newPattern.pattern);
      if (existing) {
        const oldFrequency = existing.frequency;
        existing.frequency += newPattern.count;
        existing.improving = existing.frequency < oldFrequency * 1.5; // Improving if not increasing much
      } else {
        existingPatterns.push({
          pattern: newPattern.pattern,
          frequency: newPattern.count,
          improving: false,
        });
      }
    }

    updates.l1InterferencePatterns = existingPatterns;
  }

  return updates;
}
