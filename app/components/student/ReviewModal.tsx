"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
} from "@/components/ui/dialog";
import { StudentReviewForm } from "@/components/marketing/student-review-form";
import type { TutorForReview } from "@/lib/actions/reviews";

type ReviewModalProps = {
  tutor: TutorForReview;
  isOpen: boolean;
  onClose: () => void;
};

export function ReviewModal({ tutor, isOpen, onClose }: ReviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {tutor.hasExistingReview ? "Update your review" : "Leave a review"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="pt-0">
          <StudentReviewForm
            tutorId={tutor.tutorId}
            tutorSiteId={tutor.tutorSiteId}
            tutorUsername={tutor.tutorUsername}
            tutorName={tutor.tutorName}
            isLoggedIn={true}
            canSubmit={true}
            defaultDisplayName={tutor.existingReview?.displayName}
            existingReview={tutor.existingReview}
            compact={true}
            onSubmitted={() => {
              // Close modal after short delay to show success message
              setTimeout(onClose, 1500);
            }}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
