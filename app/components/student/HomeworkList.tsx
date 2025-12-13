"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  Link2,
  Mic,
  Pause,
  Play,
  Sparkles,
  Video,
} from "lucide-react";
import {
  type HomeworkAssignment,
  type HomeworkStatus,
  type StudentPracticeData,
  markHomeworkCompleted,
} from "@/lib/actions/progress";
import { HomeworkPracticeButton } from "@/components/student/HomeworkPracticeButton";
import { HomeworkSubmissionForm } from "@/components/student/HomeworkSubmissionForm";
import { DrillMiniCard } from "@/components/student-auth/DrillMiniCard";

type HomeworkListProps = {
  homework: HomeworkAssignment[];
  practiceData?: StudentPracticeData;
  title?: string;
  description?: string;
  showPracticeDrills?: boolean;
  completedLimit?: number;
};

export function HomeworkList({
  homework,
  practiceData,
  title = "Homework & assignments",
  description = "What to focus on between lessons.",
  showPracticeDrills = true,
  completedLimit = 3,
}: HomeworkListProps) {
  const [homeworkItems, setHomeworkItems] = useState(homework);
  const [isUpdating, startTransition] = useTransition();
  const [homeworkMessage, setHomeworkMessage] = useState<string | null>(null);
  const [submittingHomeworkId, setSubmittingHomeworkId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const homeworkStatusStyles: Record<HomeworkStatus, { label: string; className: string }> = {
    assigned: { label: "Assigned", className: "bg-blue-100 text-blue-800" },
    in_progress: { label: "In progress", className: "bg-amber-100 text-amber-800" },
    submitted: { label: "Submitted", className: "bg-purple-100 text-purple-800" },
    completed: { label: "Completed", className: "bg-green-100 text-green-800" },
    cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-700" },
  };

  const openHomework = homeworkItems
    .filter((item) => item.status !== "completed" && item.status !== "cancelled")
    .sort((a, b) => {
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const completedHomework = homeworkItems
    .filter((item) => item.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.completed_at || b.updated_at).getTime() -
        new Date(a.completed_at || a.updated_at).getTime()
    );

  const attachmentIcon = (type?: string) => {
    switch (type) {
      case "pdf":
      case "file":
        return <FileText className="h-3.5 w-3.5" />;
      case "image":
        return <ImageIcon className="h-3.5 w-3.5" />;
      case "video":
        return <Video className="h-3.5 w-3.5" />;
      default:
        return <Link2 className="h-3.5 w-3.5" />;
    }
  };

  const handleComplete = (assignmentId: string) => {
    setHomeworkMessage(null);
    const previous = homeworkItems;

    startTransition(async () => {
      setHomeworkItems((items) =>
        items.map((item) =>
          item.id === assignmentId
            ? { ...item, status: "completed", completed_at: new Date().toISOString() }
            : item
        )
      );

      const result = await markHomeworkCompleted(assignmentId);

      if ((result as any)?.error) {
        setHomeworkItems(previous);
        setHomeworkMessage((result as any).error);
        return;
      }

      if ((result as any)?.data) {
        const updated = (result as any).data as HomeworkAssignment;
        setHomeworkItems((items) =>
          items.map((item) => (item.id === assignmentId ? updated : item))
        );
        setHomeworkMessage("Nice work! Homework marked as completed.");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {openHomework.length} open
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {homeworkMessage ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {homeworkMessage}
          </p>
        ) : null}

        {openHomework.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            No open homework. Your tutor will add assignments after your next lesson.
          </div>
        ) : (
          <div className="space-y-3">
            {openHomework.map((item) => {
              const status = homeworkStatusStyles[item.status] || {
                label: item.status,
                className: "bg-muted text-foreground",
              };
              const isOverdue = item.due_date
                ? new Date(item.due_date) < new Date() && item.status !== "completed"
                : false;
              const dueLabel = item.due_date
                ? `Due ${formatDistanceToNow(new Date(item.due_date), { addSuffix: true })}`
                : "No due date set";

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <Badge className={`text-[11px] ${status.className}`}>{status.label}</Badge>
                      </div>
                      {item.instructions ? (
                        <p className="text-sm text-muted-foreground">{item.instructions}</p>
                      ) : null}
                      {item.audio_instruction_url && (
                        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 p-2">
                          <audio
                            id={`audio-${item.id}`}
                            src={item.audio_instruction_url}
                            onEnded={() => setPlayingAudioId(null)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const audio = document.getElementById(`audio-${item.id}`) as HTMLAudioElement;
                              if (playingAudioId === item.id) {
                                audio?.pause();
                                setPlayingAudioId(null);
                              } else {
                                if (playingAudioId) {
                                  const prevAudio = document.getElementById(`audio-${playingAudioId}`) as HTMLAudioElement;
                                  prevAudio?.pause();
                                }
                                audio?.play();
                                setPlayingAudioId(item.id);
                              }
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            {playingAudioId === item.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4 ml-0.5" />
                            )}
                          </button>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mic className="h-3.5 w-3.5" />
                            <span>Audio instruction from tutor</span>
                          </div>
                        </div>
                      )}
                      {item.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.attachments.map((attachment, idx) => (
                            <a
                              key={`${item.id}-att-${idx}`}
                              href={attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-xs font-medium text-foreground transition hover:bg-muted/70"
                            >
                              {attachmentIcon(attachment.type)}
                              <span className="truncate max-w-[140px]">
                                {attachment.label || attachment.url}
                              </span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span className={`text-xs ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                        {dueLabel}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.practice_assignment && practiceData?.isSubscribed && (
                          <HomeworkPracticeButton
                            practiceAssignmentId={item.practice_assignment.id}
                            status={item.practice_assignment.status}
                            sessionsCompleted={item.practice_assignment.sessions_completed}
                          />
                        )}
                        {!practiceData?.isSubscribed && item.practice_assignment && practiceData && (
                          <Link
                            href={`/student/practice/subscribe?student=${practiceData.studentId ?? ""}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Unlock practice</span>
                          </Link>
                        )}
                        {item.status !== "completed" && item.status !== "cancelled" ? (
                          <>
                            <button
                              onClick={() =>
                                setSubmittingHomeworkId(
                                  submittingHomeworkId === item.id ? null : item.id
                                )
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-primary bg-transparent px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:opacity-50"
                            >
                              {submittingHomeworkId === item.id ? "Cancel" : "Submit response"}
                            </button>
                            <button
                              onClick={() => handleComplete(item.id)}
                              disabled={isUpdating}
                              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                            >
                              {isUpdating ? "Saving..." : "Mark done"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {submittingHomeworkId === item.id && (
                    <div className="mt-4 border-t border-border/70 pt-4">
                      <HomeworkSubmissionForm
                        homeworkId={item.id}
                        homeworkTitle={item.title}
                        onSubmitted={() => {
                          setSubmittingHomeworkId(null);
                          setHomeworkMessage(
                            "Your response has been submitted! Your tutor will review it soon."
                          );
                          setHomeworkItems((items) =>
                            items.map((h) =>
                              h.id === item.id ? { ...h, status: "submitted" as const } : h
                            )
                          );
                        }}
                        onCancel={() => setSubmittingHomeworkId(null)}
                      />
                    </div>
                  )}

                  {showPracticeDrills && item.drills && item.drills.length > 0 && (
                    <div className="mt-4 border-t border-border/70 pt-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Practice Drills ({item.drills.length})
                      </p>
                      <div className="space-y-2">
                        {item.drills.map((drill) => (
                          <DrillMiniCard key={drill.id} drill={drill} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {completedHomework.length > 0 ? (
          <div className="border-t border-border/70 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recently completed
            </p>
            <div className="mt-2 space-y-1.5">
              {completedHomework.slice(0, completedLimit).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.completed_at
                      ? formatDistanceToNow(new Date(item.completed_at), { addSuffix: true })
                      : "Completed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
