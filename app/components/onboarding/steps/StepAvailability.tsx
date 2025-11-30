"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";

type StepAvailabilityProps = {
  profileId: string;
  onComplete: () => void;
};

type TimeSlot = {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
};

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30", "22:00",
];

export function StepAvailability({
  profileId,
  onComplete,
}: StepAvailabilityProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([
    { id: "1", day: "monday", start_time: "09:00", end_time: "17:00" },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const addSlot = () => {
    const newSlot: TimeSlot = {
      id: Date.now().toString(),
      day: "monday",
      start_time: "09:00",
      end_time: "17:00",
    };
    setSlots([...slots, newSlot]);
  };

  const setBusinessHours = () => {
    // Set default Monday-Friday 9:00 AM - 5:00 PM
    const businessHours: TimeSlot[] = [
      { id: "mon", day: "monday", start_time: "09:00", end_time: "17:00" },
      { id: "tue", day: "tuesday", start_time: "09:00", end_time: "17:00" },
      { id: "wed", day: "wednesday", start_time: "09:00", end_time: "17:00" },
      { id: "thu", day: "thursday", start_time: "09:00", end_time: "17:00" },
      { id: "fri", day: "friday", start_time: "09:00", end_time: "17:00" },
    ];
    setSlots(businessHours);
  };

  const removeSlot = (id: string) => {
    if (slots.length > 1) {
      setSlots(slots.filter((s) => s.id !== id));
    }
  };

  const updateSlot = (id: string, field: keyof TimeSlot, value: string) => {
    setSlots(
      slots.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );
    if (errors.slots) {
      setErrors((prev) => ({ ...prev, slots: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check for valid time ranges
    for (const slot of slots) {
      if (slot.start_time >= slot.end_time) {
        newErrors.slots = "End time must be after start time";
        break;
      }
    }

    // Check for overlapping slots on the same day
    const slotsByDay = slots.reduce((acc, slot) => {
      if (!acc[slot.day]) acc[slot.day] = [];
      acc[slot.day].push(slot);
      return acc;
    }, {} as Record<string, TimeSlot[]>);

    for (const day in slotsByDay) {
      const daySlots = slotsByDay[day].sort((a, b) =>
        a.start_time.localeCompare(b.start_time)
      );
      for (let i = 1; i < daySlots.length; i++) {
        if (daySlots[i].start_time < daySlots[i - 1].end_time) {
          newErrors.slots = `Overlapping time slots on ${day}`;
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const result = await saveOnboardingStep(4, {
        availability: slots.map((s) => ({
          day_of_week: s.day,
          start_time: s.start_time,
          end_time: s.end_time,
        })),
      });

      if (result.success) {
        onComplete();
      } else {
        setErrors({ submit: result.error || "Failed to save. Please try again." });
      }
    } catch (error) {
      console.error("Error saving step 4:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Set when you're available for lessons. Students will only be able to book during these times.
      </p>

      {/* Time Slots */}
      <div className="space-y-3">
        {slots.map((slot, index) => (
          <div
            key={slot.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/30 p-3"
          >
            <select
              value={slot.day}
              onChange={(e) => updateSlot(slot.id, "day", e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>

            <span className="text-sm text-muted-foreground">from</span>

            <select
              value={slot.start_time}
              onChange={(e) => updateSlot(slot.id, "start_time", e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {formatTime(time)}
                </option>
              ))}
            </select>

            <span className="text-sm text-muted-foreground">to</span>

            <select
              value={slot.end_time}
              onChange={(e) => updateSlot(slot.id, "end_time", e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {formatTime(time)}
                </option>
              ))}
            </select>

            {slots.length > 1 && (
              <button
                type="button"
                onClick={() => removeSlot(slot.id)}
                className="ml-auto rounded-lg p-2 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {errors.slots && (
        <p className="text-xs text-red-600">{errors.slots}</p>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={setBusinessHours}
          className="inline-flex items-center gap-2 rounded-lg border border-primary/50 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10"
        >
          <Calendar className="h-4 w-4" />
          Use Business Hours (Mon-Fri 9-5)
        </button>
        <button
          type="button"
          onClick={addSlot}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add custom slot
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        You can adjust your availability anytime from your dashboard.
      </p>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}
