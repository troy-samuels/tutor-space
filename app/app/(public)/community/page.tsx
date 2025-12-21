import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community | TutorLingua",
  description: "Join the TutorLingua community for tutors.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            &larr; Back to TutorLingua
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">TutorLingua community</h1>
        <p className="text-gray-700 leading-relaxed mb-8">
          We are building a community space for language tutors to share ideas,
          pricing strategies, and growth tactics. Until it is live, explore our
          resources below.
        </p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Resources</h2>
            <p className="leading-relaxed">
              Dive into guides and templates that help you grow your tutoring business.
            </p>
            <Link
              href="/blog"
              className="mt-3 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Read the blog
            </Link>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Stay in touch</h2>
            <p className="leading-relaxed">
              Want updates when the community launches? Send us a note and we will
              keep you posted.
            </p>
            <a
              href="mailto:hello@tutorlingua.co"
              className="mt-3 inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Email us
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
