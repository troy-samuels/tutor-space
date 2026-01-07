"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Loader2,
  Trash2,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  uploadStudentAvatar,
  deleteStudentAvatar,
} from "@/lib/actions/student-avatar";

interface StudentAvatarUploadProps {
  currentAvatarUrl: string | null;
  studentName?: string | null;
}

export function StudentAvatarUpload({
  currentAvatarUrl,
  studentName,
}: StudentAvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadStudentAvatar(formData);

    if (result.success && result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      setSuccess("Profile photo updated!");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to upload photo");
    }

    setIsUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    const result = await deleteStudentAvatar();

    if (result.success) {
      setAvatarUrl(null);
      setSuccess("Profile photo removed");
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Failed to remove photo");
    }

    setIsDeleting(false);
  };

  const getInitials = (name: string | null | undefined): string => {
    const trimmed = name?.trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4">
      <Label>Profile Photo</Label>

      <div className="flex items-center gap-6">
        {/* Avatar Preview */}
        <div className="relative">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-muted flex items-center justify-center border-2 border-border">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile photo"
                width={96}
                height={96}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary text-2xl font-semibold">
                {studentName ? getInitials(studentName) : <User className="h-10 w-10" />}
              </div>
            )}
          </div>

          {/* Upload overlay */}
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading || isDeleting}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
          >
            <Camera className="mr-2 h-4 w-4" />
            {avatarUrl ? "Change Photo" : "Upload Photo"}
          </Button>

          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading || isDeleting}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-1">
            JPEG, PNG, WebP or GIF. Max 5MB.
          </p>
        </div>
      </div>

      {/* Status messages */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
