import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentBillingClient } from "./StudentBillingClient";
import { getStudentBillingHistory } from "@/lib/actions/student-billing";
import { getStudentSubscriptionSummary } from "@/lib/actions/lesson-subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";

export const metadata = {
  title: "Billing | TutorLingua",
  description: "View your payment history and receipts",
};

export default async function StudentBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const [billingData, { data: subscriptionSummary }, avatarUrl] = await Promise.all([
    getStudentBillingHistory(),
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
  ]);

  return (
    <StudentPortalLayout studentName={user.email} avatarUrl={avatarUrl} subscriptionSummary={subscriptionSummary}>
      <StudentBillingClient
        payments={billingData.payments}
        packages={billingData.packages}
        summary={billingData.summary}
      />
    </StudentPortalLayout>
  );
}
