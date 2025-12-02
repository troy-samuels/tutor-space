import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { StudentBillingClient } from "./StudentBillingClient";
import { getStudentBillingHistory } from "@/lib/actions/student-billing";

export const metadata = {
  title: "Billing | TutorLingua",
  description: "View your payment history and receipts",
};

export default async function StudentBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login");
  }

  const billingData = await getStudentBillingHistory();

  return (
    <StudentPortalLayout studentName={user.email}>
      <StudentBillingClient
        payments={billingData.payments}
        packages={billingData.packages}
        summary={billingData.summary}
      />
    </StudentPortalLayout>
  );
}
