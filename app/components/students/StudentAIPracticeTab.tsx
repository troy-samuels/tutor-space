"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Calendar,
  MessageSquare,
  Send,
  CheckCircle,
  Sparkles,
  BookOpen,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Activity,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  GRAMMAR_CATEGORY_LABELS,
  normalizeGrammarCategorySlug,
} from "@/lib/practice/grammar-categories";

// Types
export type PracticeScenario = {
  id: string;
  title: string;
  language: string;
  level: string | null;
  topic: string | null;
};

export type PracticeAssignmentItem = {
  id: string;
  title: string;
  instructions: string | null;
  status: "assigned" | "in_progress" | "completed";
  due_date: string | null;
  sessions_completed: number;
  created_at: string;
  scenario?: PracticeScenario | null;
};

export type PendingHomeworkItem = {
  id: string;
  title: string;
  topic: string | null;
  due_date: string | null;
  status: string;
  practice_assignment_id: string | null;
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

type StudentAIPracticeTabProps = {
  studentId: string;
  studentName: string;
  isSubscribed: boolean;
  assignments: PracticeAssignmentItem[];
  scenarios: PracticeScenario[];
  pendingHomework: PendingHomeworkItem[];
  summary: PracticeSummary | null;
};

export function StudentAIPracticeTab({
  studentId,
  studentName,
  isSubscribed,
  assignments,
  scenarios,
  pendingHomework,
  summary,
}: StudentAIPracticeTabProps) {
  const [items, setItems] = useState<PracticeAssignmentItem[]>(assignments);
  const [homeworkList, setHomeworkList] = useState<PendingHomeworkItem[]>(pendingHomework);
  const [isSaving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    instructions: "",
    scenarioId: "",
    dueDate: "",
    homeworkId: "",
  });

  // Not subscribed state
  if (!isSubscribed) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center">
        <Bot className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          AI Practice Not Active
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {studentName} hasn&apos;t subscribed to AI Practice yet. Once they subscribe ($8/mo),
          you can assign conversation scenarios for them to practice between lessons.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          Revenue share: $4.50 to you / $1.50 platform
        </div>
      </div>
    );
  }

  const handleHomeworkSelect = (homeworkId: string) => {
    if (!homeworkId) {
      setForm((prev) => ({ ...prev, homeworkId: "" }));
      return;
    }
    const hw = homeworkList.find((h) => h.id === homeworkId);
    if (hw) {
      setForm((prev) => ({
        ...prev,
        homeworkId,
        title: prev.title || `Practice: ${hw.title}`,
        dueDate: prev.dueDate || (hw.due_date ? hw.due_date.split("T")[0] : ""),
        instructions: prev.instructions || (hw.topic ? `Focus on: ${hw.topic}` : ""),
      }));
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.title.trim()) {
      setMessage("Please enter a title for the assignment");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/practice/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            title: form.title,
            instructions: form.instructions || null,
            scenarioId: form.scenarioId || null,
            dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
            homeworkAssignmentId: form.homeworkId || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Failed to assign practice");
          return;
        }

        setItems((prev) => [data.assignment, ...prev]);
        if (form.homeworkId) {
          setHomeworkList((prev) => prev.filter((hw) => hw.id !== form.homeworkId));
        }
        setForm({ title: "", instructions: "", scenarioId: "", dueDate: "", homeworkId: "" });
        setMessage(`Practice assigned to ${studentName}!`);
      } catch {
        setMessage("Failed to assign practice");
      }
    });
  };

  const statusStyles: Record<string, { label: string; className: string }> = {
    assigned: { label: "Assigned", className: "bg-blue-100 text-blue-800" },
    in_progress: { label: "In progress", className: "bg-amber-100 text-amber-800" },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  };

  const openAssignments = items.filter((i) => i.status !== "completed");
  const completedAssignments = items.filter((i) => i.status === "completed");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const TrendIcon = ({ trend }: { trend: string | null }) => {
    if (trend === "improving") return <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />;
    if (trend === "declining") return <TrendingUp className="h-3.5 w-3.5 text-amber-500" />;
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Analytics Section - Show if there's practice data */}
      {summary && summary.total_sessions > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Practice Analytics
          </h3>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-5">
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
                {summary.avg_session_rating ? summary.avg_session_rating.toFixed(1) : "—"}
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

          {/* Grammar Issues & Activity in columns */}
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Top Grammar Issues */}
            {summary.top_grammar_issues && summary.top_grammar_issues.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <BookOpen className="h-3.5 w-3.5" />
                  Top Grammar Issues
                </h4>
                <div className="space-y-1.5">
                  {summary.top_grammar_issues.slice(0, 4).map((issue, idx) => (
                    <div
                      key={issue.category_slug}
                      className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-foreground">
                          {GRAMMAR_CATEGORY_LABELS[normalizeGrammarCategorySlug(issue.category_slug)] || issue.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {issue.count}
                        </Badge>
                        <TrendIcon trend={issue.trend} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Activity */}
            {summary.weekly_activity && summary.weekly_activity.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <Activity className="h-3.5 w-3.5" />
                  Weekly Activity
                </h4>
                <div className="flex items-end gap-1 rounded-lg border bg-muted/30 p-3">
                  {summary.weekly_activity.map((week, idx) => {
                    const maxSessions = Math.max(...summary.weekly_activity.map((w) => w.sessions), 1);
                    const height = Math.max(8, (week.sessions / maxSessions) * 40);
                    return (
                      <div
                        key={idx}
                        className="group relative flex-1"
                        title={`${formatDate(week.week)}: ${week.sessions} sessions`}
                      >
                        <div
                          className="mx-auto w-full max-w-5 rounded-t bg-primary/70 transition-colors group-hover:bg-primary"
                          style={{ height: `${height}px` }}
                        />
                        <div className="mt-1 text-center text-[10px] text-muted-foreground">
                          {week.sessions}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {summary.last_practice_at && (
            <div className="mt-4 text-xs text-muted-foreground">
              Last practice: {new Date(summary.last_practice_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      )}

      {/* Assignment Section */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            Practice Assignments
          </h3>
          <Badge variant="outline" className="text-xs">
            {openAssignments.length} active
          </Badge>
        </div>

        {message && (
          <p className={`rounded-lg px-3 py-2 text-sm mb-4 ${message.includes("Failed") || message.includes("Please") ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {message}
          </p>
        )}

        {/* Assignment form */}
        <form onSubmit={handleAssign} className="rounded-xl border border-border/70 bg-muted/10 p-4 space-y-3">
          {homeworkList.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                Link to homework (optional)
              </label>
              <Select value={form.homeworkId} onValueChange={handleHomeworkSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select homework to reinforce" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No homework link</SelectItem>
                  {homeworkList.map((hw) => (
                    <SelectItem key={hw.id} value={hw.id}>
                      {hw.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Input
              placeholder="Practice title (e.g., 'Restaurant roleplay')"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="flex-1"
              disabled={isSaving}
            />
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-[150px]"
                disabled={isSaving}
              />
            </div>
          </div>

          {scenarios.length > 0 && (
            <Select
              value={form.scenarioId}
              onValueChange={(value) => setForm((prev) => ({ ...prev, scenarioId: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a scenario template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No template</SelectItem>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.title} ({scenario.language})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Textarea
            placeholder="Instructions for the student (optional)"
            value={form.instructions}
            onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
            className="min-h-[60px]"
            disabled={isSaving}
          />

          <Button type="submit" disabled={isSaving || !form.title.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isSaving ? "Assigning..." : "Assign Practice"}
          </Button>
        </form>

        {/* Active assignments */}
        {openAssignments.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active
            </p>
            {openAssignments.map((item) => {
              const status = statusStyles[item.status];
              const isOverdue = item.due_date && new Date(item.due_date) < new Date();

              return (
                <div key={item.id} className="rounded-lg border border-border/70 bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{item.title}</p>
                        <Badge className={`text-[10px] ${status.className}`}>
                          {status.label}
                        </Badge>
                      </div>
                      {item.scenario && (
                        <p className="text-xs text-muted-foreground">
                          {item.scenario.language}
                          {item.scenario.topic ? ` · ${item.scenario.topic}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {item.due_date && (
                        <p className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                          Due {formatDistanceToNow(new Date(item.due_date), { addSuffix: true })}
                        </p>
                      )}
                      {item.sessions_completed > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {item.sessions_completed} session{item.sessions_completed !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed assignments */}
        {completedAssignments.length > 0 && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Completed
            </p>
            <div className="space-y-1">
              {completedAssignments.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.sessions_completed} session{item.sessions_completed !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No practice assigned yet.</p>
            <p className="text-xs mt-1">
              Create an assignment above to help {studentName} practice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
