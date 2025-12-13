"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Notebook, Sparkles, MessageSquare } from "lucide-react";

export function SidebarTabs() {
  return (
    <Tabs defaultValue="notes" className="flex flex-col h-full">
      <TabsList className="w-full justify-start rounded-none border-b border-slate-100 bg-slate-50/50 p-2 gap-1">
        <TabsTrigger
          value="notes"
          className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:text-slate-900"
        >
          <Notebook className="h-4 w-4" />
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="ai"
          className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:text-slate-900"
        >
          <Sparkles className="h-4 w-4" />
          AI
        </TabsTrigger>
        <TabsTrigger
          value="chat"
          className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:text-slate-900"
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </TabsTrigger>
      </TabsList>

      {/* Notes Tab */}
      <TabsContent value="notes" className="flex-1 p-4 mt-0">
        <div className="h-full flex flex-col gap-3">
          <p className="text-sm text-slate-500">
            Take notes during the lesson
          </p>
          <Textarea
            placeholder="Type your lesson notes here..."
            className="flex-1 resize-none bg-slate-50/50 border-slate-200 focus:border-slate-300 rounded-xl"
          />
        </div>
      </TabsContent>

      {/* AI Tab */}
      <TabsContent value="ai" className="flex-1 p-4 mt-0">
        <div className="h-full flex flex-col items-center justify-center text-center gap-4">
          <div className="rounded-full bg-slate-100 p-4">
            <Sparkles className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900">AI Insights</p>
            <p className="text-sm text-slate-500 mt-1">
              AI-powered insights and suggestions will appear here
              during the lesson.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Chat Tab */}
      <TabsContent value="chat" className="flex-1 p-4 mt-0">
        <div className="h-full flex flex-col items-center justify-center text-center gap-4">
          <div className="rounded-full bg-slate-100 p-4">
            <MessageSquare className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900">Lesson Chat</p>
            <p className="text-sm text-slate-500 mt-1">
              In-lesson chat messages will appear here.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
