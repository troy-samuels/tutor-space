// Calendar event types for the enhanced calendar view

export type CalendarEventType =
  | "tutorlingua"  // Bookings made through TutorLingua
  | "google"       // Events from Google Calendar
  | "outlook"      // Events from Outlook Calendar
  | "blocked";     // Manually blocked time by tutor

// Package types for color-coding bookings (derived from services.offer_type)
export type PackageType =
  | "trial"        // Trial lesson (orange - warm lead)
  | "one_off"      // Single lesson purchase (blue - engaged)
  | "lesson_block" // Pre-paid package/bundle (blue - engaged)
  | "subscription" // Recurring subscription (purple - VIP)
  | "external";    // External calendar events (gray)

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;  // ISO string
  end: string;    // ISO string
  type: CalendarEventType;
  source: string; // Display name like "TutorLingua", "Google Calendar", etc.
  // Additional metadata
  studentId?: string;
  studentName?: string;
  serviceId?: string;
  serviceName?: string;
  meetingUrl?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  timezone?: string;
  durationMinutes?: number;
  // Package type for color-coding (NEW)
  packageType?: PackageType;
};

// Color configuration for different event types
export const CALENDAR_COLORS: Record<CalendarEventType, {
  bg: string;
  border: string;
  text: string;
  dot: string;
}> = {
  tutorlingua: {
    bg: "bg-primary/20",
    border: "border-primary",
    text: "text-primary-foreground",
    dot: "bg-primary",
  },
  google: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-900",
    dot: "bg-blue-500",
  },
  outlook: {
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-900",
    dot: "bg-purple-500",
  },
  blocked: {
    bg: "bg-gray-100",
    border: "border-gray-400",
    text: "text-gray-700",
    dot: "bg-gray-500",
  },
};

// Color configuration for package types (engagement gradient)
export const PACKAGE_COLORS: Record<PackageType, {
  bg: string;
  border: string;
  text: string;
  dot: string;
  label: string;
}> = {
  trial: {
    bg: "bg-orange-100",
    border: "border-orange-400",
    text: "text-orange-700",
    dot: "bg-orange-500",
    label: "Trial",
  },
  one_off: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "One-off",
  },
  lesson_block: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Bundle",
  },
  subscription: {
    bg: "bg-purple-100",
    border: "border-purple-400",
    text: "text-purple-700",
    dot: "bg-purple-500",
    label: "Subscription",
  },
  external: {
    bg: "bg-gray-100",
    border: "border-gray-300",
    text: "text-gray-600",
    dot: "bg-gray-400",
    label: "External",
  },
};

// Helper to get package color config with fallback
export function getPackageColors(packageType?: PackageType) {
  if (!packageType) return PACKAGE_COLORS.one_off; // Default to one_off
  return PACKAGE_COLORS[packageType] || PACKAGE_COLORS.one_off;
}

// Calendar view types
export type CalendarViewType = "month" | "week" | "day";

// Time slot for the week/day view grid
export type TimeSlot = {
  hour: number;
  minute: number;
  label: string;
};

// Day column for week view
export type DayColumn = {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  events: CalendarEvent[];
};

// Generate time slots for a day (e.g., 6am to 10pm)
export function generateTimeSlots(
  startHour: number = 6,
  endHour: number = 22,
  intervalMinutes: number = 60
): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);

      slots.push({
        hour,
        minute,
        label: time.toLocaleTimeString([], {
          hour: "numeric",
          minute: minute > 0 ? "2-digit" : undefined,
          hour12: true
        }),
      });
    }
  }

  return slots;
}

// Helper to get event position and height in the time grid
export function getEventPosition(
  event: CalendarEvent,
  startHour: number = 6,
  pixelsPerHour: number = 60
): { top: number; height: number } {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const gridStartMinutes = startHour * 60;

  const top = ((startMinutes - gridStartMinutes) / 60) * pixelsPerHour;
  const height = ((endMinutes - startMinutes) / 60) * pixelsPerHour;

  return { top: Math.max(0, top), height: Math.max(pixelsPerHour / 4, height) };
}

// Helper to check if two events overlap
export function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();

  return aStart < bEnd && bStart < aEnd;
}

// Group overlapping events for side-by-side display
export function groupOverlappingEvents(events: CalendarEvent[]): CalendarEvent[][] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const event = sorted[i];
    const overlapsWithGroup = currentGroup.some(e => eventsOverlap(e, event));

    if (overlapsWithGroup) {
      currentGroup.push(event);
    } else {
      groups.push(currentGroup);
      currentGroup = [event];
    }
  }

  groups.push(currentGroup);
  return groups;
}

// Identify external events that overlap with TutorLingua or blocked time
export function findExternalConflictIds(events: CalendarEvent[]): Set<string> {
  const protectedEvents = events.filter(
    (event) => event.type === "tutorlingua" || event.type === "blocked"
  );
  const conflicts = new Set<string>();

  events.forEach((event) => {
    if (event.type === "google" || event.type === "outlook") {
      const overlaps = protectedEvents.some((protectedEvent) => eventsOverlap(event, protectedEvent));
      if (overlaps) {
        conflicts.add(event.id);
      }
    }
  });

  return conflicts;
}
