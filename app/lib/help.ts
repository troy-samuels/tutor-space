import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import readingTime from "reading-time";

// Help content directory
const HELP_DIR = path.join(process.cwd(), "docs", "help");

export interface HelpArticleMeta {
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  order: number;
  updatedAt: string;
  readingTime: number;
  locale: "en" | "es";
  alternateLocale?: {
    locale: "en" | "es";
    slug: string;
  };
}

export interface HelpArticle extends HelpArticleMeta {
  content: string;
  rawContent: string;
}

export interface HelpCategory {
  slug: string;
  label: string;
  description: string;
  icon: string;
  articleCount: number;
  articles: HelpArticleMeta[];
}

// Category metadata
const CATEGORY_META: Record<string, { label: string; labelEs: string; description: string; descriptionEs: string; icon: string }> = {
  "getting-started": {
    label: "Getting Started",
    labelEs: "Primeros Pasos",
    description: "Set up your account and create your first service",
    descriptionEs: "Configura tu cuenta y crea tu primer servicio",
    icon: "Rocket",
  },
  "bookings": {
    label: "Bookings & Scheduling",
    labelEs: "Reservas y Programación",
    description: "Manage lessons and student appointments",
    descriptionEs: "Gestiona lecciones y citas con estudiantes",
    icon: "CalendarDays",
  },
  "payments": {
    label: "Payments",
    labelEs: "Pagos",
    description: "Accept payments and track revenue",
    descriptionEs: "Acepta pagos y rastrea tus ingresos",
    icon: "CreditCard",
  },
  "calendar": {
    label: "Calendar Integration",
    labelEs: "Integración de Calendario",
    description: "Sync with Google or Outlook calendar",
    descriptionEs: "Sincroniza con Google o Outlook",
    icon: "CalendarSync",
  },
};

/**
 * Get all help articles for a specific locale
 */
export function getAllHelpArticles(locale: "en" | "es" = "en"): HelpArticleMeta[] {
  const localeDir = path.join(HELP_DIR, locale);

  if (!fs.existsSync(localeDir)) {
    return [];
  }

  const articles: HelpArticleMeta[] = [];

  // Read all category directories
  const categories = fs.readdirSync(localeDir);

  for (const category of categories) {
    const categoryPath = path.join(localeDir, category);

    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(categoryPath, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(fileContent);

      // Calculate reading time
      const stats = readingTime(fileContent);

      const categoryMeta = CATEGORY_META[category] || {
        label: category,
        labelEs: category,
        description: "",
        descriptionEs: "",
        icon: "FileText",
      };

      articles.push({
        slug: data.slug || file.replace(".md", ""),
        title: data.title || "",
        description: data.description || "",
        category: category,
        categoryLabel: locale === "es" ? categoryMeta.labelEs : categoryMeta.label,
        order: data.order || 99,
        updatedAt: data.updatedAt || new Date().toISOString().split("T")[0],
        readingTime: Math.ceil(stats.minutes),
        locale: locale,
        alternateLocale: data.alternateLocale,
      });
    }
  }

  // Sort by category then by order
  return articles.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.order - b.order;
  });
}

/**
 * Get a single help article by slug
 */
export async function getHelpArticle(
  slug: string,
  locale: "en" | "es" = "en"
): Promise<HelpArticle | null> {
  const localeDir = path.join(HELP_DIR, locale);

  if (!fs.existsSync(localeDir)) {
    return null;
  }

  // Search through all category directories
  const categories = fs.readdirSync(localeDir);

  for (const category of categories) {
    const categoryPath = path.join(localeDir, category);

    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath);

    for (const file of files) {
      if (!file.endsWith(".md")) continue;

      const filePath = path.join(categoryPath, file);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      const articleSlug = data.slug || file.replace(".md", "");

      if (articleSlug === slug) {
        // Convert markdown to HTML
        const processedContent = await remark().use(html).process(content);
        const contentHtml = processedContent.toString();

        // Calculate reading time
        const stats = readingTime(content);

        const categoryMeta = CATEGORY_META[category] || {
          label: category,
          labelEs: category,
          description: "",
          descriptionEs: "",
          icon: "FileText",
        };

        return {
          slug: articleSlug,
          title: data.title || "",
          description: data.description || "",
          category: category,
          categoryLabel: locale === "es" ? categoryMeta.labelEs : categoryMeta.label,
          order: data.order || 99,
          updatedAt: data.updatedAt || new Date().toISOString().split("T")[0],
          readingTime: Math.ceil(stats.minutes),
          locale: locale,
          alternateLocale: data.alternateLocale,
          content: contentHtml,
          rawContent: content,
        };
      }
    }
  }

  return null;
}

/**
 * Get all help categories with their articles
 */
export function getHelpCategories(locale: "en" | "es" = "en"): HelpCategory[] {
  const articles = getAllHelpArticles(locale);
  const categoryMap = new Map<string, HelpArticleMeta[]>();

  // Group articles by category
  for (const article of articles) {
    const existing = categoryMap.get(article.category) || [];
    existing.push(article);
    categoryMap.set(article.category, existing);
  }

  // Build category objects with metadata
  const categories: HelpCategory[] = [];

  for (const [slug, categoryArticles] of categoryMap) {
    const meta = CATEGORY_META[slug] || {
      label: slug,
      labelEs: slug,
      description: "",
      descriptionEs: "",
      icon: "FileText",
    };

    categories.push({
      slug,
      label: locale === "es" ? meta.labelEs : meta.label,
      description: locale === "es" ? meta.descriptionEs : meta.description,
      icon: meta.icon,
      articleCount: categoryArticles.length,
      articles: categoryArticles.sort((a, b) => a.order - b.order),
    });
  }

  // Sort categories by a predefined order
  const categoryOrder = ["getting-started", "bookings", "payments", "calendar"];
  return categories.sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a.slug);
    const bIndex = categoryOrder.indexOf(b.slug);
    if (aIndex === -1 && bIndex === -1) return a.slug.localeCompare(b.slug);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

/**
 * Get articles by category
 */
export function getArticlesByCategory(
  category: string,
  locale: "en" | "es" = "en"
): HelpArticleMeta[] {
  return getAllHelpArticles(locale)
    .filter((article) => article.category === category)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get related articles (same category, excluding current)
 */
export function getRelatedArticles(
  article: HelpArticleMeta,
  limit: number = 3
): HelpArticleMeta[] {
  return getAllHelpArticles(article.locale)
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
}

/**
 * Generate JSON-LD schema for a help article
 */
export function generateHelpArticleSchema(article: HelpArticle, baseUrl: string) {
  const helpPath = article.locale === "es" ? "/es/help" : "/help";

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: article.title,
    description: article.description,
    step: [],
    dateModified: article.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}${helpPath}/${article.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "TutorLingua",
      url: baseUrl,
    },
    inLanguage: article.locale === "en" ? "en-US" : "es",
  };
}

/**
 * Generate breadcrumb schema for help article
 */
export function generateHelpBreadcrumbSchema(
  article: HelpArticle,
  baseUrl: string
) {
  const locale = article.locale;
  const helpPath = locale === "es" ? "/es/help" : "/help";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "es" ? "Inicio" : "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "es" ? "Centro de Ayuda" : "Help Center",
        item: `${baseUrl}${helpPath}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.categoryLabel,
        item: `${baseUrl}${helpPath}#${article.category}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: article.title,
        item: `${baseUrl}${helpPath}/${article.slug}`,
      },
    ],
  };
}
