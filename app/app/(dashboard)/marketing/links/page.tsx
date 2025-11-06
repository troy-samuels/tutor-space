import { createClient } from "@/lib/supabase/server";
import { LinkManager } from "@/components/marketing/link-manager";
import type { LinkRecord } from "@/lib/actions/links";

type LinkAnalyticsPoint = {
  date: string;
  count: number;
};

type MarketingProfile = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_handle: string | null;
  x_handle: string | null;
};

export default async function LinkInBioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: links }, analytics] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "full_name, username, avatar_url, instagram_handle, tiktok_handle, facebook_handle, x_handle"
      )
      .eq("id", user.id)
      .single<MarketingProfile>(),
    supabase
      .from("links")
      .select("*")
      .eq("tutor_id", user.id)
      .order("sort_order", { ascending: true }) as Promise<{ data: LinkRecord[] | null }>,
    buildAnalytics(supabase, user.id),
  ]);

  return (
    <LinkManager
      initialLinks={links ?? []}
      profile={{
        full_name: profile?.full_name ?? "Tutor",
        username: profile?.username ?? "",
        avatar_url: profile?.avatar_url ?? null,
        socials: {
          instagram: profile?.instagram_handle ?? null,
          tiktok: profile?.tiktok_handle ?? null,
          facebook: profile?.facebook_handle ?? null,
          x: profile?.x_handle ?? null,
        },
      }}
      analytics={analytics}
    />
  );
}

async function buildAnalytics(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tutorId: string
): Promise<LinkAnalyticsPoint[] | undefined> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const windowStart = new Date(today);
  windowStart.setDate(windowStart.getDate() - 6);

  const { data, error } = await supabase
    .from("link_events")
    .select("clicked_at")
    .eq("tutor_id", tutorId)
    .gte("clicked_at", windowStart.toISOString());

  if (error) {
    if (error.code === "42P01") {
      return undefined;
    }
    return [];
  }

  const counts = new Map<string, number>();

  data?.forEach((event) => {
    if (!event?.clicked_at) return;
    const key = new Date(event.clicked_at).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from({ length: 7 }).map((_, index) => {
    const current = new Date(windowStart);
    current.setDate(windowStart.getDate() + index);
    const key = current.toISOString().slice(0, 10);
    return {
      date: key,
      count: counts.get(key) ?? 0,
    };
  });
}
