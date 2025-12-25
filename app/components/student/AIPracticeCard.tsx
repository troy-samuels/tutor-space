"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  MessageSquare,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Mic,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  FREE_AUDIO_MINUTES,
  FREE_TEXT_TURNS,
  BLOCK_AUDIO_MINUTES,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";

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

export interface PracticeUsage {
  audioSecondsUsed: number;
  audioSecondsAllowance: number;
  textTurnsUsed: number;
  textTurnsAllowance: number;
  blocksConsumed: number;
  currentTierPriceCents: number;
  periodEnd: string | null;
  percentAudioUsed: number;
  percentTextUsed: number;
  // Freemium model additions
  isFreeUser?: boolean;
  audioSecondsRemaining?: number;
  textTurnsRemaining?: number;
  canBuyBlocks?: boolean;
  blockPriceCents?: number;
}

interface AIPracticeCardProps {
  isSubscribed: boolean;
  assignments: PracticeAssignment[];
  stats: PracticeStats | null;
  tutorName?: string;
  studentId: string;
  usage?: PracticeUsage | null;
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

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

function getProgressColor(percent: number): string {
  if (percent < 70) return "bg-emerald-500";
  if (percent < 90) return "bg-amber-500";
  return "bg-red-500";
}

export function AIPracticeCard({
  isSubscribed,
  assignments,
  stats,
  tutorName,
  studentId,
  usage,
}: AIPracticeCardProps) {
  const blockPriceDollars = (AI_PRACTICE_BLOCK_PRICE_CENTS / 100).toFixed(0);

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

  // Not subscribed - show free tier CTA (freemium model)
  if (!isSubscribed) {
    return (
      <Card className="border-dashed border-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Conversation Practice
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
              Free
            </Badge>
          </CardTitle>
          <CardDescription>
            Chat practice between your lessons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-background/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="font-medium text-foreground">
                  Start practicing for free
                </p>
                <p className="text-sm text-muted-foreground">
                  {tutorName
                    ? `${tutorName} can assign practice scenarios for you to complete between lessons.`
                    : "Your tutor can assign practice scenarios for you to complete between lessons."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">
                {FREE_TEXT_TURNS} text turns
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <Mic className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">
                {FREE_AUDIO_MINUTES} audio min
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <Zap className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-1">
                +${blockPriceDollars}/block
              </p>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Free tier resets monthly. Buy extra blocks only when you need more.
          </p>

          <Button asChild className="w-full">
            <Link href={`/student/practice/subscribe?student=${studentId}`}>
              <Sparkles className="h-4 w-4" />
              Start Practicing Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Subscribed - show practice dashboard with usage meters
  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Conversation Practice
          </CardTitle>
          <CardDescription>
            Topics assigned by your tutor
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {openAssignments.length} assigned
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage meters */}
        {usage && (
          <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Monthly Usage</span>
              <div className="flex items-center gap-2">
                {usage.isFreeUser && (
                  <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                    Free Tier
                  </Badge>
                )}
                {usage.blocksConsumed > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{usage.blocksConsumed} block{usage.blocksConsumed > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>

            {/* Text turns meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Text turns
                </span>
                <span className="text-muted-foreground">
                  {usage.textTurnsUsed} / {usage.textTurnsAllowance}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(usage.percentTextUsed)}`}
                  style={{ width: `${Math.min(usage.percentTextUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Audio minutes meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mic className="h-3.5 w-3.5" />
                  Audio time
                </span>
                <span className="text-muted-foreground">
                  {formatSeconds(usage.audioSecondsUsed)} / {formatSeconds(usage.audioSecondsAllowance)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(usage.percentAudioUsed)}`}
                  style={{ width: `${Math.min(usage.percentAudioUsed, 100)}%` }}
                />
              </div>
            </div>

            {usage.blocksConsumed > 0 && (
              <p className="text-xs text-muted-foreground">
                Current tier: ${(usage.currentTierPriceCents / 100).toFixed(0)}/mo
                {usage.periodEnd && (
                  <> · Resets {formatDistanceToNow(new Date(usage.periodEnd), { addSuffix: true })}</>
                )}
              </p>
            )}
          </div>
        )}

        {/* Mini stats row */}
        {stats && (stats.sessions_completed > 0 || stats.practice_minutes > 0) && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">
                {stats.sessions_completed}
              </p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">
                {formatMinutes(stats.practice_minutes)}
              </p>
              <p className="text-xs text-muted-foreground">Practice time</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">
                {stats.messages_sent}
              </p>
              <p className="text-xs text-muted-foreground">Messages</p>
            </div>
          </div>
        )}

        {/* Open assignments */}
        {openAssignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
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
                  href={`/student/practice/${assignment.id}`}
                  className="block rounded-xl border border-border bg-background/80 p-4 shadow-sm transition hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                          {assignment.title}
                        </p>
                        <Badge className={`text-xs shrink-0 ${status.className}`}>
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
          <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>{completedCount} completed</span>
            </div>
            <Link
              href="/student/practice/history"
              className="text-xs font-medium text-primary hover:underline"
            >
              View history
            </Link>
          </div>
        )}

        {/* Quick start button */}
        {openAssignments.length > 0 && (
          <Button asChild className="w-full">
            <Link href={`/student/practice/${openAssignments[0].id}`}>
              <MessageSquare className="h-4 w-4" />
              Start Practice
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
