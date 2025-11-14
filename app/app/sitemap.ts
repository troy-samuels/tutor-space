import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const supabase = await createClient();

  // Get all active tutor profiles for dynamic routes
  const { data: profiles } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .eq("role", "tutor")
    .not("username", "is", null);

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
    ...tutorUrls,
    ...bioUrls,
    ...profileUrls,
  ];
}

