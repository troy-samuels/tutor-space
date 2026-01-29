"use client";

import type { CalendarEvent } from "@/lib/types/calendar";
import { CALENDAR_COLORS, getEventPosition } from "@/lib/types/calendar";

type CalendarEventBlockProps = {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent, clickEvent?: React.MouseEvent) => void;
  pixelsPerHour?: number;
  startHour?: number;
  columnWidth?: number;
  columnIndex?: number;
  totalColumns?: number;
  draggable?: boolean;
  onDragStart?: (event: CalendarEvent) => void;
  onDragEnd?: () => void;
  isConflict?: boolean;
};

const CONFLICT_COLORS = {
  bg: "bg-rose-50",
  border: "border-rose-300",
  text: "text-rose-900",
  dot: "bg-rose-500",
};

export function CalendarEventBlock({
  event,
  onClick,
  pixelsPerHour = 60,
  startHour = 6,
  columnWidth,
  columnIndex = 0,
  totalColumns = 1,
  draggable = false,
  onDragStart,
  onDragEnd,
  isConflict = false,
}: CalendarEventBlockProps) {
  const { top, height } = getEventPosition(event, startHour, pixelsPerHour);
  const accentColor = isConflict ? "#f43f5e" : "var(--primary)";

  // Calculate width and left position for overlapping events
  const width = columnWidth
    ? columnWidth / totalColumns
    : `calc(${100 / totalColumns}% - 2px)`;
  const left = columnWidth
    ? (columnWidth / totalColumns) * columnIndex
    : `calc(${(100 / totalColumns) * columnIndex}%)`;

  const startTime = new Date(event.start);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const showTime = height >= 34; // Hide time text on very small blocks

  return (
    <button
      draggable={draggable}
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(event);
      }}
      onDragEnd={() => onDragEnd?.()}
      onClick={(e) => onClick?.(event, e)}
      className={`absolute overflow-hidden rounded-lg border border-stone-200/60 bg-white px-3 py-1.5 text-left text-sm text-foreground shadow-sm transition-all hover:scale-[1.02] hover:shadow-md border-l-[3px] ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width: typeof width === "number" ? `${width}px` : width,
        left: typeof left === "number" ? `${left}px` : left,
        borderLeftColor: accentColor,
        zIndex: 60 + columnIndex,
      }}
    >
      <div className="flex h-full flex-col justify-center gap-1">
        <p className="truncate text-sm font-semibold leading-tight tracking-tight">
          {event.studentName || event.title}
        </p>
        {showTime && (
          <p className="text-[10px] font-sans font-medium leading-none text-muted-foreground">
            {formatTime(startTime)}
          </p>
        )}
      </div>
    </button>
  );
}

// Horizontal event block for month view (non-positioned)
export function CalendarEventChip({
  event,
  onClick,
  isConflict = false,
}: {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent, clickEvent?: React.MouseEvent) => void;
  isConflict?: boolean;
}) {
  const colors = isConflict ? CONFLICT_COLORS : CALENDAR_COLORS[event.type];

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
      onClick={(e) => onClick?.(event, e)}
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
    { type: "preply" as const, label: "Preply" },
    { type: "italki" as const, label: "iTalki" },
    { type: "verbling" as const, label: "Verbling" },
    { type: "marketplace" as const, label: "Other" },
    { type: "google" as const, label: "Google" },
    { type: "outlook" as const, label: "Outlook" },
    { type: "blocked" as const, label: "Blocked" },
    { type: "conflict" as const, label: "Conflict" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      {items.map((item) => {
        const colors = item.type === "conflict" ? CONFLICT_COLORS : CALENDAR_COLORS[item.type];
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
