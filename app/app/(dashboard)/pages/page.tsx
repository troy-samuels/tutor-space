import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SiteConfig } from "@/lib/types/site";
import { normalizeSiteConfig } from "@/lib/site/site-config";
import { normalizeUsernameSlug } from "@/lib/utils/username-slug";
import StudioEditorClient from "./editor/studio-editor-client";

export const dynamic = "force-dynamic";

type ProfileBasics = {
  id: string;
  full_name: string | null;
  username: string | null;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
};

type ServiceLite = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
};

type ProductLite = {
  id: string;
  title: string;
  is_active: boolean | null;
  published: boolean | null;
};

export default async function PagesBuilder() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/pages");
  }

  // Parallelize all queries for faster load
  const [profileResult, siteResult, servicesResult, productsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, tagline, bio, avatar_url")
      .eq("id", user.id)
      .maybeSingle<ProfileBasics>(),
    supabase
      .from("tutor_sites")
      .select("id, config")
      .eq("tutor_id", user.id)
      .maybeSingle<{ id: string; config: SiteConfig | null }>(),
    supabase
      .from("services")
      .select("id, name, description, is_active")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("digital_products")
      .select("id, title, is_active, published")
      .eq("tutor_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const profile = profileResult.data;
  const siteRow = siteResult.data;
  const services = servicesResult.error ? [] : (servicesResult.data as ServiceLite[] | null);
  const products = productsResult.error ? [] : (productsResult.data as ProductLite[] | null);

  const initialConfig = normalizeSiteConfig(siteRow?.config);
  const siteId = siteRow?.id ?? null;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://app.tutorlingua.co";
  const shareHandleRaw = profile?.username ?? user.user_metadata?.user_name ?? user.email ?? "";
  const shareHandle = normalizeUsernameSlug(shareHandleRaw) || shareHandleRaw;
  const shareUrl = shareHandle ? `${appBaseUrl}/${shareHandle}` : appBaseUrl;

  return (
    <StudioEditorClient
      siteId={siteId}
      initialConfig={initialConfig}
      services={services ?? []}
      products={products ?? []}
      shareUrl={shareUrl}
      shareHandle={shareHandle}
      profile={{
        id: profile?.id ?? user.id,
        full_name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "Tutor",
        username: profile?.username ?? user.user_metadata?.user_name ?? user.email ?? "your-page",
        tagline: profile?.tagline ?? "Language tutor",
        bio: profile?.bio ?? "Share your teaching story and what makes your approach unique.",
        avatar_url: profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | null) ?? null,
      }}
    />
  );
}
