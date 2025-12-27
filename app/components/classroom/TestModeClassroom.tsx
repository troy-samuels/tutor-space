"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import {
  Mic,
  MicOff,
  PhoneOff,
  Circle,
  Square,
  ArrowLeft,
  MessageSquare,
  Notebook,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingInfo {
  studentId?: string;
  studentName?: string;
  tutorName?: string;
  participantName?: string;
  serviceName?: string | null;
  scheduledAt?: string;
  durationMinutes?: number;
}

interface TestModeClassroomProps {
  bookingId: string;
  bookingInfo?: BookingInfo;
  isTutor: boolean;
}

export function TestModeClassroom({
  bookingId,
  bookingInfo,
  isTutor,
}: TestModeClassroomProps) {
  const router = useRouter();
  const [micEnabled, setMicEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Recording timer
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const formatRecordingTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleToggleMic = useCallback(() => {
    setMicEnabled((prev) => !prev);
  }, []);

  const handleToggleRecording = useCallback(() => {
    setIsRecording((prev) => !prev);
  }, []);

  const handleLeave = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const participantName = isTutor
    ? bookingInfo?.studentName || "Student"
    : bookingInfo?.tutorName || "Tutor";

  return (
    <div
      data-testid="test-mode-classroom"
      className="min-h-[100dvh] bg-background p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:p-6 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-muted-foreground hover:text-foreground hover:bg-card rounded-full px-4"
          data-testid="classroom-back-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden rounded-full px-4"
          data-testid="classroom-mobile-sidebar-toggle"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat & Notes
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 lg:gap-6">
        {/* Audio Stage Mock */}
        <div className="flex-1 lg:flex-[3] relative min-h-0">
          <div className="h-full rounded-2xl shadow-lg overflow-hidden sm:rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800">
            {/* Participant Tiles */}
            <div className="h-full flex flex-col">
              <div className="flex-1 flex items-center justify-center gap-6 p-6">
                {/* Tutor Tile */}
                <div
                  className="flex flex-col items-center gap-3"
                  data-testid="participant-tile-tutor"
                >
                  <div className="relative">
                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-slate-700 flex items-center justify-center ring-4 ring-slate-600">
                      <User className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                    </div>
                    {isTutor && (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">You</span>
                      </div>
                    )}
                  </div>
                  <span className="text-white font-medium text-sm">
                    {bookingInfo?.tutorName || "Tutor"}
                  </span>
                </div>

                {/* Student Tile */}
                <div
                  className="flex flex-col items-center gap-3"
                  data-testid="participant-tile-student"
                >
                  <div className="relative">
                    <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-slate-700 flex items-center justify-center ring-4 ring-slate-600">
                      <User className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                    </div>
                    {!isTutor && (
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">You</span>
                      </div>
                    )}
                  </div>
                  <span className="text-white font-medium text-sm">
                    {bookingInfo?.studentName || "Student"}
                  </span>
                </div>
              </div>

              {/* Test Mode Banner */}
              <div className="bg-amber-500/20 border-t border-amber-500/30 px-4 py-2 text-center">
                <span className="text-amber-200 text-sm font-medium">
                  Test Mode - LiveKit not configured
                </span>
              </div>

              {/* Control Bar */}
              <div className="flex items-center justify-center p-4 sm:p-6 bg-slate-900/50">
                <div className="flex items-center gap-3 px-4 py-3 bg-card rounded-full shadow-xl">
                  {/* Mic Toggle */}
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleToggleMic}
                          aria-label={micEnabled ? "Mute" : "Unmute"}
                          data-testid={micEnabled ? "classroom-mic-mute" : "classroom-mic-unmute"}
                          className={cn(
                            "h-10 w-10 rounded-full transition-all duration-200",
                            "bg-card text-foreground hover:bg-muted shadow-sm",
                            !micEnabled && "bg-red-500 text-white hover:bg-red-600 shadow-sm"
                          )}
                        >
                          {micEnabled ? (
                            <Mic className="h-4 w-4" />
                          ) : (
                            <MicOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {micEnabled ? "Mute" : "Unmute"}
                      </TooltipContent>
                    </Tooltip>

                    {/* Mock volume indicator */}
                    {micEnabled && (
                      <div className="flex items-end gap-0.5 h-5" data-testid="classroom-mic-indicator">
                        <div className="w-1 bg-emerald-500 rounded-full h-2 animate-pulse" />
                        <div className="w-1 bg-emerald-500 rounded-full h-3 animate-pulse" style={{ animationDelay: "100ms" }} />
                        <div className="w-1 bg-emerald-500 rounded-full h-4 animate-pulse" style={{ animationDelay: "200ms" }} />
                        <div className="w-1 bg-emerald-500 rounded-full h-3 animate-pulse" style={{ animationDelay: "300ms" }} />
                        <div className="w-1 bg-emerald-500 rounded-full h-2 animate-pulse" style={{ animationDelay: "400ms" }} />
                      </div>
                    )}
                  </div>

                  {/* Recording Controls (Tutor Only) */}
                  {isTutor && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isRecording && (
                        <span
                          className="text-xs font-medium text-red-600 tabular-nums min-w-[3rem]"
                          data-testid="classroom-recording-timer"
                        >
                          {formatRecordingTime(recordingSeconds)}
                        </span>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleToggleRecording}
                            aria-label={isRecording ? "Stop recording" : "Start recording"}
                            data-testid={isRecording ? "classroom-record-stop" : "classroom-record-start"}
                            className={cn(
                              "h-10 w-10 rounded-full transition-all duration-300 relative overflow-hidden flex-shrink-0",
                              isRecording
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-card text-foreground hover:bg-muted shadow-sm"
                            )}
                          >
                            {isRecording ? (
                              <Square className="h-3.5 w-3.5 fill-current" />
                            ) : (
                              <Circle className="h-4 w-4 fill-red-500 text-red-500" />
                            )}
                            {isRecording && (
                              <span className="absolute inset-0 rounded-full animate-pulse bg-red-400/20" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {isRecording ? "Stop recording" : "Start recording"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* Student Recording Indicator */}
                  {!isTutor && isRecording && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                      <span className="text-xs text-red-600 font-medium">REC</span>
                    </div>
                  )}

                  <div className="w-px h-8 bg-border mx-1" />

                  {/* Leave Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLeave}
                        aria-label="Leave meeting"
                        data-testid="classroom-leave-button"
                        className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
                      >
                        <PhoneOff className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Leave</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Desktop */}
        <div className="hidden flex-1 min-w-[280px] max-w-[360px] lg:block">
          <div className="h-full rounded-[2rem] shadow-md bg-card overflow-hidden border border-border">
            <TestModeSidebar bookingInfo={bookingInfo} isTutor={isTutor} />
          </div>
        </div>

        {/* Sidebar - Mobile Sheet */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} side="bottom">
          <SheetOverlay onClick={() => setMobileSidebarOpen(false)} />
          <SheetContent
            side="bottom"
            className="top-auto inset-x-0 h-[85dvh] w-full overflow-hidden rounded-t-2xl border-t border-border bg-background p-0 pb-[env(safe-area-inset-bottom)] shadow-xl lg:hidden"
          >
            <div className="h-full">
              <TestModeSidebar bookingInfo={bookingInfo} isTutor={isTutor} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

interface TestModeSidebarProps {
  bookingInfo?: BookingInfo;
  isTutor: boolean;
}

function TestModeSidebar({ bookingInfo, isTutor }: TestModeSidebarProps) {
  return (
    <Tabs defaultValue="notes" className="flex flex-col h-full" data-testid="classroom-sidebar">
      <TabsList className="w-full justify-start rounded-none border-b border-slate-100 bg-slate-50/50 p-2 gap-1">
        <TabsTrigger
          value="notes"
          data-testid="classroom-sidebar-notes-tab"
          className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:text-slate-900"
        >
          <Notebook className="h-4 w-4" />
          Notes
        </TabsTrigger>
        <TabsTrigger
          value="ai"
          data-testid="classroom-sidebar-ai-tab"
          className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:text-slate-900"
        >
          <Sparkles className="h-4 w-4" />
          AI
        </TabsTrigger>
        <TabsTrigger
          value="chat"
          data-testid="classroom-sidebar-chat-tab"
          className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:text-slate-900"
        >
          <MessageSquare className="h-4 w-4" />
          Chat
        </TabsTrigger>
      </TabsList>

      {/* Notes Tab */}
      <TabsContent value="notes" className="flex-1 p-4 mt-0" data-testid="classroom-notes-content">
        <div className="h-full flex flex-col gap-3">
          <p className="text-sm text-slate-500">Take notes during the lesson</p>
          <Textarea
            placeholder="Type your lesson notes here..."
            className="flex-1 resize-none bg-slate-50/50 border-slate-200 focus:border-slate-300 rounded-xl"
            data-testid="classroom-notes-input"
          />
        </div>
      </TabsContent>

      {/* AI Tab */}
      <TabsContent value="ai" className="flex-1 p-4 mt-0" data-testid="classroom-ai-content">
        <div className="h-full flex flex-col items-center justify-center text-center gap-4">
          <div className="rounded-full bg-slate-100 p-4">
            <Sparkles className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-900">AI Insights</p>
            <p className="text-sm text-slate-500 mt-1">
              AI-powered insights and suggestions will appear here during the lesson.
            </p>
          </div>
        </div>
      </TabsContent>

      {/* Chat Tab */}
      <TabsContent value="chat" className="flex-1 p-4 mt-0" data-testid="classroom-chat-content">
        <div className="h-full flex flex-col gap-3">
          <div className="flex-1 overflow-auto">
            <div className="flex flex-col items-center justify-center text-center gap-4 h-full">
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
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Type a message..."
              className="flex-1 resize-none min-h-[44px] max-h-[120px] rounded-xl bg-slate-50/50 border-slate-200"
              data-testid="classroom-chat-input"
              rows={1}
            />
            <Button
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0"
              data-testid="classroom-chat-send"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
