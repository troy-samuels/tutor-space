import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Maria Garcia" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@maria" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="space-y-4 pt-4">
        <h3 className="text-lg font-medium">Overview</h3>
        <p className="text-sm text-muted-foreground">
          View your dashboard overview and key metrics.
        </p>
      </TabsContent>
      <TabsContent value="analytics" className="space-y-4 pt-4">
        <h3 className="text-lg font-medium">Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Detailed analytics and performance data.
        </p>
      </TabsContent>
      <TabsContent value="settings" className="space-y-4 pt-4">
        <h3 className="text-lg font-medium">Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure your preferences and account settings.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const StudentDetailTabs: Story = {
  render: () => (
    <Tabs defaultValue="lessons" className="w-[600px]">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="lessons">Lessons</TabsTrigger>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="homework">Homework</TabsTrigger>
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="payments">Payments</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
      </TabsList>
      <TabsContent value="lessons" className="pt-4">
        <div className="text-center text-muted-foreground py-8">
          Lesson calendar would display here
        </div>
      </TabsContent>
      <TabsContent value="messages" className="pt-4">
        <div className="text-center text-muted-foreground py-8">
          Messages thread would display here
        </div>
      </TabsContent>
      <TabsContent value="homework" className="pt-4">
        <div className="text-center text-muted-foreground py-8">
          Homework assignments would display here
        </div>
      </TabsContent>
      <TabsContent value="progress" className="pt-4">
        <div className="text-center text-muted-foreground py-8">
          Progress tracking would display here
        </div>
      </TabsContent>
      <TabsContent value="payments" className="pt-4">
        <div className="text-center text-muted-foreground py-8">
          Payment history would display here
        </div>
      </TabsContent>
      <TabsContent value="details" className="pt-4">
        <div className="text-center text-muted-foreground py-8">
          Student details would display here
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const Underline: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-[400px]">
      <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0">
        <TabsTrigger
          value="all"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2"
        >
          All
        </TabsTrigger>
        <TabsTrigger
          value="upcoming"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2"
        >
          Upcoming
        </TabsTrigger>
        <TabsTrigger
          value="completed"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2"
        >
          Completed
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="pt-4">All items</TabsContent>
      <TabsContent value="upcoming" className="pt-4">Upcoming items</TabsContent>
      <TabsContent value="completed" className="pt-4">Completed items</TabsContent>
    </Tabs>
  ),
};

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="inbox" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="inbox" className="flex items-center gap-2">
          Inbox
          <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
            12
          </span>
        </TabsTrigger>
        <TabsTrigger value="unread" className="flex items-center gap-2">
          Unread
          <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs">
            3
          </span>
        </TabsTrigger>
        <TabsTrigger value="sent">Sent</TabsTrigger>
      </TabsList>
      <TabsContent value="inbox" className="pt-4">
        Inbox messages
      </TabsContent>
      <TabsContent value="unread" className="pt-4">
        Unread messages
      </TabsContent>
      <TabsContent value="sent" className="pt-4">
        Sent messages
      </TabsContent>
    </Tabs>
  ),
};
