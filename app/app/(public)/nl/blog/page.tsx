import { Metadata } from "next";
import Link from "next/link";
import {
  getAllBlogPosts,
  getAllCategories,
  BlogPostMeta,
  generateBlogSchema,
  generateBlogItemListSchema,
  generateBlogIndexBreadcrumbSchema,
  generateOrganizationSchema,
  generateWebSiteSchema,
} from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | TutorLingua - Bronnen voor Zelfstandige Taaldocenten",
  description:
    "Expertgidsen en strategieën voor zelfstandige taaldocenten. Leer hoe je platformcommissies kunt verlagen, meer leerlingen kunt werven en een duurzaam bijlesbedrijf kunt opbouwen.",
  keywords: [
    "bijles tips",
    "blog voor taaldocenten",
    "Preply commissie verlagen",
    "bijlesbedrijf gids",
    "iTalki tips voor tutoren",
    "online bijles strategieën",
  ],
  openGraph: {
    title: "TutorLingua Blog - Bronnen voor Taaldocenten",
    description:
      "Expertgidsen voor zelfstandige taaldocenten. Verlaag commissies, werf leerlingen, laat je bedrijf groeien.",
    type: "website",
    url: "https://tutorlingua.co/nl/blog",
  },
  alternates: {
    languages: {
      en: "/blog",
      es: "/es/blog",
      fr: "/fr/blog",
      de: "/de/blog",
      it: "/it/blog",
      ja: "/ja/blog",
      ko: "/ko/blog",
      nl: "/nl/blog",
      pt: "/pt/blog",
      zh: "/zh/blog",
    },
  },
};

function BlogCard({ post, featured = false }: { post: BlogPostMeta; featured?: boolean }) {
  return (
    <article
      className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 hover:-translate-y-1 ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      <Link href={`/nl/blog/${post.slug}`} className="block h-full">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
        <div className={`p-6 ${featured ? "md:p-8" : ""} h-full flex flex-col`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10">
              {post.category}
            </span>
            {post.featured && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 ring-1 ring-inset ring-amber-600/10">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Uitgelicht
              </span>
            )}
          </div>
          <h2
            className={`font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 ${
              featured ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h2>
          <p
            className={`text-gray-600 mb-4 line-clamp-3 flex-grow ${
              featured ? "text-base md:text-lg" : "text-sm"
            }`}
          >
            {post.description}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {post.readingTime} min
              </span>
            </div>
            <span className="text-gray-400">
              {new Date(post.publishedAt).toLocaleDateString("nl-NL", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function CategoryFilter({
  categories,
  activeCategory,
}: {
  categories: string[];
  activeCategory?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/nl/blog"
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          !activeCategory
            ? "bg-gray-900 text-white shadow-lg shadow-gray-900/25"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
        }`}
      >
        Alle Artikelen
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/nl/blog?category=${encodeURIComponent(category.toLowerCase())}`}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            activeCategory === category.toLowerCase()
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/25"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
          }`}
        >
          {category}
        </Link>
      ))}
    </div>
  );
}

function TopicCard({
  title,
  description,
  href,
  count,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{description}</p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
            {count} artikelen
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BlogIndexPageNL() {
  const posts = getAllBlogPosts("nl");
  const categories = getAllCategories("nl");
  const featuredPosts = posts.filter((post) => post.featured).slice(0, 3);
  const recentPosts = posts.slice(0, 12);

  const baseUrl = "https://tutorlingua.co";

  const blogSchema = generateBlogSchema(baseUrl, "nl");
  const itemListSchema = generateBlogItemListSchema(posts, baseUrl, "nl");
  const breadcrumbSchema = generateBlogIndexBreadcrumbSchema(baseUrl, "nl");
  const organizationSchema = generateOrganizationSchema(baseUrl);
  const webSiteSchema = generateWebSiteSchema(baseUrl, "nl");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/50 text-sm font-medium text-gray-700 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Wekelijks bijgewerkt met nieuwe content
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              De{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                TutorLingua
              </span>{" "}
              Blog
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Expertgidsen, strategieën en tips voor zelfstandige taaldocenten.
              Leer hoe je je bedrijf kunt laten groeien, commissies kunt verlagen
              en meer van je inkomen kunt behouden.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">T</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">L</div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">+</div>
                </div>
                <span className="text-gray-600">Geschreven door bijles-experts</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-gray-600">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {posts.length}+ artikelen
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Uitgelichte Artikelen
                </h2>
                <p className="mt-2 text-gray-600">
                  Geselecteerde gidsen om je te helpen slagen
                </p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map((post, index) => (
                <BlogCard key={post.slug} post={post} featured={index === 0} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Alle Artikelen
              </h2>
              <p className="mt-2 text-gray-600">
                Ontdek onze volledige bibliotheek met bronnen
              </p>
            </div>
            <CategoryFilter categories={categories} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPosts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">Geen artikelen gevonden</p>
              <p className="text-gray-500 mt-1">Kom snel terug voor nieuwe content!</p>
            </div>
          )}
        </div>
      </section>

      {/* Topic Clusters */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Verken per Onderwerp
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Verken onze content georganiseerd op de belangrijkste onderwerpen voor zelfstandige tutoren
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TopicCard
              title="Commissies Verlagen"
              description="Leer hoe je meer van je bijles-inkomen kunt behouden door platformcommissies te begrijpen."
              href="/nl/blog?category=business"
              count={4}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <TopicCard
              title="Tools en Technologie"
              description="Essentiële software en systemen voor het runnen van een professioneel bijlesbedrijf."
              href="/nl/blog?category=tools"
              count={4}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <TopicCard
              title="Leerlingen Vinden"
              description="Marketing strategieën en tips om meer leerlingen aan te trekken voor je bijlesbedrijf."
              href="/nl/blog?category=marketing"
              count={3}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
            />
            <TopicCard
              title="Leerlingenbeheer"
              description="Best practices voor het behouden van leerlingen en het opbouwen van langdurige relaties."
              href="/nl/blog?category=retention"
              count={4}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </div>

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium text-white/90 mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Gratis wekelijkse nieuwsbrief
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                Ontvang Bijles-Tips per E-mail
              </h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Sluit je aan bij duizenden taaldocenten die onze wekelijkse nieuwsbrief
                ontvangen met praktische strategieën om je bedrijf te laten groeien.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Vul je e-mailadres in"
                  className="flex-1 px-5 py-4 rounded-xl border-0 bg-white/95 backdrop-blur text-gray-900 placeholder-gray-500 shadow-xl focus:ring-2 focus:ring-white/50 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  Abonneren
                </button>
              </form>
              <p className="mt-4 text-sm text-blue-200">
                Geen spam, uitschrijven wanneer je wilt. We respecteren je privacy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
