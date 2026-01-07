"use client";

import { HomeworkList } from "@/components/student/HomeworkList";
import { AIPracticeCard } from "@/components/student/AIPracticeCard";
import { DrillProgressCard } from "@/components/student-auth/DrillProgressCard";
import { Card, CardContent } from "@/components/ui/card";
import type {
  HomeworkAssignment,
  LearningStats,
  StudentPracticeData,
} from "@/lib/actions/progress";
import type { DrillWithContext } from "@/lib/actions/types";
import { Lock } from "lucide-react";

type HomeworkPageClientProps = {
  homework: HomeworkAssignment[];
  practiceData?: StudentPracticeData;
  stats: LearningStats | null;
  drillCounts?: { pending: number; completed: number; total: number } | null;
  pendingDrills?: DrillWithContext[] | null;
  showPracticeSections?: boolean;
};

export function HomeworkPageClient({
  homework,
  practiceData,
  stats,
  drillCounts,
  pendingDrills,
  showPracticeSections = false,
}: HomeworkPageClientProps) {
  const lessonsCompleted = stats?.lessons_completed ?? stats?.total_lessons ?? 0;
  const hasCompletedFirstClass = showPracticeSections || lessonsCompleted > 0;
  const practiceDataForDisplay = hasCompletedFirstClass ? practiceData : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Homework</h1>
        <p className="text-muted-foreground">
          See everything your tutor assigned — including AI-generated homework and linked practice.
        </p>
        {!hasCompletedFirstClass && (
          <p className="text-sm text-muted-foreground mt-2">
            Once your first class is marked complete, we&apos;ll also unlock any linked practice drills here.
          </p>
        )}
      </div>

      <HomeworkList
        homework={homework}
        practiceData={practiceDataForDisplay}
        title="Homework"
        description="Assignments from your tutor and AI."
        showPracticeDrills={hasCompletedFirstClass}
        completedLimit={5}
      />

      {hasCompletedFirstClass ? (
        <>
          {practiceDataForDisplay && practiceDataForDisplay.studentId && (
            <AIPracticeCard
              isSubscribed={practiceDataForDisplay.isSubscribed}
              assignments={practiceDataForDisplay.assignments}
              stats={practiceDataForDisplay.stats}
              studentId={practiceDataForDisplay.studentId}
            />
          )}

          {drillCounts && pendingDrills && (
            <DrillProgressCard
              pendingCount={drillCounts.pending}
              completedCount={drillCounts.completed}
              recentDrills={pendingDrills}
            />
          )}
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
            <Lock className="h-5 w-5 opacity-50" />
            <p className="leading-snug">
              Practice drills will appear after your first class is completed. For now, focus on the homework above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
