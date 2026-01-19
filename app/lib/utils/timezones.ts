import { formatInTimeZone } from "date-fns-tz";

const REGION_LABELS: Record<string, string> = {
  America: "Americas",
  Africa: "Africa",
  Antarctica: "Antarctica",
  Arctic: "Arctic",
  Asia: "Asia",
  Atlantic: "Atlantic",
  Australia: "Australia",
  Europe: "Europe",
  Indian: "Indian Ocean",
  Pacific: "Pacific",
};

const ALL_TIMEZONES = (typeof Intl !== "undefined" && Intl.supportedValuesOf)
  ? Intl.supportedValuesOf("timeZone")
  : ["UTC"];

export type TimezoneGroup = {
  region: string;
  timezones: string[];
};

const REGION_ORDER = [
  "Detected (device)",
  "Americas",
  "Europe",
  "Africa",
  "Asia",
  "Pacific",
  "Australia",
  "Atlantic",
  "Indian Ocean",
  "Arctic",
  "Antarctica",
  "UTC",
];

function getRegionLabel(timezone: string): string {
  const regionKey = timezone.split("/")[0];
  return REGION_LABELS[regionKey] || regionKey;
}

function sortRegions(a: string, b: string): number {
  const indexA = REGION_ORDER.indexOf(a);
  const indexB = REGION_ORDER.indexOf(b);
  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
  if (indexA === -1) return 1;
  if (indexB === -1) return -1;
  return indexA - indexB;
}

export function detectUserTimezone(fallback = "UTC"): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback;
  } catch {
    return fallback;
  }
}

export function groupTimezones(searchTerm = "", detectedTimezone?: string): TimezoneGroup[] {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filtered = ALL_TIMEZONES.filter((tz) =>
    normalizedSearch ? tz.toLowerCase().includes(normalizedSearch) : true
  );

  const grouped = filtered.reduce<Record<string, string[]>>((acc, tz) => {
    const regionLabel = getRegionLabel(tz);
    if (!acc[regionLabel]) acc[regionLabel] = [];
    acc[regionLabel].push(tz);
    return acc;
  }, {});

  let groups = Object.entries(grouped)
    .map(([region, timezones]) => ({
      region,
      timezones: timezones.sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => sortRegions(a.region, b.region));

  if (detectedTimezone && filtered.includes(detectedTimezone)) {
    groups = [
      { region: "Detected (device)", timezones: [detectedTimezone] },
      ...groups
        .map((group) => ({
          ...group,
          timezones: group.timezones.filter((tz) => tz !== detectedTimezone),
        }))
        .filter((group) => group.timezones.length > 0),
    ];
  }

  return groups;
}

export function formatTimezonePreview(timezone: string, date = new Date()): string {
  if (!timezone) return "";
  try {
    return formatInTimeZone(date, timezone, "EEE h:mm a (zzz)");
  } catch {
    return "";
  }
}

/**
 * Format a time range with timezone support
 *
 * @example
 * formatTimeRange(start, end, "America/New_York") // "9:00 AM - 10:00 AM EST"
 */
export function formatTimeRange(
  start: Date | string,
  end: Date | string,
  timezone: string
): string {
  if (!timezone) return "";
  try {
    const startDate = typeof start === "string" ? new Date(start) : start;
    const endDate = typeof end === "string" ? new Date(end) : end;

    const startTime = formatInTimeZone(startDate, timezone, "h:mm a");
    const endTime = formatInTimeZone(endDate, timezone, "h:mm a zzz");

    return `${startTime} - ${endTime}`;
  } catch {
    return "";
  }
}

/**
 * Get timezone abbreviation for a given timezone
 *
 * @example
 * getTimezoneAbbreviation("America/New_York") // "EST" or "EDT"
 */
export function getTimezoneAbbreviation(timezone: string, date = new Date()): string {
  if (!timezone) return "";
  try {
    return formatInTimeZone(date, timezone, "zzz");
  } catch {
    return "";
  }
}

/**
 * Convert a local time string to UTC Date
 *
 * @example
 * localTimeToUtc("09:00", new Date("2024-01-15"), "America/New_York")
 * // Returns Date object for 9:00 AM Eastern on Jan 15, 2024 in UTC
 */
export function localTimeToUtc(
  timeString: string,
  date: Date,
  timezone: string
): Date {
  const [hours, minutes] = timeString.split(":").map(Number);

  // Create a date string in the target timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hourStr = String(hours).padStart(2, "0");
  const minuteStr = String(minutes ?? 0).padStart(2, "0");

  const localDateStr = `${year}-${month}-${day}T${hourStr}:${minuteStr}:00`;

  // Use Intl to get the UTC offset for this timezone at this time
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "longOffset",
  });

  // Parse the local time in the given timezone
  const parts = formatter.formatToParts(new Date(localDateStr + "Z"));
  const offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "";

  // Extract offset from "GMT+XX:XX" or "GMT-XX:XX" format
  const offsetMatch = offsetPart.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!offsetMatch) {
    // Fallback: assume UTC
    return new Date(localDateStr + "Z");
  }

  const sign = offsetMatch[1] === "+" ? -1 : 1;
  const offsetHours = parseInt(offsetMatch[2] || "0", 10);
  const offsetMinutes = parseInt(offsetMatch[3] || "0", 10);
  const totalOffsetMs = sign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;

  return new Date(new Date(localDateStr + "Z").getTime() + totalOffsetMs);
}

/**
 * Get current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  if (!timezone) return "";
  try {
    return formatInTimeZone(new Date(), timezone, "h:mm a");
  } catch {
    return "";
  }
}

/**
 * Get full datetime in a specific timezone
 */
export function formatDateTimeInTimezone(
  date: Date | string,
  timezone: string,
  format_: string = "MMM d, yyyy h:mm a zzz"
): string {
  if (!timezone) return "";
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return formatInTimeZone(dateObj, timezone, format_);
  } catch {
    return "";
  }
}

/**
 * Get the offset in hours between two timezones
 */
export function getTimezoneOffsetDifference(
  fromTimezone: string,
  toTimezone: string,
  date = new Date()
): number {
  try {
    const formatter1 = new Intl.DateTimeFormat("en-US", {
      timeZone: fromTimezone,
      hour: "numeric",
      hour12: false,
    });
    const formatter2 = new Intl.DateTimeFormat("en-US", {
      timeZone: toTimezone,
      hour: "numeric",
      hour12: false,
    });

    const hour1 = parseInt(formatter1.format(date), 10);
    const hour2 = parseInt(formatter2.format(date), 10);

    let diff = hour2 - hour1;
    // Handle day boundary
    if (diff > 12) diff -= 24;
    if (diff < -12) diff += 24;

    return diff;
  } catch {
    return 0;
  }
}
