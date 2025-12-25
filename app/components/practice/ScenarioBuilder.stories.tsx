import type { Meta, StoryObj } from "@storybook/react";
import { ScenarioBuilder, PracticeScenario } from "./ScenarioBuilder";

const meta: Meta<typeof ScenarioBuilder> = {
  title: "Practice/ScenarioBuilder",
  component: ScenarioBuilder,
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Practice Scenarios</h1>
          <p className="text-muted-foreground">Create conversation templates for AI practice assignments</p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ScenarioBuilder>;

// Sample scenarios for testing
const sampleScenarios: PracticeScenario[] = [
  {
    id: "1",
    title: "Restaurant Ordering",
    description: "Practice ordering food and drinks at a restaurant, including asking for recommendations and handling special requests.",
    language: "Spanish",
    level: "intermediate",
    topic: "Food & Dining",
    system_prompt: "You are a friendly waiter at a Spanish restaurant...",
    vocabulary_focus: ["menú", "pedir", "cuenta", "bebida"],
    grammar_focus: ["conditional tense", "polite requests"],
    max_messages: 20,
    is_active: true,
    times_used: 12,
    created_at: "2024-12-01T10:00:00Z",
  },
  {
    id: "2",
    title: "Job Interview Practice",
    description: "Prepare for job interviews by practicing common questions and professional responses.",
    language: "Spanish",
    level: "advanced",
    topic: "Business & Career",
    system_prompt: "You are a hiring manager conducting an interview...",
    vocabulary_focus: ["experiencia", "habilidades", "logros"],
    grammar_focus: ["past tense", "subjunctive mood"],
    max_messages: 30,
    is_active: true,
    times_used: 8,
    created_at: "2024-12-05T14:00:00Z",
  },
  {
    id: "3",
    title: "Travel Directions",
    description: "Practice asking for and giving directions in a new city.",
    language: "French",
    level: "beginner",
    topic: "Travel",
    system_prompt: "You are a helpful local giving directions...",
    vocabulary_focus: ["tourner", "droite", "gauche", "tout droit"],
    grammar_focus: ["imperative mood"],
    max_messages: 15,
    is_active: false,
    times_used: 3,
    created_at: "2024-11-20T09:00:00Z",
  },
];

/**
 * Empty state - no scenarios yet
 * Shows the warm welcome card matching AI Practice design
 */
export const EmptyState: Story = {
  args: {
    scenarios: [],
  },
};

/**
 * With active scenarios
 * Shows the scenario cards in a grid layout
 */
export const WithScenarios: Story = {
  args: {
    scenarios: sampleScenarios,
  },
};

/**
 * Only active scenarios
 * Shows just the active scenario cards
 */
export const OnlyActive: Story = {
  args: {
    scenarios: sampleScenarios.filter((s) => s.is_active),
  },
};

/**
 * Single scenario
 * Shows minimal state with one scenario
 */
export const SingleScenario: Story = {
  args: {
    scenarios: [sampleScenarios[0]],
  },
};
