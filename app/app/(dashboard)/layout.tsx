import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { AuthProvider } from "@/components/providers/auth-provider";
import { getPlanTier, hasProAccess, hasStudioAccess } from "@/lib/payments/subscriptions";
import { createClient } from "@/lib/supabase/server";
import type { PlatformBillingPlan } from "@/lib/types/payments";

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

  // Server-side redirect for unauthenticated users
  if (!user) {
    redirect("/login");
  }

  // Check if this is a classroom route - students can access classroom directly
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || "";
  const isClassroomRoute = pathname.startsWith("/classroom/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, subscription_status, avatar_url, plan, username, onboarding_completed")
    .eq("id", user.id)
    .single();

  // =====================================================
  // ENTERPRISE-GRADE ROLE VERIFICATION
  // Ensures students NEVER see tutor UI or onboarding
  // EXCEPTION: Students CAN access /classroom/[bookingId] routes
  // =====================================================

  // SAFETY: No profile = not a tutor
  if (!profile) {
    // Check if this is a registered student with an auth account
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (student) {
      // Students can access classroom routes directly
      if (isClassroomRoute) {
        // Render classroom without full dashboard shell for students
        return <>{children}</>;
      }
      // This is a student trying to access other dashboard routes - send to student portal
      redirect("/student/search");
    }
    // Unknown user with no profile - send to login
    redirect("/login");
  }

  // SAFETY: If role is explicitly not "tutor", redirect to student portal
  // EXCEPTION: Allow access to classroom routes for students
  // This catches cases where role is "student", null, or any other value
  if (profile.role !== "tutor") {
    // Students can access classroom routes directly
    if (isClassroomRoute) {
      // Render classroom without full dashboard shell for students
      return <>{children}</>;
    }
    redirect("/student/search");
  }

  // Only verified tutors reach this point
  if (!profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const plan: PlatformBillingPlan =
    (profile?.plan as PlatformBillingPlan | null) ?? "professional";
  const entitlements = {
    plan,
    tier: getPlanTier(plan),
    isPaid: hasProAccess(plan),
    hasProAccess: hasProAccess(plan),
    hasStudioAccess: hasStudioAccess(plan),
  } as const;

  return (
    <AuthProvider
      initialUser={user}
      initialProfile={profile ?? null}
      initialEntitlements={entitlements}
    >
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
