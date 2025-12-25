import type { Meta, StoryObj } from "@storybook/react";
import { AIPracticeCard } from "./AIPracticeCard";
import {
  mockPracticeAssignments,
  mockPracticeStats,
  mockPracticeUsage,
  mockHighUsage,
} from "./__mocks__/student-data";

const meta: Meta<typeof AIPracticeCard> = {
  title: "Student/AIPracticeCard",
  component: AIPracticeCard,
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "warm",
      values: [
        { name: "warm", value: "#FDF8F5" },
        { name: "white", value: "#ffffff" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AIPracticeCard>;

/**
 * Shows practice assignments with usage stats and active assignments.
 * This is the typical view for a student with AI Practice enabled.
 */
export const WithAssignments: Story = {
  args: {
    isSubscribed: true,
    assignments: mockPracticeAssignments,
    stats: mockPracticeStats,
    tutorName: "Maria Garcia",
    studentId: "student-1",
    usage: mockPracticeUsage,
  },
};

/**
 * Empty state when no practice assignments have been assigned yet.
 * Shows a prompt that the tutor will assign scenarios.
 */
export const EmptyAssignments: Story = {
  args: {
    isSubscribed: true,
    assignments: [],
    stats: null,
    tutorName: "Maria Garcia",
    studentId: "student-1",
    usage: mockPracticeUsage,
  },
};

/**
 * Not subscribed state - shows the freemium onboarding CTA.
 * This is what students see before their tutor enables AI Practice.
 */
export const NotSubscribed: Story = {
  args: {
    isSubscribed: false,
    assignments: [],
    stats: null,
    tutorName: "Maria Garcia",
    studentId: "student-1",
  },
};

/**
 * Not subscribed without tutor name specified.
 * Shows generic "Your tutor" text.
 */
export const NotSubscribedNoTutor: Story = {
  args: {
    isSubscribed: false,
    assignments: [],
    stats: null,
    studentId: "student-1",
  },
};

/**
 * High usage state - usage bars show warning colors (amber/red).
 * This appears when the student is approaching their free tier limits.
 */
export const HighUsage: Story = {
  args: {
    isSubscribed: true,
    assignments: mockPracticeAssignments.slice(0, 2),
    stats: {
      sessions_completed: 12,
      practice_minutes: 180,
      messages_sent: 156,
    },
    tutorName: "Maria Garcia",
    studentId: "student-1",
    usage: mockHighUsage,
  },
};

/**
 * Shows completed assignments alongside active ones.
 * Displays the completed count and history link.
 */
export const WithCompletedAssignments: Story = {
  args: {
    isSubscribed: true,
    assignments: mockPracticeAssignments,
    stats: {
      sessions_completed: 5,
      practice_minutes: 75,
      messages_sent: 62,
    },
    tutorName: "Maria Garcia",
    studentId: "student-1",
    usage: mockPracticeUsage,
  },
};

/**
 * Shows multiple active assignments with different scenarios.
 * Demonstrates the variety of practice types available.
 */
export const MultipleScenarios: Story = {
  args: {
    isSubscribed: true,
    assignments: [
      {
        id: "pa-1",
        title: "Restaurant Practice",
        instructions: "Practice ordering food in Spanish",
        status: "assigned" as const,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        sessions_completed: 0,
        scenario: {
          id: "s1",
          title: "Restaurant Ordering",
          language: "Spanish",
          level: "intermediate",
          topic: "Food & Dining",
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "pa-2",
        title: "Travel Directions",
        instructions: "Ask for and give directions in French",
        status: "in_progress" as const,
        due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        sessions_completed: 1,
        scenario: {
          id: "s2",
          title: "Asking Directions",
          language: "French",
          level: "beginner",
          topic: "Travel",
        },
        created_at: new Date().toISOString(),
      },
      {
        id: "pa-3",
        title: "Business Meeting",
        instructions: "Practice professional conversation in German",
        status: "assigned" as const,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        sessions_completed: 0,
        scenario: {
          id: "s3",
          title: "Office Meeting",
          language: "German",
          level: "advanced",
          topic: "Business",
        },
        created_at: new Date().toISOString(),
      },
    ],
    stats: mockPracticeStats,
    tutorName: "Maria Garcia",
    studentId: "student-1",
    usage: mockPracticeUsage,
  },
};

/**
 * Shows usage with purchased blocks.
 * The student has exceeded their free tier and purchased additional blocks.
 */
export const WithPurchasedBlocks: Story = {
  args: {
    isSubscribed: true,
    assignments: mockPracticeAssignments.slice(0, 1),
    stats: {
      sessions_completed: 20,
      practice_minutes: 300,
      messages_sent: 245,
    },
    tutorName: "Maria Garcia",
    studentId: "student-1",
    usage: {
      audioSecondsUsed: 1800, // 30 minutes
      audioSecondsAllowance: 5400, // 45 + 45 = 90 minutes (1 block)
      textTurnsUsed: 400,
      textTurnsAllowance: 900, // 600 + 300 = 900 (1 block)
      blocksConsumed: 1,
      currentTierPriceCents: 500,
      periodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      percentAudioUsed: 33,
      percentTextUsed: 44,
      isFreeUser: false,
      audioSecondsRemaining: 3600,
      textTurnsRemaining: 500,
      canBuyBlocks: true,
      blockPriceCents: 500,
    },
  },
};

/**
 * Only completed assignments - shows empty active list with completed count.
 */
export const AllCompleted: Story = {
  args: {
    isSubscribed: true,
    assignments: [
      {
        ...mockPracticeAssignments[2],
        status: "completed" as const,
      },
      {
        id: "pa-4",
        title: "Past Tense Practice",
        instructions: "Practice past tense verbs",
        status: "completed" as const,
        due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        sessions_completed: 3,
        scenario: {
          id: "s4",
          title: "Grammar Practice",
          language: "Spanish",
          level: "intermediate",
          topic: "Grammar",
        },
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    stats: {
      sessions_completed: 5,
      practice_minutes: 75,
      messages_sent: 62,
    },
    tutorName: "Maria Garcia",
    studentId: "student-1",
    usage: mockPracticeUsage,
  },
};
