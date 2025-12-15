/**
 * Adaptive Drill Orchestrator
 *
 * Coordinates all drill generators to produce a balanced set of homework
 * exercises based on lesson analysis, student profile, and learning objectives.
 */

import type { TutorAnalysis, InferredObjective } from "@/lib/analysis/tutor-speech-analyzer";
import type { StudentAnalysis } from "@/lib/analysis/student-speech-analyzer";
import type { L1InterferenceAnalysis, L1InterferenceResult } from "@/lib/analysis/l1-interference";
import type { InteractionMetrics } from "@/lib/analysis/interaction-analyzer";
import { generatePronunciationDrills, type PronunciationDrill } from "./pronunciation-drill";
import { generateConversationDrills, type ConversationDrill } from "./conversation-drill";
import { generateWritingDrills, type WritingDrill } from "./writing-drill";

// =============================================================================
// TYPES
// =============================================================================

export type DrillType =
  | "pronunciation"
  | "conversation_simulation"
  | "contextual_writing"
  | "match"
  | "gap_fill"
  | "scramble"
  | "vocabulary"
  | "grammar";

export type AnyDrill =
  | PronunciationDrill
  | ConversationDrill
  | WritingDrill
  | VocabularyDrill
  | GrammarDrill
  | LegacyDrill;

export interface VocabularyDrill {
  type: "vocabulary" | "match";
  id: string;
  title: string;
  description: string;
  words: VocabularyItem[];
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  estimatedDurationMinutes: number;
  gameType: "match" | "flashcard" | "fill_blank";
}

export interface VocabularyItem {
  word: string;
  translation?: string;
  definition?: string;
  exampleSentence?: string;
  partOfSpeech?: string;
  audioUrl?: string;
}

export interface GrammarDrill {
  type: "grammar" | "gap_fill" | "scramble";
  id: string;
  title: string;
  description: string;
  exercises: GrammarExercise[];
  grammarPoint: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  estimatedDurationMinutes: number;
  explanation: string;
}

export interface GrammarExercise {
  type: "gap_fill" | "scramble" | "transform" | "correct_error";
  prompt: string;
  correctAnswer: string;
  distractors?: string[];
  explanation?: string;
}

export interface LegacyDrill {
  type: "match" | "gap_fill" | "scramble";
  id: string;
  title: string;
  description: string;
  items: unknown[];
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  estimatedDurationMinutes: number;
}

export interface AdaptiveDrillPackage {
  id: string;
  lessonId: string;
  studentId: string;
  tutorId: string;
  createdAt: string;
  totalDurationMinutes: number;
  drillCount: number;
  drills: AnyDrill[];
  priorityOrder: string[];
  completionEstimate: string;
  metadata: DrillPackageMetadata;
}

export interface DrillPackageMetadata {
  lessonObjectives: string[];
  vocabularyFocus: string[];
  grammarFocus: string[];
  l1InterferenceTargeted: string[];
  studentWeaknesses: string[];
  studentStrengths: string[];
  adaptationNotes: string[];
}

export interface AdaptiveDrillInput {
  // Core analysis data
  tutorAnalysis: TutorAnalysis;
  studentAnalysis: StudentAnalysis;
  lessonObjectives: InferredObjective[];
  l1InterferenceAnalysis: L1InterferenceAnalysis;
  interactionMetrics?: InteractionMetrics;

  // Context
  lessonId: string;
  studentId: string;
  tutorId: string;
  targetLanguage: string;
  nativeLanguage?: string;
  proficiencyLevel: string;
  studentName?: string;

  // Configuration
  maxDrills?: number;
  maxDurationMinutes?: number;
  preferredDrillTypes?: DrillType[];
  excludeDrillTypes?: DrillType[];
}

export interface DrillDistribution {
  pronunciation: number;
  conversation: number;
  writing: number;
  vocabulary: number;
  grammar: number;
}

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

const DEFAULT_DRILL_DISTRIBUTION: DrillDistribution = {
  pronunciation: 1,
  conversation: 1,
  writing: 1,
  vocabulary: 2,
  grammar: 2,
};

const DEFAULT_MAX_DRILLS = 6;
const DEFAULT_MAX_DURATION = 45; // minutes

// =============================================================================
// MAIN ORCHESTRATOR FUNCTION
// =============================================================================

/**
 * Generate an adaptive drill package based on lesson analysis
 */
export async function generateAdaptiveDrills(
  input: AdaptiveDrillInput
): Promise<AdaptiveDrillPackage> {
  const {
    tutorAnalysis,
    studentAnalysis,
    lessonObjectives,
    l1InterferenceAnalysis,
    interactionMetrics,
    lessonId,
    studentId,
    tutorId,
    targetLanguage,
    nativeLanguage,
    proficiencyLevel,
    studentName,
    maxDrills = DEFAULT_MAX_DRILLS,
    maxDurationMinutes = DEFAULT_MAX_DURATION,
    preferredDrillTypes,
    excludeDrillTypes = [],
  } = input;

  // 1. Analyze student needs and determine drill distribution
  const distribution = calculateOptimalDistribution(
    studentAnalysis,
    tutorAnalysis,
    l1InterferenceAnalysis,
    interactionMetrics,
    preferredDrillTypes,
    excludeDrillTypes
  );

  // 2. Generate drills from each generator
  const allDrills: AnyDrill[] = [];

  // Pronunciation drills
  if (distribution.pronunciation > 0 && !excludeDrillTypes.includes("pronunciation")) {
    const pronunciationDrills = await generatePronunciationDrills({
      studentAnalysis,
      tutorAnalysis,
      l1Interference: l1InterferenceAnalysis.patterns,
      targetLanguage,
      nativeLanguage,
      proficiencyLevel,
    });
    allDrills.push(...pronunciationDrills.slice(0, distribution.pronunciation));
  }

  // Conversation drills
  if (distribution.conversation > 0 && !excludeDrillTypes.includes("conversation_simulation")) {
    const conversationDrills = await generateConversationDrills({
      lessonObjectives,
      tutorAnalysis,
      studentAnalysis,
      l1Interference: l1InterferenceAnalysis.patterns,
      targetLanguage,
      nativeLanguage,
      proficiencyLevel,
      studentName,
    });
    allDrills.push(...conversationDrills.slice(0, distribution.conversation));
  }

  // Writing drills
  if (distribution.writing > 0 && !excludeDrillTypes.includes("contextual_writing")) {
    const writingDrills = await generateWritingDrills({
      lessonObjectives,
      tutorAnalysis,
      studentAnalysis,
      l1Interference: l1InterferenceAnalysis.patterns,
      targetLanguage,
      proficiencyLevel,
      studentName,
    });
    allDrills.push(...writingDrills.slice(0, distribution.writing));
  }

  // Vocabulary drills
  if (distribution.vocabulary > 0 && !excludeDrillTypes.includes("vocabulary")) {
    const vocabDrills = generateVocabularyDrills(
      tutorAnalysis,
      studentAnalysis,
      targetLanguage,
      proficiencyLevel
    );
    allDrills.push(...vocabDrills.slice(0, distribution.vocabulary));
  }

  // Grammar drills
  if (distribution.grammar > 0 && !excludeDrillTypes.includes("grammar")) {
    const grammarDrills = generateGrammarDrills(
      tutorAnalysis,
      studentAnalysis,
      l1InterferenceAnalysis,
      targetLanguage,
      proficiencyLevel
    );
    allDrills.push(...grammarDrills.slice(0, distribution.grammar));
  }

  // 3. Prioritize and limit drills
  const prioritizedDrills = prioritizeDrills(
    allDrills,
    studentAnalysis,
    l1InterferenceAnalysis,
    maxDrills,
    maxDurationMinutes
  );

  // 4. Calculate total duration
  const totalDuration = prioritizedDrills.reduce(
    (sum, drill) => sum + (drill.estimatedDurationMinutes || 5),
    0
  );

  // 5. Build metadata
  const metadata = buildMetadata(
    tutorAnalysis,
    studentAnalysis,
    lessonObjectives,
    l1InterferenceAnalysis,
    prioritizedDrills
  );

  return {
    id: `package-${Date.now()}`,
    lessonId,
    studentId,
    tutorId,
    createdAt: new Date().toISOString(),
    totalDurationMinutes: totalDuration,
    drillCount: prioritizedDrills.length,
    drills: prioritizedDrills,
    priorityOrder: prioritizedDrills.map((d) => d.id),
    completionEstimate: formatDuration(totalDuration),
    metadata,
  };
}

// =============================================================================
// DISTRIBUTION CALCULATOR
// =============================================================================

/**
 * Calculate optimal drill distribution based on student needs
 */
function calculateOptimalDistribution(
  studentAnalysis: StudentAnalysis,
  tutorAnalysis: TutorAnalysis,
  l1Interference: L1InterferenceAnalysis,
  interactionMetrics?: InteractionMetrics,
  preferredTypes?: DrillType[],
  excludeTypes: DrillType[] = []
): DrillDistribution {
  const distribution = { ...DEFAULT_DRILL_DISTRIBUTION };

  // Adjust based on L1 interference level
  if (l1Interference.overallLevel === "high") {
    distribution.grammar += 1;
    distribution.writing += 1;
  }

  // Adjust based on hesitation patterns
  const hesitationCount = studentAnalysis.hesitations.length;
  if (hesitationCount > 5) {
    distribution.vocabulary += 1;
    distribution.conversation += 1;
  }

  // Adjust based on error types
  const pronunciationErrors = studentAnalysis.errors.filter(
    (e) => e.category === "pronunciation"
  ).length;
  if (pronunciationErrors > 2) {
    distribution.pronunciation += 1;
  }

  // Adjust based on interaction metrics
  if (interactionMetrics) {
    if (interactionMetrics.engagementScore < 0.5) {
      // Low engagement - more interactive drills
      distribution.conversation += 1;
    }
    if (interactionMetrics.avgStudentLatencyMs > 3000) {
      // Slow responses - more practice needed
      distribution.vocabulary += 1;
    }
  }

  // Adjust based on tutor focus
  if (tutorAnalysis.focusVocabulary.length > 10) {
    distribution.vocabulary += 1;
  }
  if (tutorAnalysis.focusGrammar.length > 3) {
    distribution.grammar += 1;
  }

  // Apply preferred types
  if (preferredTypes && preferredTypes.length > 0) {
    const typeMap: Record<DrillType, keyof DrillDistribution> = {
      pronunciation: "pronunciation",
      conversation_simulation: "conversation",
      contextual_writing: "writing",
      match: "vocabulary",
      gap_fill: "grammar",
      scramble: "grammar",
      vocabulary: "vocabulary",
      grammar: "grammar",
    };

    for (const type of preferredTypes) {
      const key = typeMap[type];
      if (key) {
        distribution[key] += 1;
      }
    }
  }

  // Remove excluded types
  for (const type of excludeTypes) {
    if (type === "pronunciation") distribution.pronunciation = 0;
    if (type === "conversation_simulation") distribution.conversation = 0;
    if (type === "contextual_writing") distribution.writing = 0;
    if (type === "vocabulary" || type === "match") distribution.vocabulary = 0;
    if (type === "grammar" || type === "gap_fill" || type === "scramble")
      distribution.grammar = 0;
  }

  return distribution;
}

// =============================================================================
// VOCABULARY DRILL GENERATOR
// =============================================================================

/**
 * Generate vocabulary drills from lesson content
 */
function generateVocabularyDrills(
  tutorAnalysis: TutorAnalysis,
  studentAnalysis: StudentAnalysis,
  targetLanguage: string,
  proficiencyLevel: string
): VocabularyDrill[] {
  const drills: VocabularyDrill[] = [];
  const vocabulary = tutorAnalysis.focusVocabulary;

  if (vocabulary.length === 0) return drills;

  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);

  // Match game drill
  if (vocabulary.length >= 4) {
    drills.push({
      type: "match",
      id: `vocab-match-${Date.now()}`,
      title: "Vocabulary Match",
      description: "Match the words from your lesson with their meanings.",
      words: vocabulary.slice(0, 8).map((word) => ({
        word,
        definition: `Definition for ${word}`, // Would be filled by AI/database
        exampleSentence: `Example sentence using ${word}`,
      })),
      difficulty,
      language: targetLanguage,
      estimatedDurationMinutes: 5,
      gameType: "match",
    });
  }

  // Flashcard drill
  if (vocabulary.length >= 3) {
    drills.push({
      type: "vocabulary",
      id: `vocab-flashcard-${Date.now()}`,
      title: "Vocabulary Flashcards",
      description: "Review key vocabulary from your lesson.",
      words: vocabulary.slice(0, 10).map((word) => ({
        word,
        definition: `Definition for ${word}`,
        exampleSentence: `Example sentence using ${word}`,
      })),
      difficulty,
      language: targetLanguage,
      estimatedDurationMinutes: 7,
      gameType: "flashcard",
    });
  }

  return drills;
}

// =============================================================================
// GRAMMAR DRILL GENERATOR
// =============================================================================

/**
 * Generate grammar drills from lesson content
 */
function generateGrammarDrills(
  tutorAnalysis: TutorAnalysis,
  studentAnalysis: StudentAnalysis,
  l1Interference: L1InterferenceAnalysis,
  targetLanguage: string,
  proficiencyLevel: string
): GrammarDrill[] {
  const drills: GrammarDrill[] = [];
  const grammarPoints = tutorAnalysis.focusGrammar;
  const difficulty = mapProficiencyToDifficulty(proficiencyLevel);

  // Create drills for each grammar point
  for (const grammarPoint of grammarPoints.slice(0, 2)) {
    // Gap fill drill
    drills.push({
      type: "gap_fill",
      id: `grammar-gap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `Grammar Practice: ${grammarPoint}`,
      description: `Fill in the blanks to practice ${grammarPoint}.`,
      exercises: generateGapFillExercises(grammarPoint, difficulty),
      grammarPoint,
      difficulty,
      language: targetLanguage,
      estimatedDurationMinutes: 5,
      explanation: `This drill focuses on ${grammarPoint}. Pay attention to the patterns.`,
    });

    // Scramble drill for word order practice
    if (grammarPoint.toLowerCase().includes("order") || grammarPoint.toLowerCase().includes("structure")) {
      drills.push({
        type: "scramble",
        id: `grammar-scramble-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `Word Order: ${grammarPoint}`,
        description: `Rearrange the words to practice ${grammarPoint}.`,
        exercises: generateScrambleExercises(grammarPoint, difficulty),
        grammarPoint,
        difficulty,
        language: targetLanguage,
        estimatedDurationMinutes: 5,
        explanation: `Practice correct word order for ${grammarPoint}.`,
      });
    }
  }

  // L1-targeted grammar drill
  if (l1Interference.patterns.length > 0) {
    const topPattern = l1Interference.patterns[0];
    drills.push({
      type: "gap_fill",
      id: `grammar-l1-${Date.now()}`,
      title: `Practice: ${topPattern.patternName}`,
      description: topPattern.explanation,
      exercises: generateL1TargetedExercises(topPattern, difficulty),
      grammarPoint: topPattern.patternType,
      difficulty,
      language: targetLanguage,
      estimatedDurationMinutes: 7,
      explanation: topPattern.explanation,
    });
  }

  return drills;
}

/**
 * Generate gap-fill exercises for a grammar point
 */
function generateGapFillExercises(
  grammarPoint: string,
  difficulty: "beginner" | "intermediate" | "advanced"
): GrammarExercise[] {
  // In production, these would be generated by AI or pulled from a database
  // For now, return placeholder exercises
  const exerciseCount = difficulty === "beginner" ? 5 : difficulty === "intermediate" ? 7 : 10;

  return Array(exerciseCount)
    .fill(null)
    .map((_, i) => ({
      type: "gap_fill" as const,
      prompt: `Exercise ${i + 1} for ${grammarPoint}: Complete the sentence...`,
      correctAnswer: "correct answer",
      distractors: ["wrong1", "wrong2", "wrong3"],
      explanation: `This tests your knowledge of ${grammarPoint}`,
    }));
}

/**
 * Generate scramble exercises for word order practice
 */
function generateScrambleExercises(
  grammarPoint: string,
  difficulty: "beginner" | "intermediate" | "advanced"
): GrammarExercise[] {
  const exerciseCount = difficulty === "beginner" ? 4 : difficulty === "intermediate" ? 6 : 8;

  return Array(exerciseCount)
    .fill(null)
    .map((_, i) => ({
      type: "scramble" as const,
      prompt: `Scrambled: word1 / word2 / word3 / word4`,
      correctAnswer: "word1 word2 word3 word4",
      explanation: `Correct order for ${grammarPoint}`,
    }));
}

/**
 * Generate exercises targeting L1 interference
 */
function generateL1TargetedExercises(
  pattern: L1InterferenceResult,
  difficulty: "beginner" | "intermediate" | "advanced"
): GrammarExercise[] {
  // Use examples from the interference pattern
  const exercises: GrammarExercise[] = pattern.examples.slice(0, 5).map((example) => ({
    type: "gap_fill" as const,
    prompt: `Choose the correct form: ${example.wrong.replace(/\w+/, "___")}`,
    correctAnswer: example.correct,
    distractors: [example.wrong],
    explanation: pattern.explanation,
  }));

  // Add more exercises if needed
  while (exercises.length < 5) {
    exercises.push({
      type: "gap_fill",
      prompt: `Practice ${pattern.patternName}: Complete correctly...`,
      correctAnswer: "correct form",
      explanation: pattern.explanation,
    });
  }

  return exercises;
}

// =============================================================================
// PRIORITIZATION
// =============================================================================

/**
 * Prioritize and limit drills based on constraints
 */
function prioritizeDrills(
  drills: AnyDrill[],
  studentAnalysis: StudentAnalysis,
  l1Interference: L1InterferenceAnalysis,
  maxDrills: number,
  maxDuration: number
): AnyDrill[] {
  // Score each drill
  const scoredDrills = drills.map((drill) => ({
    drill,
    score: calculateDrillPriority(drill, studentAnalysis, l1Interference),
  }));

  // Sort by score (highest first)
  scoredDrills.sort((a, b) => b.score - a.score);

  // Select drills within constraints
  const selected: AnyDrill[] = [];
  let totalDuration = 0;

  for (const { drill } of scoredDrills) {
    if (selected.length >= maxDrills) break;

    const drillDuration = drill.estimatedDurationMinutes || 5;
    if (totalDuration + drillDuration > maxDuration) continue;

    selected.push(drill);
    totalDuration += drillDuration;
  }

  return selected;
}

/**
 * Calculate priority score for a drill
 */
function calculateDrillPriority(
  drill: AnyDrill,
  studentAnalysis: StudentAnalysis,
  l1Interference: L1InterferenceAnalysis
): number {
  let score = 50; // Base score

  // Higher priority for drills targeting student weaknesses
  if ("targetWords" in drill || "requiredVocabulary" in drill) {
    const vocabErrors = studentAnalysis.errors.filter((e) => e.category === "vocabulary").length;
    score += vocabErrors * 5;
  }

  if ("grammarFocus" in drill) {
    const grammarErrors = studentAnalysis.errors.filter((e) => e.category === "grammar").length;
    score += grammarErrors * 5;
  }

  // Higher priority for L1 interference targeting
  if (l1Interference.overallLevel === "high") {
    if (drill.type === "grammar" || drill.type === "gap_fill" || drill.type === "contextual_writing") {
      score += 20;
    }
  }

  // Variety bonus - mix different types
  const typeBonus: Record<string, number> = {
    pronunciation: 15,
    conversation_simulation: 15,
    contextual_writing: 10,
    vocabulary: 10,
    match: 10,
    grammar: 10,
    gap_fill: 10,
    scramble: 10,
  };
  score += typeBonus[drill.type] || 0;

  // Shorter drills get slight priority (more likely to be completed)
  if (drill.estimatedDurationMinutes <= 5) {
    score += 5;
  }

  return score;
}

// =============================================================================
// METADATA BUILDER
// =============================================================================

/**
 * Build metadata for the drill package
 */
function buildMetadata(
  tutorAnalysis: TutorAnalysis,
  studentAnalysis: StudentAnalysis,
  objectives: InferredObjective[],
  l1Interference: L1InterferenceAnalysis,
  drills: AnyDrill[]
): DrillPackageMetadata {
  // Extract unique grammar and vocabulary from drills
  const allVocab = new Set<string>();
  const allGrammar = new Set<string>();

  for (const drill of drills) {
    if ("requiredVocabulary" in drill) {
      drill.requiredVocabulary?.forEach((v: string) => allVocab.add(v));
    }
    if ("targetWords" in drill) {
      drill.targetWords?.forEach((w: string) => allVocab.add(w));
    }
    if ("grammarFocus" in drill) {
      drill.grammarFocus?.forEach((g: string) => allGrammar.add(g));
    }
    if ("grammarPoint" in drill && drill.grammarPoint) {
      allGrammar.add(drill.grammarPoint);
    }
  }

  // Identify weaknesses from errors
  const weaknesses = new Set<string>();
  const errorCategories: Record<string, number> = {};

  for (const error of studentAnalysis.errors) {
    const cat = error.category || "other";
    errorCategories[cat] = (errorCategories[cat] || 0) + 1;
  }

  for (const [cat, count] of Object.entries(errorCategories)) {
    if (count >= 2) {
      weaknesses.add(cat);
    }
  }

  // Identify strengths
  const strengths = studentAnalysis.strengths.map((s) => s.type);

  // Build adaptation notes
  const notes: string[] = [];

  if (l1Interference.overallLevel !== "low") {
    notes.push(`L1 interference level: ${l1Interference.overallLevel}`);
    notes.push(`Focus patterns: ${l1Interference.recommendedFocusAreas.join(", ")}`);
  }

  if (studentAnalysis.hesitations.length > 3) {
    notes.push("Student showed multiple hesitations - added more vocabulary practice");
  }

  if (drills.some((d) => d.type === "pronunciation")) {
    notes.push("Pronunciation drills included based on lesson analysis");
  }

  return {
    lessonObjectives: objectives.map((o) => o.topic),
    vocabularyFocus: Array.from(allVocab).slice(0, 20),
    grammarFocus: Array.from(allGrammar).slice(0, 10),
    l1InterferenceTargeted: l1Interference.patterns.map((p) => p.patternName).slice(0, 5),
    studentWeaknesses: Array.from(weaknesses),
    studentStrengths: [...new Set(strengths)],
    adaptationNotes: notes,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function mapProficiencyToDifficulty(
  proficiency: string
): "beginner" | "intermediate" | "advanced" {
  const lower = proficiency.toLowerCase();
  if (lower.includes("beginner") || lower.includes("elementary")) {
    return "beginner";
  }
  if (lower.includes("advanced") || lower.includes("proficient")) {
    return "advanced";
  }
  return "intermediate";
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? "s" : ""}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  generateVocabularyDrills,
  generateGrammarDrills,
  calculateOptimalDistribution,
  prioritizeDrills,
};
