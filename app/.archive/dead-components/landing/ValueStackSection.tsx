import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import {
  Globe,
  Calendar,
  GraduationCap,
  Users,
  Mail,
  CreditCard,
  BarChart3,
  X,
  CircleDollarSign,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Calendar,
  GraduationCap,
  Users,
  Mail,
  CreditCard,
  BarChart3,
};

type ValueStackSectionProps = {
  valueStack: LandingCopy["valueStack"];
};

export function ValueStackSection({ valueStack }: ValueStackSectionProps) {
  // Calculate the total competitor price
  const totalCompetitorPrice = valueStack.items.reduce(
    (sum, item) => sum + item.competitorPrice,
    0
  );

  return (
    <section className="bg-muted/50 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-12">
          {valueStack.headline}
        </h2>

        {/* Value stack card */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-2xl">
          {/* Feature rows */}
          <div className="space-y-1">
            {valueStack.items.map((item, index) => {
              const Icon = iconMap[item.icon] ?? Globe;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                >
                  {/* Left side: Icon + Feature + Replaces */}
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon
                        className="text-primary"
                        size={20}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm sm:text-base">
                        {item.feature}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Replaces{" "}
                        <span className="text-muted-foreground">
                          {item.replaces.join(" · ")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right side: Price */}
                  <span className="font-bold text-foreground text-base sm:text-lg flex-shrink-0 ml-4">
                    {item.competitorPrice > 0
                      ? `$${item.competitorPrice}`
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-6 border-t-2 border-border" />

          {/* Total competitor cost (crossed out) */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <X
                  className="text-red-500"
                  size={20}
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </div>
              <span className="text-muted-foreground italic text-sm sm:text-base">
                {valueStack.totalLabel}
              </span>
            </div>
            <span className="text-red-500 line-through font-bold text-lg sm:text-xl">
              ${totalCompetitorPrice}/mo
            </span>
          </div>

          {/* TutorLingua price */}
          <div className="flex items-center justify-between py-3 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <CircleDollarSign
                  className="text-primary"
                  size={22}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
              <span className="font-bold text-foreground text-lg sm:text-xl">
                {valueStack.platformLabel}
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold text-foreground">
              {valueStack.platformPrice}
              <span className="text-base sm:text-lg font-semibold text-muted-foreground">
                {valueStack.platformPeriod}
              </span>
            </span>
          </div>

          {/* CTA Button */}
          <Link
            href={valueStack.ctaHref}
            className="mt-8 block w-full rounded-xl bg-primary px-6 py-4 text-center text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
          >
            {valueStack.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
