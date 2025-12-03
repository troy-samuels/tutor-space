import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { StudentPortalLayout } from "@/components/student-auth/StudentPortalLayout";
import { stripe } from "@/lib/stripe";
import { Bot, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  BASE_AUDIO_MINUTES,
  BASE_TEXT_TURNS,
  BLOCK_AUDIO_MINUTES,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";

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
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data"],
        }) as any;

        const adminClient = createServiceRoleClient();
        if (adminClient) {
          // Get current_period_start and current_period_end from the subscription object
          const periodStart = subscription.current_period_start;
          const periodEnd = subscription.current_period_end;

          // Find the metered subscription item (block price)
          const meteredItem = subscription.items.data.find(
            (item: any) => item.price.recurring?.usage_type === "metered"
          );

          // Update student record with subscription info
          await adminClient
            .from("students")
            .update({
              ai_practice_enabled: true,
              ai_practice_subscription_id: subscription.id,
              ai_practice_current_period_end: periodEnd
                ? new Date(periodEnd * 1000).toISOString()
                : null,
              ai_practice_block_subscription_item_id: meteredItem?.id || null,
            })
            .eq("id", student.id);

          // Create initial usage period
          if (periodStart && periodEnd) {
            await adminClient
              .from("practice_usage_periods")
              .upsert(
                {
                  student_id: student.id,
                  tutor_id: student.tutor_id,
                  subscription_id: subscription.id,
                  period_start: new Date(periodStart * 1000).toISOString(),
                  period_end: new Date(periodEnd * 1000).toISOString(),
                  audio_seconds_used: 0,
                  text_turns_used: 0,
                  blocks_consumed: 0,
                  current_tier_price_cents: AI_PRACTICE_BASE_PRICE_CENTS,
                },
                {
                  onConflict: "student_id,subscription_id,period_start",
                  ignoreDuplicates: true,
                }
              );
          }
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
              <p className="font-semibold text-foreground">Your Monthly Allowance</p>
              <p className="text-sm text-muted-foreground">
                {BASE_AUDIO_MINUTES} audio minutes + {BASE_TEXT_TURNS} text turns included.
                Need more? Blocks auto-add at $5 each (+{BLOCK_AUDIO_MINUTES} min, +{BLOCK_TEXT_TURNS} turns).
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4 text-left">
          <p className="text-sm font-medium text-foreground">What&apos;s next?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your tutor will assign practice scenarios for you to complete
            between lessons. You can track your usage in the progress dashboard.
          </p>
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
