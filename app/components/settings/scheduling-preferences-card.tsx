"use client";

import { useState, useEffect } from "react";
import { Save, Calendar, Clock, AlertCircle } from "lucide-react";
import {
  getSchedulingPreferences,
  saveSchedulingPreferences,
  type SchedulingPreferences,
} from "@/lib/actions/calendar-settings";

export function SchedulingPreferencesCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [preferences, setPreferences] = useState<SchedulingPreferences>({
    maxLessonsPerDay: null,
    maxLessonsPerWeek: null,
    advanceBookingDaysMin: 1,
    advanceBookingDaysMax: 60,
    bufferTimeMinutes: 0,
  });

  useEffect(() => {
    async function loadPreferences() {
      setIsLoading(true);
      const result = await getSchedulingPreferences();
      if (result.preferences) {
        setPreferences(result.preferences);
      }
      setIsLoading(false);
    }
    loadPreferences();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    const result = await saveSchedulingPreferences(preferences);

    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: "Preferences saved successfully" });
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <div className="border-b px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="h-5 w-5 text-primary" />
          Scheduling Preferences
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Control how and when students can book lessons with you.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Booking Limits Section */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Booking Limits
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Max Lessons Per Day */}
            <div>
              <label
                htmlFor="maxLessonsPerDay"
                className="block text-sm font-medium mb-1.5"
              >
                Max Lessons Per Day
              </label>
              <input
                type="number"
                id="maxLessonsPerDay"
                min={1}
                max={20}
                value={preferences.maxLessonsPerDay ?? ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    maxLessonsPerDay: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="No limit"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty for no limit
              </p>
            </div>

            {/* Max Lessons Per Week */}
            <div>
              <label
                htmlFor="maxLessonsPerWeek"
                className="block text-sm font-medium mb-1.5"
              >
                Max Lessons Per Week
              </label>
              <input
                type="number"
                id="maxLessonsPerWeek"
                min={1}
                max={100}
                value={preferences.maxLessonsPerWeek ?? ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    maxLessonsPerWeek: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="No limit"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Leave empty for no limit
              </p>
            </div>
          </div>
        </div>

        {/* Advance Booking Window Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Advance Booking Window
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Min Days in Advance */}
            <div>
              <label
                htmlFor="advanceBookingDaysMin"
                className="block text-sm font-medium mb-1.5"
              >
                Minimum Days in Advance
              </label>
              <input
                type="number"
                id="advanceBookingDaysMin"
                min={0}
                max={30}
                value={preferences.advanceBookingDaysMin}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    advanceBookingDaysMin: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                How far in advance must bookings be made
              </p>
            </div>

            {/* Max Days in Advance */}
            <div>
              <label
                htmlFor="advanceBookingDaysMax"
                className="block text-sm font-medium mb-1.5"
              >
                Maximum Days in Advance
              </label>
              <input
                type="number"
                id="advanceBookingDaysMax"
                min={1}
                max={365}
                value={preferences.advanceBookingDaysMax}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    advanceBookingDaysMax: Number(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                How far in advance can bookings be made
              </p>
            </div>
          </div>
        </div>

        {/* Buffer Time Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground uppercase tracking-wide">
            <Clock className="h-4 w-4" />
            Buffer Time
          </h3>

          <div>
            <label
              htmlFor="bufferTimeMinutes"
              className="block text-sm font-medium mb-1.5"
            >
              Minutes Between Lessons
            </label>
            <select
              id="bufferTimeMinutes"
              value={preferences.bufferTimeMinutes}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  bufferTimeMinutes: Number(e.target.value),
                })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value={0}>No buffer</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Automatically add a break between consecutive lessons
            </p>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "error" && <AlertCircle className="h-4 w-4" />}
            {feedback.message}
          </div>
        )}

        {/* Save Button */}
        <div className="border-t pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
