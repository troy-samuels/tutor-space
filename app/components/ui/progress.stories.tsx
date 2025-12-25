import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100 },
      description: "Progress value (0-100)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const Empty: Story = {
  args: {
    value: 0,
  },
};

export const Complete: Story = {
  args: {
    value: 100,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[300px]">
      <div className="flex justify-between text-sm">
        <span>Progress</span>
        <span className="text-muted-foreground">60%</span>
      </div>
      <Progress value={60} />
    </div>
  ),
};

export const LearningGoal: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <h3 className="font-medium">Learning Goals</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Complete 100 lessons</span>
            <span className="text-muted-foreground">75/100</span>
          </div>
          <Progress value={75} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Reach B2 level</span>
            <span className="text-muted-foreground">40%</span>
          </div>
          <Progress value={40} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Master 1000 words</span>
            <span className="text-muted-foreground">632/1000</span>
          </div>
          <Progress value={63.2} />
        </div>
      </div>
    </div>
  ),
};

export const Colored: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div className="space-y-2">
        <span className="text-sm">Default</span>
        <Progress value={60} />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Success</span>
        <Progress value={80} className="[&>div]:bg-green-500" />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Warning</span>
        <Progress value={50} className="[&>div]:bg-yellow-500" />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Error</span>
        <Progress value={30} className="[&>div]:bg-destructive" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-[300px]">
      <div className="space-y-2">
        <span className="text-sm">Small</span>
        <Progress value={60} className="h-1" />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Default</span>
        <Progress value={60} />
      </div>
      <div className="space-y-2">
        <span className="text-sm">Large</span>
        <Progress value={60} className="h-4" />
      </div>
    </div>
  ),
};

export const SkillAssessment: Story = {
  render: () => (
    <div className="space-y-4 w-[350px] p-4 border rounded-lg">
      <h3 className="font-medium">Skill Assessment</h3>
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Speaking</span>
            <span className="text-muted-foreground">Advanced</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Listening</span>
            <span className="text-muted-foreground">Intermediate</span>
          </div>
          <Progress value={65} className="h-2" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Reading</span>
            <span className="text-muted-foreground">Intermediate</span>
          </div>
          <Progress value={70} className="h-2" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Writing</span>
            <span className="text-muted-foreground">Beginner</span>
          </div>
          <Progress value={40} className="h-2" />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Grammar</span>
            <span className="text-muted-foreground">Intermediate</span>
          </div>
          <Progress value={55} className="h-2" />
        </div>
      </div>
    </div>
  ),
};

export const PackageUsage: Story = {
  render: () => (
    <div className="p-4 border rounded-lg w-[300px] space-y-3">
      <div className="flex justify-between items-center">
        <span className="font-medium">Package Usage</span>
        <span className="text-sm text-muted-foreground">7/10 lessons</span>
      </div>
      <Progress value={70} />
      <p className="text-xs text-muted-foreground">
        3 lessons remaining in your package
      </p>
    </div>
  ),
};
