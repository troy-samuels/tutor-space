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

export function AIPracticeCard({
  isSubscribed,
  assignments,
  stats,
  tutorName,
  studentId,
  usage,
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

  // Not subscribed - show free tier CTA (freemium model)
  if (!isSubscribed) {
    return (
      <Card className="border-dashed border-primary bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Practice Between Lessons
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
              Included
            </Badge>
          </CardTitle>
          <CardDescription>
            Keep your skills sharp with AI conversation practice
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
                  Real conversation practice
                </p>
                <p className="text-sm text-muted-foreground">
                  Learn from gentle feedback as you build confidence in {tutorName ? "the language" : "your target language"}.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Written practice</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Type your responses and build writing confidence
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Mic className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Spoken practice</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Speak out loud and improve your pronunciation
              </p>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {tutorName
              ? `${tutorName} assigns conversations for you to practice.`
              : "Your tutor assigns conversations for you to practice."}
          </p>

          <Button asChild className="w-full">
            <Link href={`/student/practice/subscribe?student=${studentId}`}>
              <Sparkles className="h-4 w-4" />
              Start Practicing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Subscribed - show practice dashboard with usage meters
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-heading text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Conversation Practice
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Your personalized space to build conversation confidence
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
             {usage && (usage.percentTextUsed > 80 || usage.percentAudioUsed > 80) && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                  Running low
                </Badge>
             )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Open assignments */}
        {openAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Bot className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground max-w-sm mt-2">
              You&apos;ve completed all your practice assignments. Your tutor will assign new scenarios after your next lesson.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Assignment (First one) */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 transition-all hover:border-primary/30 hover:shadow-md group">
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4 flex-1">
                  <div className="space-y-2">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 mb-2 shadow-none">
                      Next Up
                    </Badge>
                    <h3 className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {openAssignments[0].title}
                    </h3>
                    {openAssignments[0].scenario && (
                       <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{openAssignments[0].scenario.language}</span>
                        <span>·</span>
                        <span>{levelLabels[openAssignments[0].scenario.level || ""] || openAssignments[0].scenario.level}</span>
                        {openAssignments[0].scenario.topic && (
                          <>
                            <span>·</span>
                            <span>{openAssignments[0].scenario.topic}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {openAssignments[0].instructions && (
                    <p className="text-muted-foreground leading-relaxed max-w-2xl">
                      {openAssignments[0].instructions}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 pt-2">
                    <Button size="lg" className="rounded-full px-8 shadow-md shadow-primary/10 hover:shadow-primary/20" asChild>
                      <Link href={`/student/practice/${openAssignments[0].id}`}>
                        <MessageSquare className="mr-2 h-5 w-5" />
                        Start Practice
                      </Link>
                    </Button>
                    {openAssignments[0].due_date && (
                       <p className="text-sm text-muted-foreground">
                        Due {formatDistanceToNow(new Date(openAssignments[0].due_date), { addSuffix: true })}
                       </p>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl bg-white/50 backdrop-blur-sm border border-primary/10 shadow-sm">
                   <Bot className="h-16 w-16 text-primary/40" />
                </div>
              </div>
            </div>

            {/* Other Assignments List */}
            {openAssignments.length > 1 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Up Next</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {openAssignments.slice(1).map((assignment) => {
                     const isOverdue =
                      assignment.due_date &&
                      new Date(assignment.due_date) < new Date() &&
                      assignment.status !== "completed";

                    return (
                      <Link
                        key={assignment.id}
                        href={`/student/practice/${assignment.id}`}
                        className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm"
                      >
                        <div className="space-y-2 mb-4">
                          <div className="flex items-start justify-between gap-2">
                             <p className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {assignment.title}
                             </p>
                          </div>
                          {assignment.scenario && (
                             <p className="text-xs text-muted-foreground">
                                {assignment.scenario.topic || assignment.scenario.language}
                             </p>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                           <span className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                              {assignment.due_date 
                                ? formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })
                                : "No due date"}
                           </span>
                           <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Stats */}
        {completedCount > 0 && (
          <div className="flex items-center justify-between border-t border-border pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                 <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-medium">{completedCount} session{completedCount !== 1 ? 's' : ''} completed</span>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 hover:bg-primary/5">
              <Link href="/student/practice/history">
                View History
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
