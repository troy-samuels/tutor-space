"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  Target,
  TrendingUp,
  CheckCircle,
  Calendar,
} from "lucide-react";
import {
  type LearningGoal,
  type LearningStats,
  type ProficiencyAssessment,
  createLearningGoal,
  updateLearningGoalProgress,
} from "@/lib/actions/progress";
import { LEVEL_LABELS, LEVEL_SCORES, SKILL_LABELS } from "@/lib/constants/progress-labels";

type StudentProgressPanelProps = {
  studentId: string;
  studentName: string;
  stats: LearningStats | null;
  goals: LearningGoal[];
  assessments: ProficiencyAssessment[];
};

export function StudentProgressPanel({
  studentId,
  studentName,
  stats,
  goals,
  assessments,
}: StudentProgressPanelProps) {
  const [goalForm, setGoalForm] = useState({ title: "", description: "", targetDate: "" });
  const [goalMessage, setGoalMessage] = useState<string | null>(null);
  const [goalList, setGoalList] = useState<LearningGoal[]>(goals);
  const [isSaving, startTransition] = useTransition();

  const activeGoals = goalList.filter((g) => g.status === "active");
  const completedGoals = goalList.filter((g) => g.status === "completed");

  const handleAddGoal = (e: FormEvent) => {
    e.preventDefault();
    setGoalMessage(null);

    startTransition(async () => {
      const result = await createLearningGoal({
        studentId,
        title: goalForm.title,
        description: goalForm.description || null,
        targetDate: goalForm.targetDate || null,
      });

      if ((result as any)?.error) {
        setGoalMessage((result as any).error);
        return;
      }

      if ((result as any)?.data) {
        setGoalList((prev) => [result.data as LearningGoal, ...prev]);
        setGoalForm({ title: "", description: "", targetDate: "" });
        setGoalMessage("Goal added for " + studentName);
      }
    });
  };

  const markGoalComplete = (goalId: string) => {
    startTransition(async () => {
      const previous = goalList;
      setGoalList((prev) =>
        prev.map((goal) =>
          goal.id === goalId ? { ...goal, status: "completed", progress_percentage: 100 } : goal
        )
      );

      const result = await updateLearningGoalProgress(goalId, 100, "completed");
      if ((result as any)?.error) {
        setGoalList(previous);
      } else if ((result as any)?.data) {
        setGoalList((prev) =>
          prev.map((goal) => (goal.id === goalId ? (result as any).data : goal))
        );
      }
    });
  };

  return (
    <Card className="border border-border bg-background/80 shadow-sm">
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Progress tracker
          </CardTitle>
          <CardDescription>
            Quick snapshot of goals and skill levels.
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {stats?.total_lessons ?? 0} lessons · {stats?.total_minutes ?? 0} mins
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Flame className="h-4 w-4 text-orange-500" />
              Streak
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {stats?.current_streak ?? 0} wk
            </p>
            <p className="text-xs text-muted-foreground">
              Longest: {stats?.longest_streak ?? 0} weeks
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Target className="h-4 w-4 text-primary" />
              Active goals
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {activeGoals.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {completedGoals.length} completed
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Total lessons
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {stats?.total_lessons ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Last session {stats?.last_lesson_at ? "on " + new Date(stats.last_lesson_at).toLocaleDateString() : "TBD"}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Learning goals</p>
            <span className="text-xs text-muted-foreground">
              {goalList.length === 0 ? "Add a target to track" : `${goalList.length} total`}
            </span>
          </div>
          {goalList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              No goals yet. Add one to track progress.
            </div>
          ) : (
            <div className="space-y-3">
              {goalList.slice(0, 3).map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-border/70 bg-muted/10 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{goal.title}</p>
                      {goal.description ? (
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                      ) : null}
                      {goal.target_date ? (
                        <div className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Due {new Date(goal.target_date).toLocaleDateString()}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[11px]">
                        {goal.status}
                      </Badge>
                      {goal.status !== "completed" ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isSaving}
                          onClick={() => markGoalComplete(goal.id)}
                        >
                          Mark done
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
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
        </div>

        <div className="rounded-lg border border-border/70 bg-muted/10 p-4">
          <p className="text-sm font-semibold text-foreground">Add quick goal</p>
          {goalMessage ? (
            <p className="mt-1 text-xs text-primary">{goalMessage}</p>
          ) : null}
          <form className="mt-3 space-y-3" onSubmit={handleAddGoal}>
            <Input
              placeholder={`E.g. master past tense with ${studentName}`}
              value={goalForm.title}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <Textarea
              placeholder="Add a short note or success criteria (optional)"
              value={goalForm.description}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">
                Target date
                <Input
                  type="date"
                  value={goalForm.targetDate}
                  onChange={(e) => setGoalForm((prev) => ({ ...prev, targetDate: e.target.value }))}
                  className="mt-1"
                />
              </label>
              <Button type="submit" disabled={isSaving} className="mt-4">
                {isSaving ? "Saving..." : "Save goal"}
              </Button>
            </div>
          </form>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Skill levels</p>
          {assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {assessments.slice(0, 4).map((assessment) => (
                <div
                  key={assessment.id}
                  className="rounded-lg border border-border/70 bg-muted/10 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {SKILL_LABELS[assessment.skill_area] || assessment.skill_area}
                    </p>
                    <Badge variant="outline" className="text-[11px]">
                      {LEVEL_LABELS[assessment.level] || assessment.level}
                    </Badge>
                  </div>
                  <Progress value={(LEVEL_SCORES[assessment.level] / 6) * 100} className="h-1.5" />
                  {assessment.notes ? (
                    <p className="text-xs text-muted-foreground">{assessment.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
