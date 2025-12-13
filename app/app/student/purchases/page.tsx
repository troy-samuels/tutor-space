import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentPurchasesClient } from "@/components/student-auth/StudentPurchasesClient";
import { getAllStudentCredits } from "@/lib/actions/student-bookings";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
  title: "My Purchases | Student Portal",
  description: "View your lesson packages and subscription credits",
};

export default async function PurchasesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login?redirect=/student/purchases");
  }

  // Get all student credits and avatar in parallel
  const [creditsResult, avatarUrl] = await Promise.all([
    getAllStudentCredits(),
    getStudentAvatarUrl(),
  ]);
  const { packages, subscriptions, error } = creditsResult;

  // Get student name for layout
  const studentName = user.user_metadata?.full_name || null;

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl}>
      <StudentPurchasesClient
        packages={packages || []}
        subscriptions={subscriptions || []}
        error={error}
      />
    </StudentPortalLayout>
  );
}
