import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Label } from "./label";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="language">Language</Label>
      <Select>
        <SelectTrigger id="language" className="w-[200px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Spanish</SelectItem>
          <SelectItem value="fr">French</SelectItem>
          <SelectItem value="de">German</SelectItem>
          <SelectItem value="pt">Portuguese</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const TimezoneSelector: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select timezone" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="america/new_york">New York (EST)</SelectItem>
        <SelectItem value="america/los_angeles">Los Angeles (PST)</SelectItem>
        <SelectItem value="america/chicago">Chicago (CST)</SelectItem>
        <SelectItem value="europe/london">London (GMT)</SelectItem>
        <SelectItem value="europe/paris">Paris (CET)</SelectItem>
        <SelectItem value="europe/berlin">Berlin (CET)</SelectItem>
        <SelectItem value="asia/tokyo">Tokyo (JST)</SelectItem>
        <SelectItem value="asia/shanghai">Shanghai (CST)</SelectItem>
        <SelectItem value="asia/seoul">Seoul (KST)</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="es">
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="es">Spanish</SelectItem>
        <SelectItem value="fr">French</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Disabled" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option">Option</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-full max-w-sm">
        <SelectValue placeholder="Select a service" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="30min">30 Minute Lesson - $25</SelectItem>
        <SelectItem value="60min">60 Minute Lesson - $45</SelectItem>
        <SelectItem value="90min">90 Minute Lesson - $60</SelectItem>
        <SelectItem value="trial">Trial Lesson (Free)</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const LessonTypeSelector: Story = {
  render: () => (
    <div className="space-y-2 w-[300px]">
      <Label>Lesson Type</Label>
      <Select defaultValue="conversation">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="conversation">Conversation Practice</SelectItem>
          <SelectItem value="grammar">Grammar Focus</SelectItem>
          <SelectItem value="vocabulary">Vocabulary Building</SelectItem>
          <SelectItem value="business">Business Language</SelectItem>
          <SelectItem value="exam">Exam Preparation</SelectItem>
          <SelectItem value="pronunciation">Pronunciation Training</SelectItem>
        </SelectContent>
      </Select>
      <p className="text-sm text-muted-foreground">
        Choose the type of lesson you want to schedule.
      </p>
    </div>
  ),
};

export const InForm: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <div className="space-y-2">
        <Label>Student Level</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
            <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
            <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Preferred Time</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select time slot" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning (8am - 12pm)</SelectItem>
            <SelectItem value="afternoon">Afternoon (12pm - 5pm)</SelectItem>
            <SelectItem value="evening">Evening (5pm - 9pm)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};
