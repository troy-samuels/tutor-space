import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PublicSitePage } from "@/components/marketing/public-site-page";
import { loadPublicSite } from "./load-site";

type PageParams = {
  username: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("public_profiles")
    .select("id, full_name, tagline, bio, avatar_url, username")
    .eq("username", resolvedParams.username.toLowerCase())
    .single();

  if (!profile) {
    return {
      title: "TutorLingua | Page not found",
    };
  }

  const { data: site } = await supabase
    .from("tutor_sites")
    .select("about_title, about_subtitle, about_body, hero_image_url")
    .eq("tutor_id", profile.id)
    .eq("status", "published")
    .single();

  const title = site?.about_title || profile.full_name || profile.username;
  const description =
    site?.about_subtitle ||
    profile.tagline ||
    profile.bio ||
    `Professional tutor page for ${profile.full_name || profile.username}`;

  return {
    title: `${title} | TutorLingua`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://tutorlingua.co/${profile.username ?? resolvedParams.username}`,
      images:
        site?.hero_image_url || profile.avatar_url
          ? [
              {
                url: site?.hero_image_url || profile.avatar_url!,
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: site?.hero_image_url || profile.avatar_url ? [site?.hero_image_url || profile.avatar_url!] : undefined,
    },
  };
}

export default async function PublicMiniSitePage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  const { siteProps, reviewFormProps } = await loadPublicSite(resolvedParams, "home");
  return <PublicSitePage siteProps={siteProps} reviewFormProps={reviewFormProps} />;
}
