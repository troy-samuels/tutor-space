import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/*",
          "/dashboard/*",
          "/settings/*",
          "/students/*",
          "/bookings/*",
          "/services/*",
          "/availability/*",
          "/analytics/*",
          "/marketing/*",
          "/ai/*",
          "/studio/*",
          "/onboarding/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

