"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

type PostLessonReviewPromptProps = {
  tutorId: string;
  tutorName: string;
  /** Called when user clicks to leave a review */
  onReview: () => void;
  /** Called when user dismisses the prompt */
  onDismiss: () => void;
  /** Whether the student already has a review for this tutor */
  hasExistingReview?: boolean;
};

const DISMISS_COOLDOWN_DAYS = 7;

/**
 * Post-lesson review prompt that appears after a lesson ends.
 * Uses localStorage to track dismissals and apply a 7-day cooldown.
 */
export function PostLessonReviewPrompt({
  tutorId,
  tutorName,
  onReview,
  onDismiss,
  hasExistingReview = false,
}: PostLessonReviewPromptProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check localStorage for recent dismissal
    const dismissKey = `review_dismiss_${tutorId}`;
    const dismissedAt = localStorage.getItem(dismissKey);

    if (dismissedAt) {
      const daysSince =
        (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSince < DISMISS_COOLDOWN_DAYS) {
        // Still within cooldown period, don't show
        return;
      }
    }

    // If student already has a review, check for a different cooldown
    // (less frequent prompts for update)
    if (hasExistingReview) {
      const updatePromptKey = `review_update_prompt_${tutorId}`;
      const lastPromptAt = localStorage.getItem(updatePromptKey);
      if (lastPromptAt) {
        const daysSince =
          (Date.now() - parseInt(lastPromptAt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          // Only prompt for updates once every 30 days
          return;
        }
      }
      // Update the last prompt timestamp
      localStorage.setItem(updatePromptKey, Date.now().toString());
    }

    // Show prompt after a short delay (2 seconds)
    const timer = setTimeout(() => setIsOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [tutorId, hasExistingReview]);

  const handleDismiss = () => {
    // Record dismissal in localStorage
    localStorage.setItem(`review_dismiss_${tutorId}`, Date.now().toString());
    setIsOpen(false);
    onDismiss();
  };

  const handleReview = () => {
    setIsOpen(false);
    onReview();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {hasExistingReview
              ? "How was your lesson?"
              : "How was your lesson?"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="text-center">
          <div className="mb-4 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-8 w-8 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
          <p className="text-muted-foreground">
            {hasExistingReview
              ? `Would you like to update your review for ${tutorName}?`
              : `Share your experience with ${tutorName} to help other students`}
          </p>
        </DialogBody>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto">
            Maybe later
          </Button>
          <Button onClick={handleReview} className="w-full sm:w-auto">
            <Star className="mr-2 h-4 w-4" />
            {hasExistingReview ? "Update review" : "Leave review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
