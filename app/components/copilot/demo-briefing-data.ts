import type { LessonBriefing } from "@/lib/actions/types";

/**
 * Demo briefing data for showcasing AI Copilot features
 * Used when no real briefings are available
 */
export const DEMO_BRIEFING: LessonBriefing = {
  id: "demo-briefing",
  tutorId: "demo",
  studentId: "demo-student",
  bookingId: "demo-booking",
  studentSummary:
    "Maria is a B1 intermediate Spanish learner preparing for a business trip to Mexico. She's been making good progress but struggles with subjunctive mood and formal business vocabulary.",
  focusAreas: [
    {
      type: "grammar",
      topic: "Subjunctive Mood",
      reason: "Frequent errors in conditional statements",
      evidence:
        "Used indicative instead of subjunctive in 4 of 6 attempts last lesson",
      count: 4,
    },
    {
      type: "vocabulary",
      topic: "Business Meeting Phrases",
      reason: "Target for upcoming trip preparation",
      evidence: "Student requested focus on professional contexts",
    },
    {
      type: "pronunciation",
      topic: "R/RR Distinction",
      reason: "Common L1 interference pattern for English speakers",
      evidence: "'pero' and 'perro' confusion noted in conversation practice",
      count: 3,
    },
  ],
  errorPatterns: [
    {
      type: "subjunctive",
      count: 4,
      examples: ["Quiero que vienes → Quiero que vengas"],
      severity: "medium",
      isL1Interference: false,
    },
    {
      type: "gender_agreement",
      count: 2,
      examples: ["el problema grande → el problema grande (self-corrected)"],
      severity: "low",
      isL1Interference: true,
    },
  ],
  suggestedActivities: [
    {
      title: "Subjunctive Wish Expressions",
      description:
        "Practice 'espero que', 'quiero que' constructions with business scenarios",
      durationMin: 10,
      category: "grammar",
      targetArea: "Subjunctive Mood",
    },
    {
      title: "Role Play: Client Meeting",
      description:
        "Simulate a first meeting with a Mexican business partner",
      durationMin: 15,
      category: "conversation",
      targetArea: "Business Meeting Phrases",
    },
    {
      title: "Minimal Pairs Drill",
      description: "pero/perro, caro/carro pronunciation practice",
      durationMin: 5,
      category: "pronunciation",
      targetArea: "R/RR Distinction",
    },
  ],
  srItemsDue: 8,
  srItemsPreview: [
    {
      word: "negociar",
      type: "verb",
      lastReviewed: "2026-01-10",
      repetitionCount: 3,
    },
    {
      word: "el contrato",
      type: "noun",
      lastReviewed: "2026-01-08",
      repetitionCount: 2,
    },
    {
      word: "proponer",
      type: "verb",
      lastReviewed: "2026-01-05",
      repetitionCount: 4,
    },
  ],
  goalProgress: {
    goalText: "Reach B2 proficiency by March",
    progressPct: 65,
    targetDate: "2026-03-01",
    status: "on_track",
  },
  engagementTrend: "improving",
  engagementSignals: [
    {
      type: "homework",
      value: "3/3",
      concern: false,
      description: "Completed all homework this week",
    },
    {
      type: "practice",
      value: 45,
      concern: false,
      description: "45 minutes of AI practice this week",
    },
    {
      type: "attendance",
      value: "100%",
      concern: false,
      description: "Attended all scheduled lessons",
    },
  ],
  lessonsAnalyzed: 12,
  lastLessonSummary:
    "Focused on travel vocabulary and airport scenarios. Maria showed excellent retention of new phrases and self-corrected gender agreement errors.",
  lastLessonDate: "2026-01-10",
  proficiencyLevel: "B1 Intermediate",
  nativeLanguage: "English",
  targetLanguage: "Spanish",
  generatedAt: new Date().toISOString(),
  viewedAt: null,
  dismissedAt: null,
  student: {
    id: "demo-student",
    fullName: "Maria Thompson",
    email: "demo@example.com",
  },
  booking: {
    id: "demo-booking",
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    service: {
      name: "Standard Lesson",
      durationMinutes: 55,
    },
  },
};
