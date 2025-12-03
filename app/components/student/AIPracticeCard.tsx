"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  MessageSquare,
  Clock,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface PracticeAssignment {
  id: string;
  title: string;
  instructions: string | null;
  status: "assigned" | "in_progress" | "completed";
  due_date: string | null;
  sessions_completed: number;
  scenario?: {
    id: string;
    title: string;
    language: string;
    level: string | null;
    topic: string | null;
  } | null;
  created_at: string;
}

export interface PracticeStats {
  sessions_completed: number;
  practice_minutes: number;
  messages_sent: number;
}

interface AIPracticeCardProps {
  isSubscribed: boolean;
  assignments: PracticeAssignment[];
  stats: PracticeStats | null;
  tutorName?: string;
  studentId: string;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  assigned: { label: "New", className: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In progress", className: "bg-amber-100 text-amber-800" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
};

const levelLabels: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all: "All levels",
};

export function AIPracticeCard({
  isSubscribed,
  assignments,
  stats,
  tutorName,
  studentId,
}: AIPracticeCardProps) {
  const openAssignments = assignments
    .filter((a) => a.status !== "completed")
    .sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const completedCount = assignments.filter((a) => a.status === "completed").length;

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Not subscribed - show upgrade CTA
  if (!isSubscribed) {
    return (
      <Card className="border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Practice Companion
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          </CardTitle>
          <CardDescription>
            Practice conversations with AI between lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-background/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Unlock AI conversation practice
                </p>
                <p className="text-sm text-muted-foreground">
                  {tutorName
                    ? `${tutorName} can assign practice scenarios for you to complete between lessons.`
                    : "Your tutor can assign practice scenarios for you to complete between lessons."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">Real-time chat</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <Bot className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">AI corrections</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <CheckCircle className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">Track progress</p>
            </div>
          </div>

          <Link
            href={`/student-auth/practice/subscribe?student=${studentId}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Subscribe for $6/month
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Subscribed - show practice dashboard
  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Practice
          </CardTitle>
          <CardDescription>
            Practice conversations assigned by your tutor
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {openAssignments.length} assigned
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini stats row */}
        {stats && (stats.sessions_completed > 0 || stats.practice_minutes > 0) && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">
                {stats.sessions_completed}
              </p>
              <p className="text-[11px] text-muted-foreground">Sessions</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">
                {formatMinutes(stats.practice_minutes)}
              </p>
              <p className="text-[11px] text-muted-foreground">Practice time</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">
                {stats.messages_sent}
              </p>
              <p className="text-[11px] text-muted-foreground">Messages</p>
            </div>
          </div>
        )}

        {/* Open assignments */}
        {openAssignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No practice assignments yet.</p>
            <p className="text-xs mt-1">
              Your tutor will assign scenarios after your next lesson.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openAssignments.slice(0, 3).map((assignment) => {
              const status = statusStyles[assignment.status];
              const isOverdue =
                assignment.due_date &&
                new Date(assignment.due_date) < new Date() &&
                assignment.status !== "completed";
              const dueLabel = assignment.due_date
                ? `Due ${formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })}`
                : "No due date";

              return (
                <Link
                  key={assignment.id}
                  href={`/student-auth/practice/${assignment.id}`}
                  className="block rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                          {assignment.title}
                        </p>
                        <Badge className={`text-[11px] shrink-0 ${status.className}`}>
                          {status.label}
                        </Badge>
                      </div>
                      {assignment.scenario && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{assignment.scenario.language}</span>
                          {assignment.scenario.level && (
                            <>
                              <span>·</span>
                              <span>{levelLabels[assignment.scenario.level] || assignment.scenario.level}</span>
                            </>
                          )}
                          {assignment.scenario.topic && (
                            <>
                              <span>·</span>
                              <span className="truncate">{assignment.scenario.topic}</span>
                            </>
                          )}
                        </div>
                      )}
                      {assignment.instructions && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {assignment.instructions}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {dueLabel}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Show completed count if any */}
        {completedCount > 0 && (
          <div className="flex items-center justify-between border-t border-border/50 pt-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>{completedCount} completed</span>
            </div>
            <Link
              href="/student-auth/practice/history"
              className="text-xs font-medium text-primary hover:underline"
            >
              View history
            </Link>
          </div>
        )}

        {/* Quick start button */}
        {openAssignments.length > 0 && (
          <Link
            href={`/student-auth/practice/${openAssignments[0].id}`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <MessageSquare className="h-4 w-4" />
            Start Practice
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
