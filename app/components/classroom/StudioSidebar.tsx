"use client";

import { useEffect, useState } from "react";
import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, PenLine, Clock } from "lucide-react";
import { ChatTab } from "./ChatTab";
import { NotesEditor } from "./NotesEditor";
import { cn } from "@/lib/utils";

export interface BookingInfo {
  studentId: string;
  studentName: string;
  tutorName: string;
  serviceName: string | null;
  scheduledAt: string;
  durationMinutes: number;
}

interface StudioSidebarProps {
  bookingId: string;
  bookingInfo?: BookingInfo;
  isTutor?: boolean;
}

export function StudioSidebar({ bookingId, bookingInfo, isTutor }: StudioSidebarProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const connectionState = useConnectionState();

  // Calculate countdown timer
  const totalSeconds = bookingInfo?.durationMinutes ? bookingInfo.durationMinutes * 60 : 0;
  const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

  // Lesson timer (counts up, but we display countdown)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time as MM:SS or H:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Get timer warning indicator color based on remaining time
  const getTimerIndicatorColor = () => {
    const lessonDurationMinutes = bookingInfo?.durationMinutes || 0;
    const remainingMinutes = remainingSeconds / 60;

    // Red dot: last minute
    if (remainingMinutes <= 1 && totalSeconds > 0) {
      return "bg-red-500";
    }

    // Yellow dot: last 5 minutes (only for lessons > 30 min)
    if (lessonDurationMinutes > 30 && remainingMinutes <= 5) {
      return "bg-amber-500";
    }

    // No indicator otherwise
    return null;
  };

  // Connection status color
  const getConnectionColor = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return "bg-emerald-500";
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return "bg-amber-500 animate-pulse";
      case ConnectionState.Disconnected:
      default:
        return "bg-red-500";
    }
  };

  // Display the other participant's name
  const participantName = bookingInfo
    ? isTutor
      ? bookingInfo.studentName
      : bookingInfo.tutorName
    : null;

  const timerIndicatorColor = getTimerIndicatorColor();
  const showTutorNotes = !!isTutor && !!bookingInfo?.studentId && !!bookingId;

  return (
    <div className="flex flex-col h-full">
      {/* Slim Session Header */}
      {bookingInfo && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/30">
          <span className="text-sm font-medium text-foreground truncate">
            {participantName}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span className="text-xs tabular-nums">{formatTime(remainingSeconds)}</span>
              {timerIndicatorColor && (
                <div className={cn("h-2 w-2 rounded-full", timerIndicatorColor)} />
              )}
            </div>
            <div
              className={cn("h-2 w-2 rounded-full", getConnectionColor())}
              title={
                connectionState === ConnectionState.Connected
                  ? "Connected"
                  : connectionState === ConnectionState.Disconnected
                    ? "Disconnected"
                    : "Connecting..."
              }
            />
          </div>
        </div>
      )}

      <Tabs defaultValue="chat" className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-muted/50 p-2 gap-1">
          <TabsTrigger
            value="chat"
            className="group rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden group-data-[state=active]:inline">Chat</span>
          </TabsTrigger>

          {showTutorNotes && (
            <TabsTrigger
              value="notes"
              className="group rounded-full data-[state=active]:bg-card data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground"
            >
              <PenLine className="h-4 w-4" />
              <span className="hidden group-data-[state=active]:inline">Notes</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-0 overflow-hidden">
          <ChatTab />
        </TabsContent>

        {showTutorNotes && bookingInfo?.studentId && (
          <TabsContent value="notes" className="flex-1 p-4 mt-0 overflow-hidden">
            <NotesEditor bookingId={bookingId} studentId={bookingInfo.studentId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

