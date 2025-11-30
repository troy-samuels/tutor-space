import { CalendarDays, Users, Lightbulb, MessageCircle, LucideIcon } from "lucide-react";
import type { PlatformBillingPlan } from "@/lib/types/payments";

export type PlanName = PlatformBillingPlan;

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  description?: string;
  plan?: PlanName;
  order?: number;
};

export type NavSection = {
  label: string;
  plan?: PlanName;
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "",
    items: [
      { href: "/calendar", label: "Calendar", icon: CalendarDays, description: "Month/Week/Day views to add, adjust, block, and manage bookings." },
      { href: "/students", label: "Students", icon: Users, description: "Open your CRM to review notes and progress." },
      { href: "/messages", label: "Messages", icon: MessageCircle, description: "Respond to student requests and lead inquiries." },
      { href: "/availability", label: "Availability", icon: Lightbulb, description: "Update your booking windows and time buffers." },
    ],
  },
];
