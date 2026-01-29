import { getAllBlogPosts, BlogLocale } from "@/lib/blog";

export const revalidate = 3600; // Revalidate every hour

const SUPPORTED_LOCALES: BlogLocale[] = ["en", "es", "fr", "pt", "de", "it", "nl", "ja", "zh", "ko"];

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getBlogPath(locale: BlogLocale): string {
  return locale === "en" ? "/blog" : `/${locale}/blog`;
}

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  // Check for locale parameter
  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale") as BlogLocale | null;
  const locale: BlogLocale = localeParam && SUPPORTED_LOCALES.includes(localeParam) ? localeParam : "en";

  const blogPath = getBlogPath(locale);
  const posts = getAllBlogPosts(locale);

  // Get the most recent post date for lastBuildDate
  const lastBuildDate = posts.length > 0
    ? new Date(posts[0].publishedAt).toUTCString()
    : new Date().toUTCString();

  const feedTitle = locale === "en"
    ? "TutorLingua Blog"
    : `TutorLingua Blog (${locale.toUpperCase()})`;

  const feedDescription = locale === "en"
    ? "Expert guides, tips, and strategies for independent language tutors. Learn how to grow your tutoring business, reduce platform fees, and keep more of your income."
    : `Expert guides and strategies for independent language tutors in ${locale.toUpperCase()}.`;

  const rssItems = posts
    .slice(0, 50) // Limit to 50 most recent posts
    .map((post) => {
      const pubDate = new Date(post.publishedAt).toUTCString();
      const link = `${baseUrl}${blogPath}/${post.slug}`;

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(post.category)}</category>
      ${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join("\n      ")}
      <author>hello@tutorlingua.co (${escapeXml(post.author)})</author>
    </item>`;
    })
    .join("");

  const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${feedTitle}</title>
    <link>${baseUrl}${blogPath}</link>
    <description>${escapeXml(feedDescription)}</description>
    <language>${locale}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml${locale !== "en" ? `?locale=${locale}` : ""}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>${feedTitle}</title>
      <link>${baseUrl}</link>
    </image>
    <copyright>Copyright ${new Date().getFullYear()} TutorLingua. All rights reserved.</copyright>
    <managingEditor>hello@tutorlingua.co (TutorLingua Team)</managingEditor>
    <webMaster>hello@tutorlingua.co (TutorLingua Team)</webMaster>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rssFeed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
