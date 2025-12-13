"use client";

import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard } from "../wizard-context";

type StepPagesProps = {
  services: Array<{ id: string; name: string; description: string | null }>;
  reviews: Array<{ id?: string; author: string; quote: string }>;
};

export function StepPages({ services, reviews }: StepPagesProps) {
  const { state, updatePages } = usePageBuilderWizard();
  const { pages } = state;

  const handleServiceToggle = (serviceId: string) => {
    const newIds = pages.selectedServiceIds.includes(serviceId)
      ? pages.selectedServiceIds.filter((id) => id !== serviceId)
      : [...pages.selectedServiceIds, serviceId];
    updatePages({ selectedServiceIds: newIds });
  };

  const handlePinReview = (reviewId: string | null) => {
    updatePages({ pinnedReviewId: reviewId });
  };

  return (
    <div className="space-y-8">
      {/* Services Section */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Services</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose which services to show on your page
            </p>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show section</span>
            <input
              type="checkbox"
              checked={pages.showLessons}
              onChange={(e) => updatePages({ showLessons: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </div>

        {pages.showLessons && (
          <div className="mt-4 space-y-2">
            {services.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No services found. Create services in the Services page first.
                </p>
              </div>
            ) : (
              services.map((service) => {
                const isSelected = pages.selectedServiceIds.includes(service.id);
                return (
                  <label
                    key={service.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border/60 bg-background/50 hover:border-primary/30"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleServiceToggle(service.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{service.name}</p>
                      {service.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Reviews Section */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Reviews</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Show testimonials and pin one to your home page
            </p>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show section</span>
            <input
              type="checkbox"
              checked={pages.showReviews}
              onChange={(e) => updatePages({ showReviews: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </div>

        {pages.showReviews && (
          <div className="mt-4 space-y-2">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Reviews will appear here when students submit them.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground">
                  Click the star to pin a review to your home page
                </p>
                {reviews.map((review, index) => {
                  const reviewId = review.id || `review-${index}`;
                  const isPinned = pages.pinnedReviewId === reviewId;
                  return (
                    <div
                      key={reviewId}
                      className={cn(
                        "rounded-xl border p-4 transition",
                        isPinned
                          ? "border-primary bg-primary/5"
                          : "border-border/60 bg-background/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground italic">
                            "{review.quote}"
                          </p>
                          <p className="mt-2 text-xs font-semibold text-foreground">
                            - {review.author}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handlePinReview(isPinned ? null : reviewId)
                          }
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full transition",
                            isPinned
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          )}
                          title={isPinned ? "Unpin from home" : "Pin to home"}
                        >
                          <Star
                            className={cn(
                              "h-4 w-4",
                              isPinned && "fill-current"
                            )}
                          />
                        </button>
                      </div>
                      {isPinned && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                          <Check className="h-3 w-3" />
                          Pinned to home page
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Social Icons */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Social Icons</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Display your social links as icons
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3">
            <span className="text-sm text-foreground">Show in header</span>
            <input
              type="checkbox"
              checked={pages.socialIconsHeader}
              onChange={(e) =>
                updatePages({ socialIconsHeader: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3">
            <span className="text-sm text-foreground">Show in footer</span>
            <input
              type="checkbox"
              checked={pages.socialIconsFooter}
              onChange={(e) =>
                updatePages({ socialIconsFooter: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </div>
      </div>

      {/* Booking CTA */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Booking Button</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Show a call-to-action button for booking
            </p>
          </div>
          <label className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show button</span>
            <input
              type="checkbox"
              checked={pages.showBooking}
              onChange={(e) => updatePages({ showBooking: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
          </label>
        </div>
      </div>

    </div>
  );
}
