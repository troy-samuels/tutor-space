"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { useProfileWizard } from "@/lib/contexts/profile-wizard-context";

type ProfessionalProfileData = {
  bio: string;
  tagline: string;
  avatar?: File;
  avatar_url?: string;
  languages_taught: string;
};

type Step2Props = {
  onNext: () => void;
  onBack: () => void;
  initialValues?: Partial<ProfessionalProfileData>;
  onSave?: (data: ProfessionalProfileData) => void;
};

const EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner (0-2 years)" },
  { value: "intermediate", label: "Intermediate (3-5 years)" },
  { value: "experienced", label: "Experienced (6-10 years)" },
  { value: "expert", label: "Expert (10+ years)" },
];

const SAMPLE_BIOS = [
  "Passionate about helping students discover the joy of language learning through personalized, engaging lessons.",
  "Native speaker with 10+ years of teaching experience. I specialize in conversational fluency and cultural immersion.",
  "Certified language educator dedicated to making learning fun and effective for students of all ages.",
];

export function Step2Professional({
  onNext,
  onBack,
  initialValues,
  onSave,
}: Step2Props) {
  const wizard = useProfileWizard();
  const [formData, setFormData] = useState<ProfessionalProfileData>({
    bio: initialValues?.bio || wizard.state.step2.bio || "",
    tagline: initialValues?.tagline || wizard.state.step2.tagline || "",
    avatar_url: initialValues?.avatar_url || wizard.state.step2.avatar_url || "",
    languages_taught: initialValues?.languages_taught || wizard.state.step2.languages_taught || "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string>(
    initialValues?.avatar_url || wizard.state.step2.avatar_url || ""
  );
  const [bioCount, setBioCount] = useState(initialValues?.bio?.length || wizard.state.step2.bio?.length || 0);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ProfessionalProfileData, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(wizard.state.avatarFile);

  const handleChange = (
    field: keyof ProfessionalProfileData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (field === "bio") {
      setBioCount(value.length);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        avatar_url: "Image must be smaller than 5MB",
      }));
      return;
    }

    // Validate file type
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        avatar_url: "Image must be PNG, JPEG, or WebP",
      }));
      return;
    }

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setAvatarFile(file);
    setErrors((prev) => ({ ...prev, avatar_url: undefined }));
  };

  const useSampleBio = (bio: string) => {
    handleChange("bio", bio);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfessionalProfileData, string>> =
      {};

    if (!formData.bio.trim()) {
      newErrors.bio = "Bio is required";
    } else if (formData.bio.length < 50) {
      newErrors.bio = "Bio should be at least 50 characters";
    } else if (formData.bio.length > 500) {
      newErrors.bio = "Bio should be less than 500 characters";
    }

    if (!formData.tagline.trim()) {
      newErrors.tagline = "Tagline is required";
    } else if (formData.tagline.length < 10) {
      newErrors.tagline = "Tagline should be at least 10 characters";
    } else if (formData.tagline.length > 100) {
      newErrors.tagline = "Tagline should be less than 100 characters";
    }

    if (!formData.languages_taught.trim()) {
      newErrors.languages_taught = "Please specify languages you teach";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Update wizard context
    wizard.updateStep2(formData);
    if (avatarFile) {
      wizard.setAvatarFile(avatarFile);
    }

    // Save to database
    setIsSaving(true);
    const result = await wizard.saveProgress();
    setIsSaving(false);

    if (result.success) {
      // Update avatar URL if it was uploaded
      if (result.avatarUrl) {
        setFormData((prev) => ({ ...prev, avatar_url: result.avatarUrl }));
        setAvatarPreview(result.avatarUrl);
      }
      // Call optional onSave callback
      onSave?.(formData);
      // Move to next step
      onNext();
    } else {
      // Show error
      setErrors((prev) => ({
        ...prev,
        bio: result.error || "Failed to save. Please try again.",
      }));
    }
  };

  const getInitials = () => {
    return "T";
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Profile Photo
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a professional headshot (recommended: 400×400px minimum)
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative h-32 w-32 overflow-hidden rounded-3xl border-2 border-brand-brown/20 bg-brand-cream">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Profile preview"
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-brand-brown">
                {getInitials()}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Use a bright, welcoming headshot. Square images look best on your
              profile.
            </p>
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-brand-brown px-5 py-2.5 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90">
              <Upload className="h-4 w-4" />
              <span>{avatarPreview ? "Replace photo" : "Upload photo"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
            {errors.avatar_url && (
              <p className="text-xs text-red-600">{errors.avatar_url}</p>
            )}
          </div>
        </div>
      </div>

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
          placeholder="e.g., Native Spanish speaker with 10+ years experience"
          maxLength={100}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.tagline
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-brand-brown focus:ring-brand-brown/20"
          }`}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            A short, catchy description that appears below your name
          </p>
          <span className="text-xs text-muted-foreground">
            {formData.tagline.length}/100
          </span>
        </div>
        {errors.tagline && (
          <p className="text-xs text-red-600">{errors.tagline}</p>
        )}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium text-foreground">
          About You <span className="text-red-500">*</span>
        </label>
        <textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
          placeholder="Tell students about your teaching style, experience, and what makes your lessons unique..."
          rows={5}
          maxLength={500}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.bio
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-brand-brown focus:ring-brand-brown/20"
          }`}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Describe your teaching approach and experience (50-500 characters)
          </p>
          <span
            className={`text-xs ${
              bioCount < 50
                ? "text-amber-600"
                : bioCount > 500
                ? "text-red-600"
                : "text-muted-foreground"
            }`}
          >
            {bioCount}/500
          </span>
        </div>
        {errors.bio && <p className="text-xs text-red-600">{errors.bio}</p>}

        {/* Sample Bios */}
        {!formData.bio && (
          <div className="rounded-xl border border-brand-brown/20 bg-brand-cream/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-brown">
              <Sparkles className="h-4 w-4" />
              <span>Need inspiration? Try these examples:</span>
            </div>
            <div className="space-y-2">
              {SAMPLE_BIOS.map((bio, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => useSampleBio(bio)}
                  className="block w-full rounded-lg bg-white p-3 text-left text-xs text-muted-foreground transition hover:bg-brand-brown/5 hover:text-foreground"
                >
                  {bio}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Languages Taught */}
      <div className="space-y-2">
        <label
          htmlFor="languages_taught"
          className="block text-sm font-medium text-foreground"
        >
          Languages You Teach <span className="text-red-500">*</span>
        </label>
        <input
          id="languages_taught"
          type="text"
          value={formData.languages_taught}
          onChange={(e) => handleChange("languages_taught", e.target.value)}
          placeholder="e.g., Spanish, French"
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm transition focus:outline-none focus:ring-2 ${
            errors.languages_taught
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-300 focus:border-brand-brown focus:ring-brand-brown/20"
          }`}
        />
        {errors.languages_taught && (
          <p className="text-xs text-red-600">{errors.languages_taught}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Separate multiple languages with commas
        </p>
      </div>

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
