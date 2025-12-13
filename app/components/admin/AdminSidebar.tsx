"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "./AdminAuthProvider";
import type { LucideIcon } from "lucide-react";
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
  UserCheck,
  ScrollText,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  requiresFinancialAccess?: boolean;
  requiresSuperAdmin?: boolean;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: UserCheck,
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
      {
        title: "Revenue",
        href: "/admin/analytics/revenue",
        icon: CreditCard,
        requiresFinancialAccess: true,
      },
      { title: "Engagement", href: "/admin/analytics/engagement", icon: TrendingUp },
      {
        title: "Subscriptions",
        href: "/admin/analytics/subscriptions",
        icon: PieChart,
        requiresFinancialAccess: true,
      },
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
    title: "Audit Log",
    href: "/admin/audit-log",
    icon: ScrollText,
    requiresSuperAdmin: true,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { canViewFinancials, isSuperAdmin } = useAdminAuth();

  const filteredNavItems = navItems
    .map((item) => {
      if (item.requiresFinancialAccess && !canViewFinancials) {
        return null;
      }
      if (item.requiresSuperAdmin && !isSuperAdmin) {
        return null;
      }

      const filteredChildren = item.children?.filter(
        (child) =>
          !child.requiresFinancialAccess || (child.requiresFinancialAccess && canViewFinancials)
      );

      return { ...item, children: filteredChildren };
    })
    .filter(Boolean) as NavItem[];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-slate-900 bg-slate-950 text-slate-100 lg:block">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-900 px-6">
        <Shield className="h-6 w-6 text-amber-400" />
        <span className="font-semibold text-lg">Admin Console</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {filteredNavItems.map((item) => {
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
                    ? "bg-primary/20 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
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
                            ? "bg-primary/30 text-white font-medium"
                            : "text-slate-400 hover:text-slate-200"
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
