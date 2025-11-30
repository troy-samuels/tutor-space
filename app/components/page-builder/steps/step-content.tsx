"use client";

import { useState, useTransition } from "react";
import { X, Upload, ImageIcon } from "lucide-react";
import { usePageBuilderWizard } from "../wizard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadHeroImage } from "@/lib/actions/tutor-sites";

export function StepContent() {
  const { state, updateContent, nextStep, prevStep } = usePageBuilderWizard();
  const { content } = state;

  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [isHeroUploading, startHeroUpload] = useTransition();
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [isGalleryUploading, startGalleryUpload] = useTransition();

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setHeroUploadError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setHeroUploadError("Image must be smaller than 5MB");
      return;
    }

    setHeroUploadError(null);

    // Create object URL for immediate preview
    const objectUrl = URL.createObjectURL(file);
    updateContent({ heroImageUrl: objectUrl });

    // Upload to storage
    startHeroUpload(async () => {
      const result = await uploadHeroImage(file);
      if ("error" in result) {
        setHeroUploadError(result.error || "Failed to upload image");
        updateContent({ heroImageUrl: null });
      } else if (result.url) {
        updateContent({ heroImageUrl: result.url });
      }
    });
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentCount = content.galleryImages.length;
    const maxAllowed = 5 - currentCount;

    if (files.length > maxAllowed) {
      setGalleryUploadError(`You can only add ${maxAllowed} more image(s)`);
      return;
    }

    setGalleryUploadError(null);

    // Process each file
    const newImages: string[] = [];

    startGalleryUpload(async () => {
      for (let i = 0; i < Math.min(files.length, maxAllowed); i++) {
        const file = files[i];

        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const result = await uploadHeroImage(file); // Reuse the upload function
        if ("url" in result && result.url) {
          newImages.push(result.url);
        }
      }

      if (newImages.length > 0) {
        updateContent({
          galleryImages: [...content.galleryImages, ...newImages],
        });
      }
    });
  };

  const handleRemoveGalleryImage = (index: number) => {
    const newImages = content.galleryImages.filter((_, i) => i !== index);
    updateContent({ galleryImages: newImages });
  };

  const handleRemoveHeroImage = () => {
    updateContent({ heroImageUrl: null });
  };

  return (
    <div className="space-y-8">
      {/* Profile Headline */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Profile Headline</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your name and tagline that appears at the top
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Title
            </label>
            <Input
              value={content.title}
              onChange={(e) => updateContent({ title: e.target.value })}
              placeholder="Your name or business name"
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Tagline
            </label>
            <Input
              value={content.subtitle}
              onChange={(e) => updateContent({ subtitle: e.target.value })}
              placeholder="What you teach or your specialty"
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">About You</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell students about yourself and your teaching approach
        </p>

        <div className="mt-4">
          <textarea
            rows={5}
            value={content.body}
            onChange={(e) => updateContent({ body: e.target.value })}
            placeholder="Tell students about your teaching approach, experience, and what makes your lessons special..."
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-relaxed shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="mt-1 text-right text-xs text-muted-foreground">
            {content.body.length} / 5,000 characters
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Hero Image</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          A main photo that represents you or your teaching
        </p>

        <div className="mt-4">
          {content.heroImageUrl ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.heroImageUrl}
                alt="Hero"
                className="h-32 w-32 rounded-2xl object-cover border border-border"
              />
              <button
                type="button"
                onClick={handleRemoveHeroImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
              >
                <X className="h-4 w-4" />
              </button>
              {isHeroUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/30 p-8 transition hover:border-primary/50 hover:bg-muted/50">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium text-muted-foreground">
                {isHeroUploading ? "Uploading..." : "Click to upload hero image"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or WebP (max 5MB)
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleHeroFileChange}
                disabled={isHeroUploading}
                className="hidden"
              />
            </label>
          )}
          {heroUploadError && (
            <p className="mt-2 text-sm text-destructive">{heroUploadError}</p>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Photo Gallery</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Add up to 5 photos to showcase your teaching environment or materials
        </p>

        <div className="mt-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {/* Existing gallery images */}
            {content.galleryImages.map((url, index) => (
              <div key={`${url}-${index}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Gallery ${index + 1}`}
                  className="h-24 w-full rounded-xl object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryImage(index)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {/* Upload button (if less than 5 images) */}
            {content.galleryImages.length < 5 && (
              <label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/30 transition hover:border-primary/50 hover:bg-muted/50">
                {isGalleryUploading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="mt-1 text-xs text-muted-foreground">Add</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleGalleryFileChange}
                  disabled={isGalleryUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {galleryUploadError && (
            <p className="mt-2 text-sm text-destructive">{galleryUploadError}</p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            {content.galleryImages.length} of 5 photos added
          </p>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button onClick={prevStep} variant="outline" size="lg" className="rounded-full px-6">
          Back
        </Button>
        <Button onClick={nextStep} size="lg" className="rounded-full px-8">
          Continue
        </Button>
      </div>
    </div>
  );
}
