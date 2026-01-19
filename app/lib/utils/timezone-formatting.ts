import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const DEFAULT_TIME_FORMAT = "h:mm a";
const SECONDARY_TIME_FORMAT = "h a";

export function formatTimeInTimezone(
  date: Date,
  timezone: string,
  formatStr: string = DEFAULT_TIME_FORMAT
): string {
  if (!timezone) return "";
  try {
    return formatInTimeZone(date, timezone, formatStr);
  } catch {
    return format(date, formatStr);
  }
}

export function formatSecondaryTimezone(
  baseDate: Date,
  baseTimezone: string,
  targetTimezone: string,
  formatStr: string = SECONDARY_TIME_FORMAT
): string {
  if (!targetTimezone || targetTimezone === baseTimezone) return "";
  return formatTimeInTimezone(baseDate, targetTimezone, formatStr);
}
