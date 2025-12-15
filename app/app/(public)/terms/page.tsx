import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | TutorLingua",
  description: "Terms of Service for TutorLingua - the all-in-one platform for language tutors",
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <Link href="/" className="text-sm font-semibold text-primary hover:underline">
            ← Back to TutorLingua
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to TutorLingua (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of TutorLingua&apos;s services, including our website, applications, and related services (collectively, the &quot;Services&quot;).
            </p>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
            </p>
          </section>

          {/* Account Types */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Account Types and Roles</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Tutor Accounts</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tutors are independent language instructors who use TutorLingua to manage their tutoring business, including booking pages, student management, and payment collection. Tutors are solely responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>The quality and delivery of educational services to students</li>
              <li>Setting their own prices, schedules, and teaching policies</li>
              <li>Compliance with local laws regarding tutoring and business operations</li>
              <li>Payment processing and tax obligations</li>
              <li>Managing student relationships and communications</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Student Accounts</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Students (or &quot;Learners&quot;) are individuals who book and attend lessons with Tutors through the Platform. Students understand that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>TutorLingua is a platform connecting students with independent tutors</li>
              <li>TutorLingua does not employ tutors or provide tutoring services directly</li>
              <li>All educational services are provided by independent tutors</li>
              <li>Payment terms, cancellation policies, and lesson quality are determined by the individual tutor</li>
            </ul>
          </section>

          {/* Platform Relationship */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Platform Relationship</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>TutorLingua is a technology platform, not an educational service provider.</strong> We provide software tools that enable tutors to run their independent tutoring businesses. We do not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Employ, supervise, or direct tutors</li>
              <li>Guarantee the quality, safety, or legality of tutor services</li>
              <li>Control tutor pricing, availability, or teaching methods</li>
              <li>Act as an agent for tutors or students</li>
              <li>Provide educational accreditation or certifications</li>
            </ul>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Account Registration and Eligibility</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Eligibility</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You must be at least 13 years old to create a student account. If you are under 18, you represent that you have obtained permission from your parent or legal guardian to use the Services. Parents or guardians are responsible for monitoring minor accounts.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Account Security</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
              <li>Providing accurate and current information during registration</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 AI Feature Consent</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              By creating an account and using TutorLingua, you consent to the processing of your data by artificial intelligence and machine learning systems as described in our{" "}
              <Link href="/privacy#ai-processing" className="text-primary font-semibold hover:underline">Privacy Policy</Link>. This consent is integral to using our Services and covers:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Text Analysis:</strong> Your written content may be analyzed by AI for grammar correction, vocabulary suggestions, and learning pattern identification</li>
              <li><strong>Audio Processing:</strong> Voice recordings may be processed for pronunciation assessment, transcription, and fluency analysis</li>
              <li><strong>AI-Generated Feedback:</strong> You will receive AI-generated corrections, explanations, and learning recommendations</li>
              <li><strong>Lesson Transcription and Analysis:</strong> If using Studio tier features, lesson recordings may be transcribed and analyzed to generate summaries, key moments, and practice materials</li>
              <li><strong>Learning Analytics:</strong> Your learning data will be aggregated and analyzed to track progress and personalize instruction</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you do not consent to AI processing, you may not be able to use certain features of the Service. You may contact us at{" "}
              <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">privacy@tutorlingua.co</a>{" "}
              to discuss alternative arrangements, though some core functionality requires AI processing to operate.
            </p>
            <p className="text-gray-700 leading-relaxed">
              <strong>For Users Under 18:</strong> If you are under 18 years of age, your parent or legal guardian must consent to AI processing on your behalf. By allowing a minor to use TutorLingua, parents and guardians consent to the AI processing of that minor&apos;s data as described herein.
            </p>
          </section>

          {/* Payments and Bookings */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payments and Bookings</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Student Payments</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When booking lessons through TutorLingua:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Students pay <strong>before</strong> a lesson is confirmed. Availability can be viewed, but bookings aren’t confirmed until payment succeeds.</li>
              <li>Payment terms, amounts, and methods are set by the individual tutor.</li>
              <li>Tutors can connect their own Stripe accounts (Stripe Connect), and student payments are processed directly to the tutor’s Stripe account.</li>
              <li>TutorLingua isn’t the merchant of record for tutor services and doesn’t charge a per-transaction platform fee.</li>
              <li>Refund and cancellation policies are determined by each tutor. TutorLingua may facilitate refunds upon request.</li>
              <li>Students agree to the specific tutor&apos;s payment terms when booking.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Tutor Fees</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tutors pay subscription fees to access TutorLingua&apos;s platform features. TutorLingua does not charge commission on tutor earnings from student bookings. Subscription fees are non-refundable except as required by law.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Third-Party Payment Processors</h3>
            <p className="text-gray-700 leading-relaxed">
              We use third-party payment processors (including Stripe) to process payments. Your payment information is subject to the payment processor&apos;s terms and privacy policy.
            </p>
          </section>

          {/* Cancellations and Refunds */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cancellations and Refunds</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Platform-Wide Cancellation Policy</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Unless otherwise specified by an individual tutor, the following default cancellation policy applies to all bookings made through TutorLingua:
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg mb-6">
              <h4 className="font-bold text-gray-900 mb-3">Standard Cancellation Terms</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-semibold shrink-0">12+ hours notice:</span>
                  <span>Full refund or rescheduling available if you cancel or request to modify your booking at least 12 hours before the scheduled lesson start time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold shrink-0">Less than 12 hours:</span>
                  <span>No refund, exchange, or rescheduling will be provided for cancellations, modifications, or no-shows occurring within 12 hours of the scheduled lesson time. The full lesson fee is forfeited.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold shrink-0">No-shows:</span>
                  <span>Failure to attend a scheduled lesson without prior cancellation will be treated as a late cancellation. The full lesson fee is non-refundable.</span>
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.2 Tutor-Specific Policies</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Individual tutors may establish their own cancellation policies that differ from the platform default. Any tutor-specific policies will be clearly displayed on the tutor&apos;s booking page and must be reviewed and accepted by students before completing a booking. In the event of a conflict between the platform policy and a tutor&apos;s policy, the tutor&apos;s policy shall prevail for that specific booking.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.3 How to Cancel or Modify a Booking</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              To cancel or request modifications to a booking:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Log into your student account on TutorLingua</li>
              <li>Navigate to your upcoming lessons</li>
              <li>Select the booking you wish to cancel or modify</li>
              <li>Click &quot;Cancel Booking&quot; or &quot;Request Change&quot;</li>
              <li>Alternatively, contact your tutor directly via email or the messaging system</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Important:</strong> Cancellation timestamps are based on when the cancellation is processed in the TutorLingua system, not when you send an email or message. Ensure you use the platform&apos;s cancellation features to receive proper timestamp confirmation.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.4 Refund Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When a refund is issued:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Refunds will be processed to the original payment method within 5-10 business days</li>
              <li>Payment processing fees are non-refundable</li>
              <li>Session package credits may be restored instead of monetary refunds, at the tutor&apos;s discretion</li>
              <li>Partial refunds are not available for multi-session packages unless otherwise stated</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.5 Tutor-Initiated Cancellations</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If a tutor cancels a confirmed booking:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Students are entitled to a full refund regardless of timing</li>
              <li>Students may request rescheduling to an alternative time slot</li>
              <li>For package bookings, the session credit will be restored to the student&apos;s account</li>
              <li>TutorLingua will assist in facilitating communication and resolution</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.6 Exceptional Circumstances</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua recognizes that extraordinary circumstances may arise. In cases of:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Medical emergencies:</strong> Documentation may be required; refunds or rescheduling considered on a case-by-case basis</li>
              <li><strong>Technical issues:</strong> Platform or connectivity problems preventing lesson access may warrant refunds or makeup sessions</li>
              <li><strong>Force majeure:</strong> Acts of God, natural disasters, or other events beyond reasonable control</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Students should contact their tutor directly and TutorLingua support at{" "}
              <a href="mailto:support@tutorlingua.co" className="text-primary font-semibold hover:underline">
                support@tutorlingua.co
              </a>{" "}
              to request exceptions. All exception requests are subject to tutor and platform approval.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">6.7 Dispute Resolution</h3>
            <p className="text-gray-700 leading-relaxed">
              TutorLingua is not a party to the agreement between students and tutors regarding lessons. While we provide tools to facilitate bookings and payments, disputes regarding lesson quality, refunds, or cancellations must first be addressed directly between the student and tutor. TutorLingua may provide communication assistance but is not obligated to resolve disputes or issue refunds on behalf of tutors.
            </p>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use the Services for any illegal, harmful, or fraudulent purpose</li>
              <li>Harass, threaten, or harm other users</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Impersonate others or provide false information</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Scrape, copy, or reproduce content without permission</li>
              <li>Interfere with or disrupt the Services or servers</li>
              <li>Use the Services to compete with TutorLingua</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.1 Platform Content</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua and its licensors own all rights to the Platform, including software, design, text, graphics, and trademarks. You may not copy, modify, distribute, or create derivative works without our written permission.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.2 User Content</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain ownership of content you submit (profiles, lesson materials, messages). By submitting content, you grant TutorLingua a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content to operate the Services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">9.3 AI-Generated Content</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>TutorLingua owns all AI-generated content</strong> produced through our Services, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Grammar corrections, explanations, and suggestions</li>
              <li>Pronunciation feedback and fluency assessments</li>
              <li>Lesson summaries and key moment identification</li>
              <li>Auto-generated vocabulary drills and grammar exercises</li>
              <li>AI Practice Companion conversation responses</li>
              <li>Learning analytics insights and progress reports</li>
              <li>Transcripts generated from lesson recordings</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>License Grant:</strong> We grant you a limited, non-exclusive, non-transferable, revocable license to use AI-generated content for your personal educational purposes only. This license terminates upon closure of your account.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Restrictions:</strong> You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Commercially redistribute, sell, or license AI-generated content</li>
              <li>Use AI-generated content to develop competing products or services</li>
              <li>Claim authorship or ownership of AI-generated content</li>
              <li>Remove any proprietary notices from AI-generated content</li>
              <li>Use AI outputs to train other AI or machine learning models without written consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              <strong>Your Input:</strong> While we own AI outputs, content you submit as input (your messages, homework, recordings) remains your property, subject to the license you grant us to process and deliver our Services.
            </p>
          </section>

          {/* Data and Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Data and Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Your privacy is important to us. Our{" "}
              <Link href="/privacy" className="text-primary font-semibold hover:underline">
                Privacy Policy
              </Link>{" "}
              explains how we collect, use, and protect your personal information. By using TutorLingua, you consent to our data practices as described in the Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">10.1 Google Calendar Integration</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua offers optional integration with Google Calendar to help tutors manage their scheduling. By connecting your Google Calendar:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>You Consent:</strong> You authorize TutorLingua to access your Google Calendar data to read events, display availability, and create lesson booking events on your behalf.</li>
              <li><strong>Data Access:</strong> We use the <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">calendar.events</code> scope to read and write calendar events. We do not access other Google services or data.</li>
              <li><strong>Purpose:</strong> Calendar access is used solely to prevent double-bookings, display your availability to students, and sync lesson bookings to your calendar.</li>
              <li><strong>Your Control:</strong> You may disconnect your Google Calendar at any time from your TutorLingua Settings, which immediately revokes our access.</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Google API Services Compliance</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Limited Use Disclosure:</strong> TutorLingua&apos;s use of Google Calendar data is limited to providing and improving the scheduling features described in this section and our{" "}
              <Link href="/privacy#google-calendar" className="text-primary font-semibold hover:underline">
                Privacy Policy
              </Link>. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>We do not use Google Calendar data for advertising purposes</li>
              <li>We do not sell Google Calendar data to third parties</li>
              <li>We do not use Google Calendar data for purposes unrelated to the core scheduling functionality</li>
              <li>We do not allow humans to read your calendar data except where necessary for security purposes, to comply with applicable law, or with your explicit consent</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Disclaimer</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua is not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Calendar sync issues caused by Google API changes, outages, or rate limits</li>
              <li>Data loss or corruption within your Google Calendar</li>
              <li>Scheduling conflicts that arise from delays in calendar synchronization</li>
              <li>Changes to Google&apos;s terms of service or API availability</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You are responsible for regularly verifying that your calendar data is syncing correctly and for disconnecting the integration if you no longer wish to use it.
            </p>
          </section>

          {/* Studio Features & AI Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Studio Features & AI Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua offers AI-powered learning features as part of its Services. This section describes these features and their terms of use.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">11.1 AI Practice Companion</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              The AI Practice Companion provides conversational language practice with real-time grammar correction and pronunciation assessment.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Service Description:</strong> Students may engage in text-based conversations with our AI, which provides grammar feedback, vocabulary suggestions, and conversational practice adapted to the student&apos;s proficiency level.</li>
              <li><strong>Audio Features:</strong> Students may submit audio recordings for pronunciation assessment, receiving detailed feedback on accuracy, fluency, and specific sounds.</li>
              <li><strong>Limitations:</strong> AI Practice is a supplementary learning tool and is not a substitute for human instruction. AI responses may occasionally contain errors or provide imperfect corrections.</li>
              <li><strong>Usage Limits:</strong> AI Practice is available via subscription with metered usage for text turns and audio minutes. Additional usage blocks may be purchased as needed.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">11.2 Lesson Recording and Transcription (Studio Tier)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Studio tier subscribers have access to lesson recording and AI-powered transcription and analysis features.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Recording:</strong> Lessons conducted through our native video platform may be recorded with participant consent. Recordings are stored securely and retained for 90 days by default.</li>
              <li><strong>Transcription:</strong> Lesson recordings are automatically transcribed using AI speech recognition technology.</li>
              <li><strong>AI Analysis:</strong> Transcripts may be analyzed by AI to generate lesson summaries, identify key learning moments, and create personalized practice materials.</li>
              <li><strong>Data Handling:</strong> See our Privacy Policy for details on how recording and transcription data is processed and retained.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">11.3 Homework System</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tutors may assign homework to students, who can submit text, audio, and file responses.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Content Ownership:</strong> Homework assignments created by tutors remain the tutor&apos;s intellectual property. Student submissions remain student property.</li>
              <li><strong>AI Feedback:</strong> AI may analyze homework submissions to provide automated feedback. Such AI-generated feedback is owned by TutorLingua.</li>
              <li><strong>Storage:</strong> Homework submissions are stored securely. Audio and file attachments are retained for 1 year after submission.</li>
            </ul>
          </section>

          {/* Lesson Recording Consent */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Lesson Recording Consent</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              When using TutorLingua&apos;s native video classroom (Studio tier), lessons may be recorded with participant consent.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.1 Recording Requirements</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>All participants must consent to recording before a recording begins</li>
              <li>A visible recording indicator will be displayed throughout the recorded session</li>
              <li>Any participant may decline to be recorded or request that recording stop</li>
              <li>Recording consent is requested at the start of each lesson; previous consent does not carry over</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.2 Use of Recordings</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Permitted Uses:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Student review and study of their own lessons</li>
              <li>Tutor reference and lesson planning</li>
              <li>AI transcription and analysis to generate learning materials</li>
              <li>Generation of practice content based on lesson content</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Prohibited Uses:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Public distribution or sharing without consent of all participants</li>
              <li>Use for marketing purposes without explicit written consent</li>
              <li>Use to train general-purpose AI models outside of TutorLingua</li>
              <li>Sharing with third parties not involved in providing the Services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">12.3 Student Rights</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Access:</strong> Students may view and download recordings of lessons in which they participated</li>
              <li><strong>Deletion:</strong> Students may request permanent deletion of their lesson recordings at any time by contacting their tutor or{" "}
                <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">privacy@tutorlingua.co</a>
              </li>
              <li><strong>Objection:</strong> Students may decline recording for any lesson without penalty</li>
              <li><strong>Transcript Access:</strong> Students may view AI-generated transcripts and summaries of their lessons</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Disclaimers and Limitations</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.1 Service &quot;As Is&quot;</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.2 Tutor Services</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua does not guarantee the quality, accuracy, or reliability of tutoring services provided by independent tutors. We do not verify tutor credentials, qualifications, or backgrounds unless explicitly stated.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.3 Limitation of Liability</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, TUTORLINGUA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES ARISING FROM YOUR USE OF THE SERVICES.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">13.4 AI Service Disclaimers</h3>
            <p className="text-gray-700 leading-relaxed mb-4 uppercase font-semibold">
              AI-GENERATED CONTENT IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY KIND. YOU ACKNOWLEDGE AND AGREE THAT:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>GRAMMAR CORRECTIONS MAY MISS ERRORS, INCORRECTLY FLAG CORRECT USAGE, OR PROVIDE IMPERFECT EXPLANATIONS</li>
              <li>PRONUNCIATION SCORES ARE ALGORITHMIC APPROXIMATIONS AND NOT EXPERT LINGUISTIC ASSESSMENTS</li>
              <li>LESSON SUMMARIES AND KEY MOMENTS MAY OMIT IMPORTANT DETAILS OR MISCHARACTERIZE CONTENT</li>
              <li>AUTO-GENERATED DRILLS AND EXERCISES MAY CONTAIN ERRORS OR BE INAPPROPRIATE FOR YOUR LEVEL</li>
              <li>AI PRACTICE COMPANION RESPONSES MAY OCCASIONALLY BE INACCURATE, IRRELEVANT, OR MISLEADING</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>AI IS A SUPPLEMENTARY TOOL.</strong> AI-powered features are designed to supplement, not replace, human language instruction. You should:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Verify important corrections and feedback with your human tutor</li>
              <li>Use AI assessments as guidance, not definitive evaluation</li>
              <li>Not rely solely on AI for language certification or high-stakes assessments</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              TUTORLINGUA DISCLAIMS ALL LIABILITY FOR ANY LEARNING OUTCOMES, LANGUAGE PROFICIENCY CLAIMS, OR DECISIONS MADE IN RELIANCE ON AI-GENERATED CONTENT. YOUR USE OF AI FEATURES IS AT YOUR OWN RISK.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Account Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct that we deem harmful to the Platform, other users, or our business interests. You may close your account at any time through account settings.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Upon termination, you will lose access to your account and any associated data. Tutors remain responsible for fulfilling any existing student bookings or commitments.
            </p>
          </section>

          {/* Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Any disputes between students and tutors should first be resolved directly between the parties. TutorLingua may provide communication tools to assist but is not obligated to mediate disputes.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For disputes with TutorLingua, you agree to first attempt to resolve the matter informally by contacting us at{" "}
              <a href="mailto:hello@tutorlingua.co" className="text-primary font-semibold hover:underline">
                hello@tutorlingua.co
              </a>.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which TutorLingua operates, without regard to conflict of law principles.
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Changes to These Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by email or through the Platform. Your continued use of the Services after such notification constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-700 mt-4">
              <strong>Email:</strong>{" "}
              <a href="mailto:hello@tutorlingua.co" className="text-primary font-semibold hover:underline">
                hello@tutorlingua.co
              </a>
            </p>
          </section>

          {/* Minors */}
          <section className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Special Notice for Minors</h2>
            <p className="text-gray-700 leading-relaxed">
              If you are under 18 years old, you must have permission from your parent or legal guardian before creating an account or booking lessons. By using TutorLingua as a minor, you confirm that you have obtained this permission. Parents and guardians are responsible for monitoring their child&apos;s use of the Platform and any associated costs.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="mx-auto max-w-4xl px-6 py-8 text-center text-sm text-gray-600">
          <p>
            © {new Date().getFullYear()} TutorLingua. All rights reserved. •{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

