import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "outline", "success", "destructive"],
      description: "Visual style variant",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
  },
};

export const Destructive: Story = {
  args: {
    children: "Destructive",
    variant: "destructive",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="destructive">Destructive</Badge>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Confirmed</Badge>
        <Badge variant="default">Pending</Badge>
        <Badge variant="secondary">Completed</Badge>
        <Badge variant="destructive">Cancelled</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">Active</Badge>
        <Badge variant="outline">Inactive</Badge>
        <Badge variant="default">New</Badge>
        <Badge variant="destructive">Expired</Badge>
      </div>
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="success" className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-current" />
        Online
      </Badge>
      <Badge variant="destructive" className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-current" />
        Offline
      </Badge>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="flex items-center gap-2 p-4 border rounded-lg w-fit">
      <span className="font-medium">Lesson Status:</span>
      <Badge variant="success">Confirmed</Badge>
    </div>
  ),
};

export const PlanBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="secondary">Free</Badge>
      <Badge variant="default">Pro</Badge>
      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        Studio
      </Badge>
    </div>
  ),
};
