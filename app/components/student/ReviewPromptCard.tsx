"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, Edit2 } from "lucide-react";
import type { TutorForReview } from "@/lib/actions/reviews";

type ReviewPromptCardProps = {
  tutor: TutorForReview;
  onReviewClick: (tutor: TutorForReview) => void;
};

export function ReviewPromptCard({ tutor, onReviewClick }: ReviewPromptCardProps) {
  return (
    <div className="flex min-w-[260px] flex-col gap-4 rounded-3xl border border-border/60 bg-background/90 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={tutor.tutorAvatarUrl || undefined} alt={tutor.tutorName} />
          <AvatarFallback className="bg-muted text-muted-foreground">
            {tutor.tutorName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{tutor.tutorName}</p>
          <p className="text-xs text-muted-foreground">
            {tutor.completedLessonsCount} lesson{tutor.completedLessonsCount !== 1 ? "s" : ""} completed
          </p>
        </div>
      </div>

      {tutor.hasExistingReview && tutor.existingReview ? (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= tutor.existingReview!.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">Your rating</span>
        </div>
      ) : null}

      <Button
        onClick={() => onReviewClick(tutor)}
        variant={tutor.hasExistingReview ? "outline" : "default"}
        size="sm"
        className="w-full"
      >
        {tutor.hasExistingReview ? (
          <>
            <Edit2 className="mr-2 h-4 w-4" />
            Update review
          </>
        ) : (
          <>
            <Star className="mr-2 h-4 w-4" />
            Leave a review
          </>
        )}
      </Button>
    </div>
  );
}
