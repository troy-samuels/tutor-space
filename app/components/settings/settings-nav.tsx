"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/payments", label: "Payments" },
  { href: "/settings/video", label: "Video" },
  { href: "/settings/calendar", label: "Calendar sync" },
  { href: "/settings/billing", label: "Billing" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 text-sm">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex items-center rounded-full border border-transparent px-4 py-2 font-medium transition",
              isActive
                ? "border-brand-brown/60 bg-brand-brown/10 text-brand-brown"
                : "border-border bg-white/60 text-muted-foreground hover:border-brand-brown/40 hover:text-brand-brown"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
