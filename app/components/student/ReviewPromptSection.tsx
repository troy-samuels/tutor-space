"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ReviewPromptCard } from "./ReviewPromptCard";
import { ReviewModal } from "./ReviewModal";
import type { TutorForReview } from "@/lib/actions/reviews";

type ReviewPromptSectionProps = {
  tutors: TutorForReview[];
};

export function ReviewPromptSection({ tutors }: ReviewPromptSectionProps) {
  const [selectedTutor, setSelectedTutor] = useState<TutorForReview | null>(null);

  if (tutors.length === 0) return null;

  // Separate tutors without reviews (show first) from those with reviews
  const tutorsWithoutReview = tutors.filter((t) => !t.hasExistingReview);
  const tutorsWithReview = tutors.filter((t) => t.hasExistingReview);
  const sortedTutors = [...tutorsWithoutReview, ...tutorsWithReview];

  return (
    <>
      <div className="rounded-3xl border border-border/60 bg-background/90 p-6 shadow-sm backdrop-blur">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <div>
            <h3 className="font-semibold text-foreground">Share Your Experience</h3>
            <p className="text-sm text-muted-foreground">
              Help other students by reviewing your tutors
            </p>
          </div>
        </div>

        <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
          {sortedTutors.map((tutor) => (
            <ReviewPromptCard
              key={tutor.tutorId}
              tutor={tutor}
              onReviewClick={setSelectedTutor}
            />
          ))}
        </div>
      </div>

      {selectedTutor && (
        <ReviewModal
          tutor={selectedTutor}
          isOpen={!!selectedTutor}
          onClose={() => setSelectedTutor(null)}
        />
      )}
    </>
  );
}
