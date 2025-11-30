import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import { LanguageRolodex } from "./LanguageRolodex";

type HeroProps = {
  hero: LandingCopy["hero"];
  socialProof: LandingCopy["socialProof"];
};

export function Hero({ hero, socialProof }: HeroProps) {

  return (
    <section className="relative overflow-hidden bg-brand-white py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero content */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl space-y-2">
            <span className="block">
              All-in-One Platform for Language Tutors
            </span>
            <span className="block text-primary">
              <LanguageRolodex />
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-700 sm:text-xl">
            {hero.subheadline}
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {hero.primaryCTA}
            </Link>
            <Link
              href="#how-it-works"
              className="text-base font-semibold leading-7 text-foreground hover:text-primary transition-colors"
            >
              {hero.secondaryCTA} <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-16">
            <p className="text-sm font-medium text-gray-600">
              {socialProof.text}
            </p>
            <div className="mt-4 flex items-center justify-center gap-x-8">
              {socialProof.tutors.map((tutor, index) => (
                <div
                  key={index}
                  className="flex items-center gap-x-2 text-sm text-gray-500"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-primary">
                    {tutor.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-foreground">
                      {tutor.name}
                    </div>
                    <div className="text-xs">{tutor.language}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative background */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-white opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>
    </section>
  );
}
