import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { TutorSearch } from "@/components/student-auth/TutorSearch";
import { UpcomingLessons } from "@/components/student-auth/UpcomingLessons";
import { QuickPracticeCard } from "@/components/student-auth/QuickPracticeCard";
import { getStudentSubscriptionSummary } from "@/lib/actions/subscriptions";
import { getStudentAvatarUrl } from "@/lib/actions/student-avatar";
import { getStudentPracticeDashboard } from "@/lib/actions/practice-dashboard";
import { AnimateIn } from "@/components/ui/animate-in";

export const metadata: Metadata = {
  title: "Find Your Tutor | TutorLingua",
  description: "Search for your tutor by username to open their landing page",
};

type PageProps = {
  searchParams: Promise<{ q?: string; prefill?: string }>;
};

export default async function StudentSearchPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login?redirect=/student/search");
  }

  const params = await searchParams;
  const initialQuery = (params.q ?? params.prefill ?? "").trim();

  const { data: student } = await supabase
    .from("students")
    .select("full_name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const studentName = student?.full_name || user.user_metadata?.full_name || null;
  const [{ data: subscriptionSummary }, avatarUrl, practiceData] = await Promise.all([
    getStudentSubscriptionSummary(),
    getStudentAvatarUrl(),
    getStudentPracticeDashboard(),
  ]);

  return (
    <StudentPortalLayout studentName={studentName} avatarUrl={avatarUrl} subscriptionSummary={subscriptionSummary}>
      <div className="space-y-6">
        {/* Quick Practice */}
        <AnimateIn>
          <QuickPracticeCard
            streak={practiceData?.streak}
            dailyComplete={practiceData?.dailyComplete}
            lastLanguage={practiceData?.lastLanguage ?? undefined}
          />
        </AnimateIn>

        {/* Upcoming Lessons with Join Button */}
        <AnimateIn delay={0.08}>
          <UpcomingLessons />
        </AnimateIn>

        {/* Tutor Search */}
        <AnimateIn delay={0.16}>
        <div className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Find your tutor</p>
            <h1 className="text-2xl font-bold text-foreground">Search by name or username</h1>
            <p className="text-sm text-muted-foreground">
              Connect with tutors and send an intro message to get approved for bookings.
            </p>
          </div>
          <TutorSearch initialQuery={initialQuery} />
        </div>
        </AnimateIn>
      </div>
    </StudentPortalLayout>
  );
}
