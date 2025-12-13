"use client";

import { useState, useEffect } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfileWizard } from "@/lib/contexts/profile-wizard-context";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { detectUserTimezone } from "@/lib/utils/timezones";

type EssentialInfoData = {
  full_name: string;
  username: string;
  timezone: string;
  primary_language: string;
};

type Step1Props = {
  onNext: () => void;
  onBack: () => void;
  initialValues?: Partial<EssentialInfoData>;
  onSave?: (data: EssentialInfoData) => void;
};

const COMMON_LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Russian",
  "Hindi",
];

export function Step1Essential({
  onNext,
  initialValues,
  onSave,
}: Step1Props) {
  const wizard = useProfileWizard();
  const [formData, setFormData] = useState<EssentialInfoData>({
    full_name: initialValues?.full_name || wizard.state.step1.full_name || "",
    username: initialValues?.username || wizard.state.step1.username || "",
    timezone: initialValues?.timezone || wizard.state.step1.timezone || detectUserTimezone(),
    primary_language: initialValues?.primary_language || wizard.state.step1.primary_language || "",
  });

  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof EssentialInfoData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect timezone on mount
  useEffect(() => {
    if (!formData.timezone) {
      setFormData((prev) => ({ ...prev, timezone: detectUserTimezone() }));
    }
  }, [formData.timezone]);

  // Username availability check with debounce
  useEffect(() => {
    if (!formData.username || formData.username === initialValues?.username) {
      setUsernameStatus("idle");
      return;
    }

    // Basic validation
    if (formData.username.length < 3) {
      setUsernameStatus("idle");
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameStatus("checking");
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", formData.username.toLowerCase())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUsernameStatus("taken");
          // Generate suggestions
          const base = formData.username.toLowerCase();
          const suggestions = [
            `${base}${Math.floor(Math.random() * 100)}`,
            `${base}_tutor`,
            `teach${base}`,
          ];
          setUsernameSuggestions(suggestions);
        } else {
          setUsernameStatus("available");
          setUsernameSuggestions([]);
        }
      } catch (err) {
        console.error("Username check failed:", err);
        setUsernameStatus("idle");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.username, initialValues?.username]);

  const handleChange = (field: keyof EssentialInfoData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EssentialInfoData, string>> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, dashes and underscores";
    } else if (usernameStatus === "taken") {
      newErrors.username = "Username is already taken";
    }

    if (!formData.timezone) {
      newErrors.timezone = "Timezone is required";
    }

    if (!formData.primary_language) {
      newErrors.primary_language = "Primary language is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Update wizard context
    wizard.updateStep1(formData);

    // Save to database
    setIsSaving(true);
    const result = await wizard.saveProgress();
    setIsSaving(false);

    if (result.success) {
      // Call optional onSave callback
      onSave?.(formData);
      // Move to next step
      onNext();
    } else {
      // Show error
      setErrors((prev) => ({
        ...prev,
        username: result.error || "Failed to save. Please try again.",
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div className="space-y-2">
        <label
          htmlFor="full_name"
          className="block text-sm font-medium text-foreground"
        >
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="full_name"
          type="text"
          value={formData.full_name}
          onChange={(e) => handleChange("full_name", e.target.value)}
          placeholder="e.g., Maria Garcia"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.full_name
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        />
        {errors.full_name && (
          <p className="text-xs text-red-600">{errors.full_name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          This will be displayed on your public profile
        </p>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-sm font-medium text-foreground"
        >
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="flex">
            <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-muted-foreground">
              tutorlingua.com/
            </span>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) =>
                handleChange("username", e.target.value.toLowerCase())
              }
              placeholder="your-name"
              className={`flex-1 rounded-r-xl border bg-white px-4 py-3 pr-10 text-sm transition focus:outline-none focus:ring-2 ${
                errors.username
                  ? "border-red-300 focus:ring-red-500"
                  : usernameStatus === "available"
                  ? "border-green-300 focus:ring-green-500/20"
                  : "border-gray-300 focus:border-primary focus:ring-primary/20"
              }`}
            />
          </div>
          {/* Status indicator */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {usernameStatus === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            {usernameStatus === "available" && (
              <Check className="h-4 w-4 text-green-600" />
            )}
            {usernameStatus === "taken" && (
              <X className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>

        {errors.username && (
          <p className="text-xs text-red-600">{errors.username}</p>
        )}

        {usernameStatus === "available" && (
          <p className="text-xs text-green-700">
            <Check className="mr-1 inline h-3 w-3" />
            Username is available!
          </p>
        )}

        {usernameStatus === "taken" && usernameSuggestions.length > 0 && (
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="mb-2 text-xs font-medium text-amber-900">
              Try these available usernames:
            </p>
            <div className="flex flex-wrap gap-2">
              {usernameSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleChange("username", suggestion)}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Your unique URL for students to book sessions
        </p>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <label
          htmlFor="timezone"
          className="block text-sm font-medium text-foreground"
        >
          Timezone <span className="text-red-500">*</span>
        </label>
        <TimezoneSelect
          id="timezone"
          value={formData.timezone}
          onChange={(tz) => handleChange("timezone", tz)}
        />
        {errors.timezone && (
          <p className="text-xs text-red-600">{errors.timezone}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Auto-detected, confirm or change if needed
        </p>
      </div>

      {/* Primary Language */}
      <div className="space-y-2">
        <label
          htmlFor="primary_language"
          className="block text-sm font-medium text-foreground"
        >
          Primary Teaching Language <span className="text-red-500">*</span>
        </label>
        <select
          id="primary_language"
          value={formData.primary_language}
          onChange={(e) => handleChange("primary_language", e.target.value)}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.primary_language
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        >
          <option value="">Select your primary language</option>
          {COMMON_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        {errors.primary_language && (
          <p className="text-xs text-red-600">{errors.primary_language}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The main language you'll be teaching
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={usernameStatus === "checking" || isSaving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {usernameStatus === "checking" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : isSaving ? (
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
