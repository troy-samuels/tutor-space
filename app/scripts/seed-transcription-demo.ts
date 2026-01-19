/**
 * Seed script to demonstrate the complete flow from lesson transcription
 * to AI Practice and Homework generation.
 *
 * Run with: npx tsx scripts/seed-transcription-demo.ts
 *
 * This script:
 * 1. Looks up Troy Samuel (tutor) and Roy Samuels (student)
 * 2. Creates a completed booking
 * 3. Creates a lesson_recording with sample transcript JSON
 * 4. Runs (simulates) the analysis pipeline
 * 5. Creates drills, practice scenarios, and homework assignments
 * 6. Links everything so you can view in the app
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration
const TUTOR_EMAIL = "troy@blairandbowers.com";
const STUDENT_NAME = "Roy Samuels";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

// =============================================================================
// ANALYSIS SIMULATION
// =============================================================================

interface SpeakerSegment {
  speaker: number;
  transcript: string;
  start: number;
  end: number;
  confidence: number;
  words: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
    speaker: number;
    language?: string;
  }>;
}

interface TranscriptData {
  metadata: {
    request_id: string;
    duration: number;
    channels: number;
  };
  results: {
    utterances: SpeakerSegment[];
  };
}

interface DiarizationResult {
  tutorSpeakerId: number;
  studentSpeakerId: number;
  tutorSpeakingTime: number;
  studentSpeakingTime: number;
  turnCount: number;
  tutorSegments: SpeakerSegment[];
  studentSegments: SpeakerSegment[];
}

interface StudentError {
  type: "grammar" | "vocabulary" | "pronunciation";
  category: string;
  original: string;
  correction: string;
  timestamp: number;
  isL1Interference: boolean;
  l1Pattern?: string;
  explanation?: string;
}

interface StudentAnalysisResult {
  errors: StudentError[];
  l1InterferenceSummary: {
    overallLevel: "low" | "medium" | "high";
    topPatterns: Array<{ pattern: string; count: number }>;
  };
  fluencyMetrics: {
    wordsPerMinute: number;
    fillerWordCount: number;
    selfCorrectionCount: number;
  };
}

interface TutorAnalysisResult {
  focusVocabulary: string[];
  focusGrammar: string[];
  correctionsProvided: number;
}

interface DrillContent {
  id: string;
  type: string;
  title: string;
  description: string;
  targetArea: string;
  items?: unknown[];
}

function simulateDiarization(transcript: TranscriptData): DiarizationResult {
  const utterances = transcript.results.utterances;
  let tutorTime = 0;
  let studentTime = 0;
  const tutorSegments: SpeakerSegment[] = [];
  const studentSegments: SpeakerSegment[] = [];

  // Speaker 0 is tutor, Speaker 1 is student
  for (const utt of utterances) {
    const duration = utt.end - utt.start;
    if (utt.speaker === 0) {
      tutorTime += duration;
      tutorSegments.push(utt);
    } else {
      studentTime += duration;
      studentSegments.push(utt);
    }
  }

  return {
    tutorSpeakerId: 0,
    studentSpeakerId: 1,
    tutorSpeakingTime: tutorTime,
    studentSpeakingTime: studentTime,
    turnCount: utterances.length,
    tutorSegments,
    studentSegments,
  };
}

function simulateStudentAnalysis(segments: SpeakerSegment[]): StudentAnalysisResult {
  // Simulate detected errors from the transcript
  const errors: StudentError[] = [
    {
      type: "grammar",
      category: "present_perfect_misuse",
      original: "I have seen the examples yesterday",
      correction: "I saw the examples yesterday",
      timestamp: 24.4,
      isL1Interference: true,
      l1Pattern: "present_perfect_misuse",
      explanation: "Present perfect cannot be used with specific past time markers",
    },
    {
      type: "grammar",
      category: "double_negative",
      original: "I don't understand nothing",
      correction: "I don't understand anything",
      timestamp: 27.5,
      isL1Interference: true,
      l1Pattern: "double_negative",
      explanation: "In English, only one negative word is used per clause",
    },
    {
      type: "grammar",
      category: "adjective_order",
      original: "a wine red",
      correction: "a red wine",
      timestamp: 164.0,
      isL1Interference: true,
      l1Pattern: "adjective_order",
      explanation: "In English, adjectives come before the noun",
    },
    {
      type: "pronunciation",
      category: "b_v_confusion",
      original: "bery",
      correction: "very",
      timestamp: 188.3,
      isL1Interference: true,
      l1Pattern: "b_v_confusion",
      explanation: "Spanish speakers often confuse B and V sounds",
    },
    {
      type: "vocabulary",
      category: "code_switching",
      original: "two (in Spanish context)",
      correction: "dos",
      timestamp: 82.5,
      isL1Interference: false,
      explanation: "Switched to English mid-sentence when number was needed",
    },
  ];

  // Calculate words per minute
  let totalWords = 0;
  let totalDuration = 0;
  let fillerCount = 0;
  let selfCorrectionCount = 0;

  for (const seg of segments) {
    totalWords += seg.words.length;
    totalDuration += seg.end - seg.start;
    // Count fillers ("eh", "um")
    for (const w of seg.words) {
      if (["eh", "um", "uh"].includes(w.word.toLowerCase())) {
        fillerCount++;
      }
    }
    // Count self-corrections ("I mean")
    if (seg.transcript.toLowerCase().includes("i mean")) {
      selfCorrectionCount++;
    }
  }

  const wordsPerMinute = totalDuration > 0 ? (totalWords / totalDuration) * 60 : 0;

  return {
    errors,
    l1InterferenceSummary: {
      overallLevel: "medium",
      topPatterns: [
        { pattern: "present_perfect_misuse", count: 1 },
        { pattern: "double_negative", count: 1 },
        { pattern: "adjective_order", count: 1 },
        { pattern: "b_v_confusion", count: 1 },
      ],
    },
    fluencyMetrics: {
      wordsPerMinute: Math.round(wordsPerMinute),
      fillerWordCount: fillerCount,
      selfCorrectionCount,
    },
  };
}

function simulateTutorAnalysis(segments: SpeakerSegment[]): TutorAnalysisResult {
  return {
    focusVocabulary: [
      "restaurant",
      "paella",
      "patatas bravas",
      "vino tinto",
      "la cuenta",
      "menú",
      "recomendar",
      "típico",
    ],
    focusGrammar: [
      "adjective placement",
      "present perfect vs simple past",
      "double negatives",
      "me gustaría construction",
    ],
    correctionsProvided: 8,
  };
}

function generateDrills(
  studentAnalysis: StudentAnalysisResult,
  tutorAnalysis: TutorAnalysisResult
): DrillContent[] {
  const drills: DrillContent[] = [];

  // 1. Pronunciation drill for B/V
  drills.push({
    id: crypto.randomUUID(),
    type: "pronunciation",
    title: "Spanish Speaker Sound Practice: B vs V",
    description: "Practice distinguishing and pronouncing B and V sounds correctly in English.",
    targetArea: "b_v_confusion",
    items: [
      { word: "very", phonetic: "/ˈveri/", audioPrompt: "Place your top teeth on your bottom lip" },
      { word: "berry", phonetic: "/ˈberi/", audioPrompt: "Close both lips together" },
      { word: "vest", phonetic: "/vest/", audioPrompt: "Top teeth on bottom lip" },
      { word: "best", phonetic: "/best/", audioPrompt: "Both lips together" },
    ],
  });

  // 2. Grammar drill for adjective order
  drills.push({
    id: crypto.randomUUID(),
    type: "gap_fill",
    title: "Adjective Order Practice",
    description: "Practice placing adjectives before nouns in English, unlike Spanish word order.",
    targetArea: "adjective_order",
    items: [
      { sentence: "I would like a ___ wine.", options: ["red", "wine red"], answer: "red" },
      {
        sentence: "She has a ___ car.",
        options: ["blue beautiful", "beautiful blue"],
        answer: "beautiful blue",
      },
      {
        sentence: "We ordered ___ soup.",
        options: ["the hot", "hot the", "the soup hot"],
        answer: "the hot",
      },
    ],
  });

  // 3. Grammar drill for present perfect
  drills.push({
    id: crypto.randomUUID(),
    type: "gap_fill",
    title: "Present Perfect vs Simple Past",
    description:
      "Learn when to use simple past (with specific times) vs present perfect (unspecified times).",
    targetArea: "present_perfect_misuse",
    items: [
      {
        sentence: "I ___ the movie yesterday.",
        options: ["have seen", "saw"],
        answer: "saw",
        explanation: "Use simple past with 'yesterday'",
      },
      {
        sentence: "I ___ that movie before.",
        options: ["have seen", "saw"],
        answer: "have seen",
        explanation: "Use present perfect for unspecified past time",
      },
      {
        sentence: "She ___ to Paris last summer.",
        options: ["has gone", "went"],
        answer: "went",
        explanation: "Use simple past with 'last summer'",
      },
    ],
  });

  // 4. Grammar drill for double negatives
  drills.push({
    id: crypto.randomUUID(),
    type: "gap_fill",
    title: "Avoiding Double Negatives",
    description: "Practice using single negatives in English, unlike Spanish double negatives.",
    targetArea: "double_negative",
    items: [
      {
        sentence: "I don't want ___.",
        options: ["nothing", "anything"],
        answer: "anything",
        explanation: "Use 'anything' with 'don't'",
      },
      {
        sentence: "She never tells ___ her secrets.",
        options: ["nobody", "anybody"],
        answer: "anybody",
        explanation: "Use 'anybody' with 'never'",
      },
      {
        sentence: "They didn't go ___.",
        options: ["nowhere", "anywhere"],
        answer: "anywhere",
        explanation: "Use 'anywhere' with 'didn't'",
      },
    ],
  });

  // 5. Vocabulary drill
  drills.push({
    id: crypto.randomUUID(),
    type: "match",
    title: "Restaurant Vocabulary Review",
    description: "Match the Spanish restaurant vocabulary with English meanings.",
    targetArea: "vocabulary",
    items: [
      { spanish: "la cuenta", english: "the bill" },
      { spanish: "el menú", english: "the menu" },
      { spanish: "recomendar", english: "to recommend" },
      { spanish: "típico", english: "typical" },
      { spanish: "patatas bravas", english: "spicy potatoes" },
      { spanish: "vino tinto", english: "red wine" },
      { spanish: "paella", english: "rice dish with seafood/meat" },
      { spanish: "por favor", english: "please" },
    ],
  });

  // 6. Conversation simulation drill
  drills.push({
    id: crypto.randomUUID(),
    type: "conversation_simulation",
    title: "Restaurant Ordering Practice",
    description: "Practice ordering food at a Spanish restaurant using proper vocabulary.",
    targetArea: "conversation",
    items: [
      {
        scenario: "The waiter asks how many people are in your party",
        prompt: "¿Mesa para cuántos?",
        expectedResponse: "Mesa para dos personas, por favor.",
      },
      {
        scenario: "You want to order something typical",
        prompt: "¿Qué le gustaría ordenar?",
        expectedResponse: "Quiero probar algo típico. ¿Qué me recomienda?",
      },
      {
        scenario: "You want the bill",
        prompt: "The waiter approaches",
        expectedResponse: "La cuenta, por favor.",
      },
    ],
  });

  return drills;
}

// =============================================================================
// MAIN SEED FUNCTION
// =============================================================================

async function seedTranscriptionDemo() {
  console.log("=".repeat(70));
  console.log("  TRANSCRIPTION → AI PRACTICE & HOMEWORK DEMO");
  console.log("=".repeat(70));
  console.log("\nStarting seed script...\n");

  // -------------------------------------------------------------------------
  // Step 1: Get tutor profile
  // -------------------------------------------------------------------------
  console.log("Step 1: Looking up tutor account...");
  const { data: tutor, error: tutorError } = await supabase
    .from("profiles")
    .select("id, full_name, username, tier")
    .eq("email", TUTOR_EMAIL)
    .single();

  if (tutorError || !tutor) {
    console.error("Could not find tutor:", tutorError);
    console.log(`\nPlease ensure you have a tutor account with email: ${TUTOR_EMAIL}`);
    process.exit(1);
  }
  console.log(`  Found tutor: ${tutor.full_name} (${tutor.id})`);
  console.log(`  Tier: ${tutor.tier || "standard"}`);

  // Ensure tutor has Studio tier
  if (tutor.tier !== "studio") {
    console.log("  Updating tutor to Studio tier for transcription features...");
    await supabase.from("profiles").update({ tier: "studio" }).eq("id", tutor.id);
  }

  // -------------------------------------------------------------------------
  // Step 2: Get or create student
  // -------------------------------------------------------------------------
  console.log("\nStep 2: Looking up student account...");
  let studentId: string;

  // Look for Roy Samuels by name
  const { data: existingStudent } = await supabase
    .from("students")
    .select("id, full_name, email")
    .eq("tutor_id", tutor.id)
    .ilike("full_name", `%${STUDENT_NAME}%`)
    .maybeSingle();

  if (existingStudent) {
    studentId = existingStudent.id;
    console.log(`  Found existing student: ${existingStudent.full_name} (${studentId})`);
  } else {
    // Create Roy Samuels
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        tutor_id: tutor.id,
        full_name: STUDENT_NAME,
        email: "roy.samuels@tutorlingua.test",
        native_language: "Spanish",
        target_language: "English",
        proficiency_level: "intermediate",
        learning_goals: "Improve English fluency, reduce Spanish interference errors",
      })
      .select("id, full_name")
      .single();

    if (studentError || !newStudent) {
      console.error("Could not create student:", studentError);
      process.exit(1);
    }
    studentId = newStudent.id;
    console.log(`  Created new student: ${newStudent.full_name} (${studentId})`);
  }

  // -------------------------------------------------------------------------
  // Step 3: Get or create a service
  // -------------------------------------------------------------------------
  console.log("\nStep 3: Getting service for booking...");
  const { data: service } = await supabase
    .from("services")
    .select("id, name")
    .eq("tutor_id", tutor.id)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (!service) {
    console.error("No active services found for tutor. Please create a service first.");
    process.exit(1);
  }
  console.log(`  Using service: ${service.name} (${service.id})`);

  // -------------------------------------------------------------------------
  // Step 4: Create completed booking
  // -------------------------------------------------------------------------
  console.log("\nStep 4: Creating completed booking...");
  const lessonDate = new Date();
  lessonDate.setHours(lessonDate.getHours() - 2); // 2 hours ago

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      tutor_id: tutor.id,
      student_id: studentId,
      service_id: service.id,
      scheduled_at: lessonDate.toISOString(),
      duration_minutes: 50,
      timezone: "America/New_York",
      status: "completed",
      payment_status: "paid",
      payment_amount: 5000,
      currency: "USD",
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    console.error("Could not create booking:", bookingError);
    process.exit(1);
  }
  console.log(`  Created booking: ${booking.id}`);

  // -------------------------------------------------------------------------
  // Step 5: Load sample transcript and create lesson_recording
  // -------------------------------------------------------------------------
  console.log("\nStep 5: Creating lesson recording with transcript...");
  const transcriptPath = path.join(__dirname, "demo-data", "sample-transcript-spanish-english.json");
  const transcriptJson = JSON.parse(fs.readFileSync(transcriptPath, "utf-8")) as TranscriptData;

  const { data: recording, error: recordingError } = await supabase
    .from("lesson_recordings")
    .insert({
      booking_id: booking.id,
      tutor_id: tutor.id,
      student_id: studentId,
      storage_path: "demo://recordings/spanish-english-lesson-demo.ogg",
      duration_seconds: 260, // ~4.3 minutes of sample content
      transcript_json: transcriptJson,
      status: "completed",
    })
    .select("id")
    .single();

  if (recordingError || !recording) {
    console.error("Could not create recording:", recordingError);
    process.exit(1);
  }
  console.log(`  Created lesson recording: ${recording.id}`);

  // -------------------------------------------------------------------------
  // Step 6: Run analysis pipeline (simulated)
  // -------------------------------------------------------------------------
  console.log("\n" + "-".repeat(70));
  console.log("  ANALYSIS PIPELINE");
  console.log("-".repeat(70));

  // 6a. Speaker Diarization
  console.log("\n[Step 6a] Speaker Diarization...");
  const diarization = simulateDiarization(transcriptJson);
  console.log(`  Tutor Speaker ID: ${diarization.tutorSpeakerId}`);
  console.log(`  Student Speaker ID: ${diarization.studentSpeakerId}`);
  console.log(`  Tutor Speaking Time: ${formatTime(diarization.tutorSpeakingTime)} (${formatPercent(diarization.tutorSpeakingTime / (diarization.tutorSpeakingTime + diarization.studentSpeakingTime))})`);
  console.log(`  Student Speaking Time: ${formatTime(diarization.studentSpeakingTime)} (${formatPercent(diarization.studentSpeakingTime / (diarization.tutorSpeakingTime + diarization.studentSpeakingTime))})`);
  console.log(`  Turn Count: ${diarization.turnCount}`);

  // 6b. Student Speech Analysis
  console.log("\n[Step 6b] Student Speech Analysis...");
  const studentAnalysis = simulateStudentAnalysis(diarization.studentSegments);
  console.log(`  Errors Detected: ${studentAnalysis.errors.length}`);
  const grammarErrors = studentAnalysis.errors.filter((e) => e.type === "grammar");
  const vocabErrors = studentAnalysis.errors.filter((e) => e.type === "vocabulary");
  const pronErrors = studentAnalysis.errors.filter((e) => e.type === "pronunciation");
  const l1Errors = studentAnalysis.errors.filter((e) => e.isL1Interference);
  console.log(`    - Grammar: ${grammarErrors.length} (${l1Errors.filter((e) => e.type === "grammar").length} L1 interference)`);
  console.log(`    - Vocabulary: ${vocabErrors.length}`);
  console.log(`    - Pronunciation: ${pronErrors.length}`);
  console.log(`  L1 Interference Level: ${studentAnalysis.l1InterferenceSummary.overallLevel}`);
  console.log(`  Top L1 Patterns:`);
  for (const p of studentAnalysis.l1InterferenceSummary.topPatterns) {
    console.log(`    - ${p.pattern}: ${p.count} occurrence(s)`);
  }
  console.log(`  Fluency Metrics:`);
  console.log(`    - Words per minute: ${studentAnalysis.fluencyMetrics.wordsPerMinute}`);
  console.log(`    - Filler words: ${studentAnalysis.fluencyMetrics.fillerWordCount}`);
  console.log(`    - Self-corrections: ${studentAnalysis.fluencyMetrics.selfCorrectionCount}`);

  // 6c. Tutor Speech Analysis
  console.log("\n[Step 6c] Tutor Speech Analysis...");
  const tutorAnalysis = simulateTutorAnalysis(diarization.tutorSegments);
  console.log(`  Focus Vocabulary: ${tutorAnalysis.focusVocabulary.slice(0, 5).join(", ")}...`);
  console.log(`  Focus Grammar: ${tutorAnalysis.focusGrammar.join(", ")}`);
  console.log(`  Corrections Provided: ${tutorAnalysis.correctionsProvided}`);

  // Update recording with analysis results
  await supabase
    .from("lesson_recordings")
    .update({
      speaker_segments: diarization,
      tutor_speaker_id: diarization.tutorSpeakerId,
      student_speaker_id: diarization.studentSpeakerId,
      tutor_speech_analysis: tutorAnalysis,
      student_speech_analysis: studentAnalysis,
      detected_languages: ["en", "es"],
      code_switching_metrics: {
        totalWords: 500,
        wordsByLanguage: { en: 400, es: 100 },
        switchCount: 15,
        avgSwitchesPerMinute: 3.5,
        dominantLanguage: "en",
        isCodeSwitched: true,
      },
    })
    .eq("id", recording.id);

  // -------------------------------------------------------------------------
  // Step 7: Generate drills
  // -------------------------------------------------------------------------
  console.log("\n[Step 7] Generating Adaptive Drills...");
  const drills = generateDrills(studentAnalysis, tutorAnalysis);
  console.log(`  Generated ${drills.length} drills:`);
  for (const drill of drills) {
    console.log(`    - [${drill.type}] "${drill.title}" (targets: ${drill.targetArea})`);
  }

  // Save drills to database
  // Note: focus_area is stored inside the content JSONB, not as a separate column
  const drillInserts = drills.map((drill) => ({
    recording_id: recording.id,
    student_id: studentId,
    tutor_id: tutor.id,
    content: drill,
    is_completed: false,
  }));

  const { error: drillError } = await supabase.from("lesson_drills").insert(drillInserts);

  if (drillError) {
    console.error("Error saving drills:", drillError);
  } else {
    console.log(`  Saved ${drills.length} drills to lesson_drills table`);
  }

  // -------------------------------------------------------------------------
  // Step 8: Create practice scenario
  // -------------------------------------------------------------------------
  console.log("\n[Step 8] Creating Practice Scenario...");

  const scenarioTitle = "Conversational Practice: Restaurant Ordering";
  const { data: existingScenario } = await supabase
    .from("practice_scenarios")
    .select("id")
    .eq("tutor_id", tutor.id)
    .eq("title", scenarioTitle)
    .maybeSingle();

  let scenarioId: string;
  if (existingScenario) {
    scenarioId = existingScenario.id;
    console.log(`  Using existing scenario: ${scenarioId}`);
  } else {
    const { data: newScenario, error: scenarioError } = await supabase
      .from("practice_scenarios")
      .insert({
        tutor_id: tutor.id,
        title: scenarioTitle,
        description:
          "Practice ordering food at a Spanish restaurant, using proper vocabulary and grammar structures covered in your recent lesson.",
        language: "Spanish",
        level: "intermediate",
        topic: "Restaurant & Dining",
        system_prompt: `You are a friendly waiter at a Spanish restaurant in Madrid. The student is practicing their Spanish restaurant vocabulary.

Key teaching points to reinforce:
1. Adjective order (before noun in English, after in Spanish)
2. Using "me gustaría" for polite requests
3. Common restaurant vocabulary: la cuenta, el menú, recomendar, típico

Speak primarily in Spanish, but switch to English to explain grammar points when needed. Gently correct errors by rephrasing correctly.`,
        vocabulary_focus: tutorAnalysis.focusVocabulary,
        grammar_focus: ["adjective_order", "present_perfect_vs_simple_past", "double_negatives"],
        max_messages: 20,
        is_active: true,
      })
      .select("id")
      .single();

    if (scenarioError || !newScenario) {
      console.error("Error creating scenario:", scenarioError);
      process.exit(1);
    }
    scenarioId = newScenario.id;
    console.log(`  Created practice scenario: ${scenarioId}`);
  }
  console.log(`  Title: "${scenarioTitle}"`);
  console.log(`  Language: Spanish`);
  console.log(`  Level: intermediate`);
  console.log(`  Grammar Focus: adjective_order, present_perfect, double_negatives`);

  // -------------------------------------------------------------------------
  // Step 9: Create practice assignment
  // -------------------------------------------------------------------------
  console.log("\n[Step 9] Creating Practice Assignment...");
  const assignmentDueDate = new Date();
  assignmentDueDate.setDate(assignmentDueDate.getDate() + 3);

  const { data: existingAssignment } = await supabase
    .from("practice_assignments")
    .select("id")
    .eq("student_id", studentId)
    .eq("scenario_id", scenarioId)
    .eq("status", "assigned")
    .maybeSingle();

  let assignmentId: string;
  if (existingAssignment) {
    assignmentId = existingAssignment.id;
    console.log(`  Using existing assignment: ${assignmentId}`);
  } else {
    const { data: newAssignment, error: assignmentError } = await supabase
      .from("practice_assignments")
      .insert({
        tutor_id: tutor.id,
        student_id: studentId,
        scenario_id: scenarioId,
        title: "Practice: Restaurant Ordering Conversation",
        instructions: `Complete a full restaurant ordering conversation in Spanish. Focus on:
- Using "me gustaría" for polite requests
- Correct adjective placement (Spanish: noun + adjective)
- Restaurant vocabulary from today's lesson

Try to complete at least one full conversation from greeting to paying the bill.`,
        status: "assigned",
        due_date: assignmentDueDate.toISOString(),
      })
      .select("id")
      .single();

    if (assignmentError || !newAssignment) {
      console.error("Error creating assignment:", assignmentError);
      process.exit(1);
    }
    assignmentId = newAssignment.id;
    console.log(`  Created practice assignment: ${assignmentId}`);
  }

  // -------------------------------------------------------------------------
  // Step 10: Create homework assignment
  // -------------------------------------------------------------------------
  console.log("\n[Step 10] Creating Homework Assignment...");
  const homeworkDueDate = new Date();
  homeworkDueDate.setDate(homeworkDueDate.getDate() + 5);

  const homeworkTitle = "Week 3 Practice: Grammar & Conversation";
  const { data: existingHomework } = await supabase
    .from("homework_assignments")
    .select("id")
    .eq("student_id", studentId)
    .eq("title", homeworkTitle)
    .maybeSingle();

  let homeworkId: string;
  if (existingHomework) {
    homeworkId = existingHomework.id;
    console.log(`  Using existing homework: ${homeworkId}`);
  } else {
    const { data: newHomework, error: homeworkError } = await supabase
      .from("homework_assignments")
      .insert({
        tutor_id: tutor.id,
        student_id: studentId,
        title: homeworkTitle,
        instructions: `Based on our lesson today, please complete the following:

**1. Grammar Review (20 mins)**
- Complete the generated drills in your practice area
- Focus especially on: adjective order, present perfect vs simple past

**2. L1 Interference Practice (15 mins)**
- Review the double negative rules
- Practice the B/V pronunciation distinction
- Write 5 sentences avoiding double negatives

**3. AI Conversation Practice (15 mins)**
- Complete the "Restaurant Ordering" practice scenario
- Try to use all the vocabulary from today's lesson

**4. Vocabulary Study (10 mins)**
- Review: la cuenta, el menú, recomendar, típico, patatas bravas, vino tinto, paella
- Practice saying each word aloud with correct pronunciation`,
        status: "assigned",
        due_date: homeworkDueDate.toISOString(),
        attachments: [
          {
            label: "Restaurant Vocabulary Flashcards",
            url: "https://example.com/restaurant-vocab.pdf",
            type: "pdf",
          },
          {
            label: "B vs V Pronunciation Guide",
            url: "https://example.com/bv-pronunciation.mp3",
            type: "audio",
          },
        ],
        tutor_notes: `Focus areas from lesson analysis:
- L1 interference (Spanish): medium level
- Top patterns: present_perfect_misuse, double_negative, adjective_order, b_v_confusion
- Self-correction ability: Good (caught adjective order mistake)
- Recommended extra practice: double negatives and B/V sounds`,
      })
      .select("id")
      .single();

    if (homeworkError || !newHomework) {
      console.error("Error creating homework:", homeworkError);
      process.exit(1);
    }
    homeworkId = newHomework.id;
    console.log(`  Created homework assignment: ${homeworkId}`);
  }
  console.log(`  Title: "${homeworkTitle}"`);
  console.log(`  Source: auto_lesson_analysis`);
  console.log(`  Status: assigned`);
  console.log(`  Linked Practice Scenario: ${scenarioId}`);
  console.log(`  Drills Included: ${drills.length}`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n" + "=".repeat(70));
  console.log("  SEED COMPLETE!");
  console.log("=".repeat(70));
  console.log("\n--- CREATED RESOURCES ---");
  console.log(`  Booking ID:            ${booking.id}`);
  console.log(`  Recording ID:          ${recording.id}`);
  console.log(`  Practice Scenario ID:  ${scenarioId}`);
  console.log(`  Practice Assignment:   ${assignmentId}`);
  console.log(`  Homework Assignment:   ${homeworkId}`);
  console.log(`  Drills Created:        ${drills.length}`);

  console.log("\n--- APP URLS (localhost:3000) ---");
  console.log(`  Student Detail:        /students/${studentId}`);
  console.log(`  Lesson Review:         /student/review/${booking.id}`);
  console.log(`  Practice Assignment:   /student/practice/${assignmentId}`);
  console.log(`  Student Progress:      /student/progress`);

  console.log("\n--- DATABASE VERIFICATION ---");
  console.log("  Run these queries to verify:");
  console.log(`  SELECT * FROM lesson_recordings WHERE id = '${recording.id}';`);
  console.log(`  SELECT * FROM lesson_drills WHERE recording_id = '${recording.id}';`);
  console.log(`  SELECT * FROM practice_scenarios WHERE id = '${scenarioId}';`);
  console.log(`  SELECT * FROM homework_assignments WHERE id = '${homeworkId}';`);

  console.log("\n--- ACCOUNTS ---");
  console.log(`  Tutor:   ${tutor.full_name} (${TUTOR_EMAIL})`);
  console.log(`  Student: ${STUDENT_NAME} (ID: ${studentId})`);
  console.log("");
}

// Run the seed
seedTranscriptionDemo().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
