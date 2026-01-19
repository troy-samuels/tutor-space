"use client";

import { useReducer, useTransition, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  Calendar,
  CalendarRange,
  Plus,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  Link2,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { useCalendarShortcuts } from "@/lib/hooks/useCalendarShortcuts";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { useCalendarEvent } from "@/lib/hooks/useCalendarEvent";
import { useCalendarSlot } from "@/lib/hooks/useCalendarSlot";
import { useSidebarData } from "@/lib/hooks/useSidebarData";
import type { CalendarEvent, CalendarViewType } from "@/lib/types/calendar";
import { rescheduleBooking } from "@/lib/actions/bookings";
import { RescheduleDialog } from "@/components/bookings/reschedule-dialog";
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

type CalendarFeedback = { type: "success" | "error"; message: string } | null;

type CalendarUIState = {
  view: CalendarViewType;
  activeDate: Date;
  blockDialogOpen: boolean;
  blockDialogDate?: Date;
  blockDialogHour?: number;
  availabilityDrawerOpen: boolean;
  bookingModalOpen: boolean;
  bookingModalDate?: Date;
  bookingModalHour?: number;
  feedback: CalendarFeedback;
  refreshKey: number;
  secondaryTimezone: string;
  availabilitySlots: AvailabilitySlot[];
};

type CalendarUIAction =
  | { type: "set_view"; view: CalendarViewType }
  | { type: "set_active_date"; date: Date }
  | { type: "open_block_dialog"; date?: Date; hour?: number }
  | { type: "close_block_dialog" }
  | { type: "open_booking_modal"; date?: Date; hour?: number }
  | { type: "close_booking_modal" }
  | { type: "open_availability_drawer" }
  | { type: "close_availability_drawer" }
  | { type: "set_feedback"; feedback: CalendarFeedback }
  | { type: "refresh" }
  | { type: "set_secondary_timezone"; timezone: string }
  | { type: "set_availability_slots"; slots: AvailabilitySlot[] };

function calendarUIReducer(
  state: CalendarUIState,
  action: CalendarUIAction
): CalendarUIState {
  switch (action.type) {
    case "set_view":
      if (state.view === action.view) return state;
      return {
        ...state,
        view: action.view,
        availabilityDrawerOpen:
          action.view === "availability" ? false : state.availabilityDrawerOpen,
      };
    case "set_active_date":
      return { ...state, activeDate: action.date };
    case "open_block_dialog":
      return {
        ...state,
        blockDialogOpen: true,
        blockDialogDate: action.date,
        blockDialogHour: action.hour,
      };
    case "close_block_dialog":
      return {
        ...state,
        blockDialogOpen: false,
        blockDialogDate: undefined,
        blockDialogHour: undefined,
      };
    case "open_booking_modal":
      return {
        ...state,
        bookingModalOpen: true,
        bookingModalDate: action.date,
        bookingModalHour: action.hour,
      };
    case "close_booking_modal":
      return {
        ...state,
        bookingModalOpen: false,
        bookingModalDate: undefined,
        bookingModalHour: undefined,
      };
    case "open_availability_drawer":
      return { ...state, availabilityDrawerOpen: true };
    case "close_availability_drawer":
      return { ...state, availabilityDrawerOpen: false };
    case "set_feedback":
      return { ...state, feedback: action.feedback };
    case "refresh":
      return { ...state, refreshKey: state.refreshKey + 1 };
    case "set_secondary_timezone":
      return { ...state, secondaryTimezone: action.timezone };
    case "set_availability_slots":
      return { ...state, availabilitySlots: action.slots };
    default:
      return state;
  }
}

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
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const hasAutoViewRef = useRef(false);

  const [state, dispatch] = useReducer(calendarUIReducer, {
    view: initialView,
    activeDate: new Date(),
    blockDialogOpen: false,
    availabilityDrawerOpen: false,
    bookingModalOpen: false,
    feedback: null,
    refreshKey: 0,
    secondaryTimezone: tutorTimezone || "",
    availabilitySlots: availability,
  });

  const [, startMoveTransition] = useTransition();

  const {
    selectedDate,
    setSelectedDate,
    sidebarOpen,
    setSidebarOpen,
    dailyLessons,
    externalEvents,
    loadDayData,
    handleSidebarClose,
  } = useSidebarData({
    initialDate: state.activeDate,
    refreshKey: state.refreshKey,
  });

  const setFeedback = useCallback((feedback: CalendarFeedback) => {
    dispatch({ type: "set_feedback", feedback });
  }, []);

  const refreshCalendar = useCallback(() => {
    dispatch({ type: "refresh" });
  }, []);

  const selectDate = useCallback(
    (date: Date, openSidebar: boolean) => {
      dispatch({ type: "set_active_date", date });
      setSelectedDate(date);

      if (openSidebar) {
        setSidebarOpen(true);
        loadDayData(date);
      } else {
        setSidebarOpen(false);
      }
    },
    [loadDayData, setSelectedDate, setSidebarOpen]
  );

  const selectDateForView = useCallback(
    (date: Date) => {
      selectDate(date, state.view === "month");
    },
    [selectDate, state.view]
  );

  const calendarEvent = useCalendarEvent({ onDateSelect: selectDateForView });
  const calendarSlot = useCalendarSlot({
    onDateSelect: selectDateForView,
    onRefresh: refreshCalendar,
    onFeedback: setFeedback,
  });

  const setView = useCallback(
    (newView: CalendarViewType) => {
      dispatch({ type: "set_view", view: newView });
      const params = new URLSearchParams(searchParams.toString());
      if (newView === "month") {
        params.delete("view");
      } else {
        params.set("view", newView);
      }
      router.replace(`/calendar${params.toString() ? `?${params}` : ""}`,
        { scroll: false }
      );
    },
    [router, searchParams]
  );

  useEffect(() => {
    dispatch({ type: "set_availability_slots", slots: availability });
  }, [availability]);

  useEffect(() => {
    const nextView = resolveViewFromSearchParams(searchParams);
    dispatch({ type: "set_view", view: nextView });
  }, [searchParams]);

  useEffect(() => {
    if (!isMobile || hasAutoViewRef.current) return;
    const viewParam = searchParams.get("view");
    if (!viewParam) {
      if (state.view !== "day") {
        setView("day");
      }
      hasAutoViewRef.current = true;
    }
  }, [isMobile, searchParams, setView, state.view]);

  useEffect(() => {
    if (!state.bookingModalOpen && searchParams.get("action") === "book") {
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

      dispatch({
        type: "open_booking_modal",
        date: bookingDate,
        hour: nextHour,
      });

      const params = new URLSearchParams(searchParams.toString());
      params.delete("action");
      router.replace(`/calendar${params.toString() ? `?${params}` : ""}`, { scroll: false });
    }
  }, [searchParams, state.bookingModalOpen, router, tutorTimezone]);

  useEffect(() => {
    setSelectedDate(state.activeDate);
  }, [state.activeDate, setSelectedDate]);

  const handleMonthDateSelect = useCallback(
    (date: Date) => {
      calendarEvent.setSelectedEvent(null);
      calendarSlot.setQuickActionsOpen(false);
      calendarEvent.closeEventPopover();
      selectDate(date, true);
    },
    [calendarEvent, calendarSlot, selectDate]
  );

  const handleRescheduleFromSidebar = useCallback(
    (lessonId: string) => {
      const lesson = dailyLessons.find((lesson) => lesson.id === lessonId);
      if (!lesson) return;
      calendarEvent.setSelectedEvent({
        id: lesson.id,
        title: lesson.student?.full_name || "Lesson",
        start: lesson.scheduled_at,
        end: new Date(
          new Date(lesson.scheduled_at).getTime() +
            lesson.duration_minutes * 60 * 1000
        ).toISOString(),
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
      calendarEvent.setRescheduleOpen(true);
    },
    [calendarEvent, dailyLessons]
  );

  const handleEventClick = useCallback(
    (event: CalendarEvent, clickEvent?: React.MouseEvent) => {
      calendarSlot.setQuickActionsOpen(false);
      calendarEvent.handleEventClick(event, clickEvent);
    },
    [calendarEvent, calendarSlot]
  );

  const handleTimeSlotClick = useCallback(
    (date: Date, hour: number, clickEvent?: React.MouseEvent) => {
      calendarEvent.setSelectedEvent(null);
      calendarEvent.closeEventPopover();
      calendarSlot.handleTimeSlotClick(date, hour, clickEvent);
    },
    [calendarEvent, calendarSlot]
  );

  const handleQuickActionsBlockTime = useCallback(() => {
    const slot = calendarSlot.handleQuickActionsBlockTime();
    if (!slot) return;
    dispatch({ type: "open_block_dialog", date: slot.date, hour: slot.hour });
  }, [calendarSlot]);

  const handleQuickActionsCreateBooking = useCallback(() => {
    const slot = calendarSlot.handleQuickActionsCreateBooking();
    if (!slot) return;
    dispatch({ type: "open_booking_modal", date: slot.date, hour: slot.hour });
  }, [calendarSlot]);

  const handleQuickAddFromPanel = useCallback(() => {
    if (!selectedDate) return;
    dispatch({ type: "open_booking_modal", date: selectedDate, hour: 9 });
  }, [selectedDate]);

  const handleQuickBlockFromPanel = useCallback(() => {
    if (!selectedDate) return;
    dispatch({ type: "open_block_dialog", date: selectedDate, hour: 9 });
  }, [selectedDate]);

  const handleBlockSuccess = useCallback(() => {
    refreshCalendar();
    setFeedback({ type: "success", message: "Time blocked successfully." });
  }, [refreshCalendar, setFeedback]);

  const handleBookingSuccess = useCallback(() => {
    refreshCalendar();
    setFeedback({ type: "success", message: "Booking created successfully." });
  }, [refreshCalendar, setFeedback]);

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
        refreshCalendar();
      })();
    });
  };

  const handleRescheduleSuccess = useCallback(
    (newStartIso: string) => {
      refreshCalendar();
      setFeedback({ type: "success", message: "Booking rescheduled." });
      calendarEvent.handleRescheduleSuccess(newStartIso);
    },
    [calendarEvent, refreshCalendar, setFeedback]
  );

  const handlePrev = () => {
    setFeedback(null);
    dispatch({
      type: "set_active_date",
      date:
        state.view === "month"
          ? subMonths(state.activeDate, 1)
          : state.view === "week"
            ? subWeeks(state.activeDate, 1)
            : subDays(state.activeDate, 1),
    });
  };

  const handleNext = () => {
    setFeedback(null);
    dispatch({
      type: "set_active_date",
      date:
        state.view === "month"
          ? addMonths(state.activeDate, 1)
          : state.view === "week"
            ? addWeeks(state.activeDate, 1)
            : addDays(state.activeDate, 1),
    });
  };

  const handleToday = () => {
    setFeedback(null);
    const today = new Date();
    dispatch({ type: "set_active_date", date: today });
    setSelectedDate(today);
  };

  const shortcutsEnabled =
    !state.bookingModalOpen &&
    !state.blockDialogOpen &&
    !state.availabilityDrawerOpen &&
    !isMobile;

  useCalendarShortcuts(
    {
      onNewBooking: () => dispatch({ type: "open_booking_modal" }),
      onBlockTime: () => dispatch({ type: "open_block_dialog" }),
      onAvailability: () => dispatch({ type: "open_availability_drawer" }),
      onToday: handleToday,
    },
    shortcutsEnabled
  );

  const toolbarLabel = useMemo(() => {
    if (state.view === "week") {
      const start = startOfWeek(state.activeDate, { weekStartsOn: 0 });
      const end = endOfWeek(state.activeDate, { weekStartsOn: 0 });
      return `${format(start, "MMMM")} ${format(start, "d")} - ${format(end, "d, yyyy")}`;
    }
    if (state.view === "day") {
      return format(state.activeDate, "MMMM d, yyyy");
    }
    return format(state.activeDate, "MMMM yyyy");
  }, [state.activeDate, state.view]);

  const primaryTimezone = useMemo(
    () => tutorTimezone || detectUserTimezone(),
    [tutorTimezone]
  );

  const iconButtonClass = isMobile ? "h-11 w-11" : "h-9 w-9";
  const textButtonClass = isMobile ? "h-11 px-4" : "h-9 px-3";
  const viewTabClass = isMobile ? "px-4 py-2.5" : "px-4 py-2";
  const primaryActionClass = isMobile ? "h-12 w-12 rounded-full" : "h-10 w-10 rounded-full";

  const containerHeightClass =
    state.view === "month"
      ? "h-[calc(100vh-11.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-8rem)]"
      : "h-[calc(100vh-11.5rem-env(safe-area-inset-bottom))] lg:h-[calc(100vh-8rem)]";

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
            {state.view === "availability" ? "Availability" : toolbarLabel}
          </span>

          {state.view !== "availability" && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Button
                variant="ghost"
                size="icon"
                className={iconButtonClass}
                onClick={handlePrev}
                title="Previous"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={iconButtonClass}
                onClick={handleNext}
                title="Next"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className={textButtonClass} onClick={handleToday}>
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
                const isActive = state.view === value;
                return (
                  <button
                    key={value}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setView(value)}
                    data-testid={`calendar-view-${value}`}
                    className={[
                      `relative flex items-center gap-1.5 ${viewTabClass} text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60`,
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

            {state.view !== "availability" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={iconButtonClass}
                    onClick={() => dispatch({ type: "open_availability_drawer" })}
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
                className={`relative ${iconButtonClass}`}
                title={
                  connectedCalendars.length > 0
                    ? `${connectedCalendars.length} calendar(s) connected`
                    : "Connect your calendar"
                }
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
                <Button variant="ghost" size="icon" className={iconButtonClass}>
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuItem className="flex-col items-start gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Timezone</span>
                  <TimezoneSelect
                    value={state.secondaryTimezone}
                    onChange={(tz) => dispatch({ type: "set_secondary_timezone", timezone: tz })}
                    placeholder="Select timezone"
                    autoDetect={false}
                    showCurrentTime
                    className="w-full"
                  />
                  {state.secondaryTimezone ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs font-semibold"
                      onClick={() => dispatch({ type: "set_secondary_timezone", timezone: "" })}
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
                  className={primaryActionClass}
                  onClick={() => dispatch({ type: "open_booking_modal" })}
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

        {state.feedback ? (
          <FeedbackBanner
            type={state.feedback.type}
            message={state.feedback.message}
            onDismiss={() => setFeedback(null)}
            className="mt-3"
          />
        ) : null}
      </div>

      {/* Main Content Area - Calendar + Sidebar */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background/40 transition-all duration-300 lg:flex-row">
        {/* Calendar Views */}
        <div
          className={[
            "relative flex-1 min-w-0 min-h-0 flex flex-col px-4 py-4 transition-all duration-300 sm:px-6 lg:flex-[2] lg:px-8",
            state.view === "month" ? "overflow-hidden" : "overflow-x-auto overflow-y-auto",
          ].join(" ")}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state.view}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" }}
              className="flex-1 min-h-0 flex flex-col"
            >
              {state.view === "month" && (
                <DashboardBookingCalendar
                  signupDate={signupDate}
                  selectedDate={state.activeDate}
                  showHeaderControls={false}
                  onDateSelect={(date) => {
                    handleMonthDateSelect(date);
                  }}
                />
              )}

              {state.view === "week" && (
                <CalendarWeekView
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventMove={handleEventMove}
                  refreshKey={state.refreshKey}
                  primaryTimezone={primaryTimezone}
                  secondaryTimezone={state.secondaryTimezone || null}
                  activeDate={state.activeDate}
                  showHeaderControls={false}
                  availabilitySlots={state.availabilitySlots}
                />
              )}

              {state.view === "day" && (
                <CalendarDayView
                  onEventClick={handleEventClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onEventMove={handleEventMove}
                  refreshKey={state.refreshKey}
                  primaryTimezone={primaryTimezone}
                  secondaryTimezone={state.secondaryTimezone || null}
                  activeDate={state.activeDate}
                  showHeaderControls={false}
                />
              )}

              {state.view === "availability" && (
                <AvailabilityTab
                  initialSlots={state.availabilitySlots}
                  onSaveSuccess={(slots) => {
                    dispatch({ type: "set_availability_slots", slots });
                    refreshCalendar();
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
        isOpen={calendarSlot.quickActionsOpen}
        onClose={() => calendarSlot.setQuickActionsOpen(false)}
        position={calendarSlot.quickActionsPosition}
        onBlockTime={handleQuickActionsBlockTime}
        onCreateBooking={handleQuickActionsCreateBooking}
        onQuickBlock={calendarSlot.handleInstantBlock}
        slotDate={calendarSlot.pendingSlotDate}
        slotHour={calendarSlot.pendingSlotHour}
      />

      {/* Event Details Popover - Show different popover based on event type */}
      {calendarEvent.popoverEvent && calendarEvent.popoverEvent.type === "blocked" ? (
        <BlockedTimePopover
          event={calendarEvent.popoverEvent}
          isOpen={calendarEvent.eventPopoverOpen}
          onClose={calendarEvent.closeEventPopover}
          position={calendarEvent.eventPopoverPosition}
          onRefresh={refreshCalendar}
        />
      ) : calendarEvent.popoverEvent ? (
        <EventDetailsPopover
          event={calendarEvent.popoverEvent}
          isOpen={calendarEvent.eventPopoverOpen}
          onClose={calendarEvent.closeEventPopover}
          position={calendarEvent.eventPopoverPosition}
          onReschedule={calendarEvent.handlePopoverReschedule}
          onRefresh={refreshCalendar}
        />
      ) : null}

      {/* Quick Block Dialog */}
      <QuickBlockDialog
        isOpen={state.blockDialogOpen}
        onClose={() => dispatch({ type: "close_block_dialog" })}
        onSuccess={handleBlockSuccess}
        initialDate={state.blockDialogDate}
        initialHour={state.blockDialogHour}
      />

      {/* Calendar Booking Modal */}
      <CalendarBookingModal
        isOpen={state.bookingModalOpen}
        onClose={() => dispatch({ type: "close_booking_modal" })}
        onSuccess={handleBookingSuccess}
        initialDate={state.bookingModalDate}
        initialHour={state.bookingModalHour}
        services={services}
        students={students}
        recentStudentIds={recentStudentIds}
        tutorTimezone={tutorTimezone}
        tutorId={tutorId}
      />

      <RescheduleDialog
        open={calendarEvent.rescheduleOpen}
        onOpenChange={(open) => {
          calendarEvent.setRescheduleOpen(open);
          if (!open) calendarEvent.setSelectedEvent(null);
        }}
        bookingId={calendarEvent.selectedEvent?.id ?? null}
        defaultStart={calendarEvent.selectedEvent?.start}
        timezone={calendarEvent.selectedEvent?.timezone}
        durationMinutes={calendarEvent.selectedEvent?.durationMinutes ?? null}
        title={calendarEvent.selectedEvent?.title}
        subtitle={
          calendarEvent.selectedEvent?.serviceName
            ? `Service: ${calendarEvent.selectedEvent.serviceName}`
            : undefined
        }
        onSuccess={handleRescheduleSuccess}
      />

      {/* Availability Drawer */}
      <AvailabilityDrawer
        isOpen={state.availabilityDrawerOpen}
        onClose={() => dispatch({ type: "close_availability_drawer" })}
        initialSlots={state.availabilitySlots.map((slot) => ({
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
          dispatch({ type: "set_availability_slots", slots: normalized });
          refreshCalendar();
          setFeedback({ type: "success", message: "Availability updated." });
        }}
      />
    </div>
  );
}
