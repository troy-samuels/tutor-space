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
    <section id="how-it-works" className="bg-muted py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {howItWorks.headline}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="space-y-10 sm:space-y-12">
            {howItWorks.steps.map((step, index) => {
              const Icon = iconMap[step.icon] ?? UserPlus;

              return (
                <div
                  key={step.number}
                  className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-x-8"
                >
                  {/* Step number with icon */}
                  <div className="flex-none">
                    <div className="relative flex h-14 w-14 items-center justify-center md:h-16 md:w-16">
                      {/* Circular background */}
                      <div className="absolute inset-0 rounded-full bg-primary shadow-lg" />
                      {/* Number */}
                      <span className="relative z-10 text-xl font-bold text-primary-foreground md:text-2xl">
                        {step.number}
                      </span>
                      {/* Small icon overlay */}
                      <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-muted shadow-sm md:h-8 md:w-8">
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
                  <div className="flex-1 rounded-2xl bg-brand-white p-6 shadow-sm md:p-8">
                    <h3 className="mb-3 text-xl font-semibold text-foreground md:text-2xl">
                      {step.title}
                    </h3>
                    <p className="text-base leading-relaxed text-gray-700 md:text-lg">
                      {step.description}
                    </p>
                  </div>

                  {/* Connecting line */}
                  {index < howItWorks.steps.length - 1 && (
                    <div className="absolute left-7 top-16 -ml-px hidden h-full w-0.5 bg-primary/30 md:block" />
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
