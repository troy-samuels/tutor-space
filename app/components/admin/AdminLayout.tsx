"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  UserCog,
  Mail,
  Download,
  Settings,
  Activity,
} from "lucide-react";

const mobileNavItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Tutors", href: "/admin/tutors", icon: Users },
  { title: "Students", href: "/admin/students", icon: GraduationCap },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { title: "Support", href: "/admin/impersonate", icon: UserCog },
  { title: "Email", href: "/admin/email", icon: Mail },
  { title: "Export", href: "/admin/export", icon: Download },
  { title: "Health", href: "/admin/health", icon: Activity },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Admin</span>
          </div>
          <nav className="flex flex-col gap-1 p-4">
            {mobileNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
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
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main content area */}
      <div className="lg:pl-64">
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
