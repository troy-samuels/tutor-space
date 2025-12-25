import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Collapsible } from "./collapsible";
import { Badge } from "./badge";
import { Settings, Bell, CreditCard, Shield, HelpCircle } from "lucide-react";

const meta: Meta<typeof Collapsible> = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <div className="w-[400px]">
      <Collapsible title="Details">
        <p className="text-sm text-muted-foreground">
          This is the collapsible content. It can contain any elements you want.
        </p>
      </Collapsible>
    </div>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <div className="w-[400px]">
      <Collapsible title="Expanded by Default" defaultOpen>
        <p className="text-sm text-muted-foreground">
          This collapsible starts in the open state.
        </p>
      </Collapsible>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="w-[400px]">
      <Collapsible title="Settings" icon={<Settings className="h-4 w-4" />}>
        <p className="text-sm text-muted-foreground">
          Configure your account settings here.
        </p>
      </Collapsible>
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <div className="w-[400px]">
      <Collapsible
        title="Notifications"
        icon={<Bell className="h-4 w-4" />}
        badge={<Badge variant="destructive">5</Badge>}
      >
        <p className="text-sm text-muted-foreground">
          You have 5 unread notifications.
        </p>
      </Collapsible>
    </div>
  ),
};

export const SettingsGroup: Story = {
  render: () => (
    <div className="w-[400px] space-y-3">
      <Collapsible
        title="Account Settings"
        icon={<Settings className="h-4 w-4" />}
        defaultOpen
      >
        <div className="space-y-2 text-sm">
          <p>Email: maria@example.com</p>
          <p>Username: mariateaches</p>
          <p>Timezone: America/New_York</p>
        </div>
      </Collapsible>

      <Collapsible
        title="Billing"
        icon={<CreditCard className="h-4 w-4" />}
      >
        <div className="space-y-2 text-sm">
          <p>Plan: Pro ($29/month)</p>
          <p>Next billing: Jan 15, 2025</p>
        </div>
      </Collapsible>

      <Collapsible
        title="Security"
        icon={<Shield className="h-4 w-4" />}
      >
        <div className="space-y-2 text-sm">
          <p>Two-factor authentication: Enabled</p>
          <p>Last password change: 30 days ago</p>
        </div>
      </Collapsible>
    </div>
  ),
};

export const FAQSection: Story = {
  render: () => (
    <div className="w-[500px] space-y-3">
      <Collapsible
        title="How do I schedule a lesson?"
        icon={<HelpCircle className="h-4 w-4" />}
      >
        <p className="text-sm text-muted-foreground">
          Navigate to your calendar and click on an available time slot.
          Select the student and service type, then confirm the booking.
        </p>
      </Collapsible>

      <Collapsible
        title="How do I accept payments?"
        icon={<HelpCircle className="h-4 w-4" />}
      >
        <p className="text-sm text-muted-foreground">
          Connect your Stripe account in Settings &gt; Payments.
          Once connected, students can pay securely when booking.
        </p>
      </Collapsible>

      <Collapsible
        title="Can I offer trial lessons?"
        icon={<HelpCircle className="h-4 w-4" />}
      >
        <p className="text-sm text-muted-foreground">
          Yes! Create a service with a price of $0 and mark it as a trial.
          You can limit each student to one trial lesson.
        </p>
      </Collapsible>
    </div>
  ),
};
