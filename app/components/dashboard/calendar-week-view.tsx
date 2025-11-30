"use client";

import { useState, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { getWeekEvents } from "@/lib/actions/calendar-events";
import type { CalendarEvent } from "@/lib/types/calendar";
import { generateTimeSlots, groupOverlappingEvents } from "@/lib/types/calendar";
import { CalendarEventBlock, CalendarColorLegend } from "./calendar-event-block";

type CalendarWeekViewProps = {
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
  initialDate?: Date;
  onEventMove?: (event: CalendarEvent, newStartIso: string) => void;
  refreshKey?: number;
};

export function CalendarWeekView({
  onEventClick,
  onTimeSlotClick,
  initialDate,
  onEventMove,
  refreshKey = 0,
}: CalendarWeekViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(initialDate || new Date(), { weekStartsOn: 0 })
  );
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  const timeSlots = generateTimeSlots(6, 22, 60);
  const pixelsPerHour = 60;
  const startHour = 6;

  // Generate days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

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

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.start), date));
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
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

        <CalendarColorLegend />
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto rounded-xl border bg-white">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="sticky top-0 z-20 flex border-b bg-muted/50">
            {/* Time column spacer */}
            <div className="w-16 flex-shrink-0 border-r" />

            {/* Day columns */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`flex-1 border-r p-2 text-center ${
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
          <div className="relative flex">
            {/* Time labels */}
            <div className="w-16 flex-shrink-0 border-r">
              {timeSlots.map((slot) => (
                <div
                  key={`${slot.hour}-${slot.minute}`}
                  className="relative border-b"
                  style={{ height: `${pixelsPerHour}px` }}
                >
                  <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
                    {slot.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns with events */}
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const eventGroups = groupOverlappingEvents(dayEvents);

              return (
                <div
                  key={day.toISOString()}
                  className={`relative flex-1 border-r ${
                    isToday(day) ? "bg-primary/5" : ""
                  }`}
                  onDragOver={(e) => {
                    if (draggedEvent) {
                      e.preventDefault();
                    }
                  }}
                  onDrop={(e) => handleDrop(day, e)}
                >
                  {/* Time slot backgrounds */}
                  {timeSlots.map((slot) => (
                    <div
                      key={`${slot.hour}-${slot.minute}`}
                      className="border-b hover:bg-muted/30 cursor-pointer"
                      style={{ height: `${pixelsPerHour}px` }}
                      onClick={() => onTimeSlotClick?.(day, slot.hour)}
                    >
                      {/* Quick add button on hover */}
                      <div className="group h-full w-full">
                        <div className="hidden group-hover:flex items-center justify-center h-full">
                          <Plus className="h-4 w-4 text-muted-foreground" />
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
                        onClick={onEventClick}
                        pixelsPerHour={pixelsPerHour}
                        startHour={startHour}
                        columnIndex={index}
                        totalColumns={group.length}
                        draggable={event.type === "tutorlingua"}
                        onDragStart={setDraggedEvent}
                        onDragEnd={() => setDraggedEvent(null)}
                      />
                    ))
                  )}

                  {/* Current time indicator */}
                  {isToday(day) && showCurrentTime && (
                    <div
                      className="absolute left-0 right-0 z-30 flex items-center"
                      style={{ top: `${currentTimePosition}px` }}
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                      <div className="h-0.5 flex-1 bg-red-500" />
                    </div>
                  )}
                </div>
              );
            })}
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
