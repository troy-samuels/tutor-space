"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitTutorSiteReview } from "@/lib/actions/reviews";
import type { SubmitReviewState, ExistingReview } from "@/lib/actions/types";
import { cn } from "@/lib/utils";

export type StudentReviewFormProps = {
  tutorId: string;
  tutorSiteId: string;
  tutorUsername: string;
  tutorName: string;
  isLoggedIn: boolean;
  canSubmit: boolean;
  defaultDisplayName?: string | null;
  onSubmitted?: (review: { author: string; quote: string; rating?: number | null }) => void;
  /** If provided, form operates in edit mode with pre-populated values */
  existingReview?: ExistingReview;
  /** Optional: render as compact form without outer card styling */
  compact?: boolean;
};

const initialState: SubmitReviewState = { status: "idle" };

export function StudentReviewForm({
  tutorId,
  tutorSiteId,
  tutorUsername,
  tutorName,
  isLoggedIn,
  canSubmit,
  defaultDisplayName,
  onSubmitted,
  existingReview,
  compact = false,
}: StudentReviewFormProps) {
  const [state, formAction] = useFormState(submitTutorSiteReview, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const isEditMode = !!existingReview;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      if (state.review && onSubmitted) {
        onSubmitted(state.review);
      }
    }
  }, [state, onSubmitted]);

  const disabled = !isLoggedIn || !canSubmit || state.status === "success";

  // Use existing review's display name if in edit mode
  const displayNameDefault = existingReview?.displayName ?? defaultDisplayName ?? "";

  const formContent = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {isEditMode ? `Update your review for ${tutorName}` : `Share your experience with ${tutorName}`}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? "You can update your review at any time."
              : "Your review helps other students decide if this tutor is right for them."}
          </p>
        </div>
        {state.status === "success" ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {isEditMode ? "Review updated!" : "Thanks for your review!"}
          </span>
        ) : null}
      </div>

      {!isLoggedIn ? (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Log in to leave a review for {tutorName}.
          </div>
          <Link
            href={`/login?redirect=/${tutorUsername}`}
            className="text-sm font-semibold text-primary underline"
          >
            Log in
          </Link>
        </div>
      ) : null}

      {isLoggedIn && !canSubmit ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You can only review tutors you learn with. Complete at least one lesson with this tutor (and make sure your student account is approved) to unlock reviews.
        </div>
      ) : null}

      <form
        ref={formRef}
        action={formAction}
        className="mt-4 space-y-4"
      >
        <input type="hidden" name="tutorId" value={tutorId} />
        <input type="hidden" name="tutorSiteId" value={tutorSiteId} />
        <input type="hidden" name="tutorUsername" value={tutorUsername} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Your name</label>
            <Input
              name="displayName"
              placeholder="How you'd like your name to appear"
              defaultValue={displayNameDefault}
              disabled={disabled}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Rating</label>
            <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3 py-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <label
                  key={value}
                  className={cn(
                    "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
                    disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/80"
                  )}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    defaultChecked={existingReview ? value === existingReview.rating : value === 5}
                    className="sr-only"
                    disabled={disabled}
                  />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {value}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Title (optional)</label>
          <Input
            name="title"
            placeholder="What changed after lessons?"
            defaultValue={existingReview?.title ?? ""}
            disabled={disabled}
            maxLength={120}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground">Your review</label>
          <textarea
            name="body"
            minLength={20}
            maxLength={800}
            placeholder="Share what you worked on, what improved, and who this tutor is best for."
            className="mt-1 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            rows={5}
            disabled={disabled}
            defaultValue={existingReview?.body ?? ""}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">200-300 characters usually works best.</p>
        </div>

        {state.message ? (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm",
              state.status === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border border-red-200 bg-red-50 text-red-900"
            )}
          >
            {state.message}
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={disabled}>
            {state.status === "success"
              ? isEditMode
                ? "Updated"
                : "Submitted"
              : isEditMode
                ? "Update review"
                : "Submit review"}
          </Button>
          <p className="text-xs text-muted-foreground">
            {isEditMode
              ? "Your updated review will appear on the tutor's site."
              : "Reviews are added to the tutor's mini-site once submitted."}
          </p>
        </div>
      </form>
    </>
  );

  // Compact mode: render without outer card wrapper
  if (compact) {
    return <div className="space-y-4">{formContent}</div>;
  }

  // Default: render with card wrapper
  return (
    <div className="mt-8 rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
      {formContent}
    </div>
  );
}
