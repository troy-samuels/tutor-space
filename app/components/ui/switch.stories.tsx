import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Switch } from "./switch";
import { Label } from "./label";

const meta: Meta<typeof Switch> = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      control: "boolean",
      description: "Disable the switch",
    },
    checked: {
      control: "boolean",
      description: "Controlled checked state",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => <Switch id="default" />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Checked: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="checked" defaultChecked />
      <Label htmlFor="checked">Enabled</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off" className="text-muted-foreground">
          Disabled Off
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on" className="text-muted-foreground">
          Disabled On
        </Label>
      </div>
    </div>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <div className="flex items-start space-x-4">
      <Switch id="dark-mode" className="mt-1" />
      <div className="space-y-1">
        <Label htmlFor="dark-mode">Dark mode</Label>
        <p className="text-sm text-muted-foreground">
          Enable dark mode for a comfortable viewing experience at night.
        </p>
      </div>
    </div>
  ),
};

export const SettingsGroup: Story = {
  render: () => (
    <div className="space-y-6 w-[400px]">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Email notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive emails about your account activity
          </p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Push notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive push notifications on your device
          </p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Marketing emails</Label>
          <p className="text-sm text-muted-foreground">
            Receive emails about new features and offers
          </p>
        </div>
        <Switch />
      </div>
    </div>
  ),
};

export const ServiceToggle: Story = {
  render: () => (
    <div className="space-y-4 w-[350px]">
      <h3 className="text-lg font-medium">Service Visibility</h3>
      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Conversation Practice</p>
            <p className="text-sm text-muted-foreground">60 min - $45</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Grammar Focus</p>
            <p className="text-sm text-muted-foreground">45 min - $35</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Trial Lesson</p>
            <p className="text-sm text-muted-foreground">30 min - Free</p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  ),
};

export const CompactList: Story = {
  render: () => (
    <div className="space-y-3 w-[300px]">
      <div className="flex items-center justify-between py-2 border-b">
        <Label className="text-sm">Auto-approve students</Label>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between py-2 border-b">
        <Label className="text-sm">Allow rescheduling</Label>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between py-2 border-b">
        <Label className="text-sm">Sync to Google Calendar</Label>
        <Switch />
      </div>
      <div className="flex items-center justify-between py-2">
        <Label className="text-sm">Public profile</Label>
        <Switch defaultChecked />
      </div>
    </div>
  ),
};
