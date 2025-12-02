"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";

const LINKS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/payments", label: "Payments" },
  { href: "/settings/video", label: "Video" },
  { href: "/settings/calendar", label: "Calendar sync" },
  { href: "/settings/billing", label: "Billing" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm">
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
      <div className="mx-2 h-6 w-px bg-border" />
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" />
        {isPending ? "Signing out..." : "Log out"}
      </button>
    </nav>
  );
}
