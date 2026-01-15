"use client";

import { useEffect, useState } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { X, Loader2, Clock, Calendar } from "lucide-react";
import { createBlockedTime } from "@/lib/actions/blocked-times";

type QuickBlockDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  initialHour?: number;
};

export function QuickBlockDialog({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  initialHour,
}: QuickBlockDialogProps) {
  const defaultDate = initialDate || new Date();
  const defaultHour = initialHour ?? 9;

  const [date, setDate] = useState(format(defaultDate, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(
    `${String(defaultHour).padStart(2, "0")}:00`
  );
  const [endTime, setEndTime] = useState(
    `${String(defaultHour + 1).padStart(2, "0")}:00`
  );
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const nextDate = initialDate || new Date();
    const nextHour = initialHour ?? 9;

    setDate(format(nextDate, "yyyy-MM-dd"));
    setStartTime(`${String(nextHour).padStart(2, "0")}:00`);
    setEndTime(`${String(nextHour + 1).padStart(2, "0")}:00`);
    setLabel("");
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, initialDate, initialHour]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Combine date and time
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const [endHour, endMinute] = endTime.split(":").map(Number);

      const startDateTime = setMinutes(
        setHours(new Date(date), startHour),
        startMinute
      );
      const endDateTime = setMinutes(
        setHours(new Date(date), endHour),
        endMinute
      );

      // Validate
      if (endDateTime <= startDateTime) {
        setError("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      const result = await createBlockedTime({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        label: label || undefined,
      });

      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setLabel("");
      } else {
        setError(result.error || "Failed to create blocked time");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick duration buttons
  const setDuration = (minutes: number) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const startDate = setMinutes(setHours(new Date(), startHour), startMinute);
    const endDate = new Date(startDate.getTime() + minutes * 60000);
    setEndTime(format(endDate, "HH:mm"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Block Time</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
              autoFocus
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              <Clock className="inline h-4 w-4 mr-1" />
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* Quick Duration Buttons - Elevated for faster selection */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Duration
            </label>
            <div className="flex gap-2">
              {[30, 60, 120, 180].map((mins) => {
                // Calculate if this duration matches current selection
                const [startHour, startMinute] = startTime.split(":").map(Number);
                const [endHour, endMinute] = endTime.split(":").map(Number);
                const currentDuration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
                const isSelected = currentDuration === mins;

                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* End Time (auto-calculated from duration, but editable) */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Lunch break, Meeting, Personal time"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="inline h-4 w-4 mr-1 animate-spin" />
                  Blocking...
                </>
              ) : (
                "Block Time"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
