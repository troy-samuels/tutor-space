import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TutorLingua",
  description: "Privacy Policy for TutorLingua - how we collect, use, and protect your personal information",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-brand-brown hover:underline">
            ← Back to TutorLingua
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              TutorLingua (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We collect information you voluntarily provide when using TutorLingua:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> Name, email address, password, username</li>
              <li><strong>Profile Information:</strong> Bio, photo, languages taught/learning, timezone, social media handles</li>
              <li><strong>Contact Information:</strong> Phone number, physical address (optional)</li>
              <li><strong>Payment Information:</strong> Processed by Stripe; we store only non-sensitive payment metadata</li>
              <li><strong>Booking Information:</strong> Lesson dates, times, notes, student-tutor communications</li>
              <li><strong>Student Information (for tutors):</strong> Student names, contact details, lesson notes, progress tracking</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, clicks, navigation paths</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>Cookies and Tracking:</strong> We use cookies and similar technologies to enhance user experience and analytics</li>
              <li><strong>Location Data:</strong> Approximate location based on IP address (for timezone detection)</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use collected information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process bookings and facilitate tutor-student connections</li>
              <li>Send transactional emails (booking confirmations, reminders, notifications)</li>
              <li>Process payments and prevent fraud</li>
              <li>Respond to your requests and provide customer support</li>
              <li>Send marketing communications (with your consent; you may opt out)</li>
              <li>Analyze usage patterns and improve user experience</li>
              <li>Comply with legal obligations and enforce our Terms</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may share your information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 With Other Users</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Students see:</strong> Tutor public profiles (name, bio, photo, languages, availability, pricing)</li>
              <li><strong>Tutors see:</strong> Student contact information and booking details for their own students only</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 With Service Providers</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Payment Processing:</strong> Stripe (credit card processing)</li>
              <li><strong>Email Services:</strong> Resend (transactional and marketing emails)</li>
              <li><strong>Video Conferencing:</strong> Zoom, Google Meet (if integrated by tutor)</li>
              <li><strong>Database & Hosting:</strong> Supabase, Vercel</li>
              <li><strong>Analytics:</strong> Usage analytics and performance monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may disclose your information if required by law, court order, or governmental request, or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.4 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed">
              If TutorLingua is involved in a merger, acquisition, or sale of assets, your information may be transferred to the new owner.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement reasonable security measures to protect your information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure authentication and session management</li>
              <li>Access controls and role-based permissions</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              However, no system is completely secure. We cannot guarantee absolute security of your information.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide Services. After account deletion, we may retain certain information as required by law or for legitimate business purposes (e.g., preventing fraud, resolving disputes).
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Portability:</strong> Export your data in a structured format</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Object:</strong> Object to certain processing activities</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@tutorlingua.co" className="text-brand-brown font-semibold hover:underline">
                privacy@tutorlingua.co
              </a>.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua is not directed to children under 13. We do not knowingly collect personal information from children under 13 without parental consent. If you believe a child under 13 has provided us with personal information, please contact us immediately.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For users aged 13-17, we require parental or guardian consent before account creation. Parents may request access to, correction of, or deletion of their child&apos;s information.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Maintain your session and authentication</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our Services</li>
              <li>Provide personalized content and features</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You can control cookies through your browser settings, but some features may not function properly if cookies are disabled.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice on our Platform. Your continued use of TutorLingua after such changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@tutorlingua.co" className="text-brand-brown font-semibold hover:underline">
                  privacy@tutorlingua.co
                </a>
              </p>
              <p>
                <strong>General Inquiries:</strong>{" "}
                <a href="mailto:hello@tutorlingua.co" className="text-brand-brown font-semibold hover:underline">
                  hello@tutorlingua.co
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} TutorLingua. All rights reserved. •{" "}
            <Link href="/terms" className="text-brand-brown hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

