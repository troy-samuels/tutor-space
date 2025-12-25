import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Sheet, SheetContent, SheetOverlay } from "./sheet";
import { Button } from "./button";
import { X, Menu, Filter } from "lucide-react";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Sheet>;

function SheetDemo({ side = "left" as const, children }: { side?: "left" | "right" | "top" | "bottom"; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open {side} Sheet
      </Button>
      <Sheet open={open} onOpenChange={setOpen} side={side}>
        <SheetOverlay onClick={() => setOpen(false)} />
        <SheetContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Sheet Title</h2>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {children || (
            <p className="text-sm text-muted-foreground">
              Sheet content goes here. Click outside or the X button to close.
            </p>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export const LeftSheet: Story = {
  render: () => <SheetDemo side="left" />,
};

export const RightSheet: Story = {
  render: () => <SheetDemo side="right" />,
};

export const BottomSheet: Story = {
  render: () => <SheetDemo side="bottom" />,
};

export const TopSheet: Story = {
  render: () => <SheetDemo side="top" />,
};

export const NavigationSidebar: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Sheet open={open} onOpenChange={setOpen} side="left">
          <SheetOverlay onClick={() => setOpen(false)} />
          <SheetContent className="p-0 w-64">
            <div className="p-4 border-b">
              <h2 className="font-semibold">TutorLingua</h2>
            </div>
            <nav className="p-2">
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm">
                Dashboard
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm">
                Bookings
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm">
                Students
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm">
                Messages
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm">
                Settings
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </>
    );
  },
};

export const FilterPanel: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Sheet open={open} onOpenChange={setOpen} side="right">
          <SheetOverlay onClick={() => setOpen(false)} />
          <SheetContent className="w-80">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Status</h3>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" /> Upcoming
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" /> Completed
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" /> Cancelled
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Date Range</h3>
                <div className="text-sm text-muted-foreground">
                  Date picker would go here
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1">
                Clear
              </Button>
              <Button className="flex-1">Apply</Button>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  },
};
