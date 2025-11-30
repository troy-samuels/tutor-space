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
              "inline-flex items-center rounded-full px-4 py-2 font-medium transition",
              isActive
                ? "bg-primary/10 text-primary shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-primary/5 hover:text-primary"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
