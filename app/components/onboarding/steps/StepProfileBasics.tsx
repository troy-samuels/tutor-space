"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, Loader2, Upload, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingStep } from "@/lib/actions/onboarding";
import Image from "next/image";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { detectUserTimezone } from "@/lib/utils/timezones";

type StepProfileBasicsProps = {
  profileId: string;
  initialValues: {
    full_name: string;
    username: string;
  };
  onComplete: () => void;
};

export function StepProfileBasics({
  profileId,
  initialValues,
  onComplete,
}: StepProfileBasicsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: initialValues.full_name,
    username: initialValues.username,
    timezone: detectUserTimezone(),
    avatar_url: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Username availability check with debounce
  useEffect(() => {
    if (!formData.username || formData.username === initialValues.username) {
      setUsernameStatus("idle");
      return;
    }

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
          .neq("id", profileId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setUsernameStatus("taken");
          const base = formData.username.toLowerCase();
          setUsernameSuggestions([
            `${base}${Math.floor(Math.random() * 100)}`,
            `${base}_tutor`,
            `teach${base}`,
          ]);
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
  }, [formData.username, initialValues.username, profileId]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "Image must be less than 5MB" }));
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, avatar: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = "Only letters, numbers, dashes and underscores allowed";
    } else if (usernameStatus === "taken") {
      newErrors.username = "Username is already taken";
    }

    if (!formData.timezone) {
      newErrors.timezone = "Timezone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      let avatarUrl = formData.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        const supabase = createClient();
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `avatars/${profileId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Save to database
      const result = await saveOnboardingStep(1, {
        full_name: formData.full_name.trim(),
        username: formData.username.toLowerCase().trim(),
        timezone: formData.timezone,
        avatar_url: avatarUrl || null,
      });

      if (result.success) {
        onComplete();
      } else {
        setErrors({ submit: result.error || "Failed to save. Please try again." });
      }
    } catch (error) {
      console.error("Error saving step 1:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Avatar Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition hover:border-primary"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                fill
                className="object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload photo
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG up to 5MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        {errors.avatar && (
          <p className="text-xs text-red-600">{errors.avatar}</p>
        )}
      </div>

      {/* Full Name */}
      <div className="space-y-2">
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
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
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-foreground">
          Username <span className="text-red-500">*</span>
        </label>
        <div className="relative flex flex-col sm:flex-row">
          <span className="inline-flex items-center rounded-t-xl sm:rounded-t-none sm:rounded-l-xl border border-b-0 sm:border-b sm:border-r-0 border-gray-300 bg-gray-50 px-3 py-2 sm:py-3 text-xs text-muted-foreground">
            tutorlingua.co/
          </span>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => handleChange("username", e.target.value.toLowerCase())}
            placeholder="your-name"
            className={`flex-1 rounded-b-xl sm:rounded-b-none sm:rounded-r-xl border bg-white px-4 py-3 pr-10 text-sm transition focus:outline-none focus:ring-2 ${
              errors.username
                ? "border-red-300 focus:ring-red-500"
                : usernameStatus === "available"
                ? "border-green-300 focus:ring-green-500/20"
                : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
          />
          <div className="absolute right-3 bottom-3 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
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
        {usernameStatus === "taken" && usernameSuggestions.length > 0 && (
          <div className="rounded-lg bg-amber-50 p-3">
            <p className="mb-2 text-xs font-medium text-amber-900">
              Try these:
            </p>
            <div className="flex flex-wrap gap-2">
              {usernameSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleChange("username", s)}
                  className="rounded-full bg-white px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <label htmlFor="timezone" className="block text-sm font-medium text-foreground">
          Timezone <span className="text-red-500">*</span>
        </label>
        <TimezoneSelect
          id="timezone"
          value={formData.timezone}
          onChange={(value) => handleChange("timezone", value)}
        />
        <p className="text-xs text-muted-foreground">
          Auto-detected from your device; choose another if you work across regions.
        </p>
        {errors.timezone && (
          <p className="text-xs text-red-600">{errors.timezone}</p>
        )}
      </div>

      {errors.submit && (
        <p className="text-sm text-red-600">{errors.submit}</p>
      )}

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={usernameStatus === "checking" || isSaving}
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
