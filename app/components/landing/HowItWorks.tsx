import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import { UserPlus, Settings, Share2, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  UserPlus,
  Settings,
  Share2,
};

type HowItWorksProps = {
  howItWorks: LandingCopy["howItWorks"];
};

export function HowItWorks({ howItWorks }: HowItWorksProps) {

  return (
    <section id="how-it-works" className="bg-muted py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {howItWorks.headline}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="space-y-12">
            {howItWorks.steps.map((step, index) => {
              const Icon = iconMap[step.icon] ?? UserPlus;

              return (
                <div
                  key={step.number}
                  className="relative flex gap-x-6 md:gap-x-8"
                >
                  {/* Step number with icon */}
                  <div className="flex-none">
                    <div className="relative flex h-16 w-16 items-center justify-center">
                      {/* Circular background */}
                      <div className="absolute inset-0 rounded-full bg-primary shadow-lg" />
                      {/* Number */}
                      <span className="relative z-10 text-2xl font-bold text-primary-foreground">
                        {step.number}
                      </span>
                      {/* Small icon overlay */}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-sm">
                        <Icon
                          className="text-primary"
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step content */}
                  <div className="flex-1 rounded-2xl bg-brand-white p-8 shadow-sm">
                    <h3 className="text-2xl font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-lg text-gray-700 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connecting line */}
                  {index < howItWorks.steps.length - 1 && (
                    <div className="absolute left-8 top-16 -ml-px h-full w-0.5 bg-primary/30" />
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Link
              href="/signup"
              className="inline-block rounded-md bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-lg"
            >
              {howItWorks.cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
