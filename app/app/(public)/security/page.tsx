import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security | TutorLingua",
  description: "How TutorLingua protects tutor and student data.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function SecurityPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Security</h1>
        <p className="text-gray-700 leading-relaxed mb-8">
          TutorLingua takes security seriously. We protect tutor and student data
          with industry-standard practices and continually improve our safeguards.
        </p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Data protection</h2>
            <p className="leading-relaxed">
              We use encryption in transit and at rest, strict access controls, and
              ongoing monitoring to keep your data safe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Payments</h2>
            <p className="leading-relaxed">
              Payments are processed by Stripe, a PCI-compliant provider trusted by
              leading platforms worldwide.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Privacy</h2>
            <p className="leading-relaxed">
              Learn how we handle personal information in our Privacy Policy.
            </p>
            <Link
              href="/privacy"
              className="mt-3 inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
            >
              Read privacy policy
            </Link>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Report a concern</h2>
            <p className="leading-relaxed">
              If you discover a potential security issue, please email us.
            </p>
            <a
              href="mailto:security@tutorlingua.co"
              className="mt-3 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Contact security
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
