/**
 * SEO Auto-Generation Utilities
 * Creates unique, consistent metadata for tutor pages across the platform
 */

type TutorProfile = {
  username: string;
  full_name: string | null;
  tagline?: string | null;
  bio?: string | null;
  languages_taught: string[];
  average_rating?: number | null;
  testimonial_count?: number | null;
  total_students?: number | null;
  total_lessons?: number | null;
  years_teaching?: number | null;
};

type PageType = "site" | "profile" | "bio" | "book" | "products" | "reviews";

/**
 * Generate unique page title based on page context
 * Each page type has a distinct pattern to avoid duplicate content
 */
export function generatePageTitle(
  profile: TutorProfile,
  pageType: PageType
): string {
  const name = profile.full_name || profile.username;
  const primaryLang = profile.languages_taught?.[0] || "Language";
  const languagesList = profile.languages_taught.join(", ") || "Language";

  switch (pageType) {
    case "site":
      return `${name} - ${primaryLang} Lessons Online | TutorLingua`;
    case "profile":
      return `${name} - ${primaryLang} Tutor Profile | TutorLingua`;
    case "bio":
      return `${name} | Links & Resources | TutorLingua`;
    case "book":
      return `Book ${primaryLang} Lessons with ${name} | TutorLingua`;
    case "products":
      return `${languagesList} Learning Resources by ${name} | TutorLingua`;
    case "reviews":
      return `${name} Reviews - Student Testimonials | TutorLingua`;
    default:
      return `${name} | TutorLingua`;
  }
}

/**
 * Generate unique meta description based on page context
 * Each page focuses on different aspects to avoid duplication
 */
export function generatePageDescription(
  profile: TutorProfile,
  pageType: PageType
): string {
  const name = profile.full_name || profile.username;
  const languages = profile.languages_taught.join(", ") || "languages";
  const primaryLang = profile.languages_taught?.[0] || "Language";

  // Build credential phrases
  const experiencePhrase = profile.years_teaching
    ? `with ${profile.years_teaching}+ years experience`
    : "";

  const ratingPhrase = profile.average_rating && profile.testimonial_count
    ? `Rated ${profile.average_rating.toFixed(1)}/5 by ${profile.testimonial_count} students.`
    : "";

  const studentsPhrase = profile.total_students && profile.total_students > 0
    ? `Teaching ${profile.total_students}+ students.`
    : "";

  switch (pageType) {
    case "site":
      // Focus on the tutor's brand and teaching
      return profile.tagline ||
        `${name} teaches ${languages} online. ${ratingPhrase} ${studentsPhrase} Book a personalized lesson today.`.trim();

    case "profile":
      // Focus on professional credentials
      return `${name} is a ${primaryLang} tutor ${experiencePhrase}. ${ratingPhrase} ${studentsPhrase} Book directly on TutorLingua with no commission fees.`.trim();

    case "bio":
      // Focus on links and resources
      return profile.tagline ||
        `${name} – featured resources, booking links, and ways to connect. Follow on social media and book ${primaryLang} lessons.`;

    case "book":
      // Focus on booking action
      return `Book ${languages} lessons with ${name} ${experiencePhrase}. ${ratingPhrase} Direct booking with no platform fees.`.trim();

    case "products":
      // Focus on digital products
      return `Browse ${languages} learning materials from ${name}. Digital resources including PDFs, worksheets, ebooks, and more.`;

    case "reviews":
      // Focus on social proof
      return `Read student reviews and testimonials about ${name}. ${ratingPhrase} See what students say about their ${primaryLang} lessons.`.trim();

    default:
      return `${name} teaches ${languages} on TutorLingua. ${ratingPhrase}`.trim();
  }
}

/**
 * Generate SEO keywords based on profile and page type
 */
export function generateKeywords(
  profile: TutorProfile,
  pageType: PageType
): string[] {
  const name = profile.full_name || profile.username;
  const languages = profile.languages_taught || [];

  // Base keywords present on all pages
  const baseKeywords = [
    name,
    profile.username,
    ...languages.map(lang => `${lang} tutor`),
    ...languages.map(lang => `learn ${lang}`),
    ...languages.map(lang => `${lang} lessons`),
  ].filter(Boolean);

  // Page-specific keywords
  const pageKeywords: Record<PageType, string[]> = {
    site: [
      "online language tutor",
      "private language lessons",
      ...languages.map(lang => `${lang} teacher`),
    ],
    profile: [
      "online language tutor",
      "private language lessons",
      "language tutor profile",
    ],
    bio: [
      "tutor links",
      "language tutor contact",
      "book language lesson",
    ],
    book: [
      "book language lesson",
      "online tutoring",
      "language class booking",
      ...languages.map(lang => `book ${lang} lesson`),
    ],
    products: [
      "language learning resources",
      "digital language materials",
      "tutor resources",
      ...languages.map(lang => `${lang} worksheets`),
      ...languages.map(lang => `${lang} learning materials`),
    ],
    reviews: [
      "tutor reviews",
      "student testimonials",
      "language tutor ratings",
      ...languages.map(lang => `${lang} tutor reviews`),
    ],
  };

  return [...baseKeywords, ...pageKeywords[pageType]].filter(Boolean);
}

/**
 * Generate canonical URL for a page
 */
export function generateCanonicalUrl(
  username: string,
  pageType: PageType
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  switch (pageType) {
    case "site":
      return `${baseUrl}/${username}`;
    case "profile":
      return `${baseUrl}/profile/${username}`;
    case "bio":
      return `${baseUrl}/bio/${username}`;
    case "book":
      return `${baseUrl}/book/${username}`;
    case "products":
      return `${baseUrl}/products/${username}`;
    case "reviews":
      return `${baseUrl}/${username}/reviews`;
    default:
      return `${baseUrl}/${username}`;
  }
}

/**
 * Generate Open Graph type for a page
 */
export function getOpenGraphType(pageType: PageType): string {
  switch (pageType) {
    case "profile":
      return "profile";
    case "products":
      return "product.group";
    default:
      return "website";
  }
}

/**
 * Format languages array into readable string
 */
export function formatLanguages(languages: string[] | string | null): string[] {
  if (!languages) return [];

  if (Array.isArray(languages)) {
    return languages;
  }

  return languages
    .split(",")
    .map(lang => lang.trim())
    .filter(Boolean);
}

/**
 * Generate a short tagline if one doesn't exist
 */
export function generateDefaultTagline(profile: TutorProfile): string {
  const name = profile.full_name || profile.username;
  const primaryLang = profile.languages_taught?.[0] || "Language";

  if (profile.years_teaching) {
    return `${primaryLang} tutor with ${profile.years_teaching}+ years of experience`;
  }

  if (profile.total_students && profile.total_students > 10) {
    return `${primaryLang} tutor helping ${profile.total_students}+ students`;
  }

  return `Independent ${primaryLang} tutor on TutorLingua`;
}
