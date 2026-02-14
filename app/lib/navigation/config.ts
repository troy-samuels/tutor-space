/**
 * Centralised navigation configuration for TutorLingua.
 *
 * Single source of truth for all navigation items by role.
 * Both BottomNav and TopNav read from this config.
 */

import {
  BarChart3,
  CalendarDays,
  Users,
  Menu,
  Search,
  CalendarPlus,
  MessageSquare,
  Flame,
  type LucideIcon,
  Clock,
  Settings,
  Sparkles,
  LayoutGrid,
  Briefcase,
  Package,
  ClipboardList,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "student" | "tutor" | "guest";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Whether this tab sits in the elevated centre position (mobile). */
  centre?: boolean;
  /** Badge key — the parent component maps this to a count value. */
  badgeKey?: "unreadMessages" | "homeworkCount";
};

export type MoreItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

// ---------------------------------------------------------------------------
// Student Navigation
// ---------------------------------------------------------------------------

export const STUDENT_NAV_ITEMS: NavItem[] = [
  { href: "/student/search", label: "Home", icon: Search },
  { href: "/student/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/student/practice", label: "Practice", icon: Flame, centre: true },
  { href: "/student/messages", label: "Messages", icon: MessageSquare, badgeKey: "unreadMessages" },
  { href: "/student/assignments", label: "More", icon: Menu, badgeKey: "homeworkCount" },
];

export const STUDENT_MORE_ITEMS: MoreItem[] = [
  { href: "/student/assignments", label: "Assignments", icon: ClipboardList, description: "View homework from your tutors" },
  { href: "/student/purchases", label: "My Purchases", icon: Package, description: "Lesson credits & subscriptions" },
  { href: "/student/settings", label: "Settings", icon: Settings, description: "Profile & account settings" },
];

// ---------------------------------------------------------------------------
// Tutor Navigation
// ---------------------------------------------------------------------------

const AI_TOOLS_ENABLED = typeof process !== "undefined"
  ? process.env.NEXT_PUBLIC_AI_TOOLS_ENABLED === "true"
  : false;

export const TUTOR_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: BarChart3 },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/students", label: "Students", icon: Users },
  { href: "/services", label: "Services", icon: Briefcase },
  { href: "#more", label: "More", icon: Menu },
];

export const TUTOR_MORE_ITEMS: MoreItem[] = [
  { href: "/availability", label: "Availability", icon: Clock, description: "Set your teaching schedule" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Profile & account settings" },
  ...(AI_TOOLS_ENABLED
    ? [{ href: "/ai", label: "AI Tools", icon: Sparkles, description: "Lesson planning & resources" }]
    : []),
  { href: "/analytics", label: "Analytics", icon: LayoutGrid, description: "View insights & reports" },
  { href: "/marketing", label: "Marketing", icon: MessageSquare, description: "Link-in-bio & promotion" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get nav items for a given role. */
export function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "student":
      return STUDENT_NAV_ITEMS;
    case "tutor":
      return TUTOR_NAV_ITEMS;
    default:
      return [];
  }
}

/** Get "More" menu items for a given role. */
export function getMoreItems(role: UserRole): MoreItem[] {
  switch (role) {
    case "student":
      return STUDENT_MORE_ITEMS;
    case "tutor":
      return TUTOR_MORE_ITEMS;
    default:
      return [];
  }
}

/** Check if a path matches a nav item (exact or prefix). */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "#more") return false;
  if (pathname === href) return true;
  // Prefix match for nested routes
  return pathname.startsWith(href + "/");
}
