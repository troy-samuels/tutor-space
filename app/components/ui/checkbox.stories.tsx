import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./checkbox";
import { Label } from "./label";

const meta: Meta<typeof Checkbox> = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Disable the checkbox",
    },
    checked: {
      control: "boolean",
      description: "Controlled checked state",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  render: () => <Checkbox id="default" />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="checked" defaultChecked />
      <Label htmlFor="checked">Checked by default</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled" className="text-muted-foreground">
          Disabled unchecked
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked" className="text-muted-foreground">
          Disabled checked
        </Label>
      </div>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex items-start space-x-2">
      <Checkbox id="marketing" className="mt-1" />
      <div className="grid gap-1.5 leading-none">
        <Label htmlFor="marketing">Marketing emails</Label>
        <p className="text-sm text-muted-foreground">
          Receive emails about new features and special offers.
        </p>
      </div>
    </div>
  ),
};

export const CheckboxGroup: Story = {
  render: () => (
    <div className="space-y-4">
      <Label className="text-base">Notification preferences</Label>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox id="email" defaultChecked />
          <Label htmlFor="email">Email notifications</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="push" defaultChecked />
          <Label htmlFor="push">Push notifications</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="sms" />
          <Label htmlFor="sms">SMS notifications</Label>
        </div>
      </div>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="space-y-4">
        <Label className="text-base font-medium">Lesson Reminders</Label>
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox id="reminder-24h" defaultChecked className="mt-0.5" />
            <div>
              <Label htmlFor="reminder-24h">24 hours before</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded the day before your lesson
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="reminder-1h" defaultChecked className="mt-0.5" />
            <div>
              <Label htmlFor="reminder-1h">1 hour before</Label>
              <p className="text-sm text-muted-foreground">
                Get a last-minute reminder
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox id="reminder-15m" className="mt-0.5" />
            <div>
              <Label htmlFor="reminder-15m">15 minutes before</Label>
              <p className="text-sm text-muted-foreground">
                For that extra push
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const StudentLabels: Story = {
  render: () => (
    <div className="space-y-3 w-[250px]">
      <Label className="text-sm font-medium">Filter by label</Label>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="label-beginner" defaultChecked />
          <Label htmlFor="label-beginner" className="text-sm">Beginner</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="label-intermediate" defaultChecked />
          <Label htmlFor="label-intermediate" className="text-sm">Intermediate</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="label-advanced" />
          <Label htmlFor="label-advanced" className="text-sm">Advanced</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="label-exam" />
          <Label htmlFor="label-exam" className="text-sm">Exam Prep</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="label-business" />
          <Label htmlFor="label-business" className="text-sm">Business</Label>
        </div>
      </div>
    </div>
  ),
};
