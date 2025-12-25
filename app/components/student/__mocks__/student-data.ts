/**
 * Comprehensive mock data for student component Storybook stories
 */

import type { HomeworkAssignment, HomeworkAttachment, LearningStats, LearningGoal, ProficiencyAssessment, LessonNote, StudentPracticeData } from "@/lib/actions/progress";
import type { PracticeAssignment, PracticeStats, PracticeUsage } from "@/components/student/AIPracticeCard";
import type { ChatMessage } from "@/components/student/AIPracticeChat";

// ============================================
// HOMEWORK MOCK DATA
// ============================================

export const mockHomeworkAssignments: HomeworkAssignment[] = [
  {
    id: "hw-1",
    tutor_id: "tutor-1",
    student_id: "student-1",
    booking_id: null,
    title: "Spanish Vocabulary: Restaurant & Food",
    instructions: `Complete the following exercises before our next lesson:

1. **Vocabulary Review**: Study the restaurant vocabulary list attached below
2. **Writing Practice**: Write 5 sentences using the new vocabulary
3. **Audio Practice**: Listen to the restaurant dialogue and answer the comprehension questions
4. **Bonus**: Complete one AI Practice session using the "Restaurant Ordering" scenario

Focus especially on:
- How to ask for the menu ("¿Me puede traer el menú, por favor?")
- How to order drinks and food politely
- How to ask for the bill ("La cuenta, por favor")`,
    status: "assigned",
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    attachments: [
      { label: "Restaurant Vocabulary PDF", url: "#", type: "pdf" },
      { label: "Audio: Restaurant Dialogue", url: "#", type: "audio" as const },
      { label: "SpanishDict: Restaurant Vocabulary", url: "https://www.spanishdict.com", type: "link" },
    ] as HomeworkAttachment[],
    audio_instruction_url: null,
    student_notes: null,
    tutor_notes: "Carlos struggles with verb conjugation - emphasize present tense practice.",
    completed_at: null,
    submitted_at: null,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    topic: "Restaurant & Dining",
    practice_assignment_id: "pa-1",
    practice_assignment: {
      id: "pa-1",
      status: "assigned",
      sessions_completed: 0,
    },
  },
  {
    id: "hw-2",
    tutor_id: "tutor-1",
    student_id: "student-1",
    booking_id: null,
    title: "Grammar Exercise: Ser vs Estar",
    instructions: "Complete the ser vs estar worksheet. Focus on understanding when to use each verb.",
    status: "in_progress",
    due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday (overdue)
    attachments: [
      { label: "Ser vs Estar Worksheet", url: "#", type: "pdf" },
    ] as HomeworkAttachment[],
    audio_instruction_url: null,
    student_notes: "I'm confused about using estar with emotions",
    tutor_notes: null,
    completed_at: null,
    submitted_at: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    topic: "Grammar",
    practice_assignment_id: null,
  },
  {
    id: "hw-3",
    tutor_id: "tutor-1",
    student_id: "student-1",
    booking_id: null,
    title: "Listening Comprehension: Travel Podcast",
    instructions: "Listen to the travel podcast episode and write a short summary (100-150 words) in Spanish.",
    status: "submitted",
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [
      { label: "Podcast Episode: Viajes por España", url: "#", type: "audio" as const },
      { label: "Transcript (for reference)", url: "#", type: "pdf" },
    ] as HomeworkAttachment[],
    audio_instruction_url: null,
    student_notes: null,
    tutor_notes: null,
    completed_at: null,
    submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    topic: "Listening",
    practice_assignment_id: null,
    latest_submission: {
      id: "sub-1",
      homework_id: "hw-3",
      tutor_feedback: null,
      review_status: "pending",
      reviewed_at: null,
      submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "hw-4",
    tutor_id: "tutor-1",
    student_id: "student-1",
    booking_id: null,
    title: "Pronunciation Practice: Difficult Sounds",
    instructions: "Record yourself reading the provided sentences. Focus on the 'rr' and 'j' sounds.",
    status: "completed",
    due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [
      { label: "Practice Sentences PDF", url: "#", type: "pdf" },
    ] as HomeworkAttachment[],
    audio_instruction_url: null,
    student_notes: null,
    tutor_notes: null,
    completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    submitted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    topic: "Pronunciation",
    practice_assignment_id: null,
    latest_submission: {
      id: "sub-2",
      homework_id: "hw-4",
      tutor_feedback: "Great work on the 'rr' sound! Your pronunciation has improved significantly. Keep practicing the 'j' sound - try making it more guttural.",
      review_status: "reviewed",
      reviewed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      submitted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
  {
    id: "hw-5",
    tutor_id: "tutor-1",
    student_id: "student-1",
    booking_id: null,
    title: "Writing: Describe Your Daily Routine",
    instructions: "Write a short paragraph (50-100 words) describing your typical day. Use present tense verbs.",
    status: "submitted",
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [] as HomeworkAttachment[],
    audio_instruction_url: null,
    student_notes: null,
    tutor_notes: null,
    completed_at: null,
    submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    topic: "Writing",
    practice_assignment_id: null,
    latest_submission: {
      id: "sub-3",
      homework_id: "hw-5",
      tutor_feedback: "Good effort, but please review verb conjugations for 'despertarse' and 'acostarse'. Try again with the corrections.",
      review_status: "needs_revision",
      reviewed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export const mockHomeworkWithAudioInstruction: HomeworkAssignment = {
  id: "hw-audio",
  tutor_id: "tutor-1",
  student_id: "student-1",
  booking_id: null,
  title: "Conversation Practice: At the Doctor",
  instructions: "Listen to my audio instructions and practice the dialogue with the AI.",
  status: "assigned",
  due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  attachments: [
    { label: "Medical Vocabulary List", url: "#", type: "pdf" },
  ] as HomeworkAttachment[],
  audio_instruction_url: "https://example.com/audio-instructions.mp3",
  student_notes: null,
  tutor_notes: null,
  completed_at: null,
  submitted_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  topic: "Medical Spanish",
  practice_assignment_id: "pa-2",
  practice_assignment: {
    id: "pa-2",
    status: "in_progress",
    sessions_completed: 1,
  },
};

// ============================================
// AI PRACTICE MOCK DATA
// ============================================

export const mockPracticeAssignments: PracticeAssignment[] = [
  {
    id: "pa-1",
    title: "Restaurant Practice - Complete before next lesson",
    instructions: "Practice ordering a complete meal in Spanish. Try to use formal language (usted) and practice asking about ingredients for dietary restrictions.",
    status: "assigned",
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    sessions_completed: 0,
    scenario: {
      id: "scenario-1",
      title: "Restaurant Ordering in Spanish",
      language: "Spanish",
      level: "intermediate",
      topic: "Restaurant & Dining",
    },
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pa-2",
    title: "Job Interview Practice",
    instructions: "Practice answering common job interview questions. Focus on using the conditional tense.",
    status: "in_progress",
    due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    sessions_completed: 1,
    scenario: {
      id: "scenario-2",
      title: "Job Interview Preparation",
      language: "Spanish",
      level: "advanced",
      topic: "Professional & Career",
    },
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "pa-3",
    title: "Travel Directions Completed",
    instructions: "Practice asking for and giving directions in a new city.",
    status: "completed",
    due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sessions_completed: 2,
    scenario: {
      id: "scenario-3",
      title: "Travel Directions",
      language: "French",
      level: "beginner",
      topic: "Travel",
    },
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockPracticeStats: PracticeStats = {
  sessions_completed: 3,
  practice_minutes: 45,
  messages_sent: 28,
};

export const mockPracticeUsage: PracticeUsage = {
  audioSecondsUsed: 450, // 7.5 minutes
  audioSecondsAllowance: 2700, // 45 minutes free
  textTurnsUsed: 85,
  textTurnsAllowance: 600,
  blocksConsumed: 0,
  currentTierPriceCents: 0,
  periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  percentAudioUsed: 17,
  percentTextUsed: 14,
  isFreeUser: true,
  audioSecondsRemaining: 2250,
  textTurnsRemaining: 515,
  canBuyBlocks: true,
  blockPriceCents: 500,
};

export const mockHighUsage: PracticeUsage = {
  audioSecondsUsed: 2400, // 40 minutes
  audioSecondsAllowance: 2700, // 45 minutes free
  textTurnsUsed: 550,
  textTurnsAllowance: 600,
  blocksConsumed: 0,
  currentTierPriceCents: 0,
  periodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  percentAudioUsed: 89,
  percentTextUsed: 92,
  isFreeUser: true,
  audioSecondsRemaining: 300,
  textTurnsRemaining: 50,
  canBuyBlocks: true,
  blockPriceCents: 500,
};

// ============================================
// CHAT MESSAGES MOCK DATA
// ============================================

export const mockChatMessages: ChatMessage[] = [
  {
    id: "msg-1",
    role: "assistant",
    content: "¡Buenas tardes! Bienvenido a El Toro Rojo. ¿Mesa para cuántas personas?",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    role: "user",
    content: "Buenas tardes. Mesa para dos personas, por favor.",
    vocabulary_used: ["mesa", "personas", "por favor"],
    created_at: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-3",
    role: "assistant",
    content: "Perfecto, síganme por favor. Aquí tienen el menú. ¿Desean comenzar con algo de beber?",
    created_at: new Date(Date.now() - 13 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-4",
    role: "user",
    content: "Yo querer agua, por favor.",
    corrections: [
      {
        original: "Yo querer agua",
        corrected: "Yo quiero agua",
        explanation: "Use 'quiero' (first person singular present) instead of 'querer' (infinitive). In Spanish, conjugate the verb to match the subject.",
      },
    ],
    vocabulary_used: ["agua"],
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-5",
    role: "assistant",
    content: "Muy bien, agua para usted. *Nota: Decimos 'Yo quiero agua' o simplemente 'Quiero agua, por favor.'* ¿Y para su acompañante?",
    created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-6",
    role: "user",
    content: "Él quiere una cerveza. ¿Tienen paella?",
    vocabulary_used: ["cerveza", "paella"],
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-7",
    role: "assistant",
    content: "¡Sí, tenemos paella! Es nuestra especialidad. La paella valenciana con mariscos es muy popular. ¿Les gustaría probarla?",
    created_at: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-8",
    role: "user",
    content: "Sí, me gustaría la paella valenciana para dos. Gracias.",
    vocabulary_used: ["me gustaría", "para dos", "gracias"],
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
];

export const mockChatWithPronunciation: ChatMessage[] = [
  ...mockChatMessages.slice(0, 4),
  {
    id: "msg-audio-1",
    role: "user",
    content: "Quiero una mesa cerca de la ventana, por favor.",
    pronunciation: {
      assessment_id: "assess-1",
      transcript: "Quiero una mesa cerca de la ventana, por favor.",
      scores: {
        accuracy: 85,
        fluency: 80,
        pronunciation: 82,
        completeness: 100,
      },
      remaining_seconds: 2250,
    },
    vocabulary_used: ["mesa", "ventana"],
    created_at: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
];

// ============================================
// LEARNING STATS MOCK DATA
// ============================================

export const mockLearningStats: LearningStats = {
  id: "stats-1",
  student_id: "student-1",
  tutor_id: "tutor-1",
  total_lessons: 8,
  total_minutes: 420,
  lessons_this_month: 3,
  minutes_this_month: 150,
  current_streak: 3,
  longest_streak: 7,
  last_lesson_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  messages_sent: 28,
  homework_completed: 5,
};

export const mockNewStudentStats: LearningStats = {
  id: "stats-2",
  student_id: "student-1",
  tutor_id: "tutor-1",
  total_lessons: 1,
  total_minutes: 50,
  lessons_this_month: 1,
  minutes_this_month: 50,
  current_streak: 1,
  longest_streak: 1,
  last_lesson_at: new Date().toISOString(),
  messages_sent: 0,
  homework_completed: 0,
};

// ============================================
// LEARNING GOALS MOCK DATA
// ============================================

export const mockLearningGoals: LearningGoal[] = [
  {
    id: "goal-1",
    student_id: "student-1",
    tutor_id: "tutor-1",
    title: "Achieve B2 Spanish proficiency",
    description: "Pass the DELE B2 exam by June 2025",
    target_date: "2025-06-01T00:00:00Z",
    progress_percentage: 65,
    status: "active",
    completed_at: null,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "goal-2",
    student_id: "student-1",
    tutor_id: "tutor-1",
    title: "Master restaurant vocabulary",
    description: "Be able to order food confidently in any Spanish restaurant",
    target_date: "2025-02-01T00:00:00Z",
    progress_percentage: 80,
    status: "active",
    completed_at: null,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "goal-3",
    student_id: "student-1",
    tutor_id: "tutor-1",
    title: "Complete 20 AI Practice sessions",
    description: "Regular practice to build conversation fluency",
    target_date: "2025-03-01T00:00:00Z",
    progress_percentage: 15,
    status: "active",
    completed_at: null,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "goal-4",
    student_id: "student-1",
    tutor_id: "tutor-1",
    title: "Learn 500 new vocabulary words",
    description: "Build a strong vocabulary foundation",
    target_date: "2024-12-01T00:00:00Z",
    progress_percentage: 100,
    status: "completed",
    completed_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// PROFICIENCY ASSESSMENTS MOCK DATA
// ============================================

export const mockAssessments: ProficiencyAssessment[] = [
  {
    id: "assess-1",
    student_id: "student-1",
    tutor_id: "tutor-1",
    skill_area: "speaking",
    level: "intermediate",
    score: null,
    notes: "Good conversational flow, needs work on subjunctive mood",
    assessed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "assess-2",
    student_id: "student-1",
    tutor_id: "tutor-1",
    skill_area: "listening",
    level: "upper_intermediate",
    score: null,
    notes: "Excellent comprehension of native speakers at moderate speed",
    assessed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "assess-3",
    student_id: "student-1",
    tutor_id: "tutor-1",
    skill_area: "reading",
    level: "intermediate",
    score: null,
    notes: "Can read newspaper articles with some dictionary help",
    assessed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "assess-4",
    student_id: "student-1",
    tutor_id: "tutor-1",
    skill_area: "writing",
    level: "elementary",
    score: null,
    notes: "Needs more practice with written Spanish, focus on accents and spelling",
    assessed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "assess-5",
    student_id: "student-1",
    tutor_id: "tutor-1",
    skill_area: "grammar",
    level: "intermediate",
    score: null,
    notes: "Good grasp of tenses, working on subjunctive",
    assessed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "assess-6",
    student_id: "student-1",
    tutor_id: "tutor-1",
    skill_area: "vocabulary",
    level: "upper_intermediate",
    score: null,
    notes: "Strong vocabulary in everyday topics, building specialized vocabulary",
    assessed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "assess-7",
    student_id: "student-1",
    tutor_id: "tutor-1",
    skill_area: "pronunciation",
    level: "intermediate",
    score: null,
    notes: "Good overall, needs work on 'rr' sound and intonation",
    assessed_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// LESSON NOTES MOCK DATA
// ============================================

export const mockLessonNotes: LessonNote[] = [
  {
    id: "note-1",
    booking_id: "booking-1",
    tutor_id: "tutor-1",
    student_id: "student-1",
    topics_covered: ["Restaurant vocabulary", "Ordering food", "Polite requests"],
    vocabulary_introduced: ["menú", "pedir", "la cuenta", "de primero", "de segundo"],
    grammar_points: ["Me gustaría + infinitive", "Conditional for politeness"],
    homework: null,
    strengths: "Natural conversational flow when ordering",
    areas_to_improve: "Handle unexpected situations like dietary restrictions",
    student_visible_notes: "Great progress on restaurant vocabulary! You're getting more confident with ordering. Next time, let's practice handling unexpected situations like dietary restrictions or complaints.",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "note-2",
    booking_id: "booking-2",
    tutor_id: "tutor-1",
    student_id: "student-1",
    topics_covered: ["Past tense review", "Irregular verbs", "Storytelling"],
    vocabulary_introduced: ["fue", "hizo", "dijo", "vino", "puso"],
    grammar_points: ["Preterite vs Imperfect", "Irregular preterite verbs"],
    homework: "Write a short diary entry each day using past tense",
    strengths: "Good with regular past tense verbs",
    areas_to_improve: "Irregular preterite verbs",
    student_visible_notes: "You're doing well with regular past tense verbs. The irregular ones need more practice - try writing a short diary entry each day using past tense.",
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "note-3",
    booking_id: "booking-3",
    tutor_id: "tutor-1",
    student_id: "student-1",
    topics_covered: ["Subjunctive mood introduction", "Expressing wishes", "Recommendations"],
    vocabulary_introduced: ["ojalá", "esperar que", "recomendar que", "es importante que"],
    grammar_points: ["Subjunctive triggers", "Present subjunctive conjugation"],
    homework: null,
    strengths: "Good understanding of subjunctive triggers",
    areas_to_improve: "Subjunctive conjugation patterns",
    student_visible_notes: "The subjunctive is challenging, but you're making good progress. Remember: 'ojalá' always triggers subjunctive. Keep practicing the conjugation patterns.",
    created_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================
// STUDENT PRACTICE DATA (Combined)
// ============================================

export const mockStudentPracticeData: StudentPracticeData = {
  isSubscribed: true,
  studentId: "student-1",
  assignments: mockPracticeAssignments,
  stats: mockPracticeStats,
  usage: mockPracticeUsage,
};

export const mockStudentPracticeDataEmpty: StudentPracticeData = {
  isSubscribed: false,
  studentId: "student-1",
  assignments: [],
  stats: null,
  usage: null,
};
