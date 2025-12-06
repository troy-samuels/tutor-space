"use client";

import { useState, useTransition } from "react";
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
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  Calendar,
  MessageSquare,
  Award,
  Flame,
  Link2,
  FileText,
  Image as ImageIcon,
  Video,
  Sparkles,
} from "lucide-react";
import {
  type LearningStats,
  type LearningGoal,
  type ProficiencyAssessment,
  type LessonNote,
  type HomeworkAssignment,
  type HomeworkStatus,
  type StudentPracticeData,
  markHomeworkCompleted,
} from "@/lib/actions/progress";
import { AIPracticeCard } from "@/components/student/AIPracticeCard";
import { HomeworkPracticeButton } from "@/components/student/HomeworkPracticeButton";
import {
  LEVEL_LABELS,
  SKILL_LABELS,
  LEVEL_SCORES,
} from "@/lib/constants/progress-labels";
import { format, formatDistanceToNow } from "date-fns";

interface StudentProgressClientProps {
  stats: LearningStats | null;
  goals: LearningGoal[];
  assessments: ProficiencyAssessment[];
  recentNotes: LessonNote[];
  homework: HomeworkAssignment[];
  practiceData?: StudentPracticeData;
}

export function StudentProgressClient({
  stats,
  goals,
  assessments,
  recentNotes,
  homework,
  practiceData,
}: StudentProgressClientProps) {
  const [homeworkItems, setHomeworkItems] = useState(homework);
  const [isUpdating, startTransition] = useTransition();
  const [homeworkMessage, setHomeworkMessage] = useState<string | null>(null);

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: "bg-red-100 text-red-800",
      elementary: "bg-orange-100 text-orange-800",
      intermediate: "bg-yellow-100 text-yellow-800",
      upper_intermediate: "bg-blue-100 text-blue-800",
      advanced: "bg-purple-100 text-purple-800",
      proficient: "bg-green-100 text-green-800",
    };
    return colors[level] || "bg-gray-100 text-gray-800";
  };

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
    .sort((a, b) => new Date(b.completed_at || b.updated_at).getTime() - new Date(a.completed_at || a.updated_at).getTime());

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">
                {stats?.total_lessons || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">
                {stats ? formatMinutes(stats.total_minutes) : "0m"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">
                {stats?.current_streak || 0} weeks
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Goals Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{completedGoals.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Homework & Assignments */}
      <Card>
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Homework & assignments
            </CardTitle>
            <CardDescription>What to focus on between lessons.</CardDescription>
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
                          <Badge className={`text-[11px] ${status.className}`}>
                            {status.label}
                          </Badge>
                        </div>
                        {item.instructions ? (
                          <p className="text-sm text-muted-foreground">{item.instructions}</p>
                        ) : null}
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
                          {/* AI Practice button - shows when homework has linked practice */}
                          {item.practice_assignment && practiceData?.isSubscribed && (
                            <HomeworkPracticeButton
                              practiceAssignmentId={item.practice_assignment.id}
                              status={item.practice_assignment.status}
                              sessionsCompleted={item.practice_assignment.sessions_completed}
                            />
                          )}
                          {!practiceData?.isSubscribed && item.practice_assignment && practiceData && (
                            <Link
                              href={`/student-auth/practice/subscribe?student=${practiceData.studentId ?? ""}`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Unlock AI practice</span>
                            </Link>
                          )}
                          {item.status !== "completed" && item.status !== "cancelled" ? (
                            <button
                              onClick={() => handleComplete(item.id)}
                              disabled={isUpdating}
                              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                            >
                              {isUpdating ? "Saving..." : "Mark done"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
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
                {completedHomework.slice(0, 3).map((item) => (
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

      {/* AI Practice Companion */}
      {practiceData && practiceData.studentId && (
        <AIPracticeCard
          isSubscribed={practiceData.isSubscribed}
          assignments={practiceData.assignments}
          stats={practiceData.stats}
          studentId={practiceData.studentId}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Proficiency Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Skill Levels
            </CardTitle>
            <CardDescription>
              Your current proficiency in each area
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No assessments yet</p>
                <p className="text-xs mt-1">
                  Your tutor will assess your skills during lessons
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {SKILL_LABELS[assessment.skill_area] || assessment.skill_area}
                      </span>
                      <Badge className={getLevelColor(assessment.level)}>
                        {LEVEL_LABELS[assessment.level] || assessment.level}
                      </Badge>
                    </div>
                    <Progress
                      value={(LEVEL_SCORES[assessment.level] / 6) * 100}
                      className="h-2"
                    />
                    {assessment.notes && (
                      <p className="text-xs text-muted-foreground">
                        {assessment.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Goals
            </CardTitle>
            <CardDescription>
              Your current learning objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No active goals</p>
                <p className="text-xs mt-1">
                  Set learning goals with your tutor
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium">{goal.title}</h4>
                      {goal.target_date && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(goal.target_date), "MMM d")}
                        </Badge>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {goal.description}
                      </p>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{goal.progress_percentage}%</span>
                      </div>
                      <Progress value={goal.progress_percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Lesson Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Lesson Notes
          </CardTitle>
          <CardDescription>
            Feedback and notes from your lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No lesson notes yet</p>
              <p className="text-xs mt-1">
                Your tutor will add notes after lessons
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {note.topics_covered && note.topics_covered.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Topics Covered
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {note.topics_covered.map((topic, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {note.vocabulary_introduced && note.vocabulary_introduced.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        New Vocabulary
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {note.vocabulary_introduced.map((word, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {word}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {note.student_visible_notes && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Notes
                      </p>
                      <p className="text-sm">{note.student_visible_notes}</p>
                    </div>
                  )}

                  {note.homework && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-yellow-800 mb-1">
                        Homework
                      </p>
                      <p className="text-sm text-yellow-900">{note.homework}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    {note.strengths && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-800 mb-1">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Strengths
                        </p>
                        <p className="text-sm text-green-900">{note.strengths}</p>
                      </div>
                    )}
                    {note.areas_to_improve && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          Areas to Improve
                        </p>
                        <p className="text-sm text-blue-900">{note.areas_to_improve}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
