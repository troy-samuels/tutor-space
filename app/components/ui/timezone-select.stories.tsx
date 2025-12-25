import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { TimezoneSelect } from "./timezone-select";
import { Label } from "./label";

const meta: Meta<typeof TimezoneSelect> = {
  title: "UI/TimezoneSelect",
  component: TimezoneSelect,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof TimezoneSelect>;

function TimezoneSelectDemo({
  initialValue = "",
  autoDetect = true,
  showCurrentTime = true,
  placeholder,
}: {
  initialValue?: string;
  autoDetect?: boolean;
  showCurrentTime?: boolean;
  placeholder?: string;
}) {
  const [timezone, setTimezone] = useState(initialValue);

  return (
    <div className="w-[300px]">
      <TimezoneSelect
        value={timezone}
        onChange={setTimezone}
        autoDetect={autoDetect}
        showCurrentTime={showCurrentTime}
        placeholder={placeholder}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <TimezoneSelectDemo />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="space-y-2 w-[300px]">
      <Label htmlFor="tz">Your Timezone</Label>
      <TimezoneSelectDemo />
    </div>
  ),
};

export const WithPreselectedValue: Story = {
  render: () => (
    <div className="space-y-2 w-[300px]">
      <Label>Timezone</Label>
      <TimezoneSelectDemo initialValue="Europe/London" autoDetect={false} />
    </div>
  ),
};

export const NoAutoDetect: Story = {
  render: () => (
    <div className="space-y-2 w-[300px]">
      <Label>Select Timezone</Label>
      <TimezoneSelectDemo
        autoDetect={false}
        placeholder="Choose your timezone"
      />
    </div>
  ),
};

export const WithoutCurrentTime: Story = {
  render: () => (
    <div className="space-y-2 w-[300px]">
      <Label>Timezone</Label>
      <TimezoneSelectDemo showCurrentTime={false} />
    </div>
  ),
};

export const InBookingForm: Story = {
  render: () => {
    const [timezone, setTimezone] = useState("");

    return (
      <div className="space-y-4 w-[350px] p-4 border rounded-lg">
        <h3 className="font-semibold">Book a Lesson</h3>

        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <input
            id="name"
            className="w-full h-10 px-3 rounded-md border"
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-2">
          <Label>Your Timezone</Label>
          <TimezoneSelect
            value={timezone}
            onChange={setTimezone}
            placeholder="Select your timezone"
          />
          <p className="text-xs text-muted-foreground">
            We'll show available times in your local timezone.
          </p>
        </div>
      </div>
    );
  },
};

export const ComparisonView: Story = {
  render: () => {
    const [studentTz, setStudentTz] = useState("America/New_York");
    const [tutorTz, setTutorTz] = useState("Europe/Paris");

    return (
      <div className="space-y-4 w-[350px]">
        <div className="space-y-2">
          <Label>Student Timezone</Label>
          <TimezoneSelect
            value={studentTz}
            onChange={setStudentTz}
            autoDetect={false}
          />
        </div>

        <div className="space-y-2">
          <Label>Tutor Timezone</Label>
          <TimezoneSelect
            value={tutorTz}
            onChange={setTutorTz}
            autoDetect={false}
          />
        </div>

        <div className="p-3 rounded-lg bg-muted/50 text-sm">
          <p className="text-muted-foreground">
            When it's 10:00 AM for the student, it will be shown in the tutor's
            local time automatically.
          </p>
        </div>
      </div>
    );
  },
};
