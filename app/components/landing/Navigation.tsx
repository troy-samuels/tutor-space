"use client";

import { useState } from "react";
import Link from "next/link";
import type { LandingCopy } from "@/lib/constants/landing-copy";
import { AuthButton } from "@/components/auth/auth-button";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { MobileMenuButton } from "@/components/navigation/MobileMenuButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type NavigationProps = {
  navigation: LandingCopy["navigation"];
};

export function Navigation({ navigation }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-brand-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile menu button */}
            <div className="flex items-center gap-x-3 md:hidden">
              <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
            </div>

            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-brand-brown">
                TutorLingua
              </Link>
            </div>

            {/* Navigation links - Desktop */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {navigation.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-brand-brown"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth actions */}
            <div className="flex items-center gap-x-3">
              <LanguageSwitcher />
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        links={navigation.links}
      />
    </>
  );
}
