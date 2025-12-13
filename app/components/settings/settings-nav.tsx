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
    <div className="grid gap-4 md:grid-cols-[220px,1fr] items-start">
      <nav className="rounded-2xl border border-border bg-white/90 p-3 shadow-sm">
        <div className="hidden md:flex flex-col gap-2 text-sm">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex items-center rounded-lg px-3 py-2 font-medium transition",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="mt-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isPending ? "Signing out..." : "Log out"}
          </button>
        </div>

        {/* Mobile accordion */}
        <div className="md:hidden space-y-2">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium",
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "text-muted-foreground hover:border-primary/40"
                )}
              >
                {link.label}
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Open</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {isPending ? "Signing out..." : "Log out"}
          </button>
        </div>
      </nav>
      <div className="md:mt-0 md:pl-0 md:border-l md:border-transparent">{/* content slot */}</div>
    </div>
  );
}
