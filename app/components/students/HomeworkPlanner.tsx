"use client";

import { useState, useTransition } from "react";
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
  Calendar,
  Clock,
  Link2,
  Paperclip,
  Plus,
  Send,
  CheckCircle,
  Bot,
} from "lucide-react";
import {
  type HomeworkAssignment,
  type HomeworkAttachment,
  type HomeworkStatus,
  HOMEWORK_STATUSES,
  assignHomework,
  updateHomeworkStatus,
} from "@/lib/actions/progress";
import { formatDistanceToNow } from "date-fns";
import { PracticeStatusIcon, type PracticeStats } from "./PracticeStatusIcon";

type HomeworkPlannerProps = {
  studentId: string;
  studentName: string;
  assignments: HomeworkAssignment[];
};

const ATTACHMENT_TYPES = ["link", "pdf", "image", "video", "file"] as const;

export function HomeworkPlanner({ studentId, studentName, assignments }: HomeworkPlannerProps) {
  const [items, setItems] = useState<HomeworkAssignment[]>(assignments);
  const [isSaving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    instructions: string;
    dueDate: string;
    attachments: HomeworkAttachment[];
  }>({
    title: "",
    instructions: "",
    dueDate: "",
    attachments: [{ label: "", url: "", type: "link" }],
  });

  const handleAttachmentChange = (
    index: number,
    field: keyof HomeworkAttachment,
    value: string
  ) => {
    setForm((prev) => {
      const next = [...prev.attachments];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, attachments: next };
    });
  };

  const addAttachmentRow = () => {
    setForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { label: "", url: "", type: "link" }],
    }));
  };

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const attachments = form.attachments.filter((att) => att.url.trim().length > 0);
      const result = await assignHomework({
        studentId,
        title: form.title,
        instructions: form.instructions || null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        attachments,
      });

      if ((result as any)?.error) {
        setMessage((result as any).error);
        return;
      }

      if ((result as any)?.data) {
        setItems((prev) => [result.data as HomeworkAssignment, ...prev]);
        setForm({ title: "", instructions: "", dueDate: "", attachments: [{ label: "", url: "", type: "link" }] });
        setMessage(`Homework sent to ${studentName}`);
      }
    });
  };

  const handleStatusChange = (assignmentId: string, status: HomeworkStatus) => {
    setMessage(null);
    startTransition(async () => {
      const previous = items;
      setItems((prev) =>
        prev.map((item) => (item.id === assignmentId ? { ...item, status } : item))
      );

      const result = await updateHomeworkStatus({ assignmentId, status });
      if ((result as any)?.error) {
        setItems(previous);
        setMessage((result as any).error);
      } else if ((result as any)?.data) {
        const updated = (result as any).data as HomeworkAssignment;
        setItems((prev) => prev.map((item) => (item.id === assignmentId ? updated : item)));
      }
    });
  };

  const handlePracticeStatsUpdate = (assignmentId: string, stats: PracticeStats) => {
    setItems((prev) =>
      prev.map((item) =>
        item.practice_assignment?.id === assignmentId
          ? {
              ...item,
              practice_assignment: {
                ...(item.practice_assignment as any),
                status: stats.status,
                sessions_completed: stats.sessionsCompleted,
              },
            }
          : item
      )
    );
  };

  return (
    <Card className="border border-border bg-background/80 shadow-sm">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            Homework planner
          </CardTitle>
          <CardDescription>Send links, PDFs, or images to keep momentum between sessions.</CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {items.filter((i) => i.status !== "completed" && i.status !== "cancelled").length} open
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            {message}
          </p>
        ) : null}

        <form onSubmit={handleAssign} className="rounded-xl border border-border/70 bg-muted/10 p-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Input
              placeholder="Assignment title"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <Input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <Textarea
            placeholder={`Instructions for ${studentName}`}
            value={form.instructions}
            onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resources
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={addAttachmentRow}>
                <Plus className="mr-1 h-4 w-4" /> Add link
              </Button>
            </div>
            {form.attachments.map((attachment, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_120px]">
                <Input
                  placeholder="Label"
                  value={attachment.label}
                  onChange={(e) => handleAttachmentChange(index, "label", e.target.value)}
                />
                <Input
                  placeholder="https://..."
                  value={attachment.url}
                  onChange={(e) => handleAttachmentChange(index, "url", e.target.value)}
                />
                <Select
                  value={attachment.type || "link"}
                  onValueChange={(value) => handleAttachmentChange(index, "type", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTACHMENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Students will see these instantly in their portal.
            </p>
            <Button type="submit" disabled={isSaving} className="inline-flex items-center gap-2">
              {isSaving ? "Sending..." : "Assign"}
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No assignments yet. Start by sending a quick task to keep progress moving.
            </div>
          ) : (
            items.map((item) => {
              const dueLabel = item.due_date
                ? formatDistanceToNow(new Date(item.due_date), { addSuffix: true })
                : "No due date";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{item.title}</p>
                      {item.instructions ? (
                        <p className="text-sm text-muted-foreground">{item.instructions}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <div className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {dueLabel}
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          {item.status}
                        </div>
                        {item.practice_assignment && (
                          <div className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5">
                            <PracticeStatusIcon
                              practiceAssignmentId={item.practice_assignment.id}
                              status={item.practice_assignment.status}
                              sessionsCompleted={item.practice_assignment.sessions_completed}
                              onStatsUpdate={(stats) => handlePracticeStatsUpdate(item.practice_assignment!.id, stats)}
                            />
                            <span className="text-primary/80">AI Practice</span>
                          </div>
                        )}
                      </div>
                      {item.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.attachments.map((att, idx) => (
                            <a
                              key={`${item.id}-att-${idx}`}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/20 px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted/60"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[140px]">
                                {att.label || att.url}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={item.status}
                        onValueChange={(value) => handleStatusChange(item.id, value as HomeworkStatus)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOMEWORK_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.status === "completed" ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <CheckCircle className="mr-1 h-3.5 w-3.5" />
                          Done
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
