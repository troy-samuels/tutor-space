import type { LandingCopy } from "@/lib/constants/landing-copy";
import {
  Globe,
  Calendar,
  Wallet,
  Users,
  Sparkles,
  CheckCircle,
  LucideIcon,
} from "lucide-react";
import { InteractiveCalendarDemo } from "./InteractiveCalendarDemo";

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Calendar,
  Wallet,
  Users,
  Sparkles,
  CheckCircle,
};

type SolutionSectionProps = {
  solution: LandingCopy["solution"];
};

export function SolutionSection({ solution }: SolutionSectionProps) {

  return (
    <section id="features" className="bg-brand-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {solution.headline}
          </h2>
          <p className="mt-4 text-lg text-gray-600">{solution.subheadline}</p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {solution.features.map((feature, index) => {
              const Icon = iconMap[feature.icon] ?? Globe;

              return (
                <div
                  key={index}
                  className="relative rounded-2xl bg-muted p-6 transition-all hover:-translate-y-1 hover:shadow-lg group sm:p-8"
                >
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Icon
                        className="text-primary"
                        size={24}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Calendar Demo */}
        <div id="calendar-demo" className="mx-auto mt-20 max-w-4xl">
          <div className="mb-8 text-center">
            <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              From scattered tools to one dashboard
            </h3>
            <p className="mt-3 text-lg text-gray-600">
              Stop juggling spreadsheets, calendars, and chat apps. See all your lessons in one place.
            </p>
          </div>
          <InteractiveCalendarDemo />
        </div>
      </div>
    </section>
  );
}
