import type { Metadata } from "next";
import { getPublicSiteData } from "@/lib/actions/tutor-sites";
import { getTutorCanonicalUrl } from "@/lib/utils/canonical";
import { PublicSitePage } from "@/components/marketing/public-site-page";
import { loadPublicSite } from "../load-site";

type PageParams = {
  username: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;

  try {
    const data = await getPublicSiteData(resolvedParams.username);
    const canonicalUsername = data.profile.username || resolvedParams.username;
    const name = data.profile.full_name || data.profile.username || canonicalUsername;
    const canonicalUrl = getTutorCanonicalUrl(canonicalUsername, "reviews");

    return {
      title: `Reviews for ${name} | TutorLingua`,
      description: `Read student reviews and testimonials for ${name}. See what students are saying about their language learning experience.`,
      alternates: { canonical: canonicalUrl },
      openGraph: {
        title: `Reviews for ${name} | TutorLingua`,
        description: `Read student reviews and testimonials for ${name}.`,
        url: canonicalUrl,
      },
    };
  } catch {
    return {
      title: "Reviews | TutorLingua",
      description: "Tutor reviews could not be found.",
    };
  }
}

export default async function PublicReviewsPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  const { siteProps, reviewFormProps } = await loadPublicSite(resolvedParams, "home");
  return <PublicSitePage siteProps={siteProps} reviewFormProps={reviewFormProps} />;
}
