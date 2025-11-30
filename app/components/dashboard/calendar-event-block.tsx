"use client";

import { Video } from "lucide-react";
import type { CalendarEvent } from "@/lib/types/calendar";
import { CALENDAR_COLORS, getEventPosition } from "@/lib/types/calendar";

type CalendarEventBlockProps = {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  pixelsPerHour?: number;
  startHour?: number;
  columnWidth?: number;
  columnIndex?: number;
  totalColumns?: number;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (event: CalendarEvent) => void;
  onDragEnd?: () => void;
};

export function CalendarEventBlock({
  event,
  onClick,
  pixelsPerHour = 60,
  startHour = 6,
  columnWidth,
  columnIndex = 0,
  totalColumns = 1,
  compact = false,
  draggable = false,
  onDragStart,
  onDragEnd,
}: CalendarEventBlockProps) {
  const colors = CALENDAR_COLORS[event.type];
  const { top, height } = getEventPosition(event, startHour, pixelsPerHour);

  // Calculate width and left position for overlapping events
  const width = columnWidth
    ? columnWidth / totalColumns
    : `calc(${100 / totalColumns}% - 2px)`;
  const left = columnWidth
    ? (columnWidth / totalColumns) * columnIndex
    : `calc(${(100 / totalColumns) * columnIndex}%)`;

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
    <button
      draggable={draggable}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(event);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={() => onClick?.(event)}
      className={`absolute overflow-hidden rounded-md border px-2 py-1 text-left transition-all hover:shadow-md ${colors.bg} ${colors.border} ${colors.text} ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width: typeof width === "number" ? `${width}px` : width,
        left: typeof left === "number" ? `${left}px` : left,
        zIndex: 10 + columnIndex,
      }}
    >
      <div className="flex h-full flex-col">
        {/* Time */}
        <div className="flex items-center gap-1 text-[10px] font-medium opacity-80">
          <span>{formatTime(startTime)}</span>
          {event.meetingUrl && <Video className="h-2.5 w-2.5" />}
        </div>

        {/* Title - only show if enough space */}
        {height >= 30 && (
          <div className="mt-0.5 flex-1 overflow-hidden">
            <p
              className={`font-medium leading-tight ${
                compact ? "text-[10px]" : "text-xs"
              } line-clamp-2`}
            >
              {event.title}
            </p>
          </div>
        )}

        {/* Duration - only show if enough space */}
        {height >= 50 && !compact && (
          <div className="mt-auto text-[9px] opacity-70">
            {durationMinutes} min
          </div>
        )}
      </div>
    </button>
  );
}

// Horizontal event block for month view (non-positioned)
export function CalendarEventChip({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}) {
  const colors = CALENDAR_COLORS[event.type];

  const startTime = new Date(event.start);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <button
      onClick={() => onClick?.(event)}
      className={`flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-[10px] transition hover:opacity-80 ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.dot}`} />
      <span className="truncate font-medium">
        {formatTime(startTime)} {event.title}
      </span>
    </button>
  );
}

// Legend component showing what each color means
export function CalendarColorLegend() {
  const items = [
    { type: "tutorlingua" as const, label: "TutorLingua" },
    { type: "google" as const, label: "Google" },
    { type: "outlook" as const, label: "Outlook" },
    { type: "blocked" as const, label: "Blocked" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {items.map((item) => {
        const colors = CALENDAR_COLORS[item.type];
        return (
          <div key={item.type} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${colors.dot}`} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
