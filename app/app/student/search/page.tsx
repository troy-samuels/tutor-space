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
        <div className="rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Find your tutor</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Search by name or username to connect and start booking lessons.
              </p>
            </div>
          </div>
          <TutorSearch initialQuery={initialQuery} />
        </div>
        </AnimateIn>
      </div>
    </StudentPortalLayout>
  );
}
