"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  CreditCard,
  TrendingUp,
  PieChart,
  UserCog,
  Mail,
  Download,
  Eye,
  Shield,
  Settings,
  Activity,
  Flag,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tutors",
    href: "/admin/tutors",
    icon: Users,
  },
  {
    title: "Students",
    href: "/admin/students",
    icon: GraduationCap,
  },
  {
    title: "Moderation",
    href: "/admin/moderation",
    icon: Flag,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
    children: [
      { title: "Overview", href: "/admin/analytics", icon: BarChart3 },
      { title: "Revenue", href: "/admin/analytics/revenue", icon: CreditCard },
      { title: "Engagement", href: "/admin/analytics/engagement", icon: TrendingUp },
      { title: "Subscriptions", href: "/admin/analytics/subscriptions", icon: PieChart },
      { title: "Page Views", href: "/admin/analytics/page-views", icon: Eye },
    ],
  },
  {
    title: "Support Tools",
    href: "/admin/impersonate",
    icon: UserCog,
  },
  {
    title: "Email Tutors",
    href: "/admin/email",
    icon: Mail,
  },
  {
    title: "Data Export",
    href: "/admin/export",
    icon: Download,
  },
  {
    title: "System Health",
    href: "/admin/health",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-white lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="font-semibold text-lg">TutorLingua Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.children && item.children.some((child) => pathname === child.href));
          const Icon = item.icon;

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>

              {/* Sub-navigation */}
              {item.children && isActive && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                          isChildActive
                            ? "bg-primary/5 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <ChildIcon className="h-3.5 w-3.5" />
                        {child.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
