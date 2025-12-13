"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Upload, Link as LinkIcon, MousePointerClick, FileText, X, Video } from "lucide-react";
import {
  createDigitalProduct,
  type ProductFormState,
} from "@/lib/actions/digital-products";
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
  const [contentType, setContentType] = useState<"file" | "link" | "video">("file");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [videoFileLabel, setVideoFileLabel] = useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

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

  return (
    <form action={formAction} className="flex h-full flex-col gap-5">
      {state.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="rounded-2xl border border-border/70 bg-white/90 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Live preview</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-16 w-12 items-center justify-center rounded-lg bg-stone-100 text-muted-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-lg font-semibold tracking-tight text-foreground">
                {title.trim() || "Product Name"}
              </p>
              <p className="text-sm font-semibold text-primary">{formatPricePreview()}</p>
              <p className="text-xs text-muted-foreground">Instant download after purchase</p>
            </div>
          </div>
        </div>

        <input
          name="title"
          required
          placeholder="Product Name (e.g. IELTS Guide)"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full border-none bg-transparent p-0 text-2xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
        />
        <div className="flex items-center gap-2">
          <div className="w-full space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price ($)</label>
            <input
              type="number"
              name="price"
              min="1"
              step="0.5"
              required
              placeholder="15"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full border-none bg-transparent text-xl font-medium text-primary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0"
            />
          </div>
          <select
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="rounded-full border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="usd">USD</option>
            <option value="eur">EUR</option>
            <option value="gbp">GBP</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">What&apos;s inside?</label>
        <textarea
          name="description"
          rows={5}
          className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Describe the chapters, worksheets, and outcomes."
        />
      </div>

      <div className="space-y-2">
        <div className="rounded-xl border-2 border-dashed border-stone-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Content</p>
              <p className="text-xs text-muted-foreground">Pick how students will receive this product.</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-muted/60 px-1 py-0.5 text-[11px] font-semibold text-muted-foreground">
              <button
                type="button"
                onClick={() => setContentType("file")}
                className={`rounded-full px-2 py-1 transition ${contentType === "file" ? "bg-white text-foreground shadow-sm" : ""}`}
              >
                File Download
              </button>
              <button
                type="button"
                onClick={() => setContentType("link")}
                className={`rounded-full px-2 py-1 transition ${contentType === "link" ? "bg-white text-foreground shadow-sm" : ""}`}
              >
                Link / URL
              </button>
              <button
                type="button"
                onClick={() => setContentType("video")}
                className={`rounded-full px-2 py-1 transition ${contentType === "video" ? "bg-white text-foreground shadow-sm" : ""}`}
              >
                Video
              </button>
            </div>
          </div>
          <input type="hidden" name="fulfillment_type" value={fulfillmentValue} />
          {contentType === "file" ? (
            <div
              className={`mt-4 flex flex-col gap-3 rounded-xl border-2 border-dashed p-6 text-center transition ${
                isDragging ? "border-orange-500 bg-orange-50/40" : "border-stone-200"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                const file = event.dataTransfer.files?.[0];
                if (file) {
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  if (fileInputRef.current) {
                    fileInputRef.current.files = dataTransfer.files;
                  }
                  setFileLabel(file.name);
                  setFileSize(file.size);
                }
              }}
            >
              {!fileLabel ? (
                <>
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <p className="text-sm font-semibold text-foreground">Upload File</p>
                    <p className="text-xs">Drop your PDF or ZIP here, or click to browse.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Choose file
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3 text-left text-sm">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{fileLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        {fileSize ? `${(fileSize / (1024 * 1024)).toFixed(1)} MB` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground transition hover:text-destructive"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                      setFileLabel(null);
                      setFileSize(null);
                    }}
                    aria-label="Remove file"
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
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setFileLabel(file ? file.name : null);
                  setFileSize(file ? file.size : null);
                }}
                accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.mov"
              />
            </div>
          ) : contentType === "link" ? (
            <div className="mt-4 space-y-2 rounded-xl border border-dashed border-stone-200 p-4">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <LinkIcon className="mt-0.5 h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-foreground">Resource URL (Notion, Quizlet, Drive)</p>
                  <input
                    type="url"
                    name="external_url"
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Students will be redirected here after purchase.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3 rounded-xl border border-dashed border-stone-200 p-4">
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <Video className="mt-0.5 h-4 w-4" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold text-foreground">Embed URL (YouTube, Vimeo, Loom)</p>
                  <input
                    type="url"
                    name="external_url"
                    placeholder="https://youtu.be/..."
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground">Or upload the video directly:</p>
                </div>
              </div>
              <div
                className={`flex flex-col gap-3 rounded-xl border-2 border-dashed p-4 text-center transition ${
                  isDragging ? "border-orange-500 bg-orange-50/40" : "border-stone-200"
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const file = event.dataTransfer.files?.[0];
                  if (file) {
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    if (videoFileInputRef.current) {
                      videoFileInputRef.current.files = dataTransfer.files;
                    }
                    setVideoFileLabel(file.name);
                    setVideoFileSize(file.size);
                  }
                }}
              >
                {!videoFileLabel ? (
                  <>
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6" />
                      <p className="text-sm font-semibold text-foreground">Upload Video</p>
                      <p className="text-xs">Drop MP4 or MOV here, or click to browse.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      className="inline-flex items-center justify-center rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      Choose video
                    </button>
                  </>
                ) : (
                  <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3 text-left text-sm">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-foreground">{videoFileLabel}</p>
                        <p className="text-xs text-muted-foreground">
                          {videoFileSize ? `${(videoFileSize / (1024 * 1024)).toFixed(1)} MB` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground transition hover:text-destructive"
                      onClick={() => {
                        if (videoFileInputRef.current) {
                          videoFileInputRef.current.value = "";
                        }
                        setVideoFileLabel(null);
                        setVideoFileSize(null);
                      }}
                      aria-label="Remove video"
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
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setVideoFileLabel(file ? file.name : null);
                    setVideoFileSize(file ? file.size : null);
                  }}
                  accept=".mp4,.mov,.mkv,.avi,.wmv"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
          <select
            name="category"
            className="w-full rounded-full border border-border/40 bg-transparent px-3 py-2 text-xs font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Language</label>
          <select
            name="language"
            className="w-full rounded-full border border-border/40 bg-transparent px-3 py-2 text-xs font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Any</option>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Level</label>
          <select
            name="level"
            className="w-full rounded-full border border-border/40 bg-transparent px-3 py-2 text-xs font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {PROFICIENCY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5" />
          Publish instantly to your product page after saving.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white shadow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish Product"}
        </button>
      </div>
    </form>
  );
}
