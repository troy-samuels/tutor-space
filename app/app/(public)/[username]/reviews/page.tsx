export { generateMetadata } from "../page";

import { PublicSitePage } from "@/components/marketing/public-site-page";
import { loadPublicSite } from "../load-site";

type PageParams = {
  username: string;
};

export default async function PublicReviewsPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  const { siteProps, reviewFormProps } = await loadPublicSite(resolvedParams, "home");
  return <PublicSitePage siteProps={siteProps} reviewFormProps={reviewFormProps} />;
}
