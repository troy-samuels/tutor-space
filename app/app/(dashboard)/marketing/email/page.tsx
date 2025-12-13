import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmailComposer } from "@/components/marketing/email-composer";
import { EmailAutomationSettings } from "@/components/marketing/email-automation-settings";
import type { EmailAudienceId } from "@/lib/constants/email-audiences";
import type { LaunchTopicId } from "@/lib/constants/launch-topics";
import type { EmailTemplateId } from "@/lib/constants/email-templates";
import { hasProAccess } from "@/lib/payments/subscriptions";

type AudienceCounts = Record<EmailAudienceId, number>;

const recommendedTemplatesByTopic: Partial<Record<LaunchTopicId, EmailTemplateId[]>> = {
  exam_prep: ["reminder", "progress"],
  kids_immersion: ["welcome", "progress"],
  business_fluency: ["reminder", "progress"],
  heritage_learners: ["welcome", "reengage"],
  seasonal_promo: ["reengage", "progress"],
};

export default async function EmailMarketingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/marketing/email");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, launch_topic, auto_welcome_enabled, auto_reengage_enabled, auto_reengage_days")
    .eq("id", user!.id)
    .single();

  const plan = profile?.plan ?? "professional";
  if (!hasProAccess(plan)) {
    redirect("/settings/billing");
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, status, email_opt_out, updated_at")
    .eq("tutor_id", user!.id);

  const counts: AudienceCounts = {
    all: 0,
    active: 0,
    inactive: 0,
    paused: 0,
    inactive_30: 0,
    never_booked: 0,
  };

  const activeStudents = (students ?? []).filter((student) => !student.email_opt_out);
  counts.all = activeStudents.length;
  activeStudents.forEach((student) => {
    const status = student.status as EmailAudienceId | null;
    if (status && counts[status] !== undefined) {
      counts[status] += 1;
    }
  });

  const { data: bookings } = await supabase
    .from("bookings")
    .select("student_id, scheduled_at")
    .eq("tutor_id", user!.id)
    .order("scheduled_at", { ascending: false })
    .limit(500);

  const lastBookingMap = new Map<string, Date>();
  (bookings ?? []).forEach((booking) => {
    if (!booking.student_id || !booking.scheduled_at) return;
    if (!lastBookingMap.has(booking.student_id)) {
      lastBookingMap.set(booking.student_id, new Date(booking.scheduled_at));
    }
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  activeStudents.forEach((student) => {
    const lastBooking = lastBookingMap.get(student.id);
    if (!lastBooking) {
      counts.never_booked += 1;
      return;
    }
    if (lastBooking < thirtyDaysAgo) {
      counts.inactive_30 += 1;
    }
  });

  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("id, subject, audience_filter, recipient_count, status, sent_at")
    .eq("tutor_id", user!.id)
    .order("sent_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-2xl font-semibold text-foreground">Email Campaigns</p>
        <p className="text-sm text-muted-foreground">
          Keep students engaged with branded broadcasts powered by your TutorLingua CRM.
        </p>
      </div>

      <EmailComposer
        counts={counts}
        recommendedTemplates={
          profile?.launch_topic
            ? recommendedTemplatesByTopic[profile.launch_topic as LaunchTopicId] ?? []
            : []
        }
      />

      <EmailAutomationSettings
        autoWelcomeEnabled={profile?.auto_welcome_enabled ?? true}
        autoReengageEnabled={profile?.auto_reengage_enabled ?? false}
        autoReengageDays={profile?.auto_reengage_days ?? 30}
      />

      <section className="rounded-3xl border border-border bg-white/80 p-6 shadow-sm">
        <header className="flex items-center justify-between gap-2 border-b border-border/60 pb-4">
          <p className="text-sm font-semibold text-foreground">Recent campaigns</p>
          <span className="text-xs text-muted-foreground">Last 5 sends</span>
        </header>
        {(!campaigns || campaigns.length === 0) && (
          <p className="py-6 text-sm text-muted-foreground">
            No campaigns sent yet. Use the composer above to send your first message.
          </p>
        )}
        {campaigns && campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">Subject</th>
                  <th className="px-2 py-2">Audience</th>
                  <th className="px-2 py-2 text-center">Recipients</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2 text-right">Sent</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-t border-border/60">
                    <td className="px-2 py-3 font-medium text-foreground">{campaign.subject}</td>
                    <td className="px-2 py-3 text-sm capitalize text-muted-foreground">
                      {campaign.audience_filter}
                    </td>
                    <td className="px-2 py-3 text-center text-sm text-foreground">
                      {campaign.recipient_count}
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{campaign.status}</td>
                    <td className="px-2 py-3 text-right text-xs text-muted-foreground">
                      {campaign.sent_at
                        ? new Date(campaign.sent_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
