"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Calendar, CalendarRange, Plus, Settings, ChevronLeft, ChevronRight, Clock, Link2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { DashboardBookingCalendar } from "./dashboard-booking-calendar";
import { CalendarWeekView } from "./calendar-week-view";
import { CalendarDayView } from "./calendar-day-view";
import { CalendarDayPanel } from "./calendar-day-panel";
import { QuickBlockDialog } from "./quick-block-dialog";
import { CalendarBookingModal } from "./calendar-booking-modal";
import { AvailabilityDrawer } from "./availability-drawer";
import { AvailabilityTab } from "./availability-tab";
import { SlotQuickActions } from "./slot-quick-actions";
import { EventDetailsPopover } from "./event-details-popover";
import { BlockedTimePopover } from "./blocked-time-popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCalendarKeyboardShortcuts } from "@/lib/hooks/useCalendarKeyboardShortcuts";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
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

const VALID_VIEWS: CalendarViewType[] = ["month", "week", "day", "availability"];

function resolveViewFromSearchParams(params: URLSearchParams): CalendarViewType {
  const viewParam = params.get("view");
  return VALID_VIEWS.includes(viewParam as CalendarViewType)
    ? (viewParam as CalendarViewType)
    : "month";
}

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

type AvailabilitySlot = {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type CalendarPageClientProps = {
  signupDate: string | null;
  services?: ServiceSummary[];
  students?: StudentSummary[];
  recentStudentIds?: string[];
  tutorTimezone?: string;
  tutorId: string;
  availability?: AvailabilitySlot[];
  connectedCalendars?: string[];
  initialView?: CalendarViewType;
};

export function CalendarPageClient({
  signupDate,
  services = [],
  students = [],
  recentStudentIds = [],
  tutorTimezone = "UTC",
  tutorId,
  availability = [],
  connectedCalendars = [],
  initialView = "month",
}: CalendarPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setViewState] = useState<CalendarViewType>(initialView);

  const setView = useCallback((newView: CalendarViewType) => {
    setViewState(newView);
    const params = new URLSearchParams(searchParams.toString());
    if (newView === "month") {
      params.delete("view");
    } else {
      params.set("view", newView);
    }
    router.replace(`/calendar${params.toString() ? `?${params}` : ""}`, { scroll: false });
  }, [router, searchParams]);
  const [activeDate, setActiveDate] = useState<Date>(new Date());
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [availabilityDrawerOpen, setAvailabilityDrawerOpen] = useState(false);
  const [blockDialogDate, setBlockDialogDate] = useState<Date | undefined>();
  const [blockDialogHour, setBlockDialogHour] = useState<number | undefined>();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [, startMoveTransition] = useTransition();
  const [secondaryTimezone, setSecondaryTimezone] = useState<string>(tutorTimezone || "");
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>(availability);

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

  useEffect(() => {
    setAvailabilitySlots(availability);
  }, [availability]);

  useEffect(() => {
    const nextView = resolveViewFromSearchParams(searchParams);
    setViewState((prev) => (prev === nextView ? prev : nextView));
  }, [searchParams]);

  // Close availability drawer when switching to availability tab
  useEffect(() => {
    if (view === "availability") {
      setAvailabilityDrawerOpen(false);
    }
  }, [view]);

  // Handle ?action=book deep link for unified booking experience
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "book" && !bookingModalOpen) {
      // Pre-fill with today at next available hour in the tutor's timezone.
      let zonedNow: Date;
      try {
        zonedNow = toZonedTime(new Date(), tutorTimezone);
      } catch {
        zonedNow = new Date();
      }
      let nextHour = zonedNow.getHours() + 1;
      let bookingDate = zonedNow;

      if (nextHour >= 22) {
        bookingDate = addDays(zonedNow, 1);
        nextHour = 9;
      }

      setBookingModalDate(bookingDate);
      setBookingModalHour(nextHour);
      setBookingModalOpen(true);
      // Clean up URL param after opening
      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/calendar${params.toString() ? `?${params}` : ""}`, { scroll: false });
    }
  }, [searchParams, bookingModalOpen, router, tutorTimezone]);

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

  const formatBlockDuration = useCallback((minutes: number) => {
    if (minutes <= 0) return "0m";
    if (minutes % 60 === 0) {
      return `${minutes / 60}hr`;
    }
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `${hours}hr ${remainder}m`;
  }, []);

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
      setFeedback({
        type: "success",
        message: `Blocked ${formatBlockDuration(durationMinutes)} successfully.`,
      });
    } else {
      setFeedback({ type: "error", message: result.error || "Failed to block time." });
    }
  }, [formatBlockDuration, pendingSlotDate, pendingSlotHour]);

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

  // Keyboard shortcuts
  const isMobile = useIsMobile();
  const shortcutsEnabled = !bookingModalOpen && !blockDialogOpen && !availabilityDrawerOpen && !isMobile;

  useCalendarKeyboardShortcuts(
    {
      onNewBooking: () => setBookingModalOpen(true),
      onBlockTime: () => setBlockDialogOpen(true),
      onAvailability: () => setAvailabilityDrawerOpen(true),
      onToday: handleToday,
    },
    shortcutsEnabled
  );

  const toolbarLabel = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(activeDate, { weekStartsOn: 0 });
      const end = endOfWeek(activeDate, { weekStartsOn: 0 });
      return `${format(start, "MMMM")} ${format(start, "d")} - ${format(end, "d, yyyy")}`;
    }
    if (view === "day") {
      return format(activeDate, "MMMM d, yyyy");
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
          <span className="text-3xl font-semibold tracking-tight text-foreground">
            {view === "availability" ? "Availability" : toolbarLabel}
          </span>

          {view !== "availability" && (
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 px-3" onClick={handleToday}>
                    Today
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="flex items-center gap-2">
                    Jump to today
                    <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">T</kbd>
                  </span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <div
              role="tablist"
              aria-label="Calendar views"
              className="inline-flex overflow-hidden rounded-full border border-border bg-white/60 shadow-sm"
            >
              {[
                { value: "month" as const, label: "Month", Icon: Calendar },
                { value: "week" as const, label: "Week", Icon: CalendarRange },
                { value: "day" as const, label: "Day", Icon: Calendar },
                { value: "availability" as const, label: "Availability", Icon: Clock },
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

            {view !== "availability" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setAvailabilityDrawerOpen(true)}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span className="flex items-center gap-2">
                    Edit availability
                    <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">A</kbd>
                  </span>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Calendar sync status indicator */}
            <Link href="/settings/calendar">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                title={connectedCalendars.length > 0 ? `${connectedCalendars.length} calendar(s) connected` : "Connect your calendar"}
              >
                <Link2 className="h-4 w-4" />
                {connectedCalendars.length > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                ) : (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-background" />
                )}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem className="flex-col items-start gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Timezone</span>
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={() => setBookingModalOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <span className="flex items-center gap-2">
                  New booking
                  <kbd className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">N</kbd>
                </span>
              </TooltipContent>
            </Tooltip>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex-1 min-h-0 flex flex-col"
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
                  availabilitySlots={availabilitySlots}
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

              {view === "availability" && (
                <AvailabilityTab
                  initialSlots={availabilitySlots}
                  onSaveSuccess={(slots) => {
                    setAvailabilitySlots(slots);
                    setRefreshKey((key) => key + 1);
                    setFeedback({ type: "success", message: "Availability updated." });
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
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

      {/* Availability Drawer */}
      <AvailabilityDrawer
        isOpen={availabilityDrawerOpen}
        onClose={() => setAvailabilityDrawerOpen(false)}
        initialSlots={availabilitySlots.map((slot) => ({
          id: slot.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available,
        }))}
        onSaveSuccess={(updatedSlots) => {
          const normalized = [...updatedSlots].sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
            return a.start_time.localeCompare(b.start_time);
          });
          setAvailabilitySlots(normalized);
          setRefreshKey((key) => key + 1);
          setFeedback({ type: "success", message: "Availability updated." });
        }}
      />
    </div>
  );
}
