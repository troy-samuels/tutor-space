import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | TutorLingua",
  description: "Contact TutorLingua support, sales, or partnerships.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact us</h1>
        <p className="text-gray-700 leading-relaxed mb-8">
          We are happy to help. Reach out and our team will respond as quickly as possible.
        </p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Support</h2>
            <p className="leading-relaxed">
              Need help using TutorLingua? Visit the Help Center or email us directly.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/help"
                className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Help Center
              </Link>
              <a
                href="mailto:hello@tutorlingua.co"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                Email support
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Partnerships</h2>
            <p className="leading-relaxed">
              Interested in partnerships or integrations? Tell us about your idea.
            </p>
            <a
              href="mailto:partnerships@tutorlingua.co"
              className="mt-3 inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Email partnerships
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
