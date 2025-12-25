import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { stripe } from "@/lib/stripe";
import { CheckCircle, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  BLOCK_AUDIO_MINUTES,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";
import { getStudentSubscriptionSummary } from "@/lib/actions/lesson-subscriptions";

export const metadata = {
  title: "Credits Unlocked | TutorLingua",
  description: "Your practice credits are ready",
};

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CreditsSuccessPage({ searchParams }: PageProps) {
  const { session_id } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/student/login");
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, tutor_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!student) {
    redirect("/student/progress");
  }

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);

      if (
        session.metadata?.type === "ai_practice_blocks" &&
        session.metadata?.studentId === student.id &&
        session.status === "complete"
      ) {
        const subscriptionId = session.subscription as string | null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data"],
          }) as any;

          const meteredItem = subscription.items.data.find(
            (item: any) => item.price.recurring?.usage_type === "metered"
          );

          const adminClient = createServiceRoleClient();
          if (adminClient) {
            await adminClient
              .from("students")
              .update({
                ai_practice_block_subscription_item_id: meteredItem?.id || null,
              })
              .eq("id", student.id);

            await adminClient
              .from("practice_usage_periods")
              .update({
                stripe_subscription_id: subscription.id,
                is_free_tier: false,
              })
              .eq("student_id", student.id)
              .gte("period_end", new Date().toISOString());
          }
        }
      }
    } catch (error) {
      console.error("[Credits Success] Error verifying session:", error);
    }
  }

  const { data: subscriptionSummary } = await getStudentSubscriptionSummary();
  const blockPriceDollars = (AI_PRACTICE_BLOCK_PRICE_CENTS / 100).toFixed(0);

  return (
    <StudentPortalLayout studentName={user.email} subscriptionSummary={subscriptionSummary}>
      <div className="mx-auto max-w-lg space-y-6 px-4 py-12 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Practice credits unlocked
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your ${blockPriceDollars} top-up is ready. Keep practicing and we&apos;ll add a new block
            whenever you go past your free allowance.
          </p>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center justify-center gap-3">
            <CreditCard className="h-8 w-8 text-primary" />
            <div className="text-left">
              <p className="font-semibold text-foreground">Block details</p>
              <p className="text-sm text-muted-foreground">
                ${blockPriceDollars} per block adds +{BLOCK_AUDIO_MINUTES} audio minutes + {BLOCK_TEXT_TURNS} text turns.
              </p>
            </div>
          </div>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/student/progress">
            Back to Practice
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </StudentPortalLayout>
  );
}
