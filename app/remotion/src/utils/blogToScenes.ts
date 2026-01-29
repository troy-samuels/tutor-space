import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * Branding configuration for videos
 */
export interface VideoBranding {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  handle: string;
}

/**
 * Input props for the KeyTakeawaysShort composition
 */
export interface BlogVideoInput {
  slug: string;
  title: string;
  hook: string;
  keyTakeaways: string[];
  branding: VideoBranding;
}

/**
 * Blog post frontmatter structure
 */
interface BlogFrontmatter {
  title: string;
  slug: string;
  description: string;
  quickAnswer?: string;
  keyTakeaways?: string[];
  category?: string;
  tags?: string[];
}

/**
 * Default branding for TutorLingua videos
 */
const DEFAULT_BRANDING: VideoBranding = {
  primaryColor: "#6366f1",
  secondaryColor: "#f59e0b",
  logo: "/logo.png",
  handle: "@tutorlingua",
};

/**
 * Generate a simple, attention-grabbing hook (max 40 chars)
 * Uses direct questions that resonate with tutors
 */
function generateHook(title: string, quickAnswer?: string): string {
  // If there's a quickAnswer that's short enough, use it
  if (quickAnswer && quickAnswer.length <= 40) {
    return quickAnswer.endsWith("?") ? quickAnswer : `${quickAnswer}?`;
  }

  // Convert title to a simple, punchy hook
  const lowercaseTitle = title.toLowerCase();

  // Platform fees / commissions
  if (lowercaseTitle.includes("fee") || lowercaseTitle.includes("commission")) {
    return "Losing money to platform fees?";
  }

  // Income / earnings
  if (lowercaseTitle.includes("income") || lowercaseTitle.includes("earn")) {
    return "Want to keep more income?";
  }

  // Booking / scheduling
  if (lowercaseTitle.includes("booking") || lowercaseTitle.includes("schedule")) {
    return "Tired of scheduling chaos?";
  }

  // Students / retention
  if (lowercaseTitle.includes("student") || lowercaseTitle.includes("retention")) {
    return "Struggling to keep students?";
  }

  // Marketing / growth
  if (lowercaseTitle.includes("marketing") || lowercaseTitle.includes("grow")) {
    return "Need more students?";
  }

  // Pricing
  if (lowercaseTitle.includes("price") || lowercaseTitle.includes("charge")) {
    return "Not sure what to charge?";
  }

  // Tools / tech
  if (lowercaseTitle.includes("tool") || lowercaseTitle.includes("tech")) {
    return "Using the wrong tools?";
  }

  // Business / start
  if (lowercaseTitle.includes("business") || lowercaseTitle.includes("start")) {
    return "Ready to go independent?";
  }

  // Default: Simple curiosity hook
  return "Here's what top tutors know...";
}

/**
 * Load and parse a blog post from the filesystem
 */
export function loadBlogPost(
  slug: string,
  locale: string = "en"
): BlogFrontmatter | null {
  const blogDir = path.join(process.cwd(), "..", "docs", "blog", locale);

  if (!fs.existsSync(blogDir)) {
    console.error(`Blog directory not found: ${blogDir}`);
    return null;
  }

  // Search through cluster directories
  const clusters = fs.readdirSync(blogDir);

  for (const cluster of clusters) {
    const clusterPath = path.join(blogDir, cluster);

    if (!fs.statSync(clusterPath).isDirectory()) continue;

    const files = fs.readdirSync(clusterPath);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(clusterPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(content);

      const postSlug = data.slug || file.replace(".md", "");

      if (postSlug === slug) {
        return data as BlogFrontmatter;
      }
    }
  }

  return null;
}

/**
 * Convert a blog post to video input props
 */
export function blogToVideoInput(
  post: BlogFrontmatter,
  brandingOverrides?: Partial<VideoBranding>
): BlogVideoInput {
  // Get key takeaways (limit to 3)
  let takeaways = post.keyTakeaways?.slice(0, 3) || [];

  // If no takeaways, use simple, action-oriented defaults
  if (takeaways.length === 0) {
    takeaways = [
      "Cut your platform fees",
      "Keep more of your income",
      "Get direct student bookings",
    ];
  }

  // Pad to exactly 3 if needed
  while (takeaways.length < 3) {
    takeaways.push("Discover more insights in the full article");
  }

  return {
    slug: post.slug,
    title: post.title,
    hook: generateHook(post.title, post.quickAnswer),
    keyTakeaways: takeaways,
    branding: {
      ...DEFAULT_BRANDING,
      ...brandingOverrides,
    },
  };
}

/**
 * Get video input props from a blog slug
 */
export function getVideoInputFromSlug(
  slug: string,
  locale: string = "en",
  brandingOverrides?: Partial<VideoBranding>
): BlogVideoInput | null {
  const post = loadBlogPost(slug, locale);

  if (!post) {
    console.error(`Blog post not found: ${slug} (locale: ${locale})`);
    return null;
  }

  return blogToVideoInput(post, brandingOverrides);
}

/**
 * List all blog post slugs for a cluster
 */
export function listBlogSlugs(
  cluster: string,
  locale: string = "en"
): string[] {
  const clusterPath = path.join(
    process.cwd(),
    "..",
    "docs",
    "blog",
    locale,
    cluster
  );

  if (!fs.existsSync(clusterPath)) {
    console.error(`Cluster not found: ${clusterPath}`);
    return [];
  }

  const files = fs.readdirSync(clusterPath);
  const slugs: string[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const filePath = path.join(clusterPath, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(content);

    slugs.push(data.slug || file.replace(".md", ""));
  }

  return slugs;
}
