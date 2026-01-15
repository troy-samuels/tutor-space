"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { Calendar, CalendarRange, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardBookingCalendar } from "./dashboard-booking-calendar";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarDayView } from "./calendar-day-view";
import { CalendarDayPanel } from "./calendar-day-panel";
import { QuickBlockDialog } from "./quick-block-dialog";
import { CalendarBookingModal } from "./calendar-booking-modal";
import { SlotQuickActions } from "./slot-quick-actions";
import { EventDetailsPopover } from "./event-details-popover";
import { BlockedTimePopover } from "./blocked-time-popover";
import { Button } from "@/components/ui/button";
import type { CalendarEvent, CalendarViewType } from "@/lib/types/calendar";
import { rescheduleBooking } from "@/lib/actions/bookings";
import { RescheduleDialog } from "@/components/bookings/reschedule-dialog";
import { getDailyLessons } from "@/lib/actions/calendar-sidebar";
import type { DailyLesson } from "@/lib/actions/types";
import { getDayEvents } from "@/lib/actions/calendar-events";
import { createBlockedTime } from "@/lib/actions/blocked-times";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { detectUserTimezone } from "@/lib/utils/timezones";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ServiceSummary = {
  id: string;
  name: string;
  duration_minutes: number;
  price_amount: number | null;
  currency: string | null;
};

type StudentSummary = {
  id: string;
  full_name: string;
  email: string;
  timezone: string | null;
};

type CalendarPageClientProps = {
  signupDate: string | null;
  services?: ServiceSummary[];
  students?: StudentSummary[];
  recentStudentIds?: string[];
  tutorTimezone?: string;
  tutorId: string;
};

export function CalendarPageClient({
  signupDate,
  services = [],
  students = [],
  recentStudentIds = [],
  tutorTimezone = "UTC",
  tutorId,
}: CalendarPageClientProps) {
  const [view, setView] = useState<CalendarViewType>("month");
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDialogDate, setBlockDialogDate] = useState<Date | undefined>();
  const [blockDialogHour, setBlockDialogHour] = useState<number | undefined>();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, startMoveTransition] = useTransition();
  const [secondaryTimezone, setSecondaryTimezone] = useState<string>("");

  // Booking modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingModalDate, setBookingModalDate] = useState<Date | undefined>();
  const [bookingModalHour, setBookingModalHour] = useState<number | undefined>();

  // Quick actions popover state
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [quickActionsPosition, setQuickActionsPosition] = useState({ x: 0, y: 0 });
  const [pendingSlotDate, setPendingSlotDate] = useState<Date | undefined>();
  const [pendingSlotHour, setPendingSlotHour] = useState<number | undefined>();

  // Event details popover state
  const [eventPopoverOpen, setEventPopoverOpen] = useState(false);
  const [eventPopoverPosition, setEventPopoverPosition] = useState({ x: 0, y: 0 });
  const [popoverEvent, setPopoverEvent] = useState<CalendarEvent | null>(null);

  // Sidebar state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dailyLessons, setDailyLessons] = useState<DailyLesson[]>([]);
  const [externalEvents, setExternalEvents] = useState<CalendarEvent[]>([]);

  // Load lessons when date is selected
  const loadDayData = useCallback(async (date: Date) => {
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
    }
  }, []);

  // Handle date selection from calendar
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setActiveDate(date);
    setSelectedEvent(null);
    setSidebarOpen(true);
    setQuickActionsOpen(false);
    setEventPopoverOpen(false);
    setPopoverEvent(null);
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

  const handleEventClick = (event: CalendarEvent, clickEvent?: React.MouseEvent) => {
    const eventDate = new Date(event.start);
    setSelectedDate(eventDate);
    setActiveDate(eventDate);
    setSelectedEvent(event);
    setQuickActionsOpen(false);

    if (clickEvent) {
      setEventPopoverPosition({ x: clickEvent.clientX, y: clickEvent.clientY });
      setPopoverEvent(event);
      setEventPopoverOpen(true);
    } else {
      setEventPopoverOpen(false);
      setPopoverEvent(null);
    }

    if (view === "month") {
      setSidebarOpen(true);
      loadDayData(eventDate);
    } else {
      setSidebarOpen(false);
    }
  };

  const handlePopoverReschedule = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setRescheduleOpen(true);
  };

  const handlePopoverRefresh = () => {
    setRefreshKey((key) => key + 1);
  };

  const handleTimeSlotClick = (date: Date, hour: number, clickEvent?: React.MouseEvent) => {
    setPendingSlotDate(date);
    setPendingSlotHour(hour);
    setSelectedEvent(null);
    setSelectedDate(date);
    setActiveDate(date);
    setEventPopoverOpen(false);
    setPopoverEvent(null);

    if (clickEvent) {
      setQuickActionsPosition({ x: clickEvent.clientX, y: clickEvent.clientY });
      setQuickActionsOpen(true);
    } else {
      setQuickActionsOpen(false);
    }

    if (view === "month") {
      setSidebarOpen(true);
      loadDayData(date);
    } else {
      setSidebarOpen(false);
    }
  };

  const handleQuickActionsBlockTime = () => {
    setBlockDialogDate(pendingSlotDate);
    setBlockDialogHour(pendingSlotHour);
    setBlockDialogOpen(true);
  };

  const handleQuickActionsCreateBooking = () => {
    setBookingModalDate(pendingSlotDate);
    setBookingModalHour(pendingSlotHour);
    setBookingModalOpen(true);
  };

  useEffect(() => {
    // Sync selected date used for side panel with activeDate changes
    setSelectedDate(activeDate);
  }, [activeDate]);

  const handleBlockSuccess = () => {
    // Refresh the calendar to show the new blocked time
    setRefreshKey((key) => key + 1);
    setFeedback({ type: "success", message: "Time blocked successfully." });
  };

  // Instant block handler for quick action buttons (1hr, 2hr)
  const handleInstantBlock = useCallback(async (durationMinutes: number) => {
    if (!pendingSlotDate || pendingSlotHour === undefined) return;

    const startDateTime = new Date(pendingSlotDate);
    startDateTime.setHours(pendingSlotHour, 0, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);

    const result = await createBlockedTime({
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
    });

    if (result.success) {
      setRefreshKey((key) => key + 1);
      setFeedback({ type: "success", message: `Blocked ${durationMinutes / 60}hr successfully.` });
    } else {
      setFeedback({ type: "error", message: result.error || "Failed to block time." });
    }
  }, [pendingSlotDate, pendingSlotHour]);

  const handleBookingSuccess = () => {
    // Refresh the calendar to show the new booking
    setRefreshKey((key) => key + 1);
    setFeedback({ type: "success", message: "Booking created successfully." });
  };

  // Quick actions from sidebar panel (month view)
  const handleQuickAddFromPanel = useCallback(() => {
    if (selectedDate) {
      setBookingModalDate(selectedDate);
      setBookingModalHour(9); // Default to 9am
      setBookingModalOpen(true);
    }
  }, [selectedDate]);

  const handleQuickBlockFromPanel = useCallback(() => {
    if (selectedDate) {
      setBlockDialogDate(selectedDate);
      setBlockDialogHour(9); // Default to 9am
      setBlockDialogOpen(true);
    }
  }, [selectedDate]);

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

  const containerHeightClass =
    view === "month"
      ? "h-[calc(100vh-11.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-8rem)]"
      : "h-[calc(100vh-11.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-8rem)]";

  const primaryTimezone = useMemo(
    () => tutorTimezone || detectUserTimezone(),
    [tutorTimezone]
  );

  const handlePrev = () => {
    setFeedback(null);
    setActiveDate((prev) => {
      if (view === "month") return subMonths(prev, 1);
      if (view === "week") return subWeeks(prev, 1);
      return subDays(prev, 1);
    });
  };

  const handleNext = () => {
    setFeedback(null);
    setActiveDate((prev) => {
      if (view === "month") return addMonths(prev, 1);
      if (view === "week") return addWeeks(prev, 1);
      return addDays(prev, 1);
    });
  };

  const handleToday = () => {
    setFeedback(null);
    const today = new Date();
    setActiveDate(today);
    setSelectedDate(today);
  };

  const toolbarLabel = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(activeDate, { weekStartsOn: 0 });
      const end = endOfWeek(activeDate, { weekStartsOn: 0 });
      return `${format(start, "MMMM")} ${format(start, "d")} - ${format(end, "d, yyyy")}`;
    }
    return format(activeDate, "MMMM yyyy");
  }, [activeDate, view]);

  return (
    <div
      className={[
        "relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card/95 shadow-lg ring-1 ring-primary/5 backdrop-blur",
        containerHeightClass,
      ].join(" ")}
    >
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-3xl font-semibold tracking-tight text-foreground">{toolbarLabel}</span>

          <div className="flex items-center gap-1 text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handlePrev}
              title="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleNext}
              title="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-9 px-3" onClick={handleToday}>
              Today
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Calendar views"
              className="inline-flex overflow-hidden rounded-full border border-border bg-white/60 shadow-sm"
            >
              {[
                { value: "month" as const, label: "Month", Icon: Calendar },
                { value: "week" as const, label: "Week", Icon: CalendarRange },
              ].map(({ value, label, Icon }) => {
                const isActive = view === value;
                return (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setView(value)}
                    data-testid={`calendar-view-${value}`}
                    className={[
                      "relative flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {isActive ? (
                      <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem className="flex-col items-start gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Display timezone</span>
                  <TimezoneSelect
                    value={secondaryTimezone}
                    onChange={(tz) => setSecondaryTimezone(tz)}
                    placeholder="Select timezone"
                    autoDetect={false}
                    showCurrentTime
                    className="w-full"
                  />
                  {secondaryTimezone ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs font-semibold"
                      onClick={() => setSecondaryTimezone("")}
                    >
                      Clear
                    </Button>
                  ) : null}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              asChild
              size="icon"
              className="h-10 w-10 rounded-full"
              title="New booking"
            >
              <Link href="/bookings">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

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

      {/* Main Content Area - Calendar + Sidebar */}
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background/40 transition-all duration-300 lg:flex-row"
      >
        {/* Calendar Views */}
        <div
          className={[
            "relative flex-1 min-w-0 min-h-0 flex flex-col px-4 py-4 transition-all duration-300 sm:px-6 lg:flex-[2] lg:px-8",
            view === "month" ? "overflow-hidden" : "overflow-x-auto overflow-y-auto",
          ].join(" ")}
        >
          {view === "month" && (
            <DashboardBookingCalendar
              signupDate={signupDate}
              selectedDate={activeDate}
              showHeaderControls={false}
              onDateSelect={(date) => {
                setActiveDate(date);
                handleDateSelect(date);
              }}
            />
          )}

          {view === "week" && (
            <CalendarWeekView
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              onEventMove={handleEventMove}
              refreshKey={refreshKey}
              primaryTimezone={primaryTimezone}
              secondaryTimezone={secondaryTimezone || null}
              activeDate={activeDate}
              showHeaderControls={false}
            />
          )}

          {view === "day" && (
            <CalendarDayView
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              onEventMove={handleEventMove}
              refreshKey={refreshKey}
              primaryTimezone={primaryTimezone}
              secondaryTimezone={secondaryTimezone || null}
              activeDate={activeDate}
              showHeaderControls={false}
            />
          )}
        </div>

      </div>

      {/* Day Details Panel - fixed overlay, only visible on month view */}
      <CalendarDayPanel
        date={selectedDate}
        lessons={dailyLessons}
        externalEvents={externalEvents}
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        onReschedule={handleRescheduleFromSidebar}
        onQuickAdd={handleQuickAddFromPanel}
        onQuickBlock={handleQuickBlockFromPanel}
      />

      {/* Quick Actions Popover */}
      <SlotQuickActions
        isOpen={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        position={quickActionsPosition}
        onBlockTime={handleQuickActionsBlockTime}
        onCreateBooking={handleQuickActionsCreateBooking}
        onQuickBlock={handleInstantBlock}
        slotDate={pendingSlotDate}
        slotHour={pendingSlotHour}
      />

      {/* Event Details Popover - Show different popover based on event type */}
      {popoverEvent && popoverEvent.type === "blocked" ? (
        <BlockedTimePopover
          event={popoverEvent}
          isOpen={eventPopoverOpen}
          onClose={() => {
            setEventPopoverOpen(false);
            setPopoverEvent(null);
          }}
          position={eventPopoverPosition}
          onRefresh={handlePopoverRefresh}
        />
      ) : popoverEvent ? (
        <EventDetailsPopover
          event={popoverEvent}
          isOpen={eventPopoverOpen}
          onClose={() => {
            setEventPopoverOpen(false);
            setPopoverEvent(null);
          }}
          position={eventPopoverPosition}
          onReschedule={handlePopoverReschedule}
          onRefresh={handlePopoverRefresh}
        />
      ) : null}

      {/* Quick Block Dialog */}
      <QuickBlockDialog
        isOpen={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        onSuccess={handleBlockSuccess}
        initialDate={blockDialogDate}
        initialHour={blockDialogHour}
      />

      {/* Calendar Booking Modal */}
      <CalendarBookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
        initialDate={bookingModalDate}
        initialHour={bookingModalHour}
        services={services}
        students={students}
        recentStudentIds={recentStudentIds}
        tutorTimezone={tutorTimezone}
        tutorId={tutorId}
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
