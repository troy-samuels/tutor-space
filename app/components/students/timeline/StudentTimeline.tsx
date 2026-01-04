"use client";

import { useState, useEffect, useTransition } from "react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Filter, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineEvent } from "./TimelineEvent";
import {
  getStudentTimeline,
  type TimelineEvent as TimelineEventType,
  type TimelineEventType as EventType,
} from "@/lib/actions/student-timeline";

type StudentTimelineProps = {
  studentId: string;
  initialEvents?: TimelineEventType[];
  showFilter?: boolean;
};

const EVENT_CATEGORIES: Record<string, EventType[]> = {
  Onboarding: [
    "student_created",
    "onboarding_started",
    "onboarding_completed",
    "onboarding_item_completed",
  ],
  Lessons: [
    "booking_created",
    "booking_completed",
    "booking_cancelled",
    "booking_rescheduled",
    "first_lesson",
    "lesson_milestone",
  ],
  Communication: ["message_sent", "message_received"],
  Homework: ["homework_assigned", "homework_completed", "homework_submitted"],
  Practice: ["practice_session_completed", "drill_completed"],
  Progress: ["goal_created", "goal_completed", "assessment_recorded"],
  Payments: ["payment_received", "package_purchased", "subscription_started"],
  Status: ["status_changed", "risk_status_changed", "note_added", "label_added", "label_removed"],
};

function groupEventsByDate(events: TimelineEventType[]): Record<string, TimelineEventType[]> {
  const groups: Record<string, TimelineEventType[]> = {};

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

export function StudentTimeline({
  studentId,
  initialEvents = [],
  showFilter = true,
}: StudentTimelineProps) {
  const [events, setEvents] = useState<TimelineEventType[]>(initialEvents);
  const [hasMore, setHasMore] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Object.keys(EVENT_CATEGORIES)
  );

  // Get filtered event types based on selected categories
  const getFilteredEventTypes = (): EventType[] => {
    const types: EventType[] = [];
    for (const category of selectedCategories) {
      types.push(...(EVENT_CATEGORIES[category] ?? []));
    }
    return types;
  };

  // Load initial events
  useEffect(() => {
    if (initialEvents.length === 0) {
      loadEvents();
    }
  }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEvents = (append = false) => {
    const offset = append ? events.length : 0;

    startTransition(async () => {
      const eventTypes = getFilteredEventTypes();
      const result = await getStudentTimeline(studentId, {
        limit: 20,
        offset,
        eventTypes: eventTypes.length > 0 ? eventTypes : undefined,
      });

      if (append) {
        setEvents((prev) => [...prev, ...result.events]);
      } else {
        setEvents(result.events);
      }
      setHasMore(result.hasMore);
      setIsLoadingMore(false);
    });
  };

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    loadEvents(true);
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  };

  // Reload when filter changes
  useEffect(() => {
    loadEvents(false);
  }, [selectedCategories]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupedEvents = groupEventsByDate(events);
  const groupKeys = Object.keys(groupedEvents);

  if (isPending && events.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Activity Timeline</CardTitle>
          {showFilter && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Filter
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Event Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(EVENT_CATEGORIES).map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No activity recorded yet
          </div>
        ) : (
          <div className="space-y-6">
            {groupKeys.map((dateLabel) => (
              <div key={dateLabel}>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 sticky top-0 bg-background py-1">
                  {dateLabel}
                </h3>
                <div>
                  {groupedEvents[dateLabel].map((event, index) => (
                    <TimelineEvent
                      key={event.id}
                      event={event}
                      isLast={index === groupedEvents[dateLabel].length - 1}
                    />
                  ))}
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
