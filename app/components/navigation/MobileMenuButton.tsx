"use client";

import { Menu } from "lucide-react";

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-gray-100 hover:text-brand-brown focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-brown md:hidden"
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
