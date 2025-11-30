import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAllBlogPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const supabaseAdmin = createServiceRoleClient();
  const supabase = supabaseAdmin ?? (await createClient());

  // Get all blog posts for both locales
  const englishPosts = getAllBlogPosts("en");
  const spanishPosts = getAllBlogPosts("es");

  // Get all active tutor profiles for dynamic routes
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .eq("role", "tutor")
    .not("username", "is", null);

  // Get tutors with published mini-sites for root-level username routes
  const { data: publishedSites } = await supabase
    .from("tutor_sites")
    .select("tutor_id, updated_at, profiles!inner(username)")
    .eq("status", "published");

  const miniSiteUrls =
    publishedSites?.map((site) => ({
      url: `${baseUrl}/${(site.profiles as any).username}`,
      lastModified: site.updated_at ? new Date(site.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })) || [];

  const tutorUrls =
    profiles?.map((profile) => ({
      url: `${baseUrl}/book/${profile.username}`,
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) || [];

  const bioUrls =
    profiles?.map((profile) => ({
      url: `${baseUrl}/bio/${profile.username}`,
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) || [];

  const profileUrls =
    profiles?.map((profile) => ({
      url: `${baseUrl}/profile/${profile.username}`,
      lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
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
    ...englishBlogUrls,
    ...spanishBlogUrls,
  ];
}
