import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Sparkles,
  Target,
  RotateCcw,
  Lightbulb,
  Clock,
  User,
  Globe,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EngagementBadge } from "@/components/copilot/engagement-indicator";
import { getLessonBriefing, markBriefingViewed } from "@/lib/actions/copilot";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function BriefingPage({ params }: PageProps) {
  const { bookingId } = await params;
  const briefing = await getLessonBriefing(bookingId);

  if (!briefing) {
    notFound();
  }

  // Mark as viewed
  if (!briefing.viewedAt) {
    await markBriefingViewed(briefing.id);
  }

  const studentName = briefing.student?.fullName || "Student";
  const initials = studentName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const scheduledAt = briefing.booking?.scheduledAt
    ? new Date(briefing.booking.scheduledAt)
    : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
            AI Copilot
          </p>
          <h1 className="text-2xl font-semibold">Lesson Briefing</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Student Overview Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-2xl border border-stone-200">
            <AvatarFallback className="rounded-2xl text-lg font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{studentName}</h2>
              <EngagementBadge trend={briefing.engagementTrend} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {briefing.proficiencyLevel && (
                <span className="inline-flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {briefing.proficiencyLevel}
                </span>
              )}
              {briefing.nativeLanguage && (
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  L1: {briefing.nativeLanguage}
                </span>
              )}
              {scheduledAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(scheduledAt, "EEEE, MMMM d 'at' h:mm a")}
                </span>
              )}
            </div>
            {briefing.studentSummary && (
              <p className="mt-3 text-sm text-muted-foreground">
                {briefing.studentSummary}
              </p>
            )}
          </div>
        </div>

        {/* Goal Progress */}
        {briefing.goalProgress && (
          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-800">
                  Current Goal
                </p>
                <p className="text-sm text-emerald-700">
                  {briefing.goalProgress.goalText}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-emerald-700">
                  {briefing.goalProgress.progressPct}%
                </p>
                {briefing.goalProgress.targetDate && (
                  <p className="text-xs text-emerald-600">
                    Target: {format(new Date(briefing.goalProgress.targetDate), "MMM d")}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${briefing.goalProgress.progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Focus Areas Card */}
      {briefing.focusAreas && briefing.focusAreas.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Target className="h-5 w-5 text-amber-600" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Focus Areas ({briefing.focusAreas.length})
            </h2>
          </div>
          <ul className="space-y-3">
            {briefing.focusAreas.map((area, index) => (
              <li
                key={index}
                className="rounded-xl border border-stone-200 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{area.topic}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {area.type}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {area.reason}
                    </p>
                  </div>
                  {area.count && (
                    <span className="shrink-0 text-lg font-semibold text-amber-600">
                      {area.count}×
                    </span>
                  )}
                </div>
                {area.evidence && (
                  <p className="mt-2 text-xs italic text-muted-foreground/80">
                    {area.evidence}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SR Items Due Card */}
      {briefing.srItemsDue > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <RotateCcw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Review Items
              </h2>
              <p className="text-xs text-muted-foreground">
                {briefing.srItemsDue} items due for spaced repetition review
              </p>
            </div>
          </div>
          {briefing.srItemsPreview && briefing.srItemsPreview.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {briefing.srItemsPreview.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {item.word}
                  <span className="text-blue-500">
                    ({item.repetitionCount}×)
                  </span>
                </span>
              ))}
              {briefing.srItemsDue > briefing.srItemsPreview.length && (
                <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs text-muted-foreground">
                  +{briefing.srItemsDue - briefing.srItemsPreview.length} more
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Suggested Activities Card */}
      {briefing.suggestedActivities && briefing.suggestedActivities.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Lightbulb className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Suggested Activities
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {briefing.suggestedActivities.map((activity, index) => (
              <div
                key={index}
                className="rounded-xl border border-stone-200 p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{activity.title}</h3>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                  >
                    {activity.durationMin} min
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activity.description}
                </p>
                {activity.targetArea && (
                  <p className="mt-2 text-[10px] text-emerald-600">
                    Targets: {activity.targetArea}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engagement Signals Card */}
      {briefing.engagementSignals && briefing.engagementSignals.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
              <AlertCircle className="h-5 w-5 text-stone-600" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Engagement Insights
            </h2>
          </div>
          <ul className="space-y-2">
            {briefing.engagementSignals.map((signal, index) => (
              <li
                key={index}
                className={`rounded-lg p-3 text-sm ${
                  signal.concern
                    ? "border border-amber-100 bg-amber-50/50 text-amber-800"
                    : "border border-emerald-100 bg-emerald-50/50 text-emerald-800"
                }`}
              >
                {signal.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Last Lesson Summary */}
      {briefing.lastLessonSummary && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:rounded-3xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Last Lesson Summary
              </h2>
              {briefing.lastLessonDate && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(briefing.lastLessonDate), "MMMM d, yyyy")}
                </p>
              )}
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            <p>{briefing.lastLessonSummary}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-4 py-4">
        <Button asChild>
          <Link href={`/classroom/${bookingId}`}>Start Lesson</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/students/${briefing.studentId}`}>View Student Profile</Link>
        </Button>
      </div>
    </div>
  );
}
