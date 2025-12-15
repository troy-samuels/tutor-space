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

type NavigationProps = {
  navigation: LandingCopy["navigation"];
  /**
   * Server-determined auth state.
   * When false, user is definitively NOT authenticated.
   * When undefined, falls back to client-side context.
   */
  isAuthenticated?: boolean;
};

export function Navigation({ navigation, isAuthenticated }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  // When server says not authenticated, don't use context user
  const effectiveUser = isAuthenticated === false ? null : user;
  const brandHref = effectiveUser ? "/dashboard" : "/";

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
              {navigation.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth actions */}
            <div className="flex items-center gap-x-3">
              <LanguageSwitcher />
              <AuthButton isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navigation.links}
        brandHref={brandHref}
      />
    </>
  );
}
