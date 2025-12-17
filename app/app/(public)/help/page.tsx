import { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  CalendarDays,
  CreditCard,
  CalendarSync,
  ArrowRight,
  Search,
  BookOpen,
} from "lucide-react";
import { getHelpCategories, HelpCategory } from "@/lib/help";

export const metadata: Metadata = {
  title: "Help Center | TutorLingua",
  description:
    "Find answers to your questions about TutorLingua. Learn how to set up your account, manage bookings, accept payments, and sync your calendar.",
  openGraph: {
    title: "Help Center | TutorLingua",
    description:
      "Find answers to your questions about TutorLingua. Guides for account setup, bookings, payments, and more.",
    type: "website",
    url: "https://tutorlingua.co/help",
  },
  alternates: {
    languages: {
      en: "/help",
      es: "/es/help",
    },
  },
};

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="w-6 h-6" />,
  CalendarDays: <CalendarDays className="w-6 h-6" />,
  CreditCard: <CreditCard className="w-6 h-6" />,
  CalendarSync: <CalendarSync className="w-6 h-6" />,
};

// Category card component
function CategoryCard({ category }: { category: HelpCategory }) {
  const icon = iconMap[category.icon] || <BookOpen className="w-6 h-6" />;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 p-6 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1">
      {/* Icon */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>

      {/* Title and description */}
      <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
        {category.label}
      </h2>
      <p className="text-gray-600 text-sm mb-5">{category.description}</p>

      {/* Article list */}
      <ul className="space-y-2 mb-5">
        {category.articles.slice(0, 3).map((article) => (
          <li key={article.slug}>
            <Link
              href={`/help/${article.slug}`}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors group/link"
            >
              <ArrowRight className="w-3 h-3 text-gray-400 group-hover/link:text-blue-500 group-hover/link:translate-x-0.5 transition-all" />
              <span className="line-clamp-1">{article.title}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Article count badge */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm text-gray-500">
          {category.articleCount} {category.articleCount === 1 ? "article" : "articles"}
        </span>
        {category.articleCount > 3 && (
          <Link
            href={`/help#${category.slug}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function HelpCenterPage() {
  const categories = getHelpCategories("en");

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-16 sm:py-20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-200/40 to-indigo-200/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-indigo-200/40 to-purple-200/40 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/50 text-sm font-medium text-gray-700 mb-6">
            <BookOpen className="w-4 h-4 text-blue-600" />
            TutorLingua Knowledge Base
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            How can we{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              help you?
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
            Find guides and tutorials to get the most out of TutorLingua.
            Learn how to set up your account, manage bookings, and grow your tutoring business.
          </p>

          {/* Search bar (visual only for now) */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles..."
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-500"
                disabled
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Search coming soon. Browse categories below.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select a topic to find the help you need
            </p>
          </div>

          {categories.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">
                Help articles coming soon
              </p>
              <p className="text-gray-500 mt-1">
                We&apos;re working on documentation to help you get started.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Contact Support CTA */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <Link
            href="mailto:support@tutorlingua.co"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Contact Support
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Back to home */}
      <div className="py-8 text-center border-t border-gray-100 bg-white">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          &larr; Back to TutorLingua
        </Link>
      </div>
    </div>
  );
}
