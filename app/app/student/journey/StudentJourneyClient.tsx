"use client";

import { useState, useMemo } from "react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  MessageSquare,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import type { TimelineEvent } from "@/lib/actions/student-timeline";

type StudentJourneyClientProps = {
  events: TimelineEvent[];
  milestones: TimelineEvent[];
  stats: {
    totalLessons: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    homeworkCompleted: number;
  } | null;
};

const iconMap: Record<string, typeof Calendar> = {
  student_created: Award,
  onboarding_started: CheckCircle2,
  onboarding_completed: Trophy,
  onboarding_item_completed: CheckCircle2,
  booking_created: Calendar,
  booking_completed: CheckCircle2,
  booking_cancelled: Calendar,
  booking_rescheduled: Calendar,
  message_sent: MessageSquare,
  message_received: MessageSquare,
  homework_assigned: BookOpen,
  homework_completed: CheckCircle2,
  homework_submitted: BookOpen,
  practice_session_completed: Target,
  drill_completed: Target,
  goal_created: Target,
  goal_completed: Trophy,
  assessment_recorded: TrendingUp,
  first_lesson: Sparkles,
  lesson_milestone: Award,
};

const colorMap: Record<string, string> = {
  student_created: "bg-blue-100 text-blue-600",
  onboarding_started: "bg-purple-100 text-purple-600",
  onboarding_completed: "bg-green-100 text-green-600",
  onboarding_item_completed: "bg-green-50 text-green-500",
  booking_created: "bg-blue-100 text-blue-600",
  booking_completed: "bg-green-100 text-green-600",
  booking_cancelled: "bg-red-100 text-red-600",
  booking_rescheduled: "bg-yellow-100 text-yellow-600",
  message_sent: "bg-blue-50 text-blue-500",
  message_received: "bg-blue-50 text-blue-500",
  homework_assigned: "bg-orange-100 text-orange-600",
  homework_completed: "bg-green-100 text-green-600",
  homework_submitted: "bg-blue-100 text-blue-600",
  practice_session_completed: "bg-purple-100 text-purple-600",
  drill_completed: "bg-purple-50 text-purple-500",
  goal_created: "bg-blue-100 text-blue-600",
  goal_completed: "bg-green-100 text-green-600",
  assessment_recorded: "bg-blue-100 text-blue-600",
  first_lesson: "bg-yellow-100 text-yellow-600",
  lesson_milestone: "bg-yellow-100 text-yellow-600",
};

function groupEventsByDate(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  const groups: Record<string, TimelineEvent[]> = {};

  for (const event of events) {
    const date = new Date(event.event_at);
    let label: string;

    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else if (isThisWeek(date)) {
      label = "This Week";
    } else if (isThisMonth(date)) {
      label = "This Month";
    } else {
      label = format(date, "MMMM yyyy");
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(event);
  }

  return groups;
}

export function StudentJourneyClient({
  events,
  milestones,
  stats,
}: StudentJourneyClientProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  const displayedEvents = useMemo(() => {
    return showAllEvents ? events : events.slice(0, 20);
  }, [events, showAllEvents]);

  const groupedEvents = groupEventsByDate(displayedEvents);
  const groupKeys = Object.keys(groupedEvents);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">My Journey</h1>
        <p className="text-sm text-muted-foreground">
          Your learning journey and milestones
        </p>
      </header>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalLessons}</p>
                  <p className="text-xs text-muted-foreground">Total Lessons</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(stats.totalMinutes / 60)}h</p>
                  <p className="text-xs text-muted-foreground">Learning Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 p-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.homeworkCompleted}</p>
                  <p className="text-xs text-muted-foreground">Homework Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Milestones */}
      {milestones.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base font-medium">Milestones Achieved</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50 p-3"
                >
                  <div className="rounded-full bg-yellow-100 p-2 ring-2 ring-yellow-300 ring-offset-2">
                    <Sparkles className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{milestone.event_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(milestone.event_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Your journey is just beginning!</p>
              <p className="text-sm">Activities will appear here as you learn.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupKeys.map((dateLabel) => (
                <div key={dateLabel}>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 sticky top-0 bg-background py-1">
                    {dateLabel}
                  </h3>
                  <div className="space-y-1">
                    {groupedEvents[dateLabel].map((event, index) => {
                      const Icon = iconMap[event.event_type] ?? Calendar;
                      const colorClass = colorMap[event.event_type] ?? "bg-gray-100 text-gray-600";
                      const isLast = index === groupedEvents[dateLabel].length - 1;

                      return (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass} ${
                                event.is_milestone ? "ring-2 ring-offset-2 ring-yellow-400" : ""
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
                          </div>
                          <div className={`flex-1 pb-4 ${isLast ? "pb-0" : ""}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">
                                  {event.event_title}
                                  {event.is_milestone && (
                                    <Sparkles className="inline-block h-3.5 w-3.5 ml-1 text-yellow-500" />
                                  )}
                                </p>
                                {event.event_description && (
                                  <p className="text-sm text-muted-foreground">
                                    {event.event_description}
                                  </p>
                                )}
                              </div>
                              <time className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(event.event_at), "h:mm a")}
                              </time>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {events.length > 20 && !showAllEvents && (
                <div className="text-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllEvents(true)}
                  >
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show all {events.length} events
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
