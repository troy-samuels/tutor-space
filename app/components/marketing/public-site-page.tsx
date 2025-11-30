"use client";

import { useState } from "react";
import { SitePreview, type SitePageView } from "@/components/marketing/site-preview";
import { StudentReviewForm, type StudentReviewFormProps } from "@/components/marketing/student-review-form";

type SitePreviewProps = Parameters<typeof SitePreview>[0];

type Props = {
  siteProps: SitePreviewProps;
  reviewFormProps?: StudentReviewFormProps;
  initialPage?: SitePageView;
};

export function PublicSitePage({ siteProps, reviewFormProps, initialPage }: Props) {
  const [reviews, setReviews] = useState(siteProps.reviews);
  const [page, setPage] = useState<SitePageView>(initialPage ?? siteProps.page ?? "home");

  return (
    <div className="min-h-screen bg-background">
      {/* Max-width container for desktop - responsive scaling */}
      <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <SitePreview
          {...siteProps}
          page={page}
          onNavigate={setPage}
          reviews={reviews}
        />
      </div>

      {reviewFormProps ? (
        <div className="mx-auto max-w-3xl px-4 pb-12">
          <StudentReviewForm
            {...reviewFormProps}
            onSubmitted={(review) =>
              setReviews((prev) => [...prev, { author: review.author, quote: review.quote, rating: review.rating }])
            }
          />
        </div>
      ) : null}
    </div>
  );
}
