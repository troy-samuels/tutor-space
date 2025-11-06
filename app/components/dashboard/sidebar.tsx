"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Users,
  Briefcase,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Rocket,
  LineChart,
  Target,
  Layers,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

type PlanName = "growth" | "studio";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
  plan?: PlanName;
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Run the Business",
    items: [
      { href: "/dashboard", label: "Overview", icon: BarChart3 },
      { href: "/bookings", label: "Bookings", icon: CalendarDays },
      { href: "/students", label: "Students", icon: Users },
      { href: "/services", label: "Services", icon: Briefcase },
      { href: "/availability", label: "Availability", icon: Lightbulb },
      { href: "/resources", label: "Resources (Soon)", icon: BookOpen, disabled: true },
      { href: "/lesson-plans", label: "Lesson Plans (Soon)", icon: GraduationCap, disabled: true },
    ],
  },
  {
    label: "Grow (Premium)",
    plan: "growth",
    items: [
      { href: "/marketing/links", label: "Link in Bio", icon: Rocket },
      { href: "/analytics", label: "Analytics", icon: LineChart },
      { href: "/ai", label: "AI Tools", icon: Target },
    ],
  },
  {
    label: "Studio Add-Ons",
    plan: "studio",
    items: [
      { href: "/studio/group-sessions", label: "Group Sessions (Soon)", icon: Users, disabled: true },
      { href: "/studio/marketplace", label: "Marketplace (Soon)", icon: Layers, disabled: true },
      { href: "/studio/ceo-dashboard", label: "CEO Dashboard (Soon)", icon: BarChart3, disabled: true },
    ],
  },
];

export function DashboardSidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { entitlements } = useAuth();

  const canAccessSection = (plan?: PlanName) => {
    if (!plan) return true;
    return plan === "growth" ? entitlements.growth : entitlements.studio;
  };

  return (
    <div className={cn("flex h-full w-full flex-col px-2 pb-8 pt-6", className)}>
      <div className="px-4 pb-6 text-xl font-semibold tracking-tight">TutorLingua</div>
      <nav className="flex-1 space-y-6">
        {NAV_SECTIONS.map((section) => {
          if (section.plan && !canAccessSection(section.plan)) {
            return <PlanUpgradeTeaser key={section.label} plan={section.plan} />;
          }

          return (
            <div key={section.label}>
              <p className="px-4 text-xs font-semibold uppercase text-muted-foreground">
                {section.label}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const disabled = item.disabled;
                  return (
                    <Link
                      key={item.href}
                      href={disabled ? "#" : item.href}
                      onClick={(event) => {
                        if (disabled) {
                          event.preventDefault();
                          return;
                        }
                        onNavigate?.();
                      }}
                      aria-disabled={disabled}
                      tabIndex={disabled ? -1 : 0}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-4 py-2 text-sm transition-colors",
                        disabled
                          ? "cursor-not-allowed border border-dashed border-border/60 text-muted-foreground/60"
                          : isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {disabled ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          Soon
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function PlanUpgradeTeaser({ plan }: { plan: PlanName }) {
  const copy =
    plan === "growth"
      ? {
          title: "Unlock the Growth plan",
          description:
            "Lead funnels, campaign analytics, and AI marketing prompts help you stay fully booked.",
        }
      : {
          title: "Scale with Studio",
          description:
            "Run group sessions, list curriculum in the marketplace, and access studio dashboards.",
        };

  return (
    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-5">
      <p className="text-sm font-semibold">{copy.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{copy.description}</p>
      <Link
        href={`/upgrade?plan=${plan}`}
        className="mt-3 inline-flex text-sm font-semibold text-primary"
      >
        View plans →
      </Link>
    </div>
  );
}
