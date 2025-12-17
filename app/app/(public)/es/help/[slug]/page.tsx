import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import {
  getHelpArticle,
  getAllHelpArticles,
  getRelatedArticles,
  generateHelpArticleSchema,
  generateHelpBreadcrumbSchema,
} from "@/lib/help";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all help articles
export async function generateStaticParams() {
  const articles = getAllHelpArticles("es");
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getHelpArticle(slug, "es");

  if (!article) {
    return {
      title: "Artículo No Encontrado | Centro de Ayuda TutorLingua",
    };
  }

  const baseUrl = "https://tutorlingua.co";

  return {
    title: `${article.title} | Centro de Ayuda TutorLingua`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      modifiedTime: article.updatedAt,
      url: `${baseUrl}/es/help/${article.slug}`,
      siteName: "TutorLingua",
    },
    alternates: {
      canonical: `${baseUrl}/es/help/${article.slug}`,
      languages: article.alternateLocale
        ? {
            [article.alternateLocale.locale]: `${baseUrl}/help/${article.alternateLocale.slug}`,
          }
        : undefined,
    },
  };
}

export default async function HelpArticlePageES({ params }: PageProps) {
  const { slug } = await params;
  const article = await getHelpArticle(slug, "es");

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article, 3);
  const baseUrl = "https://tutorlingua.co";

  // JSON-LD structured data
  const articleSchema = generateHelpArticleSchema(article, baseUrl);
  const breadcrumbSchema = generateHelpBreadcrumbSchema(article, baseUrl);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div className="min-h-screen bg-gray-50/50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Inicio
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <Link href="/es/help" className="hover:text-gray-900 transition-colors">
                Centro de Ayuda
              </Link>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-gray-900 font-medium">{article.categoryLabel}</span>
            </nav>

            {/* Category badge */}
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10">
                {article.categoryLabel}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              {article.title}
            </h1>

            {/* Description */}
            <p className="text-lg text-gray-600 mb-6">{article.description}</p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {article.readingTime} min de lectura
              </div>
              <span className="text-gray-300">|</span>
              <span>
                Última actualización:{" "}
                {new Date(article.updatedAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {/* Language Switcher */}
            {article.alternateLocale && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Link
                  href={`/help/${article.alternateLocale.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Read this article in English
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </header>

        {/* Article Content */}
        <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-10">
            {/* Article body */}
            <div
              className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900
                prose-h2:text-xl prose-h2:sm:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:scroll-mt-24
                prose-h3:text-lg prose-h3:sm:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:scroll-mt-24
                prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:mb-5
                prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-2
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-ul:my-5 prose-ul:space-y-2
                prose-ol:my-5 prose-ol:space-y-2
                prose-li:text-gray-700 prose-li:leading-relaxed
                prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-medium prose-code:text-gray-800 prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:overflow-x-auto
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:text-gray-700 prose-blockquote:font-medium
                prose-img:rounded-xl prose-img:shadow-lg
                prose-hr:border-gray-200 prose-hr:my-10"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* Feedback section */}
          <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <p className="text-gray-700 font-medium mb-4">¿Te fue útil este artículo?</p>
            <div className="flex items-center justify-center gap-3">
              <button className="px-6 py-2 bg-green-50 text-green-700 rounded-full font-medium hover:bg-green-100 transition-colors border border-green-200">
                ¡Sí, gracias!
              </button>
              <button className="px-6 py-2 bg-gray-50 text-gray-700 rounded-full font-medium hover:bg-gray-100 transition-colors border border-gray-200">
                No realmente
              </button>
            </div>
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Artículos Relacionados
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/es/help/${related.slug}`}
                    className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
                  >
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {related.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {related.readingTime} min de lectura
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link
              href="/es/help"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Centro de Ayuda
            </Link>
          </div>
        </article>

        {/* Contact Support */}
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              ¿Aún necesitas ayuda?
            </h2>
            <p className="text-gray-600 mb-6">
              Nuestro equipo de soporte está aquí para asistirte.
            </p>
            <Link
              href="mailto:support@tutorlingua.co"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
            >
              Contactar Soporte
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
