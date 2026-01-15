"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, CalendarDays, Loader2, MessageSquare, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentProfileCard } from "./StudentProfileCard";
import { StudentUpcomingLessons } from "./StudentUpcomingLessons";
import { StudentDetailTabs } from "./StudentDetailTabs";
import { StudentDetailsTab } from "./StudentDetailsTab";
import { StudentLessonsCalendar } from "./StudentLessonsCalendar";
import { StudentPaymentsTab } from "./StudentPaymentsTab";
import { StudentMessagesTab } from "./StudentMessagesTab";
import { StudentOverview } from "./StudentOverview";
import { OnboardingChecklist } from "./onboarding/OnboardingChecklist";
import { OnboardingProgressBadge } from "./onboarding/OnboardingProgressBadge";
import { EngagementScoreCard } from "./engagement/EngagementScoreCard";
import { StudentTimeline } from "./timeline/StudentTimeline";
import { getOrCreateThreadByStudentId } from "@/lib/actions/messaging";
import { getStudentOnboardingProgress, initializeStudentOnboarding } from "@/lib/actions/student-onboarding";
import { getStudentEngagementScore } from "@/lib/actions/student-engagement";
import type { OnboardingProgress, EngagementScore } from "@/lib/actions/types";
import type { StudentDetailData } from "@/lib/data/types";

type StudentDetailViewProps = {
  studentId: string;
  initialData?: StudentDetailData | null;
  onClose?: () => void;
};

type FetchState = {
  data: StudentDetailData | null;
  loading: boolean;
  error: string | null;
};

export function StudentDetailView({ studentId, initialData, onClose }: StudentDetailViewProps) {
  const [state, setState] = useState<FetchState>({
    data: initialData ?? null,
    loading: !initialData,
    error: null,
  });
  const searchParams = useSearchParams();
  const [isCreatingThread, startThreadTransition] = useTransition();
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [engagementScore, setEngagementScore] = useState<EngagementScore | null>(null);
  const [isCRMLoading, startCRMTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;
    if (initialData) return;

    setState({ data: null, loading: true, error: null });
    fetch(`/api/student-detail?studentId=${studentId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Student not found" : "Failed to load student");
        }
        const json = await res.json();
        if (isMounted) {
          setState({ data: json, loading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (isMounted) {
          setState({ data: null, loading: false, error: error.message });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [studentId, initialData]);

  const detail = state.data;

  const initialTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    const validTabs = ["overview", "profile", "onboarding", "lessons", "messages", "payments", "timeline"];
    return tabParam && validTabs.includes(tabParam) ? tabParam : "overview";
  }, [searchParams]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [threadId, setThreadId] = useState<string | null>(detail?.threadId ?? null);

  const handleStudentUpdated = (updates: Partial<StudentDetailData["student"]>) => {
    setState((prev) => {
      if (!prev.data) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          student: {
            ...prev.data.student,
            ...updates,
          },
        },
      };
    });
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setThreadId(detail?.threadId ?? null);
  }, [detail?.threadId]);

  // Load CRM data (onboarding progress and engagement score) when student data is available
  useEffect(() => {
    if (!detail?.student?.id) return;

    startCRMTransition(async () => {
      const [progressResult, scoreResult] = await Promise.all([
        getStudentOnboardingProgress(detail.student.id),
        getStudentEngagementScore(detail.student.id),
      ]);
      setOnboardingProgress(progressResult);
      setEngagementScore(scoreResult);
    });
  }, [detail?.student?.id]);

  const overviewTab = useMemo(() => {
    if (!detail) return null;
    return (
      <StudentOverview
        student={detail.student}
        nextBooking={detail.nextBooking}
        stats={detail.stats}
        recentHomework={detail.homework}
        practiceScenarios={detail.practiceScenarios}
        onEditProfile={() => setActiveTab("profile")}
      />
    );
  }, [detail, setActiveTab]);

  const profileTab = detail ? (
    <StudentDetailsTab
      student={detail.student}
      onStudentUpdated={handleStudentUpdated}
    />
  ) : null;

  const lessonsTab = detail ? (
    <StudentLessonsCalendar studentId={detail.student.id} bookings={detail.bookings} />
  ) : null;

  const messagesTab = detail ? (
    <StudentMessagesTab
      threadId={threadId}
      messages={detail.conversationMessages}
      studentName={detail.student.full_name ?? "Student"}
      tutorId={detail.tutorId}
    />
  ) : null;

  const paymentsTab = detail ? (
    detail.stripePayments ? (
      <StudentPaymentsTab
        totalPaidCents={detail.stripePayments.totalPaidCents}
        totalRefundedCents={detail.stripePayments.totalRefundedCents}
        currency={detail.stripePayments.currency}
        payments={detail.stripePayments.payments}
        source={detail.stripePayments.source}
      />
    ) : (
      <StudentPaymentsTab
        totalPaidCents={0}
        totalRefundedCents={0}
        currency="USD"
        payments={[]}
        source="audit"
      />
    )
  ) : null;

  const onboardingTab = detail ? (
    <div className="grid gap-6 lg:grid-cols-2">
      <OnboardingChecklist
        studentId={detail.student.id}
        progress={onboardingProgress}
        onUpdate={setOnboardingProgress}
      />
      {engagementScore && (
        <EngagementScoreCard
          studentId={detail.student.id}
          score={engagementScore}
          onUpdate={setEngagementScore}
        />
      )}
    </div>
  ) : null;

  const timelineTab = detail ? (
    <StudentTimeline studentId={detail.student.id} />
  ) : null;

  // Get effective status values
  const onboardingStatus = (detail?.student as { onboarding_status?: string })?.onboarding_status ?? "not_started";
  const completedCount = onboardingProgress?.completed_items?.length ?? 0;
  const totalCount = (onboardingProgress?.template?.items as Array<unknown>)?.length ?? 0;

  if (state.loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-muted/50" />
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-64 animate-pulse rounded-xl bg-muted/40" />
        </div>
      </div>
    );
  }

  if (state.error || !detail) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-sm font-semibold text-destructive">{state.error ?? "Student not found."}</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onClose ? (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to students
              </button>
            ) : (
              <Link
                href="/students"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to students
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{detail.student.full_name}</h1>
            {!isCRMLoading && (
              <div className="flex items-center gap-2">
                <OnboardingProgressBadge
                  status={onboardingStatus as "not_started" | "in_progress" | "completed"}
                  completedCount={completedCount}
                  totalCount={totalCount}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => {
              setActiveTab("messages");
              if (!threadId && !isCreatingThread) {
                startThreadTransition(async () => {
                  const result = await getOrCreateThreadByStudentId(detail.student.id);
                  if (result.threadId) {
                    setThreadId(result.threadId);
                  }
                });
              }
            }}
            aria-label="Message student"
            title="Message student"
          >
            {isCreatingThread ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            asChild
            aria-label="Book with this student"
            title="Book with this student"
          >
            <Link href={`/bookings?student=${detail.student.id}`}>
              <CalendarPlus className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => setActiveTab("lessons")}
            aria-label="View calendar"
            title="View calendar"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => setActiveTab("timeline")}
            aria-label="View recent activity"
            title="View recent activity"
          >
            <Activity className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href={`/lesson-notes/new?student=${detail.student.id}`}>Add lesson note</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <StudentProfileCard student={detail.student} />
        <StudentUpcomingLessons studentId={detail.student.id} bookings={detail.bookings} />
      </div>

      <StudentDetailTabs
        overviewTab={overviewTab}
        profileTab={profileTab}
        onboardingTab={onboardingTab}
        lessonsTab={lessonsTab}
        messagesTab={messagesTab}
        paymentsTab={paymentsTab}
        timelineTab={timelineTab}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
