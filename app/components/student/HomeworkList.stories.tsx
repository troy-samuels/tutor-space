import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeworkList } from "./HomeworkList";
import {
  mockHomeworkAssignments,
  mockHomeworkWithAudioInstruction,
  mockStudentPracticeData,
} from "./__mocks__/student-data";
import type { HomeworkAssignment } from "@/lib/actions/progress";

const meta: Meta<typeof HomeworkList> = {
  title: "Student/HomeworkList",
  component: HomeworkList,
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "warm",
      values: [
        { name: "warm", value: "#FDF8F5" },
        { name: "white", value: "#ffffff" },
      ],
    },
    // Disable server actions for Storybook
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HomeworkList>;

/**
 * Mix of open and completed homework assignments.
 * Shows the full homework workflow with various statuses.
 */
export const WithAssignments: Story = {
  args: {
    homework: mockHomeworkAssignments,
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Empty state when no homework has been assigned.
 * Shows a prompt that the tutor will add assignments.
 */
export const EmptyState: Story = {
  args: {
    homework: [],
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Homework that is past due (overdue).
 * Shows the due date in warning color.
 */
export const OverdueHomework: Story = {
  args: {
    homework: [
      {
        id: "hw-overdue",
        tutor_id: "tutor-1",
        student_id: "student-1",
        booking_id: null,
        title: "Spanish Conjugation Practice",
        instructions: "Complete the verb conjugation worksheet. This was due yesterday!",
        status: "in_progress",
        due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: [
          { label: "Conjugation Worksheet", url: "#", type: "pdf" as const },
        ],
        audio_instruction_url: null,
        student_notes: null,
        tutor_notes: null,
        completed_at: null,
        submitted_at: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        topic: "Grammar",
        practice_assignment_id: null,
      },
      ...mockHomeworkAssignments.slice(0, 2),
    ],
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Homework with various attachment types.
 * Shows PDFs, audio, video, and external links.
 */
export const WithAttachments: Story = {
  args: {
    homework: [
      {
        id: "hw-attachments",
        tutor_id: "tutor-1",
        student_id: "student-1",
        booking_id: null,
        title: "Multi-Media Lesson Review",
        instructions: "Review all the materials from our last lesson. Complete the worksheet and watch the video.",
        status: "assigned",
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: [
          { label: "Lesson Notes PDF", url: "#", type: "pdf" as const },
          { label: "Practice Audio", url: "#", type: "file" as const },
          { label: "Grammar Explanation Video", url: "#", type: "video" as const },
          { label: "Interactive Quiz", url: "https://example.com", type: "link" as const },
          { label: "Vocabulary Flashcards", url: "#", type: "image" as const },
        ],
        audio_instruction_url: null,
        student_notes: null,
        tutor_notes: null,
        completed_at: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        topic: "Lesson Review",
        practice_assignment_id: null,
      },
    ],
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Homework with audio instruction from tutor.
 * Shows the audio playback control.
 */
export const WithAudioInstructions: Story = {
  args: {
    homework: [mockHomeworkWithAudioInstruction, mockHomeworkAssignments[0]],
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Submitted homework awaiting tutor review.
 * Shows the "Pending review" badge.
 */
export const SubmittedPendingReview: Story = {
  args: {
    homework: [
      mockHomeworkAssignments.find((h) => h.status === "submitted" && h.latest_submission?.review_status === "pending")!,
      mockHomeworkAssignments[0],
    ].filter(Boolean),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Homework that needs revision based on tutor feedback.
 * Shows feedback with "Needs revision" badge.
 */
export const NeedsRevision: Story = {
  args: {
    homework: [
      mockHomeworkAssignments.find((h) => h.latest_submission?.review_status === "needs_revision")!,
      mockHomeworkAssignments[0],
    ].filter(Boolean),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Homework linked to AI Practice assignment.
 * Shows the practice button for integrated learning.
 */
export const WithLinkedPractice: Story = {
  args: {
    homework: mockHomeworkAssignments.filter((h) => h.practice_assignment_id),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Homework without practice subscription.
 * Shows "Unlock practice" CTA for homework with linked practice.
 */
export const WithoutPracticeSubscription: Story = {
  args: {
    homework: mockHomeworkAssignments.filter((h) => h.practice_assignment_id),
    practiceData: {
      ...mockStudentPracticeData,
      isSubscribed: false,
    },
  },
};

/**
 * Only completed homework shown.
 * Shows the "Recently completed" section.
 */
export const OnlyCompleted: Story = {
  args: {
    homework: mockHomeworkAssignments.filter((h) => h.status === "completed"),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Completed homework with tutor feedback.
 * Shows how reviewed homework appears with feedback.
 */
export const CompletedWithFeedback: Story = {
  args: {
    homework: [
      mockHomeworkAssignments.find((h) => h.latest_submission?.review_status === "reviewed")!,
    ].filter(Boolean),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * Custom title and description.
 * Shows component flexibility.
 */
export const CustomTitleDescription: Story = {
  args: {
    homework: mockHomeworkAssignments.slice(0, 2),
    practiceData: mockStudentPracticeData,
    title: "Weekly Assignments",
    description: "Complete these before our lesson on Friday.",
  },
};

/**
 * Homework with student notes.
 * Shows how student notes appear (from student's perspective).
 */
export const WithStudentNotes: Story = {
  args: {
    homework: [
      mockHomeworkAssignments.find((h) => h.student_notes)!,
      mockHomeworkAssignments[0],
    ].filter(Boolean),
    practiceData: mockStudentPracticeData,
  },
};

/**
 * All homework statuses represented.
 * Shows assigned, in_progress, submitted, and completed states.
 */
export const AllStatuses: Story = {
  args: {
    homework: [
      {
        id: "hw-assigned",
        tutor_id: "tutor-1",
        student_id: "student-1",
        booking_id: null,
        title: "New Assignment",
        instructions: "This is a newly assigned task.",
        status: "assigned" as const,
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: [],
        audio_instruction_url: null,
        student_notes: null,
        tutor_notes: null,
        completed_at: null,
        submitted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        topic: null,
        practice_assignment_id: null,
      },
      {
        id: "hw-in-progress",
        tutor_id: "tutor-1",
        student_id: "student-1",
        booking_id: null,
        title: "Work in Progress",
        instructions: "You've started working on this.",
        status: "in_progress" as const,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: [],
        audio_instruction_url: null,
        student_notes: "I'm halfway through this",
        tutor_notes: null,
        completed_at: null,
        submitted_at: null,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        topic: null,
        practice_assignment_id: null,
      },
      {
        id: "hw-submitted",
        tutor_id: "tutor-1",
        student_id: "student-1",
        booking_id: null,
        title: "Awaiting Review",
        instructions: "Submitted and waiting for feedback.",
        status: "submitted" as const,
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: [],
        audio_instruction_url: null,
        student_notes: null,
        tutor_notes: null,
        completed_at: null,
        submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        topic: null,
        practice_assignment_id: null,
        latest_submission: {
          id: "sub-1",
          homework_id: "hw-submitted",
          tutor_feedback: null,
          review_status: "pending" as const,
          reviewed_at: null,
          submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      {
        id: "hw-completed",
        tutor_id: "tutor-1",
        student_id: "student-1",
        booking_id: null,
        title: "Completed Task",
        instructions: "This one is done!",
        status: "completed" as const,
        due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        attachments: [],
        audio_instruction_url: null,
        student_notes: null,
        tutor_notes: null,
        completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        topic: null,
        practice_assignment_id: null,
        latest_submission: {
          id: "sub-2",
          homework_id: "hw-completed",
          tutor_feedback: "Great work on this assignment!",
          review_status: "reviewed" as const,
          reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ] as HomeworkAssignment[],
    practiceData: mockStudentPracticeData,
  },
};
