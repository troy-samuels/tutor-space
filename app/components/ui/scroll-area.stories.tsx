import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ScrollArea, ScrollBar } from "./scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const VerticalScroll: Story = {
  render: () => (
    <ScrollArea className="h-72 w-[350px] rounded-md border p-4">
      <div className="space-y-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="text-sm">
            <p className="font-medium">Item {i + 1}</p>
            <p className="text-muted-foreground">
              This is a description for item {i + 1}.
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const HorizontalScroll: Story = {
  render: () => (
    <ScrollArea className="w-[400px] whitespace-nowrap rounded-md border">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="w-[200px] shrink-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Card {i + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Horizontal scrollable card content.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

export const NotificationList: Story = {
  render: () => (
    <ScrollArea className="h-80 w-[350px] rounded-md border">
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium">Notifications</h4>
        <div className="space-y-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-lg bg-muted/50 p-3">
              <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10" />
              <div className="space-y-1">
                <p className="text-sm font-medium">New booking</p>
                <p className="text-xs text-muted-foreground">
                  Maria Garcia booked a 60-minute lesson.
                </p>
                <p className="text-xs text-muted-foreground">{i + 1}h ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  ),
};

export const StudentMessages: Story = {
  render: () => (
    <ScrollArea className="h-64 w-[400px] rounded-md border">
      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
          <div className="rounded-lg bg-muted px-3 py-2 max-w-[80%]">
            <p className="text-sm">Hi! I wanted to ask about homework.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 max-w-[80%]">
            <p className="text-sm">Of course! What do you need help with?</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
          <div className="rounded-lg bg-muted px-3 py-2 max-w-[80%]">
            <p className="text-sm">
              I'm having trouble with the verb conjugation exercises.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="rounded-lg bg-primary text-primary-foreground px-3 py-2 max-w-[80%]">
            <p className="text-sm">
              Let me send you some additional practice materials. We can also
              review this in our next lesson.
            </p>
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 shrink-0 rounded-full bg-muted" />
            <div className="rounded-lg bg-muted px-3 py-2 max-w-[80%]">
              <p className="text-sm">Message {i + 5}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const TimeSlotPicker: Story = {
  render: () => (
    <ScrollArea className="h-48 w-[200px] rounded-md border">
      <div className="p-2">
        {[
          "9:00 AM",
          "9:30 AM",
          "10:00 AM",
          "10:30 AM",
          "11:00 AM",
          "11:30 AM",
          "12:00 PM",
          "12:30 PM",
          "1:00 PM",
          "1:30 PM",
          "2:00 PM",
          "2:30 PM",
          "3:00 PM",
          "3:30 PM",
          "4:00 PM",
          "4:30 PM",
          "5:00 PM",
        ].map((time) => (
          <button
            key={time}
            className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted focus:bg-muted focus:outline-none"
          >
            {time}
          </button>
        ))}
      </div>
    </ScrollArea>
  ),
};
