/**
 * Enhanced Lesson Analysis Processor
 *
 * Integrates speaker diarization, tutor/student analysis, L1 interference detection,
 * and adaptive drill generation into a unified processing pipeline.
 */

import { parseDiarization, identifyTutorSpeaker, separateSpeakers, extractTextFromSegments } from "./speaker-diarization";
import { analyzeTutorSpeech, mergeObjectives, type TutorAnalysis, type InferredObjective } from "./tutor-speech-analyzer";
import { analyzeStudentSpeech, type StudentAnalysis, type StudentLanguageProfile } from "./student-speech-analyzer";
import { detectL1Interference, getL1PatternsForPair, matchErrorsToL1Patterns, type L1InterferenceAnalysis } from "./l1-interference";
import { analyzeInteraction, type InteractionMetrics } from "./interaction-analyzer";
import { generateAdaptiveDrills, type AdaptiveDrillPackage, type AnyDrill } from "@/lib/drills/adaptive-generator";
import { createSRItemsFromDrill } from "@/lib/spaced-repetition/scheduler";
import { createServiceRoleClient } from "@/lib/supabase/admin";

// =============================================================================
// TYPES
// =============================================================================

export interface EnhancedAnalysisInput {
  recordingId: string;
  transcriptJson: unknown;
  tutorId: string;
  studentId: string;
  bookingId?: string;
  tutorName?: string;
}

export interface EnhancedAnalysisResult {
  // Diarization
  speakerSegments: unknown[];
  tutorSpeakerId: number;
  studentSpeakerId: number;

  // Analysis
  tutorAnalysis: TutorAnalysis;
  studentAnalysis: StudentAnalysis;
  interactionMetrics: InteractionMetrics;
  l1InterferenceAnalysis: L1InterferenceAnalysis;

  // Objectives
  lessonObjectives: InferredObjective[];

  // Generated Content
  drillPackage: AdaptiveDrillPackage;

  // Summaries
  summaryMd: string;
  keyPoints: string[];
  engagementScore: number;

  // Legacy format compatibility
  legacyDrills: LegacyDrill[];
}

export interface LegacyDrill {
  content: Record<string, unknown>;
  focus_area?: string;
  source_timestamp_seconds?: number;
  drill_type?: string;
}

// =============================================================================
// MAIN PROCESSOR
// =============================================================================

/**
 * Process a lesson recording with the enhanced analysis pipeline
 */
export async function processEnhancedAnalysis(
  input: EnhancedAnalysisInput
): Promise<EnhancedAnalysisResult> {
  const { recordingId, transcriptJson, tutorId, studentId, bookingId, tutorName } = input;

  const supabase = createServiceRoleClient();

  // -------------------------------------------------------------------------
  // Step 1: Parse speaker diarization
  // -------------------------------------------------------------------------
  const segments = parseDiarization(transcriptJson);
  const tutorSpeakerId = identifyTutorSpeaker(segments, tutorName);
  const { tutorSegments, studentSegments, studentSpeakerId } = separateSpeakers(segments, tutorSpeakerId);

  const tutorText = extractTextFromSegments(tutorSegments);
  const studentText = extractTextFromSegments(studentSegments);

  // -------------------------------------------------------------------------
  // Step 2: Load student language profile
  // -------------------------------------------------------------------------
  let languageProfile = await getOrCreateLanguageProfile(studentId);
  const targetLanguage = languageProfile.targetLanguage || "en";
  const nativeLanguage = languageProfile.nativeLanguage;

  // -------------------------------------------------------------------------
  // Step 3: Load L1 interference patterns
  // -------------------------------------------------------------------------
  let l1Patterns: Awaited<ReturnType<typeof getL1PatternsForPair>> = [];
  if (nativeLanguage) {
    l1Patterns = await getL1PatternsForPair(nativeLanguage, targetLanguage);
  }

  // -------------------------------------------------------------------------
  // Step 4: Parallel analysis
  // -------------------------------------------------------------------------
  const [tutorAnalysis, rawStudentAnalysis, interactionMetrics] = await Promise.all([
    analyzeTutorSpeech(tutorSegments),
    analyzeStudentSpeech(studentSegments, languageProfile),
    Promise.resolve(analyzeInteraction(segments, tutorSpeakerId)),
  ]);

  // -------------------------------------------------------------------------
  // Step 5: L1 interference detection
  // -------------------------------------------------------------------------
  // First, match errors to L1 patterns
  const matchedErrors = matchErrorsToL1Patterns(rawStudentAnalysis.errors, l1Patterns);
  const studentAnalysis: StudentAnalysis = {
    ...rawStudentAnalysis,
    errors: matchedErrors,
  };

  // Then detect overall L1 interference
  let l1InterferenceAnalysis: L1InterferenceAnalysis = {
    overallLevel: "low",
    totalInterferenceCount: 0,
    patterns: [],
    recommendedFocusAreas: [],
    improvementSuggestions: [],
  };

  if (nativeLanguage) {
    l1InterferenceAnalysis = await detectL1Interference(
      studentAnalysis,
      nativeLanguage,
      targetLanguage
    );
  }

  // -------------------------------------------------------------------------
  // Step 6: Merge lesson objectives
  // -------------------------------------------------------------------------
  const preDefinedObjectives = await getPreDefinedObjectives(bookingId);
  const lessonObjectives = mergeObjectives(preDefinedObjectives, tutorAnalysis.inferredObjectives);

  // -------------------------------------------------------------------------
  // Step 7: Update student language profile
  // -------------------------------------------------------------------------
  languageProfile = await updateLanguageProfileFromAnalysis(
    studentId,
    targetLanguage,
    studentAnalysis,
    l1InterferenceAnalysis
  );

  // -------------------------------------------------------------------------
  // Step 8: Generate adaptive drills
  // -------------------------------------------------------------------------
  const drillPackage = await generateAdaptiveDrills({
    tutorAnalysis,
    studentAnalysis,
    lessonObjectives,
    l1InterferenceAnalysis,
    interactionMetrics,
    lessonId: recordingId,
    studentId,
    tutorId,
    targetLanguage,
    nativeLanguage,
    proficiencyLevel: languageProfile.proficiencyLevel || "intermediate",
  });

  // -------------------------------------------------------------------------
  // Step 9: Create spaced repetition items
  // -------------------------------------------------------------------------
  await createSRItemsFromDrillPackage(studentId, tutorId, drillPackage, recordingId);

  // -------------------------------------------------------------------------
  // Step 10: Save enhanced analysis to database
  // -------------------------------------------------------------------------
  if (supabase) {
    await supabase
      .from("lesson_recordings")
      .update({
        speaker_segments: segments,
        tutor_speaker_id: tutorSpeakerId,
        student_speaker_id: studentSpeakerId,
        tutor_speech_analysis: tutorAnalysis,
        student_speech_analysis: studentAnalysis,
        interaction_metrics: interactionMetrics,
        l1_interference_detected: l1InterferenceAnalysis.patterns,
        engagement_score: interactionMetrics.engagementScore,
        confusion_indicators: interactionMetrics.confusionIndicators,
      })
      .eq("id", recordingId);
  }

  // -------------------------------------------------------------------------
  // Step 11: Build summaries
  // -------------------------------------------------------------------------
  const summaryMd = buildEnhancedSummary(
    tutorAnalysis,
    studentAnalysis,
    interactionMetrics,
    l1InterferenceAnalysis,
    lessonObjectives
  );

  const keyPoints = buildKeyPoints(
    tutorAnalysis,
    studentAnalysis,
    interactionMetrics,
    lessonObjectives
  );

  // -------------------------------------------------------------------------
  // Step 12: Convert to legacy drill format
  // -------------------------------------------------------------------------
  const legacyDrills = convertToLegacyFormat(drillPackage.drills);

  return {
    speakerSegments: segments,
    tutorSpeakerId,
    studentSpeakerId,
    tutorAnalysis,
    studentAnalysis,
    interactionMetrics,
    l1InterferenceAnalysis,
    lessonObjectives,
    drillPackage,
    summaryMd,
    keyPoints,
    engagementScore: interactionMetrics.engagementScore,
    legacyDrills,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get or create student language profile
 */
async function getOrCreateLanguageProfile(studentId: string): Promise<StudentLanguageProfile> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return createDefaultProfile(studentId);
  }

  // Try to get existing profile
  const { data, error } = await supabase
    .from("student_language_profiles")
    .select("*")
    .eq("student_id", studentId)
    .order("lessons_analyzed", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // Create new profile
    return createDefaultProfile(studentId);
  }

  return {
    studentId: data.student_id,
    targetLanguage: data.target_language,
    nativeLanguage: data.native_language,
    dialectVariant: data.dialect_variant,
    formalityPreference: data.formality_preference,
    vocabularyStyle: data.vocabulary_style,
    l1InterferencePatterns: data.l1_interference_patterns,
    speakingPace: data.speaking_pace,
    fillerWordsUsed: data.filler_words_used,
    lessonsAnalyzed: data.lessons_analyzed,
    proficiencyLevel: "intermediate", // Get from student record if available
  };
}

function createDefaultProfile(studentId: string): StudentLanguageProfile {
  return {
    studentId,
    targetLanguage: "en",
    nativeLanguage: undefined,
    dialectVariant: undefined,
    formalityPreference: "neutral",
    vocabularyStyle: {},
    l1InterferencePatterns: [],
    speakingPace: "moderate",
    fillerWordsUsed: [],
    lessonsAnalyzed: 0,
    proficiencyLevel: "intermediate",
  };
}

/**
 * Get pre-defined objectives from booking/lesson_objectives table
 */
async function getPreDefinedObjectives(bookingId?: string): Promise<InferredObjective[]> {
  if (!bookingId) return [];

  const supabase = createServiceRoleClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("lesson_objectives")
    .select("tutor_objectives, tutor_focus_vocabulary, tutor_focus_grammar")
    .eq("booking_id", bookingId)
    .single();

  if (!data || !data.tutor_objectives) return [];

  // Convert to InferredObjective format
  const objectives = data.tutor_objectives as Array<{
    type: string;
    topic: string;
    description?: string;
  }>;

  return objectives.map((obj, index) => ({
    type: obj.type as "grammar" | "vocabulary" | "pronunciation" | "conversation" | "cultural",
    topic: obj.topic,
    description: obj.description || "",
    confidence: 1.0, // Pre-defined by tutor
    evidence: "Pre-defined by tutor",
    coverageStatus: "introduced" as const,
    studentMasteryEstimate: 0,
    order: index,
  }));
}

/**
 * Update student language profile based on analysis
 */
async function updateLanguageProfileFromAnalysis(
  studentId: string,
  targetLanguage: string,
  studentAnalysis: StudentAnalysis,
  l1Interference: L1InterferenceAnalysis
): Promise<StudentLanguageProfile> {
  const supabase = createServiceRoleClient();

  if (!supabase) {
    return createDefaultProfile(studentId);
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    lessons_analyzed: 1, // Will be incremented
    last_updated_at: new Date().toISOString(),
    speaking_pace: studentAnalysis.fluencyMetrics?.speakingPace || "moderate",
    filler_words_used: studentAnalysis.fluencyMetrics?.fillerWords?.map((f) => f.word) || [],
  };

  // Update L1 interference patterns
  if (l1Interference.patterns.length > 0) {
    updateData.l1_interference_patterns = l1Interference.patterns.map((p) => ({
      pattern: p.pattern,
      frequency: p.count,
      lastSeen: new Date().toISOString(),
    }));
  }

  // Upsert the profile
  const { data, error } = await supabase
    .from("student_language_profiles")
    .upsert({
      student_id: studentId,
      target_language: targetLanguage,
      ...updateData,
    }, {
      onConflict: "student_id,target_language",
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[EnhancedProcessor] Error updating language profile:", error);
    return createDefaultProfile(studentId);
  }

  return {
    studentId: data.student_id,
    targetLanguage: data.target_language,
    nativeLanguage: data.native_language,
    dialectVariant: data.dialect_variant,
    formalityPreference: data.formality_preference || "neutral",
    vocabularyStyle: data.vocabulary_style || {},
    l1InterferencePatterns: data.l1_interference_patterns || [],
    speakingPace: data.speaking_pace || "moderate",
    fillerWordsUsed: data.filler_words_used || [],
    lessonsAnalyzed: data.lessons_analyzed || 1,
    proficiencyLevel: "intermediate",
  };
}

/**
 * Create spaced repetition items from drill package
 */
async function createSRItemsFromDrillPackage(
  studentId: string,
  tutorId: string,
  drillPackage: AdaptiveDrillPackage,
  recordingId: string
): Promise<void> {
  for (const drill of drillPackage.drills) {
    // Extract items from drill content for SR tracking
    const srItems: Array<{ type: string; content: Record<string, unknown>; key: string }> = [];

    if ("requiredVocabulary" in drill && drill.requiredVocabulary) {
      for (const word of drill.requiredVocabulary) {
        srItems.push({
          type: "vocabulary",
          content: { word, drillId: drill.id },
          key: `vocab-${word}-${studentId}`,
        });
      }
    }

    if ("grammarFocus" in drill && drill.grammarFocus) {
      for (const grammar of drill.grammarFocus) {
        srItems.push({
          type: "grammar",
          content: { structure: grammar, drillId: drill.id },
          key: `grammar-${grammar}-${studentId}`,
        });
      }
    }

    if ("targetWords" in drill && drill.targetWords) {
      for (const word of drill.targetWords) {
        srItems.push({
          type: "pronunciation",
          content: { word, drillId: drill.id },
          key: `pron-${word}-${studentId}`,
        });
      }
    }

    if (srItems.length > 0) {
      try {
        await createSRItemsFromDrill(studentId, tutorId, drill.id, srItems, recordingId);
      } catch (error) {
        console.error("[EnhancedProcessor] Error creating SR items:", error);
      }
    }
  }
}

/**
 * Build enhanced markdown summary
 */
function buildEnhancedSummary(
  tutorAnalysis: TutorAnalysis,
  studentAnalysis: StudentAnalysis,
  interactionMetrics: InteractionMetrics,
  l1Interference: L1InterferenceAnalysis,
  objectives: InferredObjective[]
): string {
  const sections: string[] = [];

  // Header
  sections.push("# Lesson Analysis Report\n");

  // Engagement Overview
  sections.push("## Engagement Overview");
  sections.push(`- **Engagement Score**: ${Math.round(interactionMetrics.engagementScore * 100)}%`);
  sections.push(`- **Speaking Ratio**: Student spoke ${Math.round(interactionMetrics.speakingRatio * 100)}% of the time`);
  sections.push(`- **Turn Count**: ${interactionMetrics.turnCount} conversation turns`);
  sections.push(`- **Average Response Time**: ${Math.round(interactionMetrics.avgStudentLatencyMs)}ms\n`);

  // Learning Objectives
  if (objectives.length > 0) {
    sections.push("## Learning Objectives");
    for (const obj of objectives) {
      const masteryPct = Math.round((obj.studentMasteryEstimate || 0) * 100);
      sections.push(`- **${obj.topic}** (${obj.type}): ${obj.coverageStatus} | Mastery: ${masteryPct}%`);
    }
    sections.push("");
  }

  // Tutor Focus Areas
  if (tutorAnalysis.focusVocabulary.length > 0 || tutorAnalysis.focusGrammar.length > 0) {
    sections.push("## Lesson Focus Areas");
    if (tutorAnalysis.focusVocabulary.length > 0) {
      sections.push(`- **Vocabulary**: ${tutorAnalysis.focusVocabulary.slice(0, 10).join(", ")}`);
    }
    if (tutorAnalysis.focusGrammar.length > 0) {
      sections.push(`- **Grammar**: ${tutorAnalysis.focusGrammar.join(", ")}`);
    }
    sections.push("");
  }

  // Student Performance
  sections.push("## Student Performance");
  if (studentAnalysis.strengths.length > 0) {
    sections.push("### Strengths");
    for (const strength of studentAnalysis.strengths.slice(0, 5)) {
      sections.push(`- ${strength.type}: "${strength.example}"`);
    }
  }

  if (studentAnalysis.errors.length > 0) {
    sections.push("### Areas for Improvement");
    for (const error of studentAnalysis.errors.slice(0, 5)) {
      const l1Note = error.isL1Interference ? " (L1 interference)" : "";
      sections.push(`- ${error.category || error.type}: "${error.original}" → "${error.correction}"${l1Note}`);
    }
  }
  sections.push("");

  // L1 Interference
  if (l1Interference.overallLevel !== "low") {
    sections.push("## L1 Interference Patterns");
    sections.push(`- **Overall Level**: ${l1Interference.overallLevel}`);
    if (l1Interference.recommendedFocusAreas.length > 0) {
      sections.push(`- **Focus Areas**: ${l1Interference.recommendedFocusAreas.join(", ")}`);
    }
    for (const suggestion of l1Interference.improvementSuggestions.slice(0, 3)) {
      sections.push(`- ${suggestion}`);
    }
    sections.push("");
  }

  // Confusion Points
  if (interactionMetrics.confusionIndicators.length > 0) {
    sections.push("## Points of Confusion");
    for (const indicator of interactionMetrics.confusionIndicators.slice(0, 5)) {
      const time = formatTimestamp(indicator.timestamp);
      sections.push(`- [${time}] ${indicator.type}: ${indicator.context}`);
    }
    sections.push("");
  }

  // Learning Moments
  if (interactionMetrics.learningMoments.length > 0) {
    sections.push("## Key Learning Moments");
    for (const moment of interactionMetrics.learningMoments.slice(0, 5)) {
      const time = formatTimestamp(moment.timestamp);
      sections.push(`- [${time}] **${moment.type}**: ${moment.topic}`);
    }
  }

  return sections.join("\n");
}

/**
 * Build key points array
 */
function buildKeyPoints(
  tutorAnalysis: TutorAnalysis,
  studentAnalysis: StudentAnalysis,
  interactionMetrics: InteractionMetrics,
  objectives: InferredObjective[]
): string[] {
  const points: string[] = [];

  // Objective coverage
  const coveredObjectives = objectives.filter((o) => o.coverageStatus !== "introduced");
  if (coveredObjectives.length > 0) {
    points.push(`Covered ${coveredObjectives.length} learning objectives`);
  }

  // Vocabulary
  if (tutorAnalysis.focusVocabulary.length > 0) {
    points.push(`Practiced ${tutorAnalysis.focusVocabulary.length} vocabulary items`);
  }

  // Grammar
  if (tutorAnalysis.focusGrammar.length > 0) {
    points.push(`Grammar focus: ${tutorAnalysis.focusGrammar.slice(0, 3).join(", ")}`);
  }

  // Student strengths
  if (studentAnalysis.strengths.length > 0) {
    points.push(`Student showed strength in ${studentAnalysis.strengths[0].type}`);
  }

  // Areas for improvement
  if (studentAnalysis.errors.length > 0) {
    const errorTypes = [...new Set(studentAnalysis.errors.map((e) => e.category || e.type))];
    points.push(`Areas to practice: ${errorTypes.slice(0, 3).join(", ")}`);
  }

  // Engagement
  if (interactionMetrics.engagementScore >= 0.7) {
    points.push("High student engagement throughout");
  } else if (interactionMetrics.engagementScore < 0.4) {
    points.push("Consider strategies to increase student engagement");
  }

  // Speaking time
  if (interactionMetrics.speakingRatio < 0.3) {
    points.push("Student had limited speaking time - encourage more participation");
  } else if (interactionMetrics.speakingRatio > 0.5) {
    points.push("Good balance of student speaking time");
  }

  return points;
}

/**
 * Convert to legacy drill format
 */
function convertToLegacyFormat(drills: AnyDrill[]): LegacyDrill[] {
  return drills.map((drill) => ({
    content: {
      ...drill,
    },
    focus_area: getFocusArea(drill),
    drill_type: drill.type,
  }));
}

function getFocusArea(drill: AnyDrill): string {
  if ("grammarFocus" in drill && drill.grammarFocus && drill.grammarFocus.length > 0) {
    return `grammar: ${drill.grammarFocus[0]}`;
  }
  if ("targetVocabulary" in drill || "requiredVocabulary" in drill) {
    return "vocabulary";
  }
  if ("targetPhonemes" in drill) {
    return "pronunciation";
  }
  if (drill.type === "conversation_simulation") {
    return "conversation";
  }
  if (drill.type === "contextual_writing") {
    return "writing";
  }
  return drill.type;
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
