"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, CalendarDays, CalendarRange, Plus, Settings } from "lucide-react";
import { DashboardBookingCalendar } from "./dashboard-booking-calendar";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarDayView } from "./calendar-day-view";
import { CalendarDayPanel } from "./calendar-day-panel";
import { QuickBlockDialog } from "./quick-block-dialog";
import { Button } from "@/components/ui/button";
import type { CalendarEvent, CalendarViewType } from "@/lib/types/calendar";
import { rescheduleBooking } from "@/lib/actions/bookings";
import { RescheduleDialog } from "@/components/bookings/reschedule-dialog";
import { getDailyLessons, type DailyLesson } from "@/lib/actions/calendar-sidebar";
import { getDayEvents } from "@/lib/actions/calendar-events";

type CalendarPageClientProps = {
  signupDate: string | null;
};

export function CalendarPageClient({ signupDate }: CalendarPageClientProps) {
  const router = useRouter();
  const [view, setView] = useState<CalendarViewType>("month");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDialogDate, setBlockDialogDate] = useState<Date | undefined>();
  const [blockDialogHour, setBlockDialogHour] = useState<number | undefined>();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, startMoveTransition] = useTransition();

  // Sidebar state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dailyLessons, setDailyLessons] = useState<DailyLesson[]>([]);
  const [externalEvents, setExternalEvents] = useState<CalendarEvent[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // Load lessons when date is selected
  const loadDayData = useCallback(async (date: Date) => {
    setLoadingLessons(true);
    try {
      const [lessonsResult, eventsResult] = await Promise.all([
        getDailyLessons(date),
        getDayEvents(date.toISOString()),
      ]);
      setDailyLessons(lessonsResult.lessons);
      // Filter to only external events (Google/Outlook)
      const external = (eventsResult.events || []).filter(
        (e) => e.type === "google" || e.type === "outlook"
      );
      setExternalEvents(external);
    } catch (error) {
      console.error("Failed to load day data:", error);
    } finally {
      setLoadingLessons(false);
    }
  }, []);

  // Handle date selection from calendar
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSidebarOpen(true);
    loadDayData(date);
  }, [loadDayData]);

  // Handle sidebar close
  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  // Handle reschedule from sidebar
  const handleRescheduleFromSidebar = useCallback((lessonId: string) => {
    // Find the lesson and open reschedule dialog
    const lesson = dailyLessons.find((l) => l.id === lessonId);
    if (lesson) {
      setSelectedEvent({
        id: lesson.id,
        title: lesson.student?.full_name || "Lesson",
        start: lesson.scheduled_at,
        end: new Date(new Date(lesson.scheduled_at).getTime() + lesson.duration_minutes * 60 * 1000).toISOString(),
        type: "tutorlingua",
        source: "TutorLingua",
        studentId: lesson.student?.id,
        studentName: lesson.student?.full_name,
        serviceName: lesson.service?.name,
        meetingUrl: lesson.meeting_url ?? undefined,
        bookingStatus: lesson.status,
        paymentStatus: lesson.payment_status ?? undefined,
        durationMinutes: lesson.duration_minutes,
        packageType: lesson.packageType,
      });
      setRescheduleOpen(true);
    }
  }, [dailyLessons]);

  // Reload data when refreshKey changes and sidebar is open
  useEffect(() => {
    if (selectedDate && sidebarOpen && refreshKey > 0) {
      loadDayData(selectedDate);
    }
  }, [refreshKey, selectedDate, sidebarOpen, loadDayData]);

  const handleEventClick = (event: CalendarEvent) => {
    // TutorLingua bookings open reschedule dialog; others keep existing behavior
    if (event.type === "tutorlingua") {
      setSelectedEvent(event);
      setRescheduleOpen(true);
      return;
    }

    if (event.studentId) {
      router.push(`/students/${event.studentId}`);
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setBlockDialogDate(date);
    setBlockDialogHour(hour);
    setBlockDialogOpen(true);
  };

  const handleBlockSuccess = () => {
    // Refresh the page to show the new blocked time
    router.refresh();
  };

  const handleEventMove = (event: CalendarEvent, newStartIso: string) => {
    setFeedback(null);

    startMoveTransition(() => {
      (async () => {
        const result = await rescheduleBooking({
          bookingId: event.id,
          newStart: newStartIso,
          durationMinutes: event.durationMinutes,
          timezone: event.timezone,
        });

        if (result.error) {
          setFeedback({ type: "error", message: result.error });
          return;
        }

        setFeedback({ type: "success", message: "Booking moved to the new time." });
        setRefreshKey((key) => key + 1);
      })();
    });
  };

  const handleRescheduleSuccess = (newStartIso: string) => {
    setRefreshKey((key) => key + 1);
    setFeedback({ type: "success", message: "Booking rescheduled." });

    if (selectedEvent) {
      setSelectedEvent({ ...selectedEvent, start: newStartIso });
    }
  };

  const viewDescriptions: Record<CalendarViewType, string> = {
    month:
      "Track every lesson at a glance. Dots show how many bookings you have per day—click a date to see the student roster.",
    week:
      "See your entire week with all lessons and external calendar events. Click empty slots to block time.",
    day:
      "Detailed view of a single day. Perfect for seeing exactly what's coming up.",
  };

  const containerHeightClass =
    view === "month"
      ? "lg:min-h-[calc(100vh-4rem)]"
      : "lg:h-[calc(100vh-4rem)]";

  return (
    <div
      className={[
        "relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card/95 shadow-lg ring-1 ring-primary/5 backdrop-blur",
        containerHeightClass,
      ].join(" ")}
    >
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-background-alt/70 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {viewDescriptions[view]}
            </p>
            {feedback ? (
              <p
                className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  feedback.type === "success"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {feedback.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex gap-2"
              title="Add a new booking"
            >
              <Link href="/bookings">
                <Plus className="h-4 w-4" />
                Add booking
              </Link>
            </Button>
            <Button
              asChild
              size="icon"
              variant="outline"
              className="sm:hidden"
              title="Add a new booking"
            >
              <Link href="/bookings">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add booking</span>
              </Link>
            </Button>

            {/* View Switcher */}
            <div className="inline-flex rounded-lg border bg-muted/50 p-1">
              <button
                onClick={() => setView("month")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  view === "month"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Month
              </button>
              <button
                onClick={() => setView("week")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  view === "week"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarRange className="h-4 w-4" />
                Week
              </button>
              <button
                onClick={() => setView("day")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  view === "day"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                Day
              </button>
            </div>

            {/* Calendar Settings Link */}
            <Link
              href="/settings/calendar"
              className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted"
              title="Calendar settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Main Content Area - Calendar + Sidebar */}
      <div
        className={[
          "flex min-h-0 flex-col overflow-y-auto bg-background/40 transition-all duration-300 lg:flex-row",
          view !== "month" ? "flex-1" : "",
        ].join(" ")}
      >
        {/* Calendar Views */}
        <div
          className={[
            "relative flex-1 min-w-0 px-4 py-6 transition-all duration-300 sm:px-6 lg:flex-[2] lg:px-8",
            view === "month" ? "overflow-visible" : "overflow-x-auto",
          ].join(" ")}
        >
          {view === "month" && (
            <DashboardBookingCalendar
              signupDate={signupDate}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
            />
          )}

          {view === "week" && (
            <CalendarWeekView
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              onEventMove={handleEventMove}
              refreshKey={refreshKey}
            />
          )}

          {view === "day" && (
            <CalendarDayView
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              onEventMove={handleEventMove}
              refreshKey={refreshKey}
            />
          )}
        </div>

        {/* Day Details Sidebar - only visible on month view */}
        {view === "month" && (
          <CalendarDayPanel
            date={selectedDate}
            lessons={dailyLessons}
            externalEvents={externalEvents}
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            onReschedule={handleRescheduleFromSidebar}
          />
        )}
      </div>

      {/* Quick Block Dialog */}
      <QuickBlockDialog
        isOpen={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onSuccess={handleBlockSuccess}
        initialDate={blockDialogDate}
        initialHour={blockDialogHour}
      />

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={(open) => {
          setRescheduleOpen(open);
          if (!open) setSelectedEvent(null);
        }}
        bookingId={selectedEvent?.id ?? null}
        defaultStart={selectedEvent?.start}
        timezone={selectedEvent?.timezone}
        durationMinutes={selectedEvent?.durationMinutes ?? null}
        title={selectedEvent?.title}
        subtitle={selectedEvent?.serviceName ? `Service: ${selectedEvent.serviceName}` : undefined}
        onSuccess={handleRescheduleSuccess}
      />
    </div>
  );
}
