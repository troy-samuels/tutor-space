"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Upload, Link as LinkIcon, FileText, X, Video, ChevronLeft, ChevronRight } from "lucide-react";
import {
  createDigitalProduct,
  type ProductFormState,
} from "@/lib/actions/marketplace";
import { SUPPORTED_LANGUAGES } from "@/lib/constants/student-settings";

const initialState: ProductFormState = {};

const PRODUCT_CATEGORIES = [
  { value: "worksheet", label: "Worksheet" },
  { value: "course", label: "Course / Lesson Pack" },
  { value: "template", label: "Template" },
  { value: "ebook", label: "eBook / Guide" },
  { value: "audio", label: "Audio / Podcast" },
  { value: "video", label: "Video" },
  { value: "other", label: "Other" },
] as const;

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all", label: "All Levels" },
] as const;

type DigitalProductFormProps = {
  onSuccess?: () => void;
};

export function DigitalProductForm({ onSuccess }: DigitalProductFormProps) {
  const [state, formAction, isPending] = useActionState(createDigitalProduct, initialState);
  const [step, setStep] = useState(1);
  const [contentType, setContentType] = useState<"file" | "link" | "video">("file");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [videoFileLabel, setVideoFileLabel] = useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (state.success) {
      setFileLabel(null);
      setFileSize(null);
      setVideoFileLabel(null);
      setVideoFileSize(null);
      setContentType("file");
      setTitle("");
      setPrice("");
      setCurrency("usd");
      setDescription("");
      setExternalUrl("");
      setStep(1);
      onSuccess?.();
    }
  }, [onSuccess, state.success]);

  const formatPricePreview = () => {
    const numeric = Number(price);
    if (!numeric || Number.isNaN(numeric)) return "$0.00";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(numeric);
    } catch {
      return `$${numeric.toFixed(2)}`;
    }
  };

  const fulfillmentValue =
    contentType === "file"
      ? "file"
      : contentType === "video"
        ? videoFileLabel ? "file" : "link"
        : "link";

  const canProceedStep1 = title.trim().length > 0 && price && Number(price) > 0;
  const canProceedStep2 = contentType && (
    (contentType === "file" && fileLabel) ||
    (contentType === "link" && externalUrl.trim()) ||
    (contentType === "video" && (videoFileLabel || externalUrl.trim()))
  );

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <form ref={formRef} action={formAction} className="flex h-full flex-col">
      {/* Status Messages */}
      {state.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      )}

      {/* Mini Preview Header */}
      <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/50">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-foreground">
            {title.trim() || "New Product"}
          </p>
          <p className="text-xs font-medium text-primary">{formatPricePreview()}</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`h-2 w-2 rounded-full transition-colors ${
              step >= s ? "bg-primary" : "bg-stone-200"
            }`}
          />
        ))}
      </div>

      {/* Hidden fields for form submission */}
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="price" value={price} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="fulfillment_type" value={fulfillmentValue} />
      {(contentType === "link" || contentType === "video") && (
        <input type="hidden" name="external_url" value={externalUrl} />
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. IELTS Speaking Guide"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Price
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="15"
                  className="flex-1 rounded-xl border border-border bg-white px-4 py-3 text-base font-medium placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What's included? Describe chapters, worksheets, or outcomes."
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Content Delivery */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                How will students receive this?
              </label>
              <div className="space-y-2">
                {[
                  { value: "file", label: "File Download", desc: "PDF, ZIP, or document", icon: Upload },
                  { value: "link", label: "External Link", desc: "Notion, Drive, or website", icon: LinkIcon },
                  { value: "video", label: "Video", desc: "YouTube, Vimeo, or upload", icon: Video },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition ${
                      contentType === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-stone-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="contentTypeRadio"
                      value={option.value}
                      checked={contentType === option.value}
                      onChange={() => setContentType(option.value as "file" | "link" | "video")}
                      className="sr-only"
                    />
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      contentType === option.value ? "bg-primary/10 text-primary" : "bg-stone-100 text-muted-foreground"
                    }`}>
                      <option.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      contentType === option.value ? "border-primary" : "border-stone-300"
                    }`}>
                      {contentType === option.value && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* File Upload Zone */}
            {contentType === "file" && (
              <div
                className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
                  isDragging ? "border-primary bg-primary/5" : "border-stone-200"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && fileInputRef.current) {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    fileInputRef.current.files = dt.files;
                    setFileLabel(file.name);
                    setFileSize(file.size);
                  }
                }}
              >
                {!fileLabel ? (
                  <div className="space-y-3">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drop your file here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary font-medium hover:underline"
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted-foreground/70">PDF, ZIP, DOC, PPT, MP3, MP4</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3 text-left">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{fileLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {fileSize ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.value = "";
                        setFileLabel(null);
                        setFileSize(null);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  name="file"
                  ref={fileInputRef}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setFileLabel(file?.name ?? null);
                    setFileSize(file?.size ?? null);
                  }}
                  accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.mov"
                />
              </div>
            )}

            {/* Link Input */}
            {contentType === "link" && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://notion.so/your-content"
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">Students will be redirected here after purchase.</p>
              </div>
            )}

            {/* Video Input */}
            {contentType === "video" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">YouTube, Vimeo, or Loom embed URL</p>
                </div>

                <div className="relative">
                  <div className="absolute inset-x-0 top-1/2 border-t border-stone-200" />
                  <p className="relative bg-white px-3 text-xs text-muted-foreground text-center w-fit mx-auto">or upload directly</p>
                </div>

                <div
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition ${
                    isDragging ? "border-primary bg-primary/5" : "border-stone-200"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && videoFileInputRef.current) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      videoFileInputRef.current.files = dt.files;
                      setVideoFileLabel(file.name);
                      setVideoFileSize(file.size);
                    }
                  }}
                >
                  {!videoFileLabel ? (
                    <div className="space-y-2">
                      <Video className="mx-auto h-6 w-6 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => videoFileInputRef.current?.click()}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        Choose video file
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3 text-left">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{videoFileLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {videoFileSize ? `${(videoFileSize / (1024 * 1024)).toFixed(1)} MB` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (videoFileInputRef.current) videoFileInputRef.current.value = "";
                          setVideoFileLabel(null);
                          setVideoFileSize(null);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    name="file"
                    ref={videoFileInputRef}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setVideoFileLabel(file?.name ?? null);
                      setVideoFileSize(file?.size ?? null);
                    }}
                    accept=".mp4,.mov,.mkv,.avi,.wmv"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Publish */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Help students discover your product with these optional details.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Category
              </label>
              <select
                name="category"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Language
              </label>
              <select
                name="language"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any language</option>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Level
              </label>
              <select
                name="level"
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PROFICIENCY_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-stone-50 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Product"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
