import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { CopyLinkButton } from "@/components/blog/CopyLinkButton";
import {
  getBlogPost,
  getAllBlogPosts,
  getRelatedPosts,
  generateBlogPostSchema,
  generateBreadcrumbSchema,
} from "@/lib/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all Korean blog posts
export async function generateStaticParams() {
  const posts = getAllBlogPosts("ko");
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug, "ko");

  if (!post) {
    return {
      title: "글을 찾을 수 없습니다 | TutorLingua 블로그",
    };
  }

  const baseUrl = "https://tutorlingua.co";

  return {
    title: post.title,
    description: post.description,
    keywords: post.seoKeywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      url: `${baseUrl}/ko/blog/${post.slug}`,
      siteName: "TutorLingua",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `${baseUrl}/ko/blog/${post.slug}`,
      languages: post.alternateLocale
        ? {
            [post.alternateLocale.locale]: `${baseUrl}/${post.alternateLocale.locale === "en" ? "" : post.alternateLocale.locale + "/"}blog/${post.alternateLocale.slug}`,
          }
        : undefined,
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  };
}

export default async function BlogPostPageKO({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug, "ko");

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(post, 3);
  const baseUrl = "https://tutorlingua.co";

  // JSON-LD structured data
  const articleSchema = generateBlogPostSchema(post, baseUrl);
  const breadcrumbSchema = generateBreadcrumbSchema(post, baseUrl);

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
      <ReadingProgress />

      {/* Article Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-blue-200/80 mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              홈
            </Link>
            <svg className="w-4 h-4 text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href="/ko/blog" className="hover:text-white transition-colors">
              블로그
            </Link>
            <svg className="w-4 h-4 text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-white font-medium truncate max-w-[200px]">{post.category}</span>
          </nav>

          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white ring-1 ring-white/20">
              {post.category}
            </span>
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 backdrop-blur-sm text-blue-100 ring-1 ring-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-blue-100/90 mb-8 max-w-3xl leading-relaxed">
            {post.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Author */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/20">
                {post.author.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{post.author}</p>
                <p className="text-xs text-blue-200/70">TutorLingua 팀</p>
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-white/20" />

            {/* Date */}
            <div className="flex items-center gap-2 text-sm text-blue-200/80">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>

            {/* Reading Time */}
            <div className="flex items-center gap-2 text-sm text-blue-200/80">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.readingTime}분 읽기
            </div>

            {/* Word Count */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-blue-200/80">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {post.wordCount.toLocaleString("ko-KR")}단어
            </div>
          </div>

          {/* Language Switcher */}
          {post.alternateLocale && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <Link
                href={`${post.alternateLocale.locale === "en" ? "" : "/" + post.alternateLocale.locale}/blog/${post.alternateLocale.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium text-white hover:bg-white/20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                {post.alternateLocale.locale === "en"
                  ? "Read this article in English"
                  : post.alternateLocale.locale === "es"
                  ? "Lee este artículo en español"
                  : post.alternateLocale.locale === "fr"
                  ? "Lire cet article en français"
                  : "이 글을 한국어로 읽기"}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Article Content */}
      <article className="relative">
        {/* Main content area */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Article body with enhanced prose styling */}
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:sm:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:scroll-mt-24
              prose-h3:text-xl prose-h3:sm:text-2xl prose-h3:mt-10 prose-h3:mb-4 prose-h3:scroll-mt-24
              prose-h4:text-lg prose-h4:mt-8 prose-h4:mb-3
              prose-p:text-gray-700 prose-p:leading-[1.8] prose-p:mb-6
              prose-a:text-blue-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:underline-offset-2
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:my-6 prose-ul:space-y-2
              prose-ol:my-6 prose-ol:space-y-2
              prose-li:text-gray-700 prose-li:leading-relaxed prose-li:pl-2
              prose-table:border-collapse prose-table:w-full prose-table:my-8 prose-table:text-sm
              prose-th:bg-gray-50 prose-th:p-4 prose-th:text-left prose-th:font-semibold prose-th:border prose-th:border-gray-200
              prose-td:p-4 prose-td:border prose-td:border-gray-200
              prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-medium prose-code:text-gray-800 prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:shadow-xl prose-pre:overflow-x-auto
              prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:not-italic prose-blockquote:font-medium
              prose-img:rounded-xl prose-img:shadow-lg
              prose-hr:border-gray-200 prose-hr:my-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Article Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-200">
            {/* Tags */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">주제</h4>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/ko/blog?tag=${encodeURIComponent(tag.toLowerCase())}`}
                    className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 hover:text-gray-900 transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Share Section */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">이 글 공유하기</h4>
              <div className="flex items-center gap-3">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`${baseUrl}/ko/blog/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                  aria-label="트위터에 공유"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${baseUrl}/ko/blog/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-blue-700 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                  aria-label="링크드인에 공유"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                  </svg>
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(`이 글을 확인해보세요: ${baseUrl}/ko/blog/${post.slug}`)}`}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-100 transition-all shadow-sm"
                  aria-label="이메일로 공유"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
                <CopyLinkButton url={`${baseUrl}/ko/blog/${post.slug}`} />
              </div>
            </div>

            {/* CTA Box */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl p-8 sm:p-10 mb-12">
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
              </div>

              <div className="relative">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  과외 수입을 더 많이 보유할 준비가 되셨나요?
                </h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  TutorLingua는 직접 예약에 필요한 모든 것을 제공합니다:
                  전문 예약 페이지, 결제 처리,
                  자동 알림 및 학생 관리.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    무료로 시작하기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 hover:border-white/50 transition-all"
                  >
                    가격 보기
                  </Link>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedPosts.length > 0 && (
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                  관련 글
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/ko/blog/${relatedPost.slug}`}
                      className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:-translate-y-1"
                    >
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10 mb-3">
                        {relatedPost.category}
                      </span>
                      <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {relatedPost.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {relatedPost.readingTime}분 읽기
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </footer>
        </div>
      </article>
    </>
  );
}
