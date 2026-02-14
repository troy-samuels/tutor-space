"use client";

import { useState } from "react";
import { Instagram, Globe, Check, Loader2 } from "lucide-react";
import { useProfileWizard } from "@/lib/contexts/profile-wizard-context";

type SocialProofData = {
  website_url: string;
  instagram_handle: string;
};

type Step4Props = {
  onNext: () => void;
  onBack: () => void;
  initialValues?: Partial<SocialProofData>;
  onSave?: (data: SocialProofData) => void;
};

export function Step4Social({ onNext, initialValues, onSave }: Step4Props) {
  const wizard = useProfileWizard();
  const [formData, setFormData] = useState<SocialProofData>({
    website_url: initialValues?.website_url || wizard.state.step4.website_url || "",
    instagram_handle: initialValues?.instagram_handle || wizard.state.step4.instagram_handle || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SocialProofData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof SocialProofData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const sanitizeHandle = (value: string) => {
    if (!value) return "";
    let cleaned = value.trim();
    cleaned = cleaned.replace(/^https?:\/\//i, "");
    cleaned = cleaned.replace(/^www\./i, "");
    cleaned = cleaned.replace(/^instagram\.com\//i, "");
    cleaned = cleaned.replace(/^@+/g, "");
    cleaned = cleaned.split(/[/?#]/)[0];
    return cleaned;
  };

  const handleBlur = (field: keyof SocialProofData) => {
    if (field === "website_url") {
      if (formData.website_url && !/^https?:\/\//i.test(formData.website_url)) {
        setFormData((prev) => ({
          ...prev,
          website_url: `https://${prev.website_url.trim()}`,
        }));
      }
      return;
    }

    if (field === "instagram_handle") {
      const sanitized = sanitizeHandle(formData[field]);
      if (sanitized !== formData[field]) {
        setFormData((prev) => ({ ...prev, [field]: sanitized }));
      }
    }
  };

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SocialProofData, string>> = {};

    if (formData.website_url && !validateUrl(formData.website_url)) {
      newErrors.website_url = "Please enter a valid URL (include https://)";
    }

    if (formData.instagram_handle && formData.instagram_handle.includes("@")) {
      newErrors.instagram_handle = "Don't include @ symbol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Clean up handles
    const cleanedData = {
      ...formData,
      instagram_handle: sanitizeHandle(formData.instagram_handle),
    };

    // Update wizard context
    wizard.updateStep4(cleanedData);

    // Save to database (final step!)
    setIsSaving(true);
    const result = await wizard.saveProgress();
    setIsSaving(false);

    if (result.success) {
      // Call optional onSave callback
      onSave?.(cleanedData);
      // Complete wizard
      onNext();
    } else {
      // Show error
      setErrors((prev) => ({
        ...prev,
        website_url: result.error || "Failed to save. Please try again.",
      }));
    }
  };

  const filledCount = Object.values(formData).filter((v) => v.trim() !== "").length;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="rounded-2xl border border-border bg-muted/30 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            {filledCount > 0 ? (
              <Check className="h-6 w-6" />
            ) : (
              <Globe className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Contact & Social {filledCount > 0 && `(${filledCount}/2 added)`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional but recommended! Adding your Instagram helps students see your
              teaching style and connects them with you before booking.
            </p>
          </div>
        </div>
      </div>

      {/* Website */}
      <div className="space-y-2">
        <label htmlFor="website_url" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span>Personal Website</span>
        </label>
        <input
          id="website_url"
          type="url"
          value={formData.website_url}
          onChange={(e) => handleChange("website_url", e.target.value)}
          onBlur={() => handleBlur("website_url")}
          placeholder="https://yourwebsite.com"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.website_url
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-primary focus:ring-primary/20"
          }`}
        />
        {errors.website_url && (
          <p className="text-xs text-red-600">{errors.website_url}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Your teaching website or portfolio (include https://)
        </p>
      </div>

      {/* Instagram */}
      <div className="space-y-2">
        <label htmlFor="instagram_handle" className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Instagram className="h-4 w-4 text-muted-foreground" />
          <span>Instagram</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            @
          </span>
          <input
            id="instagram_handle"
            type="text"
            value={formData.instagram_handle}
            onChange={(e) => handleChange("instagram_handle", e.target.value)}
            onBlur={() => handleBlur("instagram_handle")}
            placeholder="username"
            className={`w-full rounded-xl border bg-white py-3 pl-8 pr-4 text-sm transition focus:outline-none focus:ring-2 ${
              errors.instagram_handle
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
          />
        </div>
        {errors.instagram_handle && (
          <p className="text-xs text-red-600">{errors.instagram_handle}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Your Instagram username (without @)
        </p>
      </div>

      {/* Platform Instagram CTA */}
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <Instagram className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Follow TutorLingua on Instagram
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Get platform updates, tips, and connect with other tutors
            </p>
          </div>
          <a
            href="https://instagram.com/tutorlingua.co"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full shadow-sm px-4 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 transition"
          >
            Follow
          </a>
        </div>
      </div>

      {/* Skip Info */}
      {filledCount === 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>You can skip this step,</strong> but we recommend adding your Instagram.
            Profiles with social proof get 3x more bookings on average.
          </p>
        </div>
      )}

      {/* Success State */}
      {filledCount >= 1 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm text-green-900">
            <Check className="h-4 w-4 flex-shrink-0" />
            <p>
              <strong>Great!</strong> Students can now find and connect with you.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Complete Setup"
          )}
        </button>
      </div>
    </div>
  );
}
