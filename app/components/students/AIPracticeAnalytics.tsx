"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  MessageSquare,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  BookOpen,
  Activity,
} from "lucide-react";

// Grammar category labels for display
const GRAMMAR_LABELS: Record<string, string> = {
  verb_tense: "Verb Tense",
  subject_verb_agreement: "Subject-Verb Agreement",
  preposition: "Prepositions",
  article: "Articles",
  word_order: "Word Order",
  gender_agreement: "Gender Agreement",
  conjugation: "Conjugation",
  pronoun: "Pronouns",
  plural_singular: "Plural/Singular",
  spelling: "Spelling",
  vocabulary: "Vocabulary",
};

interface GrammarIssue {
  category_slug: string;
  label: string;
  count: number;
  trend: "improving" | "stable" | "declining" | null;
}

interface WeeklyActivity {
  week: string;
  sessions: number;
  minutes: number;
  errors: number;
}

interface PracticeSummary {
  total_sessions: number;
  completed_sessions: number;
  total_messages_sent: number;
  total_practice_minutes: number;
  total_grammar_errors: number;
  total_phonetic_errors: number;
  top_grammar_issues: GrammarIssue[];
  avg_session_rating: number | null;
  last_practice_at: string | null;
  weekly_activity: WeeklyActivity[];
}

interface AIPracticeAnalyticsProps {
  studentId: string;
  studentName: string;
  isSubscribed: boolean;
  summary: PracticeSummary | null;
}

export function AIPracticeAnalytics({
  studentName,
  isSubscribed,
  summary,
}: AIPracticeAnalyticsProps) {
  if (!isSubscribed) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-medium text-foreground">
            AI Practice Not Active
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {studentName} hasn&apos;t subscribed to AI Practice yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.total_sessions === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Bot className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <h3 className="mt-3 font-medium text-foreground">No Practice Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {studentName} is subscribed but hasn&apos;t started practicing.
            <br />
            Assign a practice scenario to get them started!
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  const TrendIcon = ({ trend }: { trend: string | null }) => {
    if (trend === "improving")
      return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />;
    if (trend === "declining")
      return <TrendingUp className="h-3.5 w-3.5 text-amber-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Bot className="h-4 w-4 text-primary" />
          AI Practice Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              Sessions
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {summary.completed_sessions}
              <span className="text-sm font-normal text-muted-foreground">
                /{summary.total_sessions}
              </span>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Minutes
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {summary.total_practice_minutes}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5" />
              Avg Rating
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {summary.avg_session_rating
                ? summary.avg_session_rating.toFixed(1)
                : "—"}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              Errors
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {summary.total_grammar_errors}
            </div>
          </div>
        </div>

        {/* Top Grammar Issues */}
        {summary.top_grammar_issues && summary.top_grammar_issues.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              Top Grammar Issues
            </h4>
            <div className="space-y-2">
              {summary.top_grammar_issues.slice(0, 5).map((issue, idx) => (
                <div
                  key={issue.category_slug}
                  className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground">
                      {GRAMMAR_LABELS[issue.category_slug] || issue.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {issue.count} errors
                    </Badge>
                    <TrendIcon trend={issue.trend} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly Activity Sparkline */}
        {summary.weekly_activity && summary.weekly_activity.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Activity className="h-3.5 w-3.5" />
              Weekly Activity
            </h4>
            <div className="flex items-end gap-1 rounded-md border bg-muted/30 p-3">
              {summary.weekly_activity.map((week, idx) => {
                const maxSessions = Math.max(
                  ...summary.weekly_activity.map((w) => w.sessions),
                  1
                );
                const height = Math.max(
                  8,
                  (week.sessions / maxSessions) * 48
                );
                return (
                  <div
                    key={idx}
                    className="group relative flex-1"
                    title={`${formatDate(week.week)}: ${week.sessions} sessions, ${week.minutes} min`}
                  >
                    <div
                      className="mx-auto w-full max-w-6 rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                      style={{ height: `${height}px` }}
                    />
                    <div className="mt-1 text-center text-[10px] text-muted-foreground">
                      {week.sessions}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>
                {summary.weekly_activity.length > 0
                  ? formatDate(summary.weekly_activity[0].week)
                  : ""}
              </span>
              <span>
                {summary.weekly_activity.length > 0
                  ? formatDate(
                      summary.weekly_activity[summary.weekly_activity.length - 1]
                        .week
                    )
                  : ""}
              </span>
            </div>
          </div>
        )}

        {/* Last Practice */}
        {summary.last_practice_at && (
          <div className="text-xs text-muted-foreground">
            Last practice:{" "}
            {new Date(summary.last_practice_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
