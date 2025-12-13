"use client";

import { useState, useTransition } from "react";
import { X, Upload, ImageIcon, Move } from "lucide-react";
import { usePageBuilderWizard } from "../wizard-context";
import { Input } from "@/components/ui/input";
import { uploadHeroImage } from "@/lib/actions/tutor-sites";
import { cn } from "@/lib/utils";

export function StepContent() {
  const { state, updateContent } = usePageBuilderWizard();
  const { content } = state;

  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [isHeroUploading, startHeroUpload] = useTransition();
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [isGalleryUploading, startGalleryUpload] = useTransition();
  const [reorderMode, setReorderMode] = useState(false);

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

  const moveGalleryImage = (from: number, to: number) => {
    if (to < 0 || to >= content.galleryImages.length) return;
    const next = [...content.galleryImages];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    updateContent({ galleryImages: next });
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

      {/* Background Image */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Background Image</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Banner image for your site header. Recommended: 1600×400px (4:1 ratio)
        </p>

        <div className="mt-3">
          {content.heroImageUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.heroImageUrl}
                alt="Background"
                className="h-20 w-full rounded-xl object-cover border border-border"
              />
              <button
                type="button"
                onClick={handleRemoveHeroImage}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
              >
                <X className="h-3 w-3" />
              </button>
              {isHeroUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 h-16 transition hover:border-primary/50 hover:bg-muted/40">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {isHeroUploading ? "Uploading..." : "Upload background"}
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
            <p className="mt-1.5 text-xs text-destructive">{heroUploadError}</p>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Photo Gallery</h3>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{content.galleryImages.length}/5</span>
            {content.galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setReorderMode((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 font-semibold text-primary transition hover:bg-primary/10"
              >
                <Move className="h-3 w-3" />
                {reorderMode ? "Done" : "Reorder"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {content.galleryImages.map((url, index) => (
            <div key={`${url}-${index}`} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className={cn(
                  "h-full w-full rounded-lg object-cover border border-border",
                  reorderMode ? "ring-2 ring-primary/60" : ""
                )}
              />
              <button
                type="button"
                onClick={() => handleRemoveGalleryImage(index)}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white"
              >
                <X className="h-2.5 w-2.5" />
              </button>
              {reorderMode && (
                <div className="absolute inset-0 flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, index - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-xs font-semibold text-muted-foreground shadow-sm hover:bg-white"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, index + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/85 text-xs font-semibold text-muted-foreground shadow-sm hover:bg-white"
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
          ))}

          {content.galleryImages.length < 5 && (
            <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border/50 bg-muted/20 hover:border-primary/50 hover:bg-muted/40 transition">
              {isGalleryUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
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
          <p className="mt-1.5 text-xs text-destructive">{galleryUploadError}</p>
        )}
      </div>

    </div>
  );
}
