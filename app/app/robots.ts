import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    rules: [
      // Default rules for all search engines
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/students/",
          "/bookings/",
          "/services/",
          "/availability/",
          "/analytics/",
          "/marketing/",
          "/ai/",
          "/studio/",
          "/onboarding/",
          "/admin/",
          "/classroom/",
          "/copilot/",
          "/student/practice/",
          "/student/settings/",
          "/student/billing/",
        ],
      },
      // OpenAI GPTBot - Allow public content for ChatGPT search
      {
        userAgent: "GPTBot",
        allow: [
          "/",
          "/blog/",
          "/for/",
          "/profile/",
          "/bio/",
          "/book/",
          "/products/",
          "/help/",
          "/tutors/",
          "/llms.txt",
          "/feed.xml",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
          "/onboarding/",
        ],
      },
      // Google Gemini / Bard
      {
        userAgent: "Google-Extended",
        allow: [
          "/",
          "/blog/",
          "/for/",
          "/profile/",
          "/bio/",
          "/book/",
          "/products/",
          "/help/",
          "/tutors/",
          "/llms.txt",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
        ],
      },
      // Anthropic Claude Web
      {
        userAgent: "Claude-Web",
        allow: [
          "/",
          "/blog/",
          "/for/",
          "/profile/",
          "/bio/",
          "/book/",
          "/products/",
          "/help/",
          "/tutors/",
          "/llms.txt",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
        ],
      },
      // Anthropic ClaudeBot
      {
        userAgent: "ClaudeBot",
        allow: [
          "/",
          "/blog/",
          "/for/",
          "/profile/",
          "/bio/",
          "/book/",
          "/products/",
          "/help/",
          "/tutors/",
          "/llms.txt",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
        ],
      },
      // Perplexity AI
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
        ],
      },
      // Common Crawl (used by many AI systems)
      {
        userAgent: "CCBot",
        allow: [
          "/",
          "/blog/",
          "/for/",
          "/profile/",
          "/help/",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
        ],
      },
      // Cohere AI
      {
        userAgent: "cohere-ai",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard/",
          "/settings/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

