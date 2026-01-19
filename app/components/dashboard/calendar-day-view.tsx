"use client";

import { useState, useEffect, useMemo } from "react";
import { addDays, subDays, format, isToday } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { ChevronLeft, ChevronRight, Plus, Video, ExternalLink } from "lucide-react";
import { getDayEvents } from "@/lib/actions/calendar-events";
import type { CalendarEvent } from "@/lib/types/calendar";
import { isClassroomUrl } from "@/lib/utils/classroom-links";
import {
  generateTimeSlots,
  groupOverlappingEvents,
  CALENDAR_COLORS,
  findExternalConflictIds,
} from "@/lib/types/calendar";
import { CalendarEventBlock, CalendarColorLegend } from "./calendar-event-block";

type CalendarDayViewProps = {
  onEventClick?: (event: CalendarEvent, clickEvent?: React.MouseEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number, event?: React.MouseEvent) => void;
  initialDate?: Date;
  onEventMove?: (event: CalendarEvent, newStartIso: string) => void;
  refreshKey?: number;
  activeDate?: Date | null;
  showHeaderControls?: boolean;
  primaryTimezone?: string;
  secondaryTimezone?: string | null;
};

export function CalendarDayView({
  onEventClick,
  onTimeSlotClick,
  initialDate,
  onEventMove,
  refreshKey = 0,
  activeDate,
  showHeaderControls = true,
  primaryTimezone,
  secondaryTimezone,
}: CalendarDayViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const conflictIds = useMemo(() => findExternalConflictIds(events), [events]);

  const timeSlots = generateTimeSlots(6, 22, 60);
  const pixelsPerHour = 80; // Larger for day view
  const startHour = 6;
  const showSecondaryTimezone = Boolean(secondaryTimezone) && secondaryTimezone !== primaryTimezone;
  const timeColumnWidth = showSecondaryTimezone ? "w-28 sm:w-32" : "w-20";
  const baseTimezone =
    primaryTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  // Fetch events when date changes
  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      const result = await getDayEvents(currentDate.toISOString());
      setEvents(result.events || []);
      setIsLoading(false);
    }
    fetchEvents();
  }, [currentDate, refreshKey]);

  const goToPreviousDay = () => setCurrentDate(subDays(currentDate, 1));
  const goToNextDay = () => setCurrentDate(addDays(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  useEffect(() => {
    if (activeDate) {
      setCurrentDate(activeDate);
    }
  }, [activeDate]);

  // Current time indicator position
  const now = new Date();
  const currentTimePosition =
    (now.getHours() - startHour + now.getMinutes() / 60) * pixelsPerHour;
  const showCurrentTime =
    isToday(currentDate) && now.getHours() >= startHour && now.getHours() < 22;

  const eventGroups = groupOverlappingEvents(events);

  const handleEventClick = (event: CalendarEvent, clickEvent?: React.MouseEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event, clickEvent);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!draggedEvent || !onEventMove) return;
    e.preventDefault();

    const targetTz =
      draggedEvent.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    const rect = e.currentTarget.getBoundingClientRect();
    const minutesFromTop = Math.max(0, e.clientY - rect.top);
    const totalMinutes = startHour * 60 + (minutesFromTop / pixelsPerHour) * 60;

    const snappedMinutes = Math.round(totalMinutes / 15) * 15;
    const duration = draggedEvent.durationMinutes ?? 60;
    const maxMinutes = 22 * 60 - duration;
    const clampedMinutes = Math.min(Math.max(snappedMinutes, startHour * 60), maxMinutes);

    const hours = Math.floor(clampedMinutes / 60);
    const minutes = clampedMinutes % 60;

    const datePart = formatInTimeZone(currentDate, targetTz, "yyyy-MM-dd");
    const timePart = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
    const newStartIso = fromZonedTime(`${datePart}T${timePart}`, targetTz).toISOString();

    onEventMove(draggedEvent, newStartIso);
    setDraggedEvent(null);
  };

  const getRowBg = (index: number) =>
    index % 2 === 0 ? "bg-transparent" : "bg-black/[0.02]";

  const formatSecondaryTime = (hour: number, minute: number) => {
    if (!secondaryTimezone) return "";
    try {
      const datePart = formatInTimeZone(currentDate, baseTimezone, "yyyy-MM-dd");
      const zoned = fromZonedTime(
        `${datePart}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
        baseTimezone
      );
      return formatInTimeZone(zoned, secondaryTimezone, "h a");
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Main Calendar */}
      <div className="flex-1 flex flex-col">
        {showHeaderControls ? (
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousDay}
                className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToNextDay}
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
              {format(currentDate, "EEEE, MMMM d, yyyy")}
              {isToday(currentDate) && (
                <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  Today
                </span>
              )}
            </h2>

            <CalendarColorLegend />
          </div>
        ) : null}

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto rounded-xl border bg-white">
          <div className="relative min-h-full">
            <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              <div className={`${timeColumnWidth} flex-shrink-0 px-1`}>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-foreground">Local</span>
                  {showSecondaryTimezone ? (
                    <span className="ml-auto text-muted-foreground">Student</span>
                  ) : null}
                </div>
                {secondaryTimezone ? (
                  <p className="mt-1 truncate text-[11px] font-normal text-muted-foreground">
                    {secondaryTimezone.replace(/_/g, " ")}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] font-normal text-muted-foreground">Your time</p>
                )}
              </div>
              <div className="flex-1 text-right text-[11px] font-semibold text-muted-foreground">
                Schedule
              </div>
            </div>

            <div className="relative flex">
              {/* Time labels */}
              <div className={`${timeColumnWidth} flex-shrink-0`}>
                {timeSlots.map((slot, index) => (
                  <div
                    key={`${slot.hour}-${slot.minute}`}
                    className={`relative ${getRowBg(index)}`}
                    style={{ height: `${pixelsPerHour}px` }}
                  >
                    <div className="flex h-full items-center justify-between px-3 text-[11px]">
                      <span className="font-semibold text-foreground">{slot.label}</span>
                      {showSecondaryTimezone ? (
                        <span className="text-muted-foreground">
                          {formatSecondaryTime(slot.hour, slot.minute)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main column with events */}
              <div
                className={`relative flex-1 ${
                  isToday(currentDate) ? "bg-primary/5" : ""
                }`}
                onDragOver={(e) => {
                  if (draggedEvent) {
                    e.preventDefault();
                  }
                }}
                onDrop={handleDrop}
              >
                {/* Time slot backgrounds */}
                {timeSlots.map((slot, index) => (
                  <div
                    key={`${slot.hour}-${slot.minute}`}
                    className={`${getRowBg(index)} cursor-pointer transition-colors hover:bg-muted/40`}
                    style={{ height: `${pixelsPerHour}px` }}
                    onClick={(e) => onTimeSlotClick?.(currentDate, slot.hour, e)}
                  >
                    <div className="group h-full w-full p-2">
                      <div className="hidden group-hover:flex items-center gap-1 text-xs text-muted-foreground">
                        <Plus className="h-3 w-3" />
                        <span>Add event</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Events */}
                {eventGroups.map((group) =>
                  group.map((event, index) => (
                    <CalendarEventBlock
                      key={event.id}
                      event={event}
                      onClick={handleEventClick}
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

                {/* Current time indicator */}
                {showCurrentTime && (
                  <div
                    className="absolute left-0 right-0 z-30 flex items-center"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-0.5 flex-1 bg-red-500" />
                  </div>
                )}
              </div>
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

      {/* Event Details Sidebar */}
      {selectedEvent && (
        <div className="w-80 flex-shrink-0">
          <EventDetailPanel
            event={selectedEvent}
            isConflict={conflictIds.has(selectedEvent.id)}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
    </div>
  );
}

// Event detail panel component
function EventDetailPanel({
  event,
  isConflict,
  onClose,
}: {
  event: CalendarEvent;
  isConflict: boolean;
  onClose: () => void;
}) {
  const colors = isConflict ? {
    bg: "bg-rose-50",
    border: "border-rose-300",
    text: "text-rose-900",
    dot: "bg-rose-500",
  } : CALENDAR_COLORS[event.type];
  const startTime = new Date(event.start);
  const endTime = new Date(event.end);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const durationMinutes = Math.round(
    (endTime.getTime() - startTime.getTime()) / 60000
  );

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}>
            {event.source}
          </div>
          {isConflict && (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
              Conflict
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          &times;
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2">{event.title}</h3>

      <div className="space-y-3 text-sm">
        <div>
          <div className="text-muted-foreground">Time</div>
          <div>
            {formatTime(startTime)} - {formatTime(endTime)}
            <span className="ml-1 text-muted-foreground">({durationMinutes} min)</span>
          </div>
        </div>

        <div>
          <div className="text-muted-foreground">Date</div>
          <div>{format(startTime, "EEEE, MMMM d, yyyy")}</div>
        </div>

        {event.studentName && (
          <div>
            <div className="text-muted-foreground">Student</div>
            <div>{event.studentName}</div>
          </div>
        )}

        {event.serviceName && (
          <div>
            <div className="text-muted-foreground">Service</div>
            <div>{event.serviceName}</div>
          </div>
        )}

        {event.bookingStatus && (
          <div>
            <div className="text-muted-foreground">Status</div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  event.bookingStatus === "confirmed"
                    ? "bg-emerald-100 text-emerald-700"
                    : event.bookingStatus === "pending"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {event.bookingStatus}
              </span>
              {event.paymentStatus && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    event.paymentStatus === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {event.paymentStatus}
                </span>
              )}
            </div>
          </div>
        )}

        {event.meetingUrl && (
          <a
            href={event.meetingUrl}
            target={isClassroomUrl(event.meetingUrl) ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Video className="h-4 w-4" />
            Join Meeting
            {!isClassroomUrl(event.meetingUrl) && (
              <ExternalLink className="h-3 w-3" />
            )}
          </a>
        )}
      </div>
    </div>
  );
}
