import { Star } from "lucide-react";
import type { SophieMockData } from "../sophie-data";

type MockupReviewsProps = {
  reviews: SophieMockData["reviews"];
  theme: SophieMockData["theme"];
};

export function MockupReviews({ reviews, theme }: MockupReviewsProps) {
  return (
    <section className="px-4 py-6" style={{ backgroundColor: theme.background }}>
      <h2
        className="text-base font-semibold"
        style={{
          color: theme.primary,
          fontFamily: '"Merriweather", Georgia, serif',
        }}
      >
        What students say
      </h2>

      <div className="mt-3 space-y-3">
        {reviews.map((review) => (
          <blockquote
            key={review.id}
            className="rounded-xl p-3"
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${theme.primary}15`,
            }}
          >
            {/* Star rating */}
            <div className="flex gap-0.5">
              {Array.from({ length: review.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3 w-3 fill-current"
                  style={{ color: theme.secondary }}
                />
              ))}
            </div>

            <p
              className="mt-2 text-xs leading-relaxed"
              style={{ color: `${theme.text}cc` }}
            >
              "{review.quote}"
            </p>

            <footer
              className="mt-2 text-xs font-medium"
              style={{ color: theme.primary }}
            >
              — {review.author}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
