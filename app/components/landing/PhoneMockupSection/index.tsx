"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Palette,
  Layers,
  Star,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";

const MockupSiteContent = dynamic(
  () => import("./MockupSiteContent").then((m) => m.MockupSiteContent),
  { ssr: false }
);

type FeatureItem = {
  icon: string;
  title: string;
  description: string;
};

type PhoneMockupCopy = {
  headline: string;
  subheadline: string;
  features: FeatureItem[];
  cta: string;
};

type PhoneMockupSectionProps = {
  copy: PhoneMockupCopy;
};

const iconMap: Record<string, LucideIcon> = {
  Palette,
  Layers,
  Star,
  Smartphone,
};

export function PhoneMockupSection({ copy }: PhoneMockupSectionProps) {
  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16 min-h-[640px]">
          {/* Left column - Text content */}
          <div className="order-2 lg:order-1 flex flex-col items-start justify-center text-left">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {copy.headline}
            </h2>
            <p className="mt-4 text-lg text-gray-600">{copy.subheadline}</p>

            {/* Feature list */}
            <ul className="mt-8 w-full max-w-none space-y-5 lg:max-w-xl">
              {copy.features.map((feature, index) => {
                const Icon = iconMap[feature.icon] ?? Layers;
                return (
                  <li key={index} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon
                        className="h-5 w-5 text-primary"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="text-base font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* CTA button */}
            <div className="mt-10 text-center lg:text-left">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
              >
                {copy.cta}
              </Link>
            </div>
          </div>

          {/* Right column - Phone mockup */}
          <div className="order-1 flex justify-center lg:order-2">
            <PhoneFrame>
              <MockupSiteContent />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </section>
  );
}
