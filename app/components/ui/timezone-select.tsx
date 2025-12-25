"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";
import { detectUserTimezone, formatTimezonePreview, groupTimezones } from "@/lib/utils/timezones";

/**
 * Timezone selector with search, auto-detection, and current time preview.
 * Groups timezones by region for easier navigation.
 *
 * @example
 * // Basic timezone select
 * <TimezoneSelect
 *   value={timezone}
 *   onChange={setTimezone}
 * />
 *
 * @example
 * // Disable auto-detection
 * <TimezoneSelect
 *   value={timezone}
 *   onChange={setTimezone}
 *   autoDetect={false}
 *   placeholder="Choose your timezone"
 * />
 *
 * @example
 * // In a form with label
 * <Label htmlFor="tz">Timezone</Label>
 * <TimezoneSelect
 *   id="tz"
 *   name="timezone"
 *   value={timezone}
 *   onChange={setTimezone}
 * />
 */
type TimezoneSelectProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  autoDetect?: boolean;
  showCurrentTime?: boolean;
  className?: string;
};

export function TimezoneSelect({
  value,
  onChange,
  id,
  name,
  placeholder = "Select timezone",
  disabled,
  autoDetect = true,
  showCurrentTime = true,
  className,
}: TimezoneSelectProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const detectedTimezone = useMemo(() => detectUserTimezone(), []);

  useEffect(() => {
    if (!value && autoDetect && detectedTimezone) {
      onChange(detectedTimezone);
    }
  }, [autoDetect, detectedTimezone, onChange, value]);

  const groups = useMemo(
    () => groupTimezones(searchTerm, detectedTimezone),
    [detectedTimezone, searchTerm]
  );
  const currentTime = useMemo(() => formatTimezonePreview(value), [value]);

  return (
    <div className={cn("space-y-2", className)}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="min-h-[44px] items-start py-2">
          <div className="flex flex-col text-left">
            <SelectValue placeholder={placeholder} />
            {showCurrentTime && currentTime ? (
              <span className="text-[11px] text-muted-foreground">Now: {currentTime}</span>
            ) : null}
          </div>
        </SelectTrigger>
        <SelectContent>
          <div className="border-b border-border/60 bg-muted/40 px-3 py-2">
            <label className="flex items-center gap-2 rounded-md border border-input bg-background px-2 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search city or region"
                className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </label>
          </div>

          {autoDetect && detectedTimezone ? (
            <div className="flex items-center justify-between px-3 pb-2 text-[11px] text-muted-foreground">
              <button
                type="button"
                className="text-primary hover:text-primary/80"
                onClick={() => onChange(detectedTimezone)}
              >
                Use {detectedTimezone}
              </button>
              <span>Auto-detected</span>
            </div>
          ) : null}

          {groups.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No matches</div>
          ) : (
            groups.map((group) => (
              <div key={group.region}>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase text-muted-foreground">
                  {group.region}
                </p>
                {group.timezones.map((timezone) => (
                  <SelectItem key={timezone} value={timezone}>
                    {timezone.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </div>
            ))
          )}
        </SelectContent>
      </Select>

      {name ? <input type="hidden" name={name} value={value} /> : null}
    </div>
  );
}
