import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Navigation - matching landing page style */}
      <nav className="sticky top-0 z-50 bg-transparent backdrop-blur-sm border-b border-black/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Logo href="https://tutorlingua.co" variant="wordmark" className="h-8 sm:h-9" />

            {/* Nav links - Desktop */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              <Link
                href="https://tutorlingua.co/#features"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Features
              </Link>
              <Link
                href="https://tutorlingua.co/#pricing"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Pricing
              </Link>
              <Link
                href="https://tutorlingua.co/help"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Help
              </Link>
            </div>

            {/* CTA Button */}
            <Link
              href="https://tutorlingua.co/signup"
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer - matching landing page style */}
      <footer className="bg-brand-black text-brand-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8">
            {/* Brand */}
            <div className="flex flex-col items-center sm:items-start gap-4">
              <Logo href="https://tutorlingua.co" variant="wordmark" className="brightness-0 invert h-8" />
              <p className="text-sm text-gray-400">
                Own your repeat business. Built for language tutors.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
              <Link
                href="https://tutorlingua.co"
                className="text-gray-400 hover:text-brand-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="https://tutorlingua.co/#pricing"
                className="text-gray-400 hover:text-brand-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="https://tutorlingua.co/help"
                className="text-gray-400 hover:text-brand-white transition-colors"
              >
                Help
              </Link>
              <Link
                href="https://tutorlingua.co/privacy"
                className="text-gray-400 hover:text-brand-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="https://tutorlingua.co/terms"
                className="text-gray-400 hover:text-brand-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} TutorLingua. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
