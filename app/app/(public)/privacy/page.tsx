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
              <li><strong>Cookies Information:</strong> We use cookies and similar technologies to enhance user experience and analytics. See Section 12 for more details.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Calendar Data:</strong> If you connect Google Calendar or Microsoft Outlook, we access your calendar events to prevent double-bookings and display availability. See Section 2.4 for detailed information about our Google Calendar integration.</li>
              <li><strong>Social Media:</strong> If you interact with our social media pages, we may receive information made available through those platforms</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.4 Google Calendar Integration</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua offers optional integration with Google Calendar to help tutors manage their scheduling. This section describes in detail how we access, use, and protect your Google Calendar data.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Data We Access</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you connect your Google Calendar, we request access using the <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">calendar.events</code> scope, which allows us to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Read your calendar events, including event titles, start and end times, dates, and busy/free status</li>
              <li>Create new calendar events for confirmed TutorLingua lesson bookings</li>
              <li>View event attendee information to identify scheduling conflicts</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">How We Use This Data</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua&apos;s use of Google Calendar data is limited to the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Preventing Double-Bookings:</strong> We read your existing calendar events to determine when you are busy, ensuring students can only book lessons during your available times</li>
              <li><strong>Displaying Availability:</strong> Your calendar busy times are used to show accurate availability on your public booking page</li>
              <li><strong>Creating Lesson Events:</strong> When a student books a lesson with you, we create a calendar event on your Google Calendar with the lesson details</li>
              <li><strong>Calendar View:</strong> We display your calendar events within the TutorLingua dashboard for unified scheduling management</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Data Storage and Retention</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>OAuth Tokens:</strong> Your Google OAuth access and refresh tokens are stored encrypted in our database. These tokens allow TutorLingua to access your calendar on your behalf.</li>
              <li><strong>Calendar Events:</strong> We do not permanently store your Google Calendar event data. Events are fetched on-demand when displaying your calendar or checking availability.</li>
              <li><strong>Created Events:</strong> Lesson booking events created by TutorLingua on your Google Calendar are stored on Google&apos;s servers, not ours, and remain on your calendar after you disconnect from TutorLingua.</li>
              <li><strong>Token Retention:</strong> OAuth tokens are retained until you disconnect your Google Calendar from TutorLingua. Upon disconnection, tokens are immediately deleted from our systems.</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Data Sharing</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>We do not sell, share, or transfer your Google Calendar data to any third parties.</strong> Your calendar data is used exclusively within the TutorLingua platform for the purposes described above. We do not use your calendar data for advertising, marketing, or any purpose other than providing our scheduling services.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Your Rights and Controls</h4>
            <p className="text-gray-700 leading-relaxed mb-4">You have full control over your Google Calendar connection:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Disconnect Anytime:</strong> You can disconnect your Google Calendar from TutorLingua at any time through your Settings &gt; Calendar page. This immediately revokes our access.</li>
              <li><strong>Revoke via Google:</strong> You can also revoke TutorLingua&apos;s access directly from your Google Account at{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                  myaccount.google.com/permissions
                </a>
              </li>
              <li><strong>Request Token Deletion:</strong> You may request deletion of stored OAuth tokens by contacting{" "}
                <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">
                  privacy@tutorlingua.co
                </a>
              </li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">Google API Services Compliance</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua&apos;s use and transfer of information received from Google APIs adheres to the{" "}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                Google API Services User Data Policy
              </a>, including the Limited Use requirements. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>We only use Google Calendar data to provide and improve the scheduling features described in this policy</li>
              <li>We do not use Google Calendar data to serve advertisements</li>
              <li>We do not allow humans to read your calendar data except where necessary for security purposes, to comply with applicable law, or with your explicit consent</li>
              <li>We do not transfer Google Calendar data to third parties except as necessary to provide our services, comply with applicable laws, or as part of a merger, acquisition, or sale of assets (with notice to you)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">2.5 AI Processing and Learning Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">When you use our AI-powered learning features, we collect additional data to provide personalized educational services:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Audio Data:</strong> Voice recordings submitted for pronunciation assessment, audio homework submissions, and audio messages between tutors and students</li>
              <li><strong>Conversation Data:</strong> Messages exchanged with our AI Practice Companion, including your text inputs and AI-generated responses, grammar corrections, and session context</li>
              <li><strong>Learning Analytics:</strong> Grammar error patterns categorized by type (verb tense, subject-verb agreement, prepositions, articles, word order, gender agreement, conjugation, pronouns, plural/singular, spelling, vocabulary), pronunciation accuracy scores, fluency metrics, and vocabulary usage tracking</li>
              <li><strong>Lesson Recording Data (Studio Tier):</strong> Video and audio recordings of lessons conducted through our platform, transcripts generated from recordings, AI-generated lesson summaries, key moments with timestamps, and auto-generated practice drills</li>
              <li><strong>Homework Submissions:</strong> Text responses, audio recordings, and file attachments submitted by students for homework assignments, along with tutor feedback</li>
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
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Comply with applicable laws, lawful requests, and legal process</li>
              <li>Protect our, your, or others&apos; rights, privacy, safety, or property</li>
              <li>Enforce the terms and conditions that govern the Service</li>
              <li>Audit our compliance with legal and contractual requirements</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.5 AI-Powered Learning Features</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We use artificial intelligence and machine learning technologies to enhance the educational experience:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Real-Time Grammar Correction:</strong> AI language models analyze your written text to identify grammar errors, provide corrections, and offer explanations to help you learn</li>
              <li><strong>Pronunciation Assessment:</strong> Speech recognition services process your audio recordings to evaluate pronunciation accuracy, fluency, and provide detailed feedback on specific sounds and words</li>
              <li><strong>Learning Analytics:</strong> We aggregate and analyze your learning data to identify patterns, track progress over time, and provide insights to tutors to personalize your instruction</li>
              <li><strong>Lesson Transcription and Analysis (Studio Tier):</strong> AI services transcribe lesson recordings and generate summaries, identify key learning moments, and create personalized practice materials based on lesson content</li>
              <li><strong>Auto-Generated Practice Content:</strong> AI generates vocabulary drills, grammar exercises, and practice scenarios based on your identified areas for improvement</li>
              <li><strong>Conversational AI Practice:</strong> Our AI Practice Companion engages in conversational practice sessions, adapting to your proficiency level and providing contextual feedback</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">3.6 Optional Lesson Recording Use (Tutor Opt-In)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              If a tutor opts in, we may use eligible lesson recordings (adults only) for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Internal Training:</strong> Improve accuracy and reliability of our learning features. Training use is internal only.</li>
              <li><strong>Marketing Clips:</strong> Create promotional clips, subject to tutor opt-in and clip approval.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Recordings involving minors are excluded from training and marketing use.
            </p>
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
              <li><strong>Google Calendar:</strong> When you connect your Google Calendar, we access your calendar data through Google&apos;s APIs solely to provide scheduling features. <strong>We do not share, sell, or transfer your Google Calendar data to any third parties.</strong> See Section 2.4 for complete details on our Google Calendar integration.</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-900 mb-3">AI and Machine Learning Service Providers</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following third-party AI services to provide our learning features. Your data is processed by these providers under our Data Processing Agreements in accordance with GDPR Article 28:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>OpenAI, Inc. (United States):</strong> Powers our AI Practice Companion, real-time grammar correction, lesson analysis, and feedback generation. Processes text conversations and lesson transcripts. OpenAI does not use API data to train their models.</li>
              <li><strong>Microsoft Azure Speech Services (United States/EU):</strong> Provides pronunciation assessment and speech recognition. Processes audio recordings and returns accuracy scores, fluency metrics, and word-level feedback. Audio is processed and not retained after analysis.</li>
              <li><strong>Deepgram, Inc. (United States):</strong> Transcribes lesson recordings for Studio tier users. Processes audio files and returns timestamped transcripts with speaker identification.</li>
              <li><strong>LiveKit, Inc. (United States):</strong> Provides real-time video conferencing infrastructure for Studio tier. Processes video and audio streams during live lessons and facilitates recording to secure storage.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pursuant to our instructions, these parties will access, process, or store personal information in the course of performing their duties to us. All AI service providers are bound by confidentiality obligations and are prohibited from using your data for purposes other than providing services to TutorLingua.
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
            <p className="text-gray-700 leading-relaxed mb-4">
              We retain your information for as long as your account is active or as needed to provide Services. After account deletion, we may retain certain information as required by law or for legitimate business purposes (e.g., preventing fraud, resolving disputes, enforcing our agreements).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">7.1 AI and Learning Data Retention Periods</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We apply specific retention periods to AI-processed and learning-related data:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>AI Practice Session Messages:</strong> Retained for 2 years to enable progress tracking, learning analytics, and tutor review of student development</li>
              <li><strong>Grammar and Pronunciation Analytics:</strong> Aggregated learning patterns retained for 3 years; individual error records retained for 1 year</li>
              <li><strong>Pronunciation Audio Recordings:</strong> Original audio files retained for 30 days; pronunciation scores and analytics retained for the duration of your account</li>
              <li><strong>Lesson Recordings (Studio Tier):</strong> Retained for up to 1 year unless deleted sooner</li>
              <li><strong>Lesson Transcripts and AI Summaries:</strong> Retained for the same period as the associated lesson recording</li>
              <li><strong>Homework Submissions:</strong> Retained for the duration of your account; audio and file attachments retained for 1 year after submission</li>
              <li><strong>AI Practice Usage and Billing Data:</strong> Retained for 7 years for tax compliance and billing dispute resolution</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              You may request deletion of specific AI-processed data at any time by contacting{" "}
              <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">
                privacy@tutorlingua.co
              </a>. Some data may be retained in anonymized or aggregated form for service improvement purposes.
            </p>
          </section>

          {/* AI Processing & Automated Decision Making */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. AI Processing & Automated Decision Making</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua uses artificial intelligence to enhance language learning. This section explains how AI processes your data and your rights regarding automated processing.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 How We Use AI</h3>
            <p className="text-gray-700 leading-relaxed mb-4">Our AI features include:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Real-Time Processing:</strong> Grammar correction and pronunciation assessment provide immediate feedback as you practice</li>
              <li><strong>Batch Processing:</strong> Lesson recordings are transcribed and analyzed after sessions to generate summaries and practice materials</li>
              <li><strong>Learning Analytics:</strong> Your progress data is analyzed to identify patterns and areas for improvement</li>
              <li><strong>Content Generation:</strong> AI generates personalized drills, exercises, and practice scenarios based on your learning needs</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.2 Your Rights Regarding AI Processing</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In accordance with GDPR Article 22 and applicable US state privacy laws:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>No Significant Automated Decisions:</strong> TutorLingua does not make automated decisions that produce legal effects or similarly significant effects concerning you. AI is used solely to enhance learning, not to make consequential decisions about your access to services or opportunities.</li>
              <li><strong>Right to Human Review:</strong> You may request human review of any AI-generated assessment or feedback by contacting your tutor or our support team.</li>
              <li><strong>Right to Explanation:</strong> You may request an explanation of how AI features process your data and generate outputs by contacting{" "}
                <a href="mailto:privacy@tutorlingua.co" className="text-primary font-semibold hover:underline">privacy@tutorlingua.co</a>.</li>
              <li><strong>Right to Object:</strong> You may object to AI processing by disabling specific AI features in your account settings or by not using AI-powered features. Note that some core functionality requires AI processing.</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.3 AI Output Ownership</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>TutorLingua owns all AI-generated content</strong>, including but not limited to: grammar corrections and explanations, pronunciation feedback, lesson summaries and key moments, auto-generated drills and exercises, AI Practice Companion responses, and learning analytics insights.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              We grant you a limited, non-exclusive, non-transferable license to use AI-generated content for your personal educational purposes only. You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li>Commercially redistribute AI-generated content</li>
              <li>Use AI outputs to develop competing products or services</li>
              <li>Claim authorship or ownership of AI-generated content</li>
              <li>Use AI outputs to train other AI models without our written consent</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Your input remains your property.</strong> Content you submit (messages, homework, audio recordings) remains yours, subject to our license to process it for providing services.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.4 AI Data Security</h3>
            <p className="text-gray-700 leading-relaxed mb-4">We implement robust security measures for AI processing:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>All data transmitted to AI services is encrypted using TLS 1.3</li>
              <li>We maintain Data Processing Agreements (DPAs) with all AI subprocessors</li>
              <li>Conversation context is limited to the current session to minimize data exposure</li>
              <li>AI providers are contractually prohibited from using your data to train their models</li>
              <li>Audio data sent for pronunciation assessment is processed in real-time and not retained by the provider</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Your Privacy Rights</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TutorLingua is not directed to children under the age of 16. We do not knowingly collect personal information from children under 16 without parental consent. If you have reason to believe that a child under 16 has provided personal information to TutorLingua, please contact us and we will endeavor to delete that information from our databases.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For users aged 13-17, we recommend parental or guardian oversight. Parents may request access to, correction of, or deletion of their child&apos;s information by contacting us.
            </p>
          </section>

          {/* International Users */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. International Data Transfers</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Cookies and Tracking Technologies</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Do Not Track Signals</h2>
            <p className="text-gray-700 leading-relaxed">
              Do Not Track (&quot;DNT&quot;) is a privacy preference that users can set in certain web browsers. Please note that we do not respond to or honor DNT signals or similar mechanisms transmitted by web browsers. To find out more about &quot;Do Not Track,&quot; please visit{" "}
              <a href="http://www.allaboutdnt.com" target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline">
                www.allaboutdnt.com
              </a>.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service and our business may change from time to time. As a result, we may change this Privacy Policy at any time. When we do, we will post an updated version on this page, unless another type of notice is required by applicable law. By continuing to use our Service or providing us with personal information after we have posted an updated Privacy Policy, you consent to the revised Privacy Policy and practices described in it.
            </p>
          </section>

          {/* GDPR Representative */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. GDPR Representatives</h2>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contact Us</h2>
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
