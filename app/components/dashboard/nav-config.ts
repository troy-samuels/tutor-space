import { CalendarDays, Users, Lightbulb, MessageCircle, Bot, Store, Mic, LucideIcon } from "lucide-react";
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
  studioFeature?: boolean;
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
      { href: "/classroom/test", label: "Audio Studio", icon: Mic, description: "Native audio classroom with recording and transcription.", studioFeature: true },
      { href: "/ai", label: "AI Assistant", icon: Bot, description: "AI-powered help with lesson prep, feedback, and content creation." },
      { href: "/marketplace", label: "Sales", icon: Store, description: "Track digital product sales and commission earnings." },
    ],
  },
];
