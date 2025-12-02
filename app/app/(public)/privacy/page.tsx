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
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            &larr; Back to TutorLingua
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
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to TutorLingua. TutorLingua (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a platform for independent language tutors (&quot;Tutors&quot;) to manage their tutoring business, including bookings, payments, and student relationships. TutorLingua also allows language learners (&quot;Students&quot;) to discover tutors, book lessons, and manage their learning journey (collectively, the &quot;Service&quot;).
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              This Privacy Policy explains the personal information we collect from Tutors and Students (collectively, &quot;you&quot;) via our website, mobile application, and Service generally, how we use and share that information, and your choices and rights concerning our information practices.
            </p>
            <p className="text-gray-700 leading-relaxed">
              TutorLingua is the controller of your personal information in accordance with data protection laws of the European Economic Area, the United Kingdom, and applicable U.S. state privacy laws. If you have any questions or comments about this Policy, please contact us at{" "}
              <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">
                privacy@tutorlingua.co
              </a>.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We collect information you voluntarily provide when using TutorLingua:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Account Information:</strong> Name, email address, password, username, profile photo</li>
              <li><strong>Profile Information:</strong> Bio, tagline, languages taught/learning, timezone, website URL, social media handles</li>
              <li><strong>Contact Information:</strong> Phone number, physical address (optional)</li>
              <li><strong>Financial Information:</strong> Our payment processor Stripe, Inc. (&quot;Stripe&quot;) collects the financial information necessary to process payments through the Service. In addition to this Privacy Policy and our Terms of Service, your financial data is also processed pursuant to Stripe&apos;s services agreement and privacy policy.</li>
              <li><strong>Booking Information:</strong> Lesson dates, times, duration, notes, student-tutor communications</li>
              <li><strong>Student Information (for Tutors):</strong> Student names, contact details, lesson notes, progress tracking, learning goals</li>
              <li><strong>Communication Information:</strong> Messages you send through our platform, support inquiries, survey responses</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">When you visit, use, and interact with the Service, we may receive certain information about your visit, use, or interactions:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Log Information:</strong> Information your browser automatically sends, including IP address, browser type and settings, date and time of requests, and how you interacted with the Service</li>
              <li><strong>Device Information:</strong> Device name, operating system, browser type, and device identifiers</li>
              <li><strong>Usage Information:</strong> Pages visited, features used, time spent, clicks, navigation paths, actions taken</li>
              <li><strong>Location Information:</strong> Approximate location based on IP address (for timezone detection and fraud prevention)</li>
              <li><strong>Cookies Information:</strong> We use cookies and similar technologies to enhance user experience and analytics. See Section 11 for more details.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Calendar Data:</strong> If you connect Google Calendar or Microsoft Outlook, we access your calendar events to prevent double-bookings and display availability</li>
              <li><strong>Social Media:</strong> If you interact with our social media pages, we may receive information made available through those platforms</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may use personal information for the following purposes:</p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 To Operate and Deliver Our Service</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Provide, operate, maintain, and secure our Service</li>
              <li>Process bookings and facilitate tutor-student connections</li>
              <li>Send transactional emails (booking confirmations, reminders, notifications)</li>
              <li>Process payments and prevent fraud</li>
              <li>Respond to your requests and provide customer support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 To Improve, Monitor, and Personalize Our Service</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Enrich your user experience and customize your relationship with us</li>
              <li>Protect the security of our Service</li>
              <li>Prevent and detect security threats, fraud, or other criminal or malicious activities</li>
              <li>Analyze usage patterns and improve features</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Research and Development</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may use personal information to develop, analyze, and improve the Service. We may create aggregated, de-identified, or anonymized data from personal information we collect. We may use and share this anonymized data for our lawful business purposes.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.4 Legal Compliance</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Comply with applicable laws, lawful requests, and legal process</li>
              <li>Protect our, your, or others&apos; rights, privacy, safety, or property</li>
              <li>Enforce the terms and conditions that govern the Service</li>
              <li>Audit our compliance with legal and contractual requirements</li>
            </ul>
          </section>

          {/* Marketing & Advertising */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Marketing & Advertising</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We, our service providers, and advertising partners may use your personal information for marketing purposes:
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Direct Marketing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you elect to provide your email or use our Service, we may use that information to send you newsletters, product updates, and special offers. You may opt out of receiving marketing communications by:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Following the unsubscribe instructions in any marketing email</li>
              <li>Updating your email preferences in your account settings</li>
              <li>Contacting us at{" "}
                <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">
                  privacy@tutorlingua.co
                </a>
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you unsubscribe from marketing, you will continue to receive transactional communications (booking confirmations, account updates, etc.).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Interest-Based Advertising</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may engage third-party advertising companies to display our ads on their online services. We may share information about our users with these companies to facilitate advertising. Our disclosure of information to these partners may be considered a &quot;sale&quot; or &quot;sharing&quot; of personal information under applicable laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You can opt out of these disclosures by clicking &quot;Do Not Sell My Personal Information&quot; in the footer of our website (if applicable) or by contacting us directly.
            </p>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How We Share Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may share your information in the following circumstances:</p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 With Other Users</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Students see:</strong> Tutor public profiles (name, bio, photo, languages, availability, pricing)</li>
              <li><strong>Tutors see:</strong> Student contact information and booking details for their own students only</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 With Service Providers</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Payment Processing (Stripe Connect):</strong> TutorLingua uses Stripe Connect to facilitate payments. Tutors connect their own Stripe accounts and are the merchant of record for their tutoring services. When you book a lesson, your payment is processed directly to the Tutor&apos;s connected Stripe account. TutorLingua facilitates this transaction but is not the merchant of record for tutor services. We do not store full credit card data.</li>
              <li><strong>Email Services:</strong> Resend (transactional and marketing emails)</li>
              <li><strong>Video Conferencing:</strong> Zoom, Google Meet (if integrated by tutor)</li>
              <li><strong>Database & Hosting:</strong> Supabase, Vercel</li>
              <li><strong>Analytics:</strong> Usage analytics and performance monitoring services</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pursuant to our instructions, these parties will access, process, or store personal information in the course of performing their duties to us.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Professional Advisors</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may share personal information with our professional advisors such as lawyers, accountants, and auditors where necessary to facilitate the services they render to us.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.4 Legal Requirements</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may disclose your information if required to do so by law or in the good faith belief that such action is necessary to: (i) comply with a legal obligation, including to meet national security or law enforcement requirements; (ii) protect and defend our rights or property; (iii) prevent fraud; (iv) act in urgent circumstances to protect the personal safety of users of the Service or the public; or (v) protect against legal liability.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.5 Business Transfers</h3>
            <p className="text-gray-700 leading-relaxed">
              If TutorLingua is involved in a merger, acquisition, financing due diligence, reorganization, bankruptcy, receivership, sale of all or a portion of our assets, or transition of service to another provider (collectively a &quot;Transaction&quot;), your personal information may be shared in the diligence process with counterparties and transferred to a successor or affiliate as part of that Transaction.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement commercially reasonable technical, administrative, and organizational measures to protect personal information both online and offline from loss, misuse, and unauthorized access, disclosure, alteration, or destruction:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Secure authentication and session management</li>
              <li>Access controls and role-based permissions</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              However, no Internet or email transmission is ever fully secure or error-free. Please keep this in mind when disclosing any personal information to us via the Internet. We are not responsible for circumvention of any privacy settings or security measures contained on the Service.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide Services. After account deletion, we may retain certain information as required by law or for legitimate business purposes (e.g., preventing fraud, resolving disputes, enforcing our agreements).
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Privacy Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on where you are based, and as provided under applicable law and subject to any limitations in such law, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data we hold about you</li>
              <li><strong>Correction:</strong> Update or correct incomplete or inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (&quot;right to be forgotten&quot;)</li>
              <li><strong>Restriction:</strong> Ask us to restrict our handling of your personal information</li>
              <li><strong>Portability:</strong> Receive your personal information in a structured, commonly used, machine-readable format or have it transmitted to another company</li>
              <li><strong>Opt Out of Sale/Sharing:</strong> Opt out of the sale of your personal information or sharing for interest-based advertising. You can opt out by contacting us or clicking &quot;Do Not Sell My Personal Information&quot; if available on our website</li>
              <li><strong>Opt Out of Profiling:</strong> Opt out of profiling in connection with decisions that produce legal or similarly significant effects. Note: TutorLingua does not engage in profiling that produces such effects</li>
              <li><strong>Object:</strong> Object to how we are using your personal information</li>
              <li><strong>Withdraw Consent:</strong> Withdraw your consent at any time where we rely on consent to process your information</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 How to Exercise Your Rights</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">
                privacy@tutorlingua.co
              </a>. Prior to any response, we may require you to verify your identity.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Authorized Agents</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on where you reside, you may be entitled to empower an &quot;authorized agent&quot; to submit requests on your behalf. We will require authorized agents to confirm their identity and authority in accordance with applicable laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 Non-Discrimination</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are entitled to exercise the rights described above free from discrimination.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.4 Limits on Your Rights</h3>
            <p className="text-gray-700 leading-relaxed">
              In some instances, your choices may be limited, such as where fulfilling your request would impair the rights of others, our ability to provide a service you have requested, or our ability to comply with our legal obligations and enforce our legal rights. We may have valid legal reasons to refuse your request, and will inform you if that is the case.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16 without parental consent. If you have reason to believe that a child under 16 has provided personal information to TutorLingua, please contact us and we will endeavor to delete that information from our databases.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For users aged 13-17, we recommend parental or guardian oversight. Parents may request access to, correction of, or deletion of their child&apos;s information by contacting us.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua is based in the United States and your personal information will be stored here. We may share your personal information with third parties who are also based in the United States or other countries.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you are based outside the United States, please note that the United States may not provide the same protections as the data protection laws where you are based. We will ensure that relevant safeguards are in place to afford adequate protection for your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>EU Commission or UK government adequacy decisions</li>
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Other contractual protections for international transfers</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              For more information about how we transfer personal information internationally, please contact us at{" "}
              <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">
                privacy@tutorlingua.co
              </a>.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Maintain your session and authentication</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our Services</li>
              <li>Provide personalized content and features</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can control cookies through your browser settings. Use these links to learn more about how to control cookies: Firefox, Chrome, Microsoft Edge, Safari (Mac), Safari (Mobile/iOS).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Please note that some features may not function properly if cookies are disabled.
            </p>
          </section>

          {/* Do Not Track */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Do Not Track Signals</h2>
            <p className="text-gray-700 leading-relaxed">
              Do Not Track (&quot;DNT&quot;) is a privacy preference that users can set in certain web browsers. Please note that we do not respond to or honor DNT signals or similar mechanisms transmitted by web browsers. To find out more about &quot;Do Not Track,&quot; please visit{" "}
              <a href="http://www.allaboutdnt.com" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                www.allaboutdnt.com
              </a>.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service and our business may change from time to time. As a result, we may change this Privacy Policy at any time. When we do, we will post an updated version on this page, unless another type of notice is required by applicable law. By continuing to use our Service or providing us with personal information after we have posted an updated Privacy Policy, you consent to the revised Privacy Policy and practices described in it.
            </p>
          </section>

          {/* GDPR Representative */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. GDPR Representatives</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you wish to lodge a complaint about how we process your personal information, please contact us and we will endeavor to respond to your complaint as soon as possible. Depending on where you reside, such as if you reside in the European Economic Area or United Kingdom, you may have the right to complain to a data protection regulator where you live or work, or where you feel a violation has occurred.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.1 EU Representative</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pursuant to Article 27 of the General Data Protection Regulation (&quot;GDPR&quot;), we have appointed a representative in the EU. You can contact our EU representative regarding matters pertaining to EU data protection laws:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Email:{" "}
                <a href="mailto:gdpr-eu@tutorlingua.co" className="text-primary font-semibold hover:underline">
                  gdpr-eu@tutorlingua.co
                </a>
              </li>
              <li>Address: [EU Representative Address - To Be Appointed]</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">14.2 UK Representative</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pursuant to Article 27 of the UK GDPR, we have appointed a representative in the UK. You can contact our UK representative regarding matters pertaining to UK data protection laws:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Email:{" "}
                <a href="mailto:gdpr-uk@tutorlingua.co" className="text-primary font-semibold hover:underline">
                  gdpr-uk@tutorlingua.co
                </a>
              </li>
              <li>Address: [UK Representative Address - To Be Appointed]</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about our Privacy Policy or information practices, please feel free to contact us:
            </p>
            <div className="mt-4 space-y-2 text-gray-700">
              <p>
                <strong>Privacy Inquiries:</strong>{" "}
                <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">
                  privacy@tutorlingua.co
                </a>
              </p>
              <p>
                <strong>General Inquiries:</strong>{" "}
                <a href="mailto:hello@tutorlingua.co" className="text-primary font-semibold hover:underline">
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
            &copy; {new Date().getFullYear()} TutorLingua. All rights reserved. &bull;{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
