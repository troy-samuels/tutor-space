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
