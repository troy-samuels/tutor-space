"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Camera, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AvatarSectionProps = {
  avatarUrl: string | null;
  fullName: string;
  onAvatarChange: (url: string) => void;
};

export function AvatarSection({
  avatarUrl,
  fullName,
  onAvatarChange,
}: AvatarSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate initials from full name
  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(fullName || "TU");
  const displayUrl = previewUrl || avatarUrl;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    // Show preview immediately
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

      onAvatarChange(result.url);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    onAvatarChange("");
    setPreviewUrl(null);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <div className="relative">
        <div
          className={cn(
            "relative h-28 w-28 overflow-hidden rounded-full",
            isUploading && "opacity-60"
          )}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={fullName || "Profile photo"}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-3xl font-semibold text-primary-foreground">
              {initials}
            </div>
          )}

          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        {/* Remove button (only if there's an avatar) */}
        {displayUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-transform hover:scale-110"
            title="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Upload button */}
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-full"
        >
          {displayUrl ? (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Change Photo
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          JPG, PNG, or WebP (max 5MB)
        </p>

        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
