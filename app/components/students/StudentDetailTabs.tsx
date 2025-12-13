"use client";

import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, MessageCircle, CreditCard, User } from "lucide-react";

type StudentDetailTabsProps = {
  overviewTab: ReactNode;
  lessonsTab: ReactNode;
  messagesTab: ReactNode;
  paymentsTab: ReactNode;
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

export function StudentDetailTabs({
  overviewTab,
  lessonsTab,
  messagesTab,
  paymentsTab,
  defaultTab = "overview",
  activeTab,
  onTabChange,
}: StudentDetailTabsProps) {
  return (
    <Tabs
      defaultValue={defaultTab}
      value={activeTab}
      onValueChange={onTabChange}
      className="w-full"
    >
      <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto rounded-none overflow-x-auto">
        <TabsTrigger
          value="overview"
          className="inline-flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
        >
          <User className="h-4 w-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="lessons"
          className="inline-flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
        >
          <BookOpen className="h-4 w-4" />
          Lessons
        </TabsTrigger>
        <TabsTrigger
          value="messages"
          className="inline-flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
        >
          <MessageCircle className="h-4 w-4" />
          Messages
        </TabsTrigger>
        <TabsTrigger
          value="payments"
          className="inline-flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none bg-transparent"
        >
          <CreditCard className="h-4 w-4" />
          Payments
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {overviewTab}
        </TabsContent>
        <TabsContent value="lessons" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {lessonsTab}
        </TabsContent>
        <TabsContent value="messages" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {messagesTab}
        </TabsContent>
        <TabsContent value="payments" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          {paymentsTab}
        </TabsContent>
      </div>
    </Tabs>
  );
}
