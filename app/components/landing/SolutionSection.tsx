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
          <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            {solution.headline}
          </h2>
          <p className="mt-4 text-lg text-gray-600">{solution.subheadline}</p>
        </div>

        <div className="mx-auto mt-16 max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {solution.features.map((feature, index) => {
              const Icon = iconMap[feature.icon] ?? Globe;

              return (
                <div
                  key={index}
                  className="relative rounded-2xl bg-brand-cream p-8 transition-all hover:-translate-y-1 hover:shadow-lg group"
                >
                  {/* Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 rounded-lg bg-brand-brown/10 flex items-center justify-center transition-transform group-hover:scale-110">
                      <Icon
                        className="text-brand-brown"
                        size={24}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-brand-brown mb-3">
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
      </div>
    </section>
  );
}
