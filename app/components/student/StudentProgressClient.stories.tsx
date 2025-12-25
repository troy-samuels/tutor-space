import type { Meta, StoryObj } from "@storybook/react";
import { StudentProgressClient } from "@/app/student/progress/StudentProgressClient";
import {
  mockLearningStats,
  mockNewStudentStats,
  mockLearningGoals,
  mockAssessments,
  mockLessonNotes,
  mockHomeworkAssignments,
  mockStudentPracticeData,
  mockStudentPracticeDataEmpty,
} from "@/components/student/__mocks__/student-data";
import type { LearningGoal, ProficiencyAssessment } from "@/lib/actions/progress";

// Mock drill data for stories
const mockDrillCounts = {
  pending: 5,
  completed: 12,
  total: 17,
};

const mockPendingDrills = [
  {
    id: "drill-1",
    recording_id: "recording-1",
    student_id: "student-1",
    tutor_id: "tutor-1",
    booking_id: "booking-1",
    homework_assignment_id: null,
    drill_type: "vocabulary" as const,
    status: "pending" as const,
    focus_area: "Basic vocabulary",
    due_date: null,
    is_completed: false,
    completed_at: null,
    content: {
      type: "match" as const,
      prompt: "Match the Spanish words with their English translations",
      data: {
        pairs: [
          { id: "1", left: "la mesa", right: "the table" },
          { id: "2", left: "la silla", right: "the chair" },
        ],
      },
    },
    created_at: new Date().toISOString(),
    tutor_name: "María García",
    lesson_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "drill-2",
    recording_id: "recording-1",
    student_id: "student-1",
    tutor_id: "tutor-1",
    booking_id: "booking-1",
    homework_assignment_id: null,
    drill_type: "grammar" as const,
    status: "pending" as const,
    focus_area: "Verb conjugation",
    due_date: null,
    is_completed: false,
    completed_at: null,
    content: {
      type: "gap-fill" as const,
      prompt: "Fill in the blank with the correct verb form",
      data: {
        sentence: "Yo ___ español todos los días.",
        answer: "hablo",
        options: ["hablo", "hablas", "habla", "hablamos"],
      },
    },
    created_at: new Date().toISOString(),
    tutor_name: "María García",
    lesson_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockReviewableTutors = [
  {
    tutorId: "tutor-1",
    tutorName: "María García",
    tutorAvatarUrl: null,
    tutorUsername: "maria-garcia",
    tutorSiteId: "site-1",
    completedLessonsCount: 8,
    lastLessonDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hasExistingReview: false,
    existingReview: undefined,
  },
];

const meta: Meta<typeof StudentProgressClient> = {
  title: "Student/StudentProgressClient",
  component: StudentProgressClient,
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "warm",
      values: [
        { name: "warm", value: "#FDF8F5" },
        { name: "white", value: "#ffffff" },
      ],
    },
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof StudentProgressClient>;

/**
 * Full dashboard with all sections populated.
 * Shows the complete student progress experience.
 */
export const FullDashboard: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals,
    assessments: mockAssessments,
    recentNotes: mockLessonNotes,
    homework: mockHomeworkAssignments,
    practiceData: mockStudentPracticeData,
    drillCounts: mockDrillCounts,
    pendingDrills: mockPendingDrills,
    reviewableTutors: mockReviewableTutors,
  },
};

/**
 * New student with minimal data.
 * First lesson just completed, no goals or assessments yet.
 */
export const NewStudent: Story = {
  args: {
    stats: mockNewStudentStats,
    goals: [],
    assessments: [],
    recentNotes: [],
    homework: [],
    practiceData: mockStudentPracticeDataEmpty,
  },
};

/**
 * Active learner with strong engagement.
 * Multiple goals, drills, and AI practice sessions.
 */
export const ActiveLearner: Story = {
  args: {
    stats: {
      id: "stats-active",
      student_id: "student-1",
      tutor_id: "tutor-1",
      total_lessons: 15,
      total_minutes: 750,
      lessons_this_month: 4,
      minutes_this_month: 200,
      current_streak: 5,
      longest_streak: 8,
      last_lesson_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      messages_sent: 96,
      homework_completed: 12,
    },
    goals: mockLearningGoals.filter((g) => g.status === "active"),
    assessments: mockAssessments,
    recentNotes: mockLessonNotes.slice(0, 2),
    homework: mockHomeworkAssignments.slice(0, 3),
    practiceData: mockStudentPracticeData,
    drillCounts: {
      pending: 3,
      completed: 25,
      total: 28,
    },
    pendingDrills: mockPendingDrills,
  },
};

/**
 * Goal-focused view with multiple active learning goals.
 * Shows progress tracking towards specific objectives.
 */
export const GoalFocused: Story = {
  args: {
    stats: mockLearningStats,
    goals: [
      ...mockLearningGoals.filter((g) => g.status === "active"),
      {
        id: "goal-5",
        student_id: "student-1",
        tutor_id: "tutor-1",
        title: "Complete 10 AI practice sessions",
        description: "Build conversational fluency through regular practice",
        target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        progress_percentage: 30,
        status: "active" as const,
        completed_at: null,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    assessments: mockAssessments.slice(0, 4),
    recentNotes: mockLessonNotes.slice(0, 1),
    homework: mockHomeworkAssignments.slice(0, 2),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Homework-heavy view.
 * Student with multiple pending assignments.
 */
export const HomeworkFocused: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals.slice(0, 2),
    assessments: mockAssessments.slice(0, 3),
    recentNotes: mockLessonNotes.slice(0, 1),
    homework: mockHomeworkAssignments,
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Without AI Practice subscription.
 * Shows the freemium CTA for AI practice.
 */
export const WithoutAIPractice: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals.slice(0, 2),
    assessments: mockAssessments,
    recentNotes: mockLessonNotes,
    homework: mockHomeworkAssignments.slice(0, 2),
    practiceData: mockStudentPracticeDataEmpty,
  },
};

/**
 * With reviewable tutors prompt.
 * Shows the review prompt section for tutors.
 */
export const WithReviewPrompt: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals.slice(0, 2),
    assessments: mockAssessments.slice(0, 4),
    recentNotes: mockLessonNotes.slice(0, 2),
    homework: mockHomeworkAssignments.slice(0, 2),
    practiceData: mockStudentPracticeData,
    reviewableTutors: mockReviewableTutors,
  },
};

/**
 * With pending drills.
 * Shows the drill progress card with pending exercises.
 */
export const WithDrills: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals.slice(0, 2),
    assessments: mockAssessments.slice(0, 4),
    recentNotes: mockLessonNotes.slice(0, 1),
    homework: mockHomeworkAssignments.slice(0, 2),
    practiceData: mockStudentPracticeData,
    drillCounts: mockDrillCounts,
    pendingDrills: mockPendingDrills,
  },
};

/**
 * Proficiency assessments showcase.
 * Shows all skill areas with different levels.
 */
export const SkillLevelsShowcase: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals.slice(0, 1),
    assessments: [
      {
        id: "assess-speaking",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "speaking" as const,
        level: "upper_intermediate" as const,
        score: null,
        notes: "Excellent conversational skills, natural flow",
        assessed_at: new Date().toISOString(),
      },
      {
        id: "assess-listening",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "listening" as const,
        level: "advanced" as const,
        score: null,
        notes: "Can understand native speakers at full speed",
        assessed_at: new Date().toISOString(),
      },
      {
        id: "assess-reading",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "reading" as const,
        level: "intermediate" as const,
        score: null,
        notes: "Good comprehension of written texts",
        assessed_at: new Date().toISOString(),
      },
      {
        id: "assess-writing",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "writing" as const,
        level: "elementary" as const,
        score: null,
        notes: "Needs more practice with written expression",
        assessed_at: new Date().toISOString(),
      },
      {
        id: "assess-grammar",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "grammar" as const,
        level: "intermediate" as const,
        score: null,
        notes: "Solid grasp of common structures",
        assessed_at: new Date().toISOString(),
      },
      {
        id: "assess-vocabulary",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "vocabulary" as const,
        level: "proficient" as const,
        score: null,
        notes: "Extensive vocabulary in multiple topics",
        assessed_at: new Date().toISOString(),
      },
      {
        id: "assess-pronunciation",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "pronunciation" as const,
        level: "beginner" as const,
        score: null,
        notes: "Working on accent reduction",
        assessed_at: new Date().toISOString(),
      },
    ],
    recentNotes: mockLessonNotes.slice(0, 1),
    homework: [],
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Rich lesson notes display.
 * Multiple lesson notes with full feedback.
 */
export const LessonNotesShowcase: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals.slice(0, 1),
    assessments: mockAssessments.slice(0, 3),
    recentNotes: [
      {
        id: "note-detailed",
        booking_id: "booking-1",
        tutor_id: "tutor-1",
        student_id: "student-1",
        topics_covered: ["Subjunctive mood", "Expressing wishes", "Polite requests"],
        vocabulary_introduced: ["ojalá", "esperar que", "recomendar que", "es importante que", "quisiera"],
        grammar_points: ["Subjunctive triggers", "Present subjunctive conjugation", "Conditional for politeness"],
        homework: null,
        strengths: "Natural conversational flow, good progress with irregular forms",
        areas_to_improve: "More practice with emotional expressions",
        student_visible_notes: "Excellent progress on the subjunctive! You're starting to use it naturally in conversation. Keep practicing the irregular forms.",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      ...mockLessonNotes.slice(0, 2),
    ],
    homework: mockHomeworkAssignments.slice(0, 2),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Minimal stats view.
 * Shows dashboard with null stats (edge case).
 */
export const NullStats: Story = {
  args: {
    stats: null,
    goals: [],
    assessments: [],
    recentNotes: [],
    homework: [],
  },
};

/**
 * Completed goals celebration.
 * Shows completed goals alongside active ones.
 */
export const WithCompletedGoals: Story = {
  args: {
    stats: mockLearningStats,
    goals: mockLearningGoals,
    assessments: mockAssessments.slice(0, 4),
    recentNotes: mockLessonNotes.slice(0, 2),
    homework: mockHomeworkAssignments.slice(0, 2),
    practiceData: mockStudentPracticeData,
  },
};
