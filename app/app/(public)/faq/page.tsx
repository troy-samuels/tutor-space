import { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  TrendingUp,
  Settings,
  DollarSign,
  Search,
  BookOpen,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { FAQ_CATEGORIES, getFAQsForSchema } from "./faq-data";
import { FAQCategorySection } from "@/components/faq/faq-accordion";
import { FAQSearch } from "@/components/faq/faq-search";
import { generateFAQSchema } from "@/lib/utils/structured-data";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ | TutorLingua - Common Questions About Language Tutoring",
  description:
    "Find answers to common questions about online language tutoring, pricing, scheduling, and building your tutoring business. 50+ FAQs for tutors and students.",
  keywords: [
    "language tutor FAQ",
    "online tutoring questions",
    "how much do tutors charge",
    "tutoring pricing",
    "language learning FAQ",
    "tutoring business questions",
    "TEFL tutor questions",
    "online tutoring guide",
  ],
  openGraph: {
    title: "FAQ | TutorLingua - Common Questions About Language Tutoring",
    description:
      "Find answers to 50+ common questions about online language tutoring, pricing, scheduling, and building your tutoring business.",
    type: "website",
    url: "https://tutorlingua.co/faq",
  },
  alternates: {
    canonical: "https://tutorlingua.co/faq",
  },
};

// Icon mapping for categories
const iconMap: Record<string, React.ReactNode> = {
  Rocket: <Rocket className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  Settings: <Settings className="w-6 h-6" />,
  DollarSign: <DollarSign className="w-6 h-6" />,
  Search: <Search className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
};

// Category navigation card
function CategoryNavCard({
  category,
  index,
}: {
  category: (typeof FAQ_CATEGORIES)[0];
  index: number;
}) {
  const icon = iconMap[category.icon] || <HelpCircle className="w-6 h-6" />;

  return (
    <Link
      href={`#${category.id}`}
      className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {category.title}
        </h3>
        <p className="text-sm text-gray-500">{category.items.length} questions</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

export default function FAQPage() {
  // Generate FAQ schema for rich snippets
  const faqSchema = generateFAQSchema(getFAQsForSchema());

  return (
    <>
      {/* FAQPage Schema for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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
              <HelpCircle className="w-4 h-4 text-blue-600" />
              50+ Questions Answered
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Frequently Asked{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Questions
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8">
              Everything you need to know about online language tutoring.
              Whether you&apos;re starting your tutoring career or looking for the perfect tutor.
            </p>

            {/* Search */}
            <FAQSearch />
          </div>
        </section>

        {/* Category Quick Navigation */}
        <section className="py-12 sm:py-16 border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-gray-900">Jump to a Topic</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FAQ_CATEGORIES.map((category, index) => (
                <CategoryNavCard key={category.id} category={category} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-16">
              {FAQ_CATEGORIES.map((category) => (
                <FAQCategorySection key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-blue-100 mb-8 max-w-xl mx-auto">
              Join thousands of tutors and students already using TutorLingua
              to transform their language learning journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/signup">
                  Create Your Tutor Profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/tutors">Find a Tutor</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Still have questions? */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Still have questions?
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Can&apos;t find what you&apos;re looking for? Check out our help center
              or reach out to our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/help">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Help Center
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="mailto:support@tutorlingua.co">
                  Contact Support
                </Link>
              </Button>
            </div>
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
    </>
  );
}
