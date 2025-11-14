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
  Mail,
  MessageCircle,
  Package,
  FileText,
  Star,
  Globe,
  LucideIcon,
} from "lucide-react";

export type PlanName = "growth" | "studio";

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
  items: NavItem[];
  plan?: PlanName;
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Run the Business",
    items: [
      { href: "/dashboard", label: "Overview", icon: BarChart3, description: "View KPIs, metrics, and sprint progress at a glance.", order: 1 },
      // Pages (Mini‑Site hub) — unlocked for now; advanced customization will be gated in-page.
      { href: "/pages", label: "Pages", icon: Globe, description: "Create About, Lessons, and Reviews pages with preview.", order: 2 },
      { href: "/bookings", label: "Bookings", icon: CalendarDays, description: "Manage upcoming lessons, payments, and reminders." },
      { href: "/students", label: "Students", icon: Users, description: "Open your CRM to review notes and progress." },
      { href: "/services", label: "Services", icon: Briefcase, description: "Publish or edit the lessons and packages you sell." },
      { href: "/messages", label: "Messages", icon: MessageCircle, description: "Respond to student requests and lead inquiries." },
      { href: "/digital-products", label: "Digital products", icon: Package, description: "Sell printable resources and async lessons." },
      { href: "/availability", label: "Availability", icon: Lightbulb, description: "Update your booking windows and time buffers." },
      { href: "/resources", label: "Resources (Soon)", icon: BookOpen, disabled: true },
      { href: "/lesson-plans", label: "Lesson Plans (Soon)", icon: GraduationCap, disabled: true },
    ],
  },
  {
    label: "Grow (Premium)",
    plan: "growth",
    items: [
      { href: "/marketing/links", label: "Link in Bio", icon: Rocket, description: "Refresh your link hub and social CTAs." },
      { href: "/marketing/email", label: "Email Campaigns", icon: Mail, description: "Send nurture sequences and broadcasts." },
      { href: "/analytics", label: "Analytics", icon: LineChart, description: "Watch revenue, conversion, and channel trends." },
      { href: "/ai", label: "AI Tools", icon: Target, description: "Generate copy, lesson notes, and parent updates with AI." },
      // Mini‑Site (Hybrid) subpages — visible and gated under Growth. Marked as "Soon" to avoid 404s until built.
      { href: "/pages/about", label: "About (Soon)", icon: FileText, disabled: true, description: "Tell your teaching story and qualifications." },
      { href: "/pages/lessons", label: "Lessons (Soon)", icon: GraduationCap, disabled: true, description: "List lesson types, packages, and pricing." },
      { href: "/pages/reviews", label: "Reviews (Soon)", icon: Star, disabled: true, description: "Showcase parent and student testimonials." },
      { href: "/pages/resources", label: "Resources (Soon)", icon: BookOpen, disabled: true, description: "Share useful study links and materials." },
      { href: "/pages/contact", label: "Contact (Soon)", icon: MessageCircle, disabled: true, description: "Let parents and students reach you quickly." },
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
