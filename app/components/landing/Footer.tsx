import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import { Logo } from "@/components/Logo";

type FooterProps = {
  footer: LandingCopy["footer"];
};

export function Footer({ footer }: FooterProps) {

  return (
    <footer className="bg-brand-black text-brand-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Top section */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo href="/" variant="wordmark" className="brightness-0 invert" />
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              {footer.tagline}
            </p>
          </div>

          {/* Links sections */}
          {footer.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-brand-white mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-brand-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-12 border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">{footer.copyright}</p>

          {/* Social links */}
          <div className="flex gap-x-6 items-center">
            <Link
              href="mailto:hello@tutorlingua.co"
              className="text-gray-400 hover:text-brand-white transition-colors"
              aria-label="Email us"
            >
              <span className="sr-only">Email</span>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Link>
            <Link
              href="https://instagram.com/tutorlingua.co"
              className="text-gray-400 hover:text-brand-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow us on Instagram"
            >
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
