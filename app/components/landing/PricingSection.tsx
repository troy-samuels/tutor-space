import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import { cn } from "@/lib/utils";

type PricingSectionProps = {
  pricing: LandingCopy["pricing"];
};

export function PricingSection({ pricing }: PricingSectionProps) {
  return (
    <section id="pricing" className="bg-background py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {pricing.headline}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{pricing.subheadline}</p>
        </div>

        {/* Pricing card - centered */}
        <div className="mx-auto mt-12 flex justify-center">
          {pricing.tiers.map((tier) => {
            return (
            <div
              key={tier.name}
              className={cn(
                "relative w-full max-w-md rounded-3xl p-8 shadow-lg",
                tier.highlighted
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex rounded-full bg-muted px-4 py-1.5 text-sm font-semibold text-primary shadow-md">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <h3
                className={cn(
                  "text-2xl font-bold",
                  tier.highlighted ? "text-primary-foreground" : "text-primary"
                )}
              >
                {tier.name}
              </h3>

              {/* Price */}
              <p className="mt-4 flex items-baseline gap-x-2">
                <span
                  className={cn(
                    "text-5xl font-bold tracking-tight",
                    tier.highlighted ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {tier.price}
                </span>
                <span
                  className={cn(
                    "text-base font-semibold",
                    tier.highlighted ? "text-primary-foreground/80" : "text-gray-600"
                  )}
                >
                  {tier.period}
                </span>
              </p>

              {/* Description */}
              <p
                className={cn(
                  "mt-4 text-sm",
                  tier.highlighted ? "text-primary-foreground/90" : "text-gray-600"
                )}
              >
                {tier.description}
              </p>

              {/* Features */}
              <ul className="mt-8 space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex gap-x-3">
                    <svg
                      className={cn(
                        "h-6 w-5 flex-none",
                        tier.highlighted ? "text-primary-foreground" : "text-primary"
                      )}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={cn(
                        "text-sm",
                        tier.highlighted
                          ? "text-primary-foreground/90"
                          : "text-gray-700"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/signup"
                className={cn(
                  "mt-8 block rounded-md px-6 py-3 text-center text-base font-semibold shadow-sm transition-all",
                  tier.highlighted
                    ? "bg-background text-primary hover:bg-background/90"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {tier.cta}
              </Link>
            </div>
            );
          })}
        </div>

        {/* Comparison note */}
        <p className="mt-12 text-center text-sm text-gray-600 max-w-3xl mx-auto leading-relaxed">
          {pricing.comparisonNote}
        </p>
      </div>
    </section>
  );
}
