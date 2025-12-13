"use client";

import { useState, useEffect } from "react";
import { useConnectionState } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { User, Clock, Wifi, WifiOff, WifiLow } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BookingInfo {
  studentName: string;
  tutorName: string;
  serviceName: string | null;
  scheduledAt: string;
  durationMinutes: number;
}

interface SessionHeaderProps {
  bookingInfo: BookingInfo;
  isTutor: boolean;
  className?: string;
}

export function SessionHeader({
  bookingInfo,
  isTutor,
  className,
}: SessionHeaderProps) {
  const connectionState = useConnectionState();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Lesson timer
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

  // Connection quality styling
  const getConnectionInfo = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return {
          icon: <Wifi className="h-3.5 w-3.5" />,
          label: "Connected",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
        };
      case ConnectionState.Connecting:
      case ConnectionState.Reconnecting:
        return {
          icon: <WifiLow className="h-3.5 w-3.5 animate-pulse" />,
          label: "Connecting...",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
        };
      case ConnectionState.Disconnected:
      default:
        return {
          icon: <WifiOff className="h-3.5 w-3.5" />,
          label: "Disconnected",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
    }
  };

  const connectionInfo = getConnectionInfo();

  // Display the other participant's name
  const participantName = isTutor
    ? bookingInfo.studentName
    : bookingInfo.tutorName;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 bg-card/95 backdrop-blur-sm rounded-full shadow-lg border border-border",
        className
      )}
    >
      {/* Participant Info */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground leading-tight">
            {participantName}
          </span>
          {bookingInfo.serviceName && (
            <span className="text-xs text-muted-foreground leading-tight">
              {bookingInfo.serviceName}
            </span>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border" />

      {/* Timer */}
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-sm font-medium tabular-nums text-foreground">
          {formatTime(elapsedSeconds)}
        </span>
        {bookingInfo.durationMinutes && (
          <span className="text-xs text-muted-foreground">
            / {bookingInfo.durationMinutes}min
          </span>
        )}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border" />

      {/* Connection Quality */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
          connectionInfo.bgColor
        )}
      >
        <span className={connectionInfo.color}>{connectionInfo.icon}</span>
        <span className={cn("text-xs font-medium", connectionInfo.color)}>
          {connectionInfo.label}
        </span>
      </div>
    </div>
  );
}
