import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateTutorReferralLink } from "@/lib/practice/deep-links";
import { getTutorReferralStats } from "@/lib/actions/referrals";
import { ReferralShareCard } from "@/components/dashboard/ReferralShareCard";

/**
 * Tutor referral dashboard page with share link and conversion stats.
 */
export default async function TutorReferralsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

  if (!profile?.id || !profile.username) {
    redirect("/settings/profile");
  }

  const stats = await getTutorReferralStats(profile.id);
  const referralLink = generateTutorReferralLink({
    tutorId: profile.id,
    tutorUsername: profile.username,
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/[0.1] bg-background p-6 text-foreground shadow-[0_0_70px_-25px_rgba(232,120,77,0.45)] backdrop-blur-xl">
        <p className="inline-flex rounded-full border border-primary/45 bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#E8A84D]">
          Tutor referral programme
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          Refer a tutor. Earn 1 month of Pro when they upgrade.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Invite peers with your unique link. We track referred tutors, active referrals, and rewards in one place.
        </p>

        <div className="mt-5 rounded-2xl border border-white/[0.1] bg-white/[0.05] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Your referral link</p>
          <p className="mt-2 break-all text-sm text-foreground">{referralLink}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.1] bg-background p-4 text-foreground backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Total referred</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{stats.totalReferred}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.1] bg-background p-4 text-foreground backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Active referred</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{stats.activeReferred}</p>
        </div>
        <div className="rounded-2xl border border-white/[0.1] bg-background p-4 text-foreground backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Rewards earned</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{stats.rewardsEarned}</p>
        </div>
      </div>

      <ReferralShareCard referralLink={referralLink} />
    </div>
  );
}
