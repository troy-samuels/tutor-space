import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { stripe } from "@/lib/stripe";
import { Bot, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Welcome to AI Practice | TutorLingua",
  description: "Your AI Practice subscription is now active",
};

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SubscribeSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student-auth/login");
  }

  // Get student record
  const { data: student } = await supabase
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student-auth/progress");
  }

  // If we have a session_id, verify and update the subscription
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (
        session.metadata?.type === "ai_practice_subscription" &&
        session.metadata?.studentId === student.id &&
        session.status === "complete"
      ) {
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        const adminClient = createServiceRoleClient();
        if (adminClient) {
          // Get current_period_end from the subscription object
          const periodEnd = (subscription as { current_period_end?: number }).current_period_end;
          await adminClient
            .from("students")
            .update({
              ai_practice_enabled: true,
              ai_practice_subscription_id: subscription.id,
              ai_practice_current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
            })
            .eq("id", student.id);
        }
      }
    } catch (error) {
      console.error("[Subscribe Success] Error verifying session:", error);
    }
  }

  return (
    <StudentPortalLayout studentName={user.email}>
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to AI Practice!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your subscription is now active. You can start practicing conversations
            with AI right away.
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-foreground">What&apos;s next?</p>
              <p className="text-sm text-muted-foreground">
                Your tutor will assign practice scenarios for you to complete
                between lessons.
              </p>
            </div>
          </div>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/student-auth/progress">
            Go to My Progress
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </StudentPortalLayout>
  );
}
