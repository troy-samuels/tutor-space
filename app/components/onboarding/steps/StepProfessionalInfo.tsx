"use client";

import { useState, useTransition } from "react";
import { saveOnboardingStep } from "@/lib/actions/onboarding";

type StepProfessionalInfoProps = {
  onComplete: () => void;
  onSaveError?: (message: string) => void;
};

export function StepProfessionalInfo({
  onComplete,
  onSaveError,
}: StepProfessionalInfoProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    tagline: "",
    bio: "",
    website_url: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.tagline.trim()) {
      newErrors.tagline = "Tagline is required";
    } else if (formData.tagline.length < 10) {
      newErrors.tagline = "Tagline must be at least 10 characters";
    } else if (formData.tagline.length > 100) {
      newErrors.tagline = "Tagline must be less than 100 characters";
    }

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length < 50) {
      newErrors.bio = "Bio must be at least 50 characters";
    } else if (formData.bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters";
    }

    if (formData.website_url && !isValidUrl(formData.website_url)) {
      newErrors.website_url = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      const urlToTest = url.startsWith("http") ? url : `https://${url}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    let websiteUrl = formData.website_url.trim();
    if (websiteUrl && !websiteUrl.startsWith("http")) {
      websiteUrl = `https://${websiteUrl}`;
    }

    // Optimistic: Move to next step immediately
    onComplete();

    // Save to database in background
    startTransition(async () => {
      try {
        const result = await saveOnboardingStep(2, {
          tagline: formData.tagline.trim(),
          bio: formData.bio.trim(),
          website_url: websiteUrl || null,
        });

        if (!result.success) {
          console.error("Background save failed for step 2:", result.error);
          onSaveError?.(result.error || "Failed to save professional info");
        }
      } catch (error) {
        console.error("Error saving step 2:", error);
        onSaveError?.("An error occurred while saving");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Tagline */}
      <div className="space-y-2">
        <label htmlFor="tagline" className="block text-sm font-medium text-foreground">
          Tagline <span className="text-red-500">*</span>
        </label>
        <input
          id="tagline"
          type="text"
          value={formData.tagline}
          onChange={(e) => handleChange("tagline", e.target.value)}
          placeholder="e.g., Conversational Spanish for busy professionals"
          maxLength={100}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.tagline
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        />
        <div className="flex justify-between">
          {errors.tagline ? (
            <p className="text-xs text-red-600">{errors.tagline}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              A short description that tells students what you offer
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {formData.tagline.length}/100
          </span>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium text-foreground">
          Bio <span className="text-red-500">*</span>
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder="Tell students about your background, teaching style, and what makes your lessons unique..."
          rows={4}
          maxLength={500}
          className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.bio
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        />
        <div className="flex justify-between">
          {errors.bio ? (
            <p className="text-xs text-red-600">{errors.bio}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Minimum 50 characters
            </p>
          )}
          <span className="text-xs text-muted-foreground">
            {formData.bio.length}/500
          </span>
        </div>
      </div>

      {/* Website URL */}
      <div className="space-y-2">
        <label htmlFor="website_url" className="block text-sm font-medium text-foreground">
          Website URL <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          id="website_url"
          type="text"
          value={formData.website_url}
          onChange={(e) => handleChange("website_url", e.target.value)}
          placeholder="e.g., yourwebsite.com"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.website_url
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        />
        {errors.website_url && (
          <p className="text-xs text-red-600">{errors.website_url}</p>
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
          className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
