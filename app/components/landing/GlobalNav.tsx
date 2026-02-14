"use client";

import { useState } from "react";
import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import { AuthButton } from "@/components/auth/auth-button";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { MobileMenuButton } from "@/components/navigation/MobileMenuButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/lib/hooks/useAuth";
import { Logo } from "@/components/Logo";

type Audience = "student" | "tutor";

const STUDENT_NAV_LINKS = [
  { label: "Pricing", href: "#pricing" },
];

const TUTOR_NAV_LINKS = [
  { label: "Pricing", href: "#pricing" },
];

type GlobalNavProps = {
  navigation: LandingCopy["navigation"];
  isAuthenticated?: boolean;
  audience?: Audience;
};

export function GlobalNav({ navigation, isAuthenticated, audience = "student" }: GlobalNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const effectiveUser = isAuthenticated === false ? null : user;
  const brandHref = effectiveUser ? "/dashboard" : "/";

  const navLinks = audience === "student" ? STUDENT_NAV_LINKS : TUTOR_NAV_LINKS;
  const switchLabel = audience === "student" ? "For Tutors" : "For Students";
  const switchHref = audience === "student" ? "/for-tutors" : "/";
  const primaryCTA = audience === "student"
    ? { label: "Start for Free", href: "/practice" }
    : { label: "Start Free Trial", href: "/signup" };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-transparent backdrop-blur-sm border-b border-black/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile menu button */}
            <div className="flex items-center gap-x-3 md:hidden">
              <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
            </div>

            {/* Logo */}
            <div className="flex items-center">
              <Logo href={brandHref} variant="wordmark" className="h-9 sm:h-10" />
            </div>

            {/* Navigation links - Desktop */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={switchHref}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {switchLabel}
              </Link>
            </div>

            {/* Auth actions */}
            <div className="flex items-center gap-x-3">
              <LanguageSwitcher />
              <Link
                href={primaryCTA.href}
                className="hidden sm:inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:bg-primary/90 hover:-translate-y-0.5"
              >
                {primaryCTA.label}
              </Link>
              <AuthButton isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={[...navLinks, { label: switchLabel, href: switchHref }]}
        brandHref={brandHref}
      />
    </>
  );
}
