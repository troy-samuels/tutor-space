import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAllBlogPosts } from "@/lib/blog";
import { NICHE_DATA } from "@/lib/marketing/niche-data";
import { listPublishedSitesWithProfiles } from "@/lib/repositories/tutor-sites";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Get all blog posts for both locales
  const englishPosts = getAllBlogPosts("en");
  const spanishPosts = getAllBlogPosts("es");

  // Get only ACTIVE tutor profiles for dynamic routes
  const { data: activeProfiles } = await supabase
    .from("profiles")
    .select("id, username, updated_at")
    .eq("role", "tutor")
    .eq("account_status", "active")
    .not("username", "is", null);

  // Get tutors with published mini-sites for root-level username routes
  const { data: publishedSites } = await listPublishedSitesWithProfiles(supabase);

  // Get tutors with at least one active service (for /book URLs)
  const { data: tutorsWithServices } = await supabase
    .from("services")
    .select("tutor_id, profiles!inner(username, updated_at, account_status)")
    .eq("is_active", true)
    .is("deleted_at", null)
    .eq("profiles.account_status", "active");

  // Get unique tutors with services
  const tutorServiceMap = new Map<string, { username: string; updated_at: string }>();
  tutorsWithServices?.forEach((service) => {
    const profile = service.profiles as any;
    if (profile?.username && !tutorServiceMap.has(profile.username)) {
      tutorServiceMap.set(profile.username, {
        username: profile.username,
        updated_at: profile.updated_at,
      });
    }
  });

  // Get tutors with published digital products (for /products URLs)
  const { data: tutorsWithProducts } = await supabase
    .from("digital_products")
    .select("tutor_id, profiles!inner(username, updated_at, account_status)")
    .eq("published", true)
    .eq("profiles.account_status", "active");

  // Get unique tutors with products
  const tutorProductMap = new Map<string, { username: string; updated_at: string }>();
  tutorsWithProducts?.forEach((product) => {
    const profile = product.profiles as any;
    if (profile?.username && !tutorProductMap.has(profile.username)) {
      tutorProductMap.set(profile.username, {
        username: profile.username,
        updated_at: profile.updated_at,
      });
    }
  });

  const miniSiteUrls =
    publishedSites?.map((site) => ({
      url: `${baseUrl}/${(site.profiles as any).username}`,
      lastModified: site.updated_at ? new Date(site.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })) || [];

  // Only include /book URLs for tutors with active services
  const tutorUrls = Array.from(tutorServiceMap.values()).map((tutor) => ({
    url: `${baseUrl}/book/${tutor.username}`,
    lastModified: tutor.updated_at ? new Date(tutor.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Bio and profile URLs only for active tutors
  const bioUrls =
    activeProfiles?.map((profile) => ({
      url: `${baseUrl}/bio/${profile.username}`,
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) || [];

  const profileUrls =
    activeProfiles?.map((profile) => ({
      url: `${baseUrl}/profile/${profile.username}`,
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })) || [];

  // Products page URLs only for tutors with published digital products
  const productsUrls = Array.from(tutorProductMap.values()).map((tutor) => ({
    url: `${baseUrl}/products/${tutor.username}`,
    lastModified: tutor.updated_at ? new Date(tutor.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Reviews page URLs (for tutors with published sites)
  const reviewsUrls =
    publishedSites?.map((site) => ({
      url: `${baseUrl}/${(site.profiles as any).username}/reviews`,
      lastModified: site.updated_at ? new Date(site.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })) || [];

  // English blog post URLs
  const englishBlogUrls = englishPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: post.featured ? 0.8 : 0.7,
  }));

  // Spanish blog post URLs
  const spanishBlogUrls = spanishPosts.map((post) => ({
    url: `${baseUrl}/es/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: post.featured ? 0.8 : 0.7,
  }));

  const nicheUrls = (Object.keys(NICHE_DATA) as Array<keyof typeof NICHE_DATA>).map((slug) => ({
    url: `${baseUrl}/for/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // FAQ page
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Blog index pages
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/es/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...miniSiteUrls,
    ...tutorUrls,
    ...bioUrls,
    ...profileUrls,
    ...productsUrls,
    ...reviewsUrls,
    ...englishBlogUrls,
    ...spanishBlogUrls,
    ...nicheUrls,
  ];
}
