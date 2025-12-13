"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Mic, Paperclip, X, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "./AudioRecorder";
import { submitHomework, uploadSubmissionFile, type SubmissionFile } from "@/lib/actions/homework-submissions";

type HomeworkSubmissionFormProps = {
  homeworkId: string;
  homeworkTitle: string;
  onSubmitted: () => void;
  onCancel?: () => void;
};

export function HomeworkSubmissionForm({
  homeworkId,
  homeworkTitle,
  onSubmitted,
  onCancel,
}: HomeworkSubmissionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [textResponse, setTextResponse] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAudioComplete = (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);
  };

  const handleRemoveAudio = () => {
    setAudioBlob(null);
    setAudioDuration(0);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles?.length) return;

    for (const file of Array.from(selectedFiles)) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError(`File "${file.name}" is too large. Maximum size is 50MB.`);
        continue;
      }

      setUploadingFiles((prev) => [...prev, file.name]);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadSubmissionFile(formData);

        if (result.error) {
          setError(result.error);
        } else if (result.url) {
          const fileUrl = result.url; // Capture to avoid null in closure
          setFiles((prev) => [
            ...prev,
            {
              name: file.name,
              url: fileUrl,
              type: file.type,
              size: file.size,
            },
          ]);
        }
      } catch {
        setError(`Failed to upload "${file.name}"`);
      } finally {
        setUploadingFiles((prev) => prev.filter((name) => name !== file.name));
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setError(null);

    // Must have at least some content
    if (!textResponse.trim() && !audioBlob && files.length === 0) {
      setError("Please add a response, recording, or file before submitting");
      return;
    }

    startTransition(async () => {
      try {
        // If there's an audio blob, upload it first
        let audioUrl: string | undefined;
        if (audioBlob) {
          const formData = new FormData();
          const ext = audioBlob.type.includes("webm") ? "webm" : "mp4";
          formData.append("file", audioBlob, `recording.${ext}`);

          const uploadResult = await uploadSubmissionFile(formData);
          if (uploadResult.error) {
            setError(uploadResult.error);
            return;
          }
          audioUrl = uploadResult.url || undefined;
        }

        const result = await submitHomework({
          homeworkId,
          textResponse: textResponse.trim() || undefined,
          audioUrl,
          fileAttachments: files.length > 0 ? files : undefined,
        });

        if (result.error) {
          setError(result.error);
        } else {
          setIsSuccess(true);
          setTimeout(() => {
            onSubmitted();
          }, 1500);
        }
      } catch {
        setError("Failed to submit homework. Please try again.");
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Homework Submitted!
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your tutor will review your submission soon.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Submit Response</h3>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {homeworkTitle}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Text response */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          Written Response
        </label>
        <textarea
          value={textResponse}
          onChange={(e) => setTextResponse(e.target.value)}
          placeholder="Write your response here..."
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {/* Audio recording */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mic className="h-3.5 w-3.5" />
          Audio Recording
        </label>
        {audioBlob ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-sm text-foreground">
              Recording ({Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, "0")})
            </span>
            <button
              type="button"
              onClick={handleRemoveAudio}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <AudioRecorder
            onRecordingComplete={handleAudioComplete}
            maxDurationSeconds={300}
          />
        )}
      </div>

      {/* File attachments */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />
          File Attachments
        </label>

        {/* File list */}
        <AnimatePresence>
          {files.map((file, index) => (
            <motion.div
              key={file.url}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Uploading files */}
        {uploadingFiles.map((name) => (
          <div
            key={name}
            className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Uploading {name}...</span>
          </div>
        ))}

        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.txt"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFiles.length > 0}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Add Files
        </Button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit button */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={isPending || uploadingFiles.length > 0}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Homework"
          )}
        </Button>
      </div>
    </div>
  );
}
