"use client";

import { useState } from "react";
import { Plus, Minus, Zap, Loader2 } from "lucide-react";
import { useProfileWizard } from "@/lib/contexts/profile-wizard-context";

type BookingPreferencesData = {
  booking_enabled: boolean;
  auto_accept_bookings: boolean;
  buffer_time_minutes: number;
};

type Step3Props = {
  onNext: () => void;
  onBack: () => void;
  initialValues?: Partial<BookingPreferencesData>;
  onSave?: (data: BookingPreferencesData) => void;
};

const PRESET_BUFFER_TIMES = [0, 5, 10, 15, 30, 45, 60];

export function Step3Preferences({
  onNext,
  onBack,
  initialValues,
  onSave,
}: Step3Props) {
  const wizard = useProfileWizard();
  const [formData, setFormData] = useState<BookingPreferencesData>({
    booking_enabled: initialValues?.booking_enabled ?? wizard.state.step3.booking_enabled ?? true,
    auto_accept_bookings: initialValues?.auto_accept_bookings ?? wizard.state.step3.auto_accept_bookings ?? false,
    buffer_time_minutes: initialValues?.buffer_time_minutes ?? wizard.state.step3.buffer_time_minutes ?? 15,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (field: keyof BookingPreferencesData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const changeBuffer = (delta: number) => {
    setFormData((prev) => ({
      ...prev,
      buffer_time_minutes: Math.min(480, Math.max(0, prev.buffer_time_minutes + delta)),
    }));
  };

  const setBufferPreset = (minutes: number) => {
    setFormData((prev) => ({
      ...prev,
      buffer_time_minutes: minutes,
    }));
  };

  const handleSubmit = async () => {
    // Update wizard context
    wizard.updateStep3(formData);

    // Save to database
    setIsSaving(true);
    const result = await wizard.saveProgress();
    setIsSaving(false);

    if (result.success) {
      // Call optional onSave callback
      onSave?.(formData);
      // Move to next step
      onNext();
    }
    // Note: No validation errors to show for this step, all fields have defaults
  };

  const formatBufferTime = (minutes: number) => {
    if (minutes === 0) return "No buffer";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  };

  return (
    <div className="space-y-6">
      {/* Booking Enabled */}
      <div className="rounded-2xl border border-brand-brown/20 bg-brand-cream/30 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">
              Enable Bookings
            </h3>
            <p className="text-sm text-muted-foreground">
              Allow students to book sessions through your TutorLingua profile. You can always pause this later.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("booking_enabled")}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-brown focus:ring-offset-2 ${
              formData.booking_enabled ? "bg-brand-brown" : "bg-gray-300"
            }`}
            role="switch"
            aria-checked={formData.booking_enabled}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                formData.booking_enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Auto Accept Bookings */}
      {formData.booking_enabled && (
        <div className="rounded-2xl border border-brand-brown/20 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  Auto-Accept Bookings
                </h3>
                <span className="rounded-full bg-brand-brown/10 px-2 py-0.5 text-xs font-medium text-brand-brown">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically confirm bookings without manual approval. Reduces friction and increases conversion by 40%.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("auto_accept_bookings")}
              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-brown focus:ring-offset-2 ${
                formData.auto_accept_bookings ? "bg-brand-brown" : "bg-gray-300"
              }`}
              role="switch"
              aria-checked={formData.auto_accept_bookings}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                  formData.auto_accept_bookings ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {formData.auto_accept_bookings && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-900">
              <Zap className="h-4 w-4 flex-shrink-0" />
              <span>
                Great choice! Students can book instantly, and you'll get more bookings with less work.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Buffer Time */}
      {formData.booking_enabled && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">
              Buffer Time Between Sessions
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add automatic breaks between back-to-back sessions for prep time and rest.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-brown/20 bg-white p-5">
            {/* Stepper Control */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => changeBuffer(-5)}
                disabled={formData.buffer_time_minutes === 0}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-brown/30 bg-white text-brand-brown transition hover:bg-brand-brown/5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Decrease buffer time"
              >
                <Minus className="h-5 w-5" />
              </button>

              <div className="min-w-[140px] text-center">
                <div className="text-3xl font-semibold text-brand-brown">
                  {formatBufferTime(formData.buffer_time_minutes)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formData.buffer_time_minutes === 0
                    ? "Sessions can be back-to-back"
                    : "Break between each session"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => changeBuffer(5)}
                disabled={formData.buffer_time_minutes === 480}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-brown/30 bg-white text-brand-brown transition hover:bg-brand-brown/5 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase buffer time"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Preset Buttons */}
            <div className="mt-6 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Quick presets:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_BUFFER_TIMES.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setBufferPreset(minutes)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      formData.buffer_time_minutes === minutes
                        ? "bg-brand-brown text-brand-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {formatBufferTime(minutes)}
                  </button>
                ))}
              </div>
            </div>

            {/* Helper Info */}
            {formData.buffer_time_minutes > 0 && (
              <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                <p>
                  <strong>Example:</strong> If a session ends at 3:00 PM, students
                  can't book until {" "}
                  <strong>
                    {new Date(
                      new Date().setHours(
                        15,
                        formData.buffer_time_minutes,
                        0
                      )
                    ).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </strong>
                  .
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disabled State Info */}
      {!formData.booking_enabled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900">
            Bookings Currently Disabled
          </h3>
          <p className="mt-2 text-sm text-amber-800">
            Your profile will be visible, but students won't be able to book sessions. Enable bookings above to start accepting students.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-brand-brown px-8 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90 disabled:cursor-not-allowed disabled:opacity-50"
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
