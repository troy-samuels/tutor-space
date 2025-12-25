import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./textarea";
import { Label } from "./label";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text",
    },
    disabled: {
      control: "boolean",
      description: "Disable the textarea",
    },
    rows: {
      control: { type: "number", min: 1, max: 20 },
      description: "Number of visible rows",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here.",
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label htmlFor="bio">Bio</Label>
      <Textarea id="bio" placeholder="Tell us about yourself..." />
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label htmlFor="description">Description</Label>
      <Textarea id="description" placeholder="Describe your lesson..." />
      <p className="text-sm text-muted-foreground">
        Provide a brief description of the lesson content.
      </p>
    </div>
  ),
};

export const CustomRows: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div className="space-y-2">
        <Label>3 rows (default)</Label>
        <Textarea rows={3} placeholder="3 rows..." />
      </div>
      <div className="space-y-2">
        <Label>6 rows</Label>
        <Textarea rows={6} placeholder="6 rows..." />
      </div>
      <div className="space-y-2">
        <Label>10 rows</Label>
        <Textarea rows={10} placeholder="10 rows..." />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: "Disabled textarea",
    disabled: true,
  },
};

export const WithCharacterCount: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label htmlFor="limited">Message</Label>
      <Textarea
        id="limited"
        placeholder="Write your message..."
        maxLength={500}
        defaultValue="This is an example message that shows how character counting works."
      />
      <div className="flex justify-end">
        <span className="text-sm text-muted-foreground">67/500</span>
      </div>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label htmlFor="error-textarea">Notes</Label>
      <Textarea
        id="error-textarea"
        placeholder="Add notes..."
        className="border-destructive focus-visible:ring-destructive"
      />
      <p className="text-sm text-destructive">Please enter at least 20 characters.</p>
    </div>
  ),
};

export const LessonNotes: Story = {
  render: () => (
    <div className="space-y-4 w-[400px]">
      <div className="space-y-2">
        <Label htmlFor="topics">Topics Covered</Label>
        <Textarea
          id="topics"
          placeholder="- Present tense conjugation&#10;- Vocabulary: food and dining&#10;- Conversation practice"
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="feedback">Student Feedback</Label>
        <Textarea
          id="feedback"
          placeholder="Provide feedback for the student..."
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          This feedback will be visible to the student.
        </p>
      </div>
    </div>
  ),
};

export const MessageComposer: Story = {
  render: () => (
    <div className="p-4 border rounded-lg w-[400px] space-y-3">
      <Textarea
        placeholder="Type your message..."
        rows={4}
        className="resize-none"
      />
      <div className="flex justify-between items-center">
        <button className="text-sm text-muted-foreground hover:text-foreground">
          Attach file
        </button>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
          Send
        </button>
      </div>
    </div>
  ),
};

export const Resizable: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label>Resizable (default)</Label>
      <Textarea placeholder="Drag the corner to resize..." />
    </div>
  ),
};

export const NoResize: Story = {
  render: () => (
    <div className="space-y-2 w-[350px]">
      <Label>Fixed size (no resize)</Label>
      <Textarea
        placeholder="Cannot be resized..."
        className="resize-none"
        rows={4}
      />
    </div>
  ),
};
