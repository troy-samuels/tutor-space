"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2, Upload, X, ImageIcon, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard } from "../wizard-context";
import { uploadHeroImage } from "@/lib/actions/tutor-sites";

type StepProfileProps = {
  fullName: string;
};

export function StepProfile({ fullName }: StepProfileProps) {
  const { state, updateAvatar, updateContent } = usePageBuilderWizard();
  const { avatarUrl, content } = state;

  // Avatar upload state
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gallery upload state
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [isGalleryUploading, startGalleryUpload] = useTransition();
  const [reorderMode, setReorderMode] = useState(false);

  // Avatar helpers
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(fullName || "TU");
  const displayUrl = previewUrl || avatarUrl;

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setAvatarError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be smaller than 5MB");
      return;
    }

    setAvatarError(null);
    setIsUploading(true);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      updateAvatar(result.url);
      setPreviewUrl(null);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to upload image");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    updateAvatar("");
    setPreviewUrl(null);
  };

  // Gallery handlers
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
    const newImages: string[] = [];

    startGalleryUpload(async () => {
      for (let i = 0; i < Math.min(files.length, maxAllowed); i++) {
        const file = files[i];
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const result = await uploadHeroImage(file);
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

  return (
    <div className="space-y-6">
      {/* Photo Upload */}
      <div className="flex items-start gap-5">
        <div className="relative">
          <div
            className={cn(
              "relative h-20 w-20 overflow-hidden rounded-full",
              isUploading && "opacity-60"
            )}
          >
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt={fullName || "Profile photo"}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary text-2xl font-semibold text-primary-foreground">
                {initials}
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>

          {displayUrl && !isUploading && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {displayUrl ? (
              <>
                <Camera className="mr-1.5 h-3.5 w-3.5" />
                Change
              </>
            ) : (
              <>
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload Photo
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP (max 5MB)</p>
          {avatarError && <p className="text-xs text-destructive">{avatarError}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleAvatarSelect}
          className="hidden"
        />
      </div>

      {/* Name & Tagline */}
      <div className="space-y-3">
        <Input
          value={content.title}
          onChange={(e) => updateContent({ title: e.target.value })}
          placeholder="Your name"
          className="text-base font-medium"
        />
        <Input
          value={content.subtitle}
          onChange={(e) => updateContent({ subtitle: e.target.value })}
          placeholder="What you teach (e.g., Spanish Tutor - Conversational Focus)"
        />
      </div>

      {/* About */}
      <div>
        <textarea
          rows={4}
          value={content.body}
          onChange={(e) => updateContent({ body: e.target.value })}
          placeholder="Tell students about yourself and your teaching approach..."
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {content.body.length} / 5,000
        </p>
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">
            Gallery ({content.galleryImages.length}/5)
          </p>
          {content.galleryImages.length > 1 && (
            <button
              type="button"
              onClick={() => setReorderMode((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/10"
            >
              <Move className="h-3.5 w-3.5" />
              {reorderMode ? "Done" : "Reorder"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {content.galleryImages.map((url, index) => (
            <div key={`${url}-${index}`} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Gallery ${index + 1}`}
                className={cn(
                  "h-full w-full rounded-lg object-cover border border-border/50",
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
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-muted-foreground shadow-sm hover:bg-white"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGalleryImage(index, index + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80 text-xs font-semibold text-muted-foreground shadow-sm hover:bg-white"
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
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
          <p className="mt-1 text-xs text-destructive">{galleryUploadError}</p>
        )}
      </div>
    </div>
  );
}
