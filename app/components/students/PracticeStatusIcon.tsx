"use client";

import { useState } from "react";
import { Bot, MessageSquare, Clock, Sparkles, CheckCircle, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PracticeStats = {
  assignmentId: string;
  sessionsCompleted: number;
  totalMessages: number;
  totalMinutes: number;
  grammarIssues: number;
  lastSessionAt: string | null;
  status: "assigned" | "in_progress" | "completed";
};

type PracticeStatusIconProps = {
  practiceAssignmentId: string;
  status: "assigned" | "in_progress" | "completed";
  sessionsCompleted: number;
  className?: string;
  onStatsUpdate?: (stats: PracticeStats) => void;
};

export function PracticeStatusIcon({
  practiceAssignmentId,
  status,
  sessionsCompleted,
  className,
  onStatsUpdate,
}: PracticeStatusIconProps) {
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const fetchStats = async () => {
    if (stats) return; // Already fetched

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/practice/stats/${practiceAssignmentId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
      onStatsUpdate?.(data as PracticeStats);
    } catch {
      setError("Unable to load stats");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchStats();
    }
  };

  // Determine icon color based on status
  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-emerald-500";
      case "in_progress":
        return "text-amber-500";
      default:
        return "text-primary/60";
    }
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative inline-flex items-center justify-center rounded-full p-1 transition-colors hover:bg-muted",
            className
          )}
          title="AI Practice linked - click for stats"
        >
          <Bot className={cn("h-4 w-4", getStatusColor())} />
          {sessionsCompleted > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground">
              {sessionsCompleted > 9 ? "9+" : sessionsCompleted}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="border-b border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Practice Stats</span>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-sm text-muted-foreground text-center py-2">
              {error}
            </div>
          ) : stats ? (
            <>
              {/* Status badge */}
              <div className="flex items-center gap-2">
                {stats.status === "completed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </span>
                ) : stats.status === "in_progress" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Sparkles className="h-3 w-3" />
                    In Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Assigned
                  </span>
                )}
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/70 bg-background p-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="text-[10px] uppercase tracking-wide">Sessions</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {stats.sessionsCompleted}
                  </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-background p-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] uppercase tracking-wide">Time</span>
                  </div>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {formatMinutes(stats.totalMinutes)}
                  </p>
                </div>
              </div>

              {/* Additional metrics */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Messages exchanged</span>
                  <span className="font-medium text-foreground">{stats.totalMessages}</span>
                </div>
                {stats.grammarIssues > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Grammar corrections</span>
                    <span className="font-medium text-foreground">{stats.grammarIssues}</span>
                  </div>
                )}
                {stats.lastSessionAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last practiced</span>
                    <span className="font-medium text-foreground">
                      {new Date(stats.lastSessionAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* No sessions yet */}
              {stats.sessionsCompleted === 0 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  Student hasn't started practicing yet
                </p>
              )}
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
