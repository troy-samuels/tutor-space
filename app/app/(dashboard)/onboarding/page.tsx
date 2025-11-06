import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Facebook,
  Instagram,
  Music4,
  Twitter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

const STEPS = [
  {
    label: "Add your TutorLingua profile details",
    description: "Upload a photo, write your bio, add languages, and craft your parent credibility message.",
  },
  {
    label: "Connect your social profiles",
    description: "Add Instagram, TikTok, Facebook, and X handles so parents can follow your brand.",
  },
  {
    label: "Set your services and session packages",
    description: "Create your 1:1 lessons, bundles, and pricing so students can book and pay up front.",
  },
  {
    label: "Publish availability and sync calendars",
    description: "Connect Stripe, sync your calendar, and share your TutorLingua link across channels.",
  },
] as const;

type OnboardingProfile = {
  username: string | null;
  bio: string | null;
  tagline: string | null;
  full_name: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_handle: string | null;
  x_handle: string | null;
};

const SOCIAL_CHANNELS = [
  {
    field: "instagram_handle",
    label: "Instagram",
    icon: Instagram,
    helper: "Add an Instagram handle to showcase reels and stories.",
  },
  {
    field: "tiktok_handle",
    label: "TikTok",
    icon: Music4,
    helper: "Link bite-sized lesson clips to drive conversions.",
  },
  {
    field: "facebook_handle",
    label: "Facebook",
    icon: Facebook,
    helper: "Make it easy for parents to follow announcements.",
  },
  {
    field: "x_handle",
    label: "X",
    icon: Twitter,
    helper: "Share quick lesson tips and learner wins.",
  },
] as const satisfies ReadonlyArray<{
  field: keyof Pick<OnboardingProfile, "instagram_handle" | "tiktok_handle" | "facebook_handle" | "x_handle">;
  label: string;
  icon: typeof Instagram;
  helper: string;
}>;

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, bio, tagline, full_name, instagram_handle, tiktok_handle, facebook_handle, x_handle"
    )
    .eq("id", user?.id ?? "")
    .single();

  const profileComplete = Boolean(
    profile?.username && profile?.bio && profile?.tagline && profile?.full_name
  );

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-border bg-background p-8 shadow-sm">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground">Welcome to TutorLingua!</h1>
        <p className="text-sm text-muted-foreground">
          Let&apos;s get your tutor site ready so students can start booking within minutes.
        </p>
      </header>

      <div className="space-y-5">
        {STEPS.map((step, index) => (
          <div
            key={step.label}
            className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-4 sm:px-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-brown text-sm font-semibold text-brand-white">
                {index + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border/60 bg-white/80 px-5 py-6 shadow-sm backdrop-blur">
        <header className="space-y-1.5">
          <h2 className="text-lg font-semibold text-foreground">
            Connect your social proof & parent credibility
          </h2>
          <p className="text-sm text-muted-foreground">
            Parents convert faster when they can browse your most active channels and see proof of progress.
          </p>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {SOCIAL_CHANNELS.map((social) => {
            const Icon = social.icon;
            const handle = (profile as OnboardingProfile | null)?.[social.field];
            const displayHandle =
              handle && handle.startsWith("@") ? handle : handle ? `@${handle}` : null;
            const isConnected = Boolean(displayHandle);

            return (
              <div
                key={social.field}
                className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-muted/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-brown/10">
                      <Icon className="h-5 w-5 text-brand-brown" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{social.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {displayHandle ?? social.helper}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      isConnected ? "bg-emerald-50 text-emerald-600" : "bg-brand-brown/10 text-brand-brown"
                    }`}
                  >
                    {isConnected ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    {isConnected ? "Connected" : "Pending"}
                  </span>
                </div>
                <Link
                  href="/settings/profile"
                  className="inline-flex h-10 items-center justify-center rounded-full border border-brand-brown/30 bg-white px-4 text-xs font-semibold text-brand-brown transition hover:bg-brand-brown/10"
                >
                  {isConnected ? "Update handle" : "Add handle"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/settings/profile"
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-brown px-6 text-sm font-semibold text-brand-white shadow-sm transition hover:bg-brand-brown/90"
        >
          Complete your profile
        </Link>
        <Link
          href="/settings/calendar"
          className="inline-flex h-11 items-center justify-center rounded-md border border-input px-6 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Connect calendar sync
        </Link>
        {!profileComplete && (
          <Link
            href="/dashboard?skipOnboarding=1"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input px-6 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Skip for now
          </Link>
        )}
      </div>

      {profileComplete && profile?.username ? (
        <div className="rounded-2xl border border-brand-brown/30 bg-brand-brown/5 px-5 py-4 text-sm text-muted-foreground">
          <p>
            Your TutorLingua site is live at{" "}
            <Link
              href={`/@${profile.username}`}
              className="font-semibold text-brand-brown hover:underline"
            >
              tutorlingua.co/@{profile.username}
            </Link>
            . Share it with parents to showcase your credibility page.
          </p>
        </div>
      ) : null}

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Once your profile is complete, TutorLingua automates bookings, payments, and parent updates for you.
      </p>
    </section>
  );
}
