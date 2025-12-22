import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicSiteData } from "@/lib/actions/tutor-sites";
import { SITE_THEMES } from "@/lib/themes";
import PublicProfileClient from "./public-profile-client";

type PageParams = {
  username: string;
};

export async function generateMetadata(
  { params }: { params: Promise<PageParams> }
): Promise<Metadata> {
  const resolvedParams = await params;

  try {
    const data = await getPublicSiteData(resolvedParams.username);
    const canonicalUsername = data.profile.username || resolvedParams.username;
    const name = data.profile.full_name || data.profile.username || canonicalUsername;
    const description =
      data.profile.tagline || data.site.config.bio || `Book a lesson with ${name} on TutorLingua.`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
    const canonicalUrl = `${baseUrl.replace(/\/+$/, "")}/${canonicalUsername}`;

    return {
      title: `${name} | TutorLingua`,
      description,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `${name} | TutorLingua`,
        description,
        url: canonicalUrl,
      },
    };
  } catch {
    return {
      title: "Tutor not found | TutorLingua",
      description: "This tutor profile could not be found.",
    };
  }
}

export default async function PublicProfilePage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  const data = await getPublicSiteData(resolvedParams.username);
  if (!data) {
    notFound();
  }

  const { profile, site, services, products, reviews, nextSlot } = data;
  if (profile.username && profile.username !== resolvedParams.username) {
    redirect(`/${profile.username}`);
  }
  const theme = SITE_THEMES[site.config.themeId] ?? SITE_THEMES.academic;
  const visibility = new Map(site.config.blocks.map((b) => [b.type, b.isVisible !== false] as const));

  return (
    <PublicProfileClient
      username={profile.username || resolvedParams.username}
      profile={{
        full_name: profile.full_name || profile.username || "Tutor",
        tagline: site.config.hero?.customHeadline || profile.tagline || "",
        bio: site.config.bio || profile.bio || "",
        avatar_url: profile.avatar_url,
        languages_taught: Array.isArray(profile.languages_taught)
          ? (profile.languages_taught as string[])
          : typeof profile.languages_taught === "string"
            ? (profile.languages_taught as string).split(",").map((s) => s.trim()).filter(Boolean)
            : [],
      }}
      coverImage={site.config.hero?.coverImage || null}
      themeId={site.config.themeId}
      accentColor={theme.accentColor}
      bgColor={theme.bgPage}
      services={services}
      products={products}
      reviews={reviews}
      nextSlot={nextSlot}
      visibility={{
        about: visibility.get("about") ?? true,
        services: visibility.get("services") ?? true,
        products: visibility.get("products") ?? true,
        reviews: visibility.get("reviews") ?? true,
        faq: visibility.get("faq") ?? true,
      }}
      faqs={site.config.faq ?? []}
    />
  );
}
