import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentPurchasesClient } from "@/components/student-auth/StudentPurchasesClient";
import { getAllStudentCredits, getConnectedTutorOfferings } from "@/lib/actions/student-bookings";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentDisplayName } from "@/lib/utils/student-name";

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

  const studentName = await getStudentDisplayName(supabase, user);
  // Get all student credits, tutor offerings, and avatar in parallel
  const [creditsResult, offeringsResult, avatarUrl] = await Promise.all([
    getAllStudentCredits(),
    getConnectedTutorOfferings(),
    getStudentAvatarUrl(),
  ]);
  const { packages, subscriptions, error } = creditsResult;
  const connectedTutors = offeringsResult.tutors || [];

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl}>
      <StudentPurchasesClient
        packages={packages || []}
        subscriptions={subscriptions || []}
        connectedTutors={connectedTutors}
        error={error}
      />
    </StudentPortalLayout>
  );
}
