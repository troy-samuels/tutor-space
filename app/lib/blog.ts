import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import readingTime from "reading-time";

// Blog content directory
const BLOG_DIR = path.join(process.cwd(), "docs", "blog");

// Supported blog locales
export type BlogLocale = "en" | "es" | "fr" | "pt" | "de" | "it" | "nl" | "ja" | "zh" | "ko";

// Locale metadata for schema generation
const LOCALE_CONFIG: Record<BlogLocale, { inLanguage: string; blogName: string; homeName: string; description: string }> = {
  en: {
    inLanguage: "en-US",
    blogName: "TutorLingua Blog",
    homeName: "Home",
    description: "Expert guides, tips, and strategies for independent language tutors. Learn how to grow your tutoring business, reduce platform fees, and keep more of your income.",
  },
  es: {
    inLanguage: "es",
    blogName: "Blog de TutorLingua",
    homeName: "Inicio",
    description: "Guías expertas, consejos y estrategias para tutores de idiomas independientes. Aprende cómo hacer crecer tu negocio de tutoría, reducir comisiones y conservar más de tus ingresos.",
  },
  fr: {
    inLanguage: "fr-FR",
    blogName: "Blog TutorLingua",
    homeName: "Accueil",
    description: "Guides experts, conseils et stratégies pour les tuteurs de langues indépendants. Apprenez à développer votre activité de tutorat, réduire les frais de plateforme et conserver plus de vos revenus.",
  },
  pt: {
    inLanguage: "pt-BR",
    blogName: "Blog TutorLingua",
    homeName: "Início",
    description: "Guias especializados, dicas e estratégias para tutores de idiomas independentes. Aprenda a expandir seu negócio de tutoria, reduzir taxas de plataforma e manter mais da sua renda.",
  },
  de: {
    inLanguage: "de-DE",
    blogName: "TutorLingua Blog",
    homeName: "Startseite",
    description: "Expertenratgeber, Tipps und Strategien für selbstständige Sprachlehrer. Erfahren Sie, wie Sie Ihr Nachhilfegeschäft ausbauen, Plattformgebühren reduzieren und mehr von Ihrem Einkommen behalten.",
  },
  it: {
    inLanguage: "it-IT",
    blogName: "Blog TutorLingua",
    homeName: "Home",
    description: "Guide esperte, consigli e strategie per tutor di lingue indipendenti. Scopri come far crescere la tua attività di tutoring, ridurre le commissioni delle piattaforme e trattenere più guadagni.",
  },
  nl: {
    inLanguage: "nl-NL",
    blogName: "TutorLingua Blog",
    homeName: "Home",
    description: "Expertgidsen, tips en strategieën voor onafhankelijke taaldocenten. Leer hoe u uw bijlesbedrijf kunt laten groeien, platformkosten kunt verlagen en meer van uw inkomen kunt behouden.",
  },
  ja: {
    inLanguage: "ja-JP",
    blogName: "TutorLingua ブログ",
    homeName: "ホーム",
    description: "独立した語学講師のための専門ガイド、ヒント、戦略。チューター事業の成長、プラットフォーム手数料の削減、収入をより多く残す方法を学びましょう。",
  },
  zh: {
    inLanguage: "zh-CN",
    blogName: "TutorLingua 博客",
    homeName: "首页",
    description: "为独立语言教师提供的专业指南、技巧和策略。了解如何发展您的辅导业务、降低平台费用并保留更多收入。",
  },
  ko: {
    inLanguage: "ko-KR",
    blogName: "TutorLingua 블로그",
    homeName: "홈",
    description: "독립 어학 튜터를 위한 전문 가이드, 팁 및 전략. 과외 비즈니스 성장, 플랫폼 수수료 절감 및 수입 유지 방법을 알아보세요.",
  },
};

// Get blog path for a locale
function getBlogPath(locale: BlogLocale): string {
  return locale === "en" ? "/blog" : `/${locale}/blog`;
}

// FAQ item for AEO (Answer Engine Optimization)
export interface FAQItem {
  question: string;
  answer: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  wordCount: number;
  featured: boolean;
  seoKeywords: string[];
  relatedArticles: string[];
  locale: BlogLocale;
  alternateLocale?: {
    locale: BlogLocale;
    slug: string;
  };
  cluster: string;
  position: "complement" | "replacement" | "authority";
  // AEO (Answer Engine Optimization) fields
  quickAnswer?: string; // One-sentence answer for AI extraction
  keyTakeaways?: string[]; // Bullet-point summaries for AI
  faqs?: FAQItem[]; // Related questions for FAQ schema
}

export interface BlogPost extends BlogPostMeta {
  content: string;
  rawContent: string;
}

/**
 * Get all blog posts for a specific locale
 */
export function getAllBlogPosts(locale: BlogLocale = "en"): BlogPostMeta[] {
  const localeDir = path.join(BLOG_DIR, locale);

  if (!fs.existsSync(localeDir)) {
    return [];
  }

  const posts: BlogPostMeta[] = [];

  // Read all cluster directories
  const clusters = fs.readdirSync(localeDir);

  for (const cluster of clusters) {
    const clusterPath = path.join(localeDir, cluster);

    if (!fs.statSync(clusterPath).isDirectory()) continue;

    const files = fs.readdirSync(clusterPath);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(clusterPath, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      // Calculate reading time if not in frontmatter
      const stats = readingTime(fileContent);

      posts.push({
        slug: data.slug || file.replace(".md", ""),
        title: data.title || "",
        description: data.description || "",
        category: data.category || "",
        tags: data.tags || [],
        author: data.author || "TutorLingua Team",
        publishedAt: data.publishedAt || new Date().toISOString().split("T")[0],
        updatedAt: data.updatedAt || data.publishedAt || new Date().toISOString().split("T")[0],
        readingTime: data.readingTime || Math.ceil(stats.minutes),
        wordCount: data.wordCount || stats.words,
        featured: data.featured || false,
        seoKeywords: data.seoKeywords || [],
        relatedArticles: data.relatedArticles || [],
        locale: locale,
        alternateLocale: data.alternateLocale,
        cluster: cluster,
        position: data.position || "authority",
        // AEO fields
        quickAnswer: data.quickAnswer,
        keyTakeaways: data.keyTakeaways || [],
        faqs: data.faqs || [],
      });
    }
  }

  // Sort by date (newest first) and featured status
  return posts.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(
  slug: string,
  locale: BlogLocale = "en"
): Promise<BlogPost | null> {
  const localeDir = path.join(BLOG_DIR, locale);

  if (!fs.existsSync(localeDir)) {
    return null;
  }

  // Search through all cluster directories
  const clusters = fs.readdirSync(localeDir);

  for (const cluster of clusters) {
    const clusterPath = path.join(localeDir, cluster);

    if (!fs.statSync(clusterPath).isDirectory()) continue;

    const files = fs.readdirSync(clusterPath);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(clusterPath, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      const postSlug = data.slug || file.replace(".md", "");

      if (postSlug === slug) {
        // Convert markdown to HTML
        const processedContent = await remark().use(html).process(content);
        const contentHtml = processedContent.toString();

        // Calculate reading time
        const stats = readingTime(content);

        return {
          slug: postSlug,
          title: data.title || "",
          description: data.description || "",
          category: data.category || "",
          tags: data.tags || [],
          author: data.author || "TutorLingua Team",
          publishedAt: data.publishedAt || new Date().toISOString().split("T")[0],
          updatedAt: data.updatedAt || data.publishedAt || new Date().toISOString().split("T")[0],
          readingTime: data.readingTime || Math.ceil(stats.minutes),
          wordCount: data.wordCount || stats.words,
          featured: data.featured || false,
          seoKeywords: data.seoKeywords || [],
          relatedArticles: data.relatedArticles || [],
          locale: locale,
          alternateLocale: data.alternateLocale,
          cluster: cluster,
          position: data.position || "authority",
          // AEO fields
          quickAnswer: data.quickAnswer,
          keyTakeaways: data.keyTakeaways || [],
          faqs: data.faqs || [],
          content: contentHtml,
          rawContent: content,
        };
      }
    }
  }

  return null;
}

/**
 * Get all unique categories
 */
export function getAllCategories(locale: BlogLocale = "en"): string[] {
  const posts = getAllBlogPosts(locale);
  const categories = new Set(posts.map((post) => post.category).filter(Boolean));
  return Array.from(categories).sort();
}

/**
 * Get all unique tags
 */
export function getAllTags(locale: BlogLocale = "en"): string[] {
  const posts = getAllBlogPosts(locale);
  const tags = new Set(posts.flatMap((post) => post.tags));
  return Array.from(tags).sort();
}

/**
 * Get posts by category
 */
export function getPostsByCategory(
  category: string,
  locale: BlogLocale = "en"
): BlogPostMeta[] {
  return getAllBlogPosts(locale).filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get posts by tag
 */
export function getPostsByTag(
  tag: string,
  locale: BlogLocale = "en"
): BlogPostMeta[] {
  return getAllBlogPosts(locale).filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get related posts
 */
export function getRelatedPosts(
  post: BlogPostMeta,
  limit: number = 3
): BlogPostMeta[] {
  const allPosts = getAllBlogPosts(post.locale);

  // First, try to get explicitly related articles
  if (post.relatedArticles.length > 0) {
    const related = allPosts.filter(
      (p) => post.relatedArticles.includes(p.slug) && p.slug !== post.slug
    );
    if (related.length >= limit) {
      return related.slice(0, limit);
    }
  }

  // Otherwise, find posts with similar tags or same category
  const scored = allPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = 0;

      // Same category
      if (p.category === post.category) score += 3;

      // Same cluster
      if (p.cluster === post.cluster) score += 2;

      // Shared tags
      const sharedTags = p.tags.filter((t) => post.tags.includes(t));
      score += sharedTags.length;

      return { post: p, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.post);
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(
  locale: BlogLocale = "en",
  limit: number = 5
): BlogPostMeta[] {
  return getAllBlogPosts(locale)
    .filter((post) => post.featured)
    .slice(0, limit);
}

/**
 * Generate JSON-LD schema for a blog post
 */
export function generateBlogPostSchema(post: BlogPost, baseUrl: string) {
  const blogPath = getBlogPath(post.locale);
  const config = LOCALE_CONFIG[post.locale];

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: post.author,
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "TutorLingua",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}${blogPath}/${post.slug}`,
    },
    url: `${baseUrl}${blogPath}/${post.slug}`,
    keywords: post.seoKeywords.join(", "),
    articleSection: post.category,
    wordCount: post.wordCount,
    inLanguage: config.inLanguage,
    isPartOf: {
      "@type": "Blog",
      name: config.blogName,
      url: `${baseUrl}${blogPath}`,
    },
  };
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(
  post: BlogPost,
  baseUrl: string
) {
  const blogPath = getBlogPath(post.locale);
  const config = LOCALE_CONFIG[post.locale];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: config.homeName,
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}${blogPath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.category,
        item: `${baseUrl}${blogPath}/category/${encodeURIComponent(post.category.toLowerCase())}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: `${baseUrl}${blogPath}/${post.slug}`,
      },
    ],
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TutorLingua",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
    },
    sameAs: [
      "https://twitter.com/tutorlingua",
      "https://www.linkedin.com/company/tutorlingua",
      "https://www.instagram.com/tutorlingua",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: `${baseUrl}/contact`,
    },
  };
}

/**
 * Generate WebSite schema for the blog
 */
export function generateWebSiteSchema(baseUrl: string, locale: BlogLocale = "en") {
  const blogPath = getBlogPath(locale);
  const config = LOCALE_CONFIG[locale];

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.blogName,
    url: `${baseUrl}${blogPath}`,
    description: config.description,
    publisher: {
      "@type": "Organization",
      name: "TutorLingua",
      url: baseUrl,
    },
    inLanguage: config.inLanguage,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}${blogPath}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Blog schema (CollectionPage) for blog index
 */
export function generateBlogSchema(baseUrl: string, locale: BlogLocale = "en") {
  const blogPath = getBlogPath(locale);
  const config = LOCALE_CONFIG[locale];

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: config.blogName,
    description: config.description,
    url: `${baseUrl}${blogPath}`,
    inLanguage: config.inLanguage,
    publisher: {
      "@type": "Organization",
      name: "TutorLingua",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}${blogPath}`,
    },
  };
}

/**
 * Generate ItemList schema for blog posts
 */
export function generateBlogItemListSchema(
  posts: BlogPostMeta[],
  baseUrl: string,
  locale: BlogLocale = "en"
) {
  const blogPath = getBlogPath(locale);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.slice(0, 10).map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        url: `${baseUrl}${blogPath}/${post.slug}`,
        datePublished: post.publishedAt,
        author: {
          "@type": "Organization",
          name: post.author,
        },
      },
    })),
  };
}

/**
 * Generate blog index breadcrumb schema
 */
export function generateBlogIndexBreadcrumbSchema(
  baseUrl: string,
  locale: BlogLocale = "en"
) {
  const blogPath = getBlogPath(locale);
  const config = LOCALE_CONFIG[locale];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: config.homeName,
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}${blogPath}`,
      },
    ],
  };
}
