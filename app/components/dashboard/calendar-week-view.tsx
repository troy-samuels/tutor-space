"use client";

import { useState, useEffect, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  isToday,
  isSameDay,
  addDays,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { getWeekEvents } from "@/lib/actions/calendar-events";
import type { CalendarEvent } from "@/lib/types/calendar";
import {
  generateTimeSlots,
  groupOverlappingEvents,
  findExternalConflictIds,
} from "@/lib/types/calendar";
import { CalendarEventBlock, CalendarColorLegend } from "./calendar-event-block";
import { createBlockedTime } from "@/lib/actions/blocked-times";

type AvailabilitySlot = {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type CalendarWeekViewProps = {
  onEventClick?: (event: CalendarEvent, clickEvent?: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number, event?: React.MouseEvent) => void;
  initialDate?: Date;
  onEventMove?: (event: CalendarEvent, newStartIso: string) => void;
  refreshKey?: number;
  activeDate?: Date | null;
  showHeaderControls?: boolean;
  primaryTimezone?: string;
  secondaryTimezone?: string | null;
  availabilitySlots?: AvailabilitySlot[];
};

export function CalendarWeekView({
  onEventClick,
  onTimeSlotClick,
  initialDate,
  onEventMove,
  refreshKey = 0,
  activeDate,
  showHeaderControls = true,
  primaryTimezone,
  secondaryTimezone,
  availabilitySlots = [],
}: CalendarWeekViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(initialDate || new Date(), { weekStartsOn: 0 })
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [copyStatus, setCopyStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [isCopying, setIsCopying] = useState(false);

  const startHour = 6;
  const endHour = 22;
  const timeSlots = generateTimeSlots(startHour, endHour, 60);
  const pixelsPerHour = 60;
  const showSecondaryTimezone = Boolean(secondaryTimezone) && secondaryTimezone !== primaryTimezone;
  const timeColumnWidth = showSecondaryTimezone ? "w-28 sm:w-32" : "w-16 sm:w-20";
  const baseTimezone =
    primaryTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const slotHover = prefersReducedMotion ? undefined : { backgroundColor: "rgba(15, 23, 42, 0.04)" };
  const slotTap = prefersReducedMotion ? undefined : { scale: 0.995 };
  const slotTransition = prefersReducedMotion ? { duration: 0 } : { duration: 0.12 };
  const primaryAbbr = useMemo(() => {
    try {
      return formatInTimeZone(new Date(), baseTimezone, "zzz");
    } catch {
      return "LOCAL";
    }
  }, [baseTimezone]);

  // Generate days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const conflictIds = useMemo(() => findExternalConflictIds(events), [events]);

  const getRowBg = (index: number) =>
    index % 2 === 0 ? "bg-transparent" : "bg-stone-50/30";

  const formatSecondaryTime = (hour: number, minute: number) => {
    if (!secondaryTimezone) return "";
    try {
      const datePart = formatInTimeZone(currentWeekStart, baseTimezone, "yyyy-MM-dd");
      const zoned = fromZonedTime(
        `${datePart}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
        baseTimezone
      );
      return formatInTimeZone(zoned, secondaryTimezone, "h a");
    } catch {
      return "";
    }
  };

  // Fetch events when week changes
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      const result = await getWeekEvents(currentWeekStart.toISOString());
      setEvents(result.events || []);
      setIsLoading(false);
    }
    fetchEvents();
  }, [currentWeekStart, refreshKey]);

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));

  useEffect(() => {
    if (activeDate) {
      setCurrentWeekStart(startOfWeek(activeDate, { weekStartsOn: 0 }));
    }
  }, [activeDate]);

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start), date));
  };

  // Get availability slots for a specific day of the week
  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availabilitySlots.filter((slot) => slot.day_of_week === dayOfWeek && slot.is_available);
  };

  // Calculate availability zone position and height
  const getAvailabilityZoneStyle = (slot: AvailabilitySlot) => {
    const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
    const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;
    const gridStartMinutes = startHour * 60;
    const gridEndMinutes = endHour * 60;

    const visibleStart = Math.max(startTimeMinutes, gridStartMinutes);
    const visibleEnd = Math.min(endTimeMinutes, gridEndMinutes);

    if (visibleEnd <= visibleStart) return null;

    const top = ((visibleStart - gridStartMinutes) / 60) * pixelsPerHour;
    const height = ((visibleEnd - visibleStart) / 60) * pixelsPerHour;

    return { top, height };
  };

  // Current time indicator position
  const now = new Date();
  const currentTimePosition =
    (now.getHours() - startHour + now.getMinutes() / 60) * pixelsPerHour;
  const showCurrentTime = now.getHours() >= startHour && now.getHours() < 22;

  const handleDrop = (day: Date, e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedEvent || !onEventMove) return;
    e.preventDefault();

    const targetTz =
      draggedEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const rect = e.currentTarget.getBoundingClientRect();
    const minutesFromTop = Math.max(0, e.clientY - rect.top);
    const totalMinutes = startHour * 60 + (minutesFromTop / pixelsPerHour) * 60;

    // Snap to 15-minute increments and keep the event within visible hours
    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const duration = draggedEvent.durationMinutes ?? 60;
    const maxMinutes = 22 * 60 - duration;
    const clampedMinutes = Math.min(Math.max(snappedMinutes, startHour * 60), maxMinutes);

    const hours = Math.floor(clampedMinutes / 60);
    const minutes = clampedMinutes % 60;

    const datePart = formatInTimeZone(day, targetTz, "yyyy-MM-dd");
    const timePart = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    const newStartIso = fromZonedTime(`${datePart}T${timePart}`, targetTz).toISOString();

    onEventMove(draggedEvent, newStartIso);
    setDraggedEvent(null);
  };

  const handleCopyBlockedWeek = async () => {
    setCopyStatus(null);
    setIsCopying(true);

    const blockedEvents = events.filter((event) => event.type === "blocked");
    if (blockedEvents.length === 0) {
      setCopyStatus({ type: "error", message: "No blocked time to copy for this week." });
      setIsCopying(false);
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const event of blockedEvents) {
      const start = addWeeks(new Date(event.start), 1);
      const end = addWeeks(new Date(event.end), 1);
      const result = await createBlockedTime({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        label: event.title || event.source || "Blocked time",
      });

      if (result.success) {
        successCount += 1;
      } else {
        failureCount += 1;
      }
    }

    if (successCount > 0) {
      setCopyStatus({
        type: failureCount ? "error" : "success",
        message:
          failureCount > 0
            ? `Copied ${successCount} blocked slot${successCount === 1 ? "" : "s"}. ${failureCount} skipped.`
            : `Copied ${successCount} blocked slot${successCount === 1 ? "" : "s"} to next week.`,
      });
    } else {
      setCopyStatus({ type: "error", message: "No blocked slots copied." });
    }

    setIsCopying(false);
  };

  return (
    <div className="flex flex-col h-full">
      {showHeaderControls ? (
        <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousWeek}
              className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToNextWeek}
              className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={goToToday}
              className="ml-2 rounded-full border px-3 py-1 text-xs font-medium hover:bg-muted"
            >
              Today
            </button>
          </div>

          <h2 className="text-lg font-semibold">
            {format(currentWeekStart, "MMM d")} -{" "}
            {format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), "MMM d, yyyy")}
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBlockedWeek}
              disabled={isCopying}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              title="Copy blocked time to the next week"
            >
              <Copy className="h-4 w-4" />
              {isCopying ? "Copying…" : "Copy week → next"}
            </button>
            <CalendarColorLegend />
          </div>
        </div>
      ) : null}

      {copyStatus ? (
        <p
          className={`mb-2 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
            copyStatus.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {copyStatus.message}
        </p>
      ) : null}

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto rounded-xl border bg-white">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="sticky top-0 z-20 flex bg-background/80 backdrop-blur-md">
            {/* Time column spacer */}
            <div className={`${timeColumnWidth} flex-shrink-0 px-2 py-3 text-right bg-transparent`}>
              <div className="flex h-full items-end justify-end">
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
                  {primaryAbbr || "LOCAL"}
                </span>
              </div>
            </div>

            {/* Day columns */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`flex-1 p-2 text-center ${
                  isToday(day) ? "bg-primary/10" : ""
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday(day) ? "text-primary" : ""
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative flex bg-stone-50/30">
            {/* Time labels */}
            <div className={`${timeColumnWidth} flex-shrink-0 bg-transparent`}>
              {timeSlots.map((slot, index) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className={`relative ${getRowBg(index)}`}
                  style={{ height: `${pixelsPerHour}px` }}
                >
                  <div className="flex h-full items-start justify-end px-3 pt-2">
                    <span className="relative -mt-2.5 text-xs font-sans text-muted-foreground">
                      {slot.label.replace(" ", "")}
                    </span>
                    {showSecondaryTimezone ? (
                      <span className="text-muted-foreground">
                        {formatSecondaryTime(slot.hour, slot.minute)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Day columns with events */}
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const eventGroups = groupOverlappingEvents(dayEvents);
              const dayAvailability = getAvailabilityForDay(day.getDay());

              return (
                <div
                  key={day.toISOString()}
                  className={`relative flex-1 ${
                    isToday(day) ? "bg-primary/5" : ""
                  }`}
                  onDragOver={(e) => {
                    if (draggedEvent) {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => handleDrop(day, e)}
                >
                  {/* Availability zones - rendered as background */}
                  {dayAvailability.map((slot) => {
                    const zoneStyle = getAvailabilityZoneStyle(slot);
                    if (!zoneStyle) return null;
                    return (
                      <div
                        key={slot.id ?? `${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}
                        className="absolute inset-x-0 bg-emerald-500/10 border-l-2 border-emerald-500/40 pointer-events-none"
                        style={{
                          top: `${zoneStyle.top}px`,
                          height: `${zoneStyle.height}px`,
                        }}
                        title="Available for bookings"
                      />
                    );
                  })}

                  {/* Time slot backgrounds */}
                  {timeSlots.map((slot, slotIndex) => (
                    <motion.div
                      key={`${slot.hour}-${slot.minute}`}
                      className={`${getRowBg(slotIndex)} cursor-pointer transition-colors hover:bg-muted/40`}
                      style={{ height: `${pixelsPerHour}px` }}
                      onClick={(event) => onTimeSlotClick?.(day, slot.hour, event)}
                      whileHover={slotHover}
                      whileTap={slotTap}
                      transition={slotTransition}
                    >
                      {/* Quick add button on hover */}
                      <div className="group h-full w-full">
                        <div className="hidden group-hover:flex items-center justify-center h-full">
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Events */}
                  {eventGroups.map((group) =>
                    group.map((event, index) => (
                      <CalendarEventBlock
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                        pixelsPerHour={pixelsPerHour}
                        startHour={startHour}
                        columnIndex={index}
                        totalColumns={group.length}
                        draggable={event.type === "tutorlingua"}
                        onDragStart={setDraggedEvent}
                        onDragEnd={() => setDraggedEvent(null)}
                        isConflict={conflictIds.has(event.id)}
                      />
                    ))
                  )}
                </div>
              );
            })}

            {/* Current time indicator across grid */}
            {showCurrentTime && (
              <div
                className="pointer-events-none absolute inset-x-0"
                style={{ top: `${currentTimePosition}px` }}
              >
                <div
                  className="absolute h-0.5 w-full border-t-2 border-primary"
                  style={{ left: 0, right: 0, zIndex: 50 }}
                />
                <div
                  className="absolute h-3 w-3 -translate-y-1.5 rounded-full bg-primary"
                  style={{ left: showSecondaryTimezone ? 70 : 44, zIndex: 50 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
