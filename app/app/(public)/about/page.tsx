import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | TutorLingua",
  description: "Learn about TutorLingua and why we build for language tutors.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function AboutPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About TutorLingua</h1>
        <p className="text-gray-700 leading-relaxed mb-8">
          TutorLingua helps independent language tutors run their business with one
          simple workspace. We bring bookings, payments, and student relationships
          together so tutors can spend less time on admin and more time teaching.
        </p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Why we exist</h2>
            <p className="leading-relaxed">
              Most tutors juggle multiple tools that were not made for tutoring.
              TutorLingua replaces scattered workflows with a single platform built
              for language professionals.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Who it is for</h2>
            <p className="leading-relaxed">
              TutorLingua is designed for independent tutors who want to grow their
              repeat business, keep more of their revenue, and present a polished
              student experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get started</h2>
            <p className="leading-relaxed">
              Ready to launch your own tutoring hub? Start with a free trial and
              set up your site in minutes.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-flex items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Sign up free
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
