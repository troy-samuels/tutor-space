import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardShell } from "@/components/dashboard/shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "TutorLingua | Dashboard",
  description: "Run your tutoring business, manage bookings, and track growth in one place.",
};

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role && profile.role !== "tutor") {
      redirect("/student-auth/login");
    }
  }

  return (
    <ProtectedRoute
      loadingFallback={
        <div className="p-8 text-center text-sm text-muted-foreground">
          Loading dashboard...
        </div>
      }
    >
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
