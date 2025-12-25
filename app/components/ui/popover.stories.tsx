import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-muted-foreground">
          This is a popover with some content. Click outside to close.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Quick Edit</h4>
            <p className="text-sm text-muted-foreground">
              Update your profile information.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Maria Garcia" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" placeholder="A short bio..." />
            </div>
          </div>
          <Button size="sm">Save Changes</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const AlignStart: Story = {
  render: () => (
    <div className="flex justify-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Align Start</Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <p className="text-sm">Aligned to the start of the trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const AlignEnd: Story = {
  render: () => (
    <div className="flex justify-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Align End</Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <p className="text-sm">Aligned to the end of the trigger.</p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const HelpPopover: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Label>Lesson Duration</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button className="h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center hover:bg-muted/80">
            ?
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64" side="right">
          <p className="text-sm">
            Choose how long each lesson will last. Standard lessons are 60 minutes,
            but you can offer 30-minute or 90-minute sessions.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

export const SettingsPopover: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          Settings
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="grid gap-2">
          <h4 className="text-sm font-medium">Display Settings</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <span className="text-sm">Light</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Language</span>
            <span className="text-sm">English</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
