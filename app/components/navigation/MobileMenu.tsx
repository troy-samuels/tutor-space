"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  links: Array<{ href: string; label: string }>;
  brandHref?: string;
}

export function MobileMenu({ isOpen, onClose, links, brandHref = "/" }: MobileMenuProps) {
  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="relative z-50 md:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu panel */}
      <div className="fixed inset-0 flex">
        <div className="relative mr-16 flex w-full max-w-xs flex-1 transform transition-transform duration-300 ease-in-out">
          {/* Close button */}
          <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-white text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={onClose}
            >
              <span className="sr-only">Close menu</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Menu content */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-brand-white px-6 pb-4 shadow-xl">
            <div className="flex h-16 shrink-0 items-center">
              <Link href={brandHref} className="text-2xl font-bold text-primary" onClick={onClose}>
                TutorLingua
              </Link>
            </div>

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="group flex gap-x-3 rounded-md p-3 text-base font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
