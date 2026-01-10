import { addDays, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import type { AvailabilitySlotInput } from "@/lib/validators/availability";

export type GeneratedSlot = {
  start: string;
  end: string;
  day_label: string;
  time_label: string;
};

export type TimeWindow = {
  start: string;
  end: string;
};

type GenerateSlotParams = {
  availability: AvailabilitySlotInput[];
  timezone: string;
  days?: number;
  startDate?: Date;
  busyWindows?: TimeWindow[];
  bufferMinutes?: number;
};

export function generateBookingSlots({
  availability,
  timezone,
  days = 14,
  startDate = new Date(),
  busyWindows = [],
  bufferMinutes = 0,
}: GenerateSlotParams): GeneratedSlot[] {
  const results: GeneratedSlot[] = [];
  const effectiveBufferMs = Math.max(bufferMinutes, 0) * 60 * 1000;
  const normalizedBusy = busyWindows
    .map((window) => {
      const startMs = Date.parse(window.start);
      const endMs = Date.parse(window.end);
      if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
        return null;
      }
      return {
        start: startMs - effectiveBufferMs,
        end: endMs + effectiveBufferMs,
      };
    })
    .filter((window): window is { start: number; end: number } => Boolean(window));

  for (let offset = 0; offset < days; offset += 1) {
    const dayStart = startOfDay(addDays(startDate, offset));
    const zonedDate = toZonedTime(dayStart, timezone);
    const dayOfWeek = zonedDate.getDay();

    const daySlots = availability.filter(
      (slot) => slot.day_of_week === dayOfWeek && slot.is_available
    );

    daySlots.forEach((slot) => {
      const [startHours, startMinutes] = slot.start_time.split(":").map(Number);
      const [endHours, endMinutes] = slot.end_time.split(":").map(Number);

      const startZoned = new Date(zonedDate);
      startZoned.setHours(startHours, startMinutes, 0, 0);
      const endZoned = new Date(zonedDate);
      endZoned.setHours(endHours, endMinutes, 0, 0);

      const startUtc = fromZonedTime(startZoned, timezone).toISOString();
      const endUtc = fromZonedTime(endZoned, timezone).toISOString();

      const slotStartMs = Date.parse(startUtc);
      const slotEndMs = Date.parse(endUtc);
      const overlapsBusy =
        normalizedBusy.length > 0 &&
        normalizedBusy.some(
          (window) => slotStartMs < window.end && slotEndMs > window.start
        );

      if (overlapsBusy) {
        return;
      }

      results.push({
        start: startUtc,
        end: endUtc,
        day_label: formatInTimeZone(startZoned, timezone, "EEEE, MMM d"),
        time_label: `${formatInTimeZone(startZoned, timezone, "h:mm a")} – ${formatInTimeZone(
          endZoned,
          timezone,
          "h:mm a"
        )}`,
      });
    });
  }

  return results;
}
