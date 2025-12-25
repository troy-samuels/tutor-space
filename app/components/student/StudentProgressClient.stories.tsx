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
    type: "match" as const,
    content: {
      pairs: [
        { id: "1", term: "la mesa", definition: "the table" },
        { id: "2", term: "la silla", definition: "the chair" },
      ],
    },
    difficulty: "intermediate" as const,
    created_at: new Date().toISOString(),
    lesson_id: "lesson-1",
  },
  {
    id: "drill-2",
    type: "gap_fill" as const,
    content: {
      sentence: "Yo ___ español todos los días.",
      answer: "hablo",
      options: ["hablo", "hablas", "habla", "hablamos"],
    },
    difficulty: "beginner" as const,
    created_at: new Date().toISOString(),
    lesson_id: "lesson-1",
  },
];

const mockReviewableTutors = [
  {
    tutorId: "tutor-1",
    tutorName: "María García",
    tutorAvatarUrl: null,
    tutorUsername: "maria-garcia",
    completedLessonsCount: 8,
    lastLessonDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    hasExistingReview: false,
    existingReview: null,
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
      total_lessons: 15,
      total_minutes: 750,
      homework_completed: 12,
      current_streak: 5,
      longest_streak: 8,
      practice_sessions_completed: 8,
      practice_minutes: 120,
      practice_messages_sent: 96,
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
        progress: 30,
        status: "active" as const,
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
        skill_area: "speaking",
        level: "upper_intermediate",
        notes: "Excellent conversational skills, natural flow",
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "assess-listening",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "listening",
        level: "advanced",
        notes: "Can understand native speakers at full speed",
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "assess-reading",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "reading",
        level: "intermediate",
        notes: "Good comprehension of written texts",
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "assess-writing",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "writing",
        level: "elementary",
        notes: "Needs more practice with written expression",
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "assess-grammar",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "grammar",
        level: "intermediate",
        notes: "Solid grasp of common structures",
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "assess-vocabulary",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "vocabulary",
        level: "proficient",
        notes: "Extensive vocabulary in multiple topics",
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      {
        id: "assess-pronunciation",
        student_id: "student-1",
        tutor_id: "tutor-1",
        skill_area: "pronunciation",
        level: "beginner",
        notes: "Working on accent reduction",
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ] as ProficiencyAssessment[],
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
        vocabulary: ["ojalá", "esperar que", "recomendar que", "es importante que", "quisiera"],
        grammar_points: ["Subjunctive triggers", "Present subjunctive conjugation", "Conditional for politeness"],
        student_feedback: "Excellent progress on the subjunctive! You're starting to use it naturally in conversation. Keep practicing the irregular forms.",
        next_lesson_focus: "More subjunctive practice with different triggers and emotional expressions",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
