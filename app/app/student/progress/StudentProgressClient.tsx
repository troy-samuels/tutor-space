"use client";

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
} from "lucide-react";
import {
  type LearningStats,
  type LearningGoal,
  type ProficiencyAssessment,
  type LessonNote,
  type HomeworkAssignment,
  type StudentPracticeData,
} from "@/lib/actions/progress";
import { AIPracticeCard } from "@/components/student/AIPracticeCard";
import { DrillProgressCard } from "@/components/student-auth/DrillProgressCard";
import type { DrillWithContext } from "@/lib/actions/drills";
import {
  LEVEL_LABELS,
  SKILL_LABELS,
  LEVEL_SCORES,
} from "@/lib/constants/progress-labels";
import { format, formatDistanceToNow } from "date-fns";
import { HomeworkList } from "@/components/student/HomeworkList";

interface StudentProgressClientProps {
  stats: LearningStats | null;
  goals: LearningGoal[];
  assessments: ProficiencyAssessment[];
  recentNotes: LessonNote[];
  homework: HomeworkAssignment[];
  practiceData?: StudentPracticeData;
  drillCounts?: { pending: number; completed: number; total: number };
  pendingDrills?: DrillWithContext[];
}

export function StudentProgressClient({
  stats,
  goals,
  assessments,
  recentNotes,
  homework,
  practiceData,
  drillCounts,
  pendingDrills,
}: StudentProgressClientProps) {
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

      <HomeworkList homework={homework} practiceData={practiceData} />

      {/* Practice Drills */}
      {drillCounts && pendingDrills && (
        <DrillProgressCard
          pendingCount={drillCounts.pending}
          completedCount={drillCounts.completed}
          recentDrills={pendingDrills}
        />
      )}

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
