import type { LandingCopy } from "@/lib/constants/landing-copy";
import { TrendingDown, Layers, Clock, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  TrendingDown,
  Layers,
  Clock,
};

type ProblemSectionProps = {
  problems: LandingCopy["problems"];
};

export function ProblemSection({ problems }: ProblemSectionProps) {

  return (
    <section className="bg-muted py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {problems.headline}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
            {problems.items.map((problem, index) => {
              const Icon = iconMap[problem.icon] ?? TrendingDown;

              return (
                <div
                  key={index}
                  className="relative rounded-2xl bg-brand-white p-6 shadow-sm transition-all hover:shadow-md group sm:p-8"
                >
                  {/* Icon Container */}
                  <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-muted flex items-center justify-center transition-transform group-hover:scale-105">
                      <Icon
                        className="text-primary"
                        size={40}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3 text-center">
                    {problem.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-center">
                    {problem.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-12 text-center text-lg italic text-gray-600">
            {problems.subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
