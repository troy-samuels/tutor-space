"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Plus,
  Send,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

type PracticeAssignmentPanelProps = {
  studentId: string;
  studentName: string;
  assignments: PracticeAssignmentItem[];
  scenarios: PracticeScenario[];
  studentHasSubscription: boolean;
};

export function PracticeAssignmentPanel({
  studentId,
  studentName,
  assignments,
  scenarios,
  studentHasSubscription,
}: PracticeAssignmentPanelProps) {
  const [items, setItems] = useState<PracticeAssignmentItem[]>(assignments);
  const [isSaving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    instructions: "",
    scenarioId: "",
    dueDate: "",
  });

  const statusStyles: Record<string, { label: string; className: string }> = {
    assigned: { label: "Assigned", className: "bg-blue-100 text-blue-800" },
    in_progress: { label: "In progress", className: "bg-amber-100 text-amber-800" },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
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
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.error || "Failed to assign practice");
          return;
        }

        setItems((prev) => [data.assignment, ...prev]);
        setForm({ title: "", instructions: "", scenarioId: "", dueDate: "" });
        setMessage(`Practice assigned to ${studentName}!`);
      } catch (error) {
        setMessage("Failed to assign practice");
      }
    });
  };

  const openAssignments = items.filter((i) => i.status !== "completed");
  const completedAssignments = items.filter((i) => i.status === "completed");

  // If student doesn't have subscription, show a different UI
  if (!studentHasSubscription) {
    return (
      <Card className="border border-border bg-background/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI Practice
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              New
            </Badge>
          </CardTitle>
          <CardDescription>
            AI conversation practice between lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
            <Bot className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">
              {studentName} hasn&apos;t subscribed yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Once they subscribe to AI Practice ($6/mo), you can assign
              conversation scenarios for them to practice between lessons.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              <p className="font-medium">Revenue share: $4.50 to you / $1.50 platform</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-background/80 shadow-sm">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AI Practice
          </CardTitle>
          <CardDescription>
            Assign AI conversation practice for between lessons
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {openAssignments.length} active
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p className={`rounded-lg px-3 py-2 text-sm ${message.includes("Failed") || message.includes("Please") ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            {message}
          </p>
        )}

        {/* Assignment form */}
        <form onSubmit={handleAssign} className="rounded-xl border border-border/70 bg-muted/10 p-4 space-y-3">
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
                <SelectItem value="">No template - custom practice</SelectItem>
                {scenarios.map((scenario) => (
                  <SelectItem key={scenario.id} value={scenario.id}>
                    {scenario.title} ({scenario.language}
                    {scenario.level ? ` · ${scenario.level}` : ""})
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

          <Button type="submit" disabled={isSaving || !form.title.trim()} className="w-full sm:w-auto">
            <Send className="h-4 w-4 mr-2" />
            {isSaving ? "Assigning..." : "Assign Practice"}
          </Button>
        </form>

        {/* Active assignments */}
        {openAssignments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active assignments
            </p>
            {openAssignments.map((item) => {
              const status = statusStyles[item.status];
              const isOverdue = item.due_date && new Date(item.due_date) < new Date();

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 bg-background/80 p-3"
                >
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
                          {item.scenario.level ? ` · ${item.scenario.level}` : ""}
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
          <div className="border-t border-border/50 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Completed
            </p>
            <div className="mt-2 space-y-1">
              {completedAssignments.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium truncate">{item.title}</span>
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
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-center text-sm text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No practice assigned yet.</p>
            <p className="text-xs mt-1">
              Create an assignment above to help {studentName} practice between lessons.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
