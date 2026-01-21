/**
 * FAQ data for the TutorLingua FAQ page
 * Organized by 6 categories targeting high-search, low-competition keywords
 */

export type FAQItem = {
  id: string;
  question: string;
  answer: string;
};

export type FAQCategory = {
  id: string;
  title: string;
  description: string;
  icon: string;
  items: FAQItem[];
};

export const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "tutors-getting-started",
    title: "For Tutors - Getting Started",
    description: "Everything you need to launch your online tutoring career",
    icon: "Rocket",
    items: [
      {
        id: "tefl-certificate",
        question: "Do I need a TEFL certificate to tutor online?",
        answer:
          "Not required on most platforms, but increases credibility and earning potential. Tutors with TEFL or similar certifications typically earn 20-40% more than those without. If you're serious about tutoring long-term, it's a worthwhile investment that pays for itself within a few months.",
      },
      {
        id: "tutor-without-degree",
        question: "Can I tutor without a degree?",
        answer:
          "Yes, passion and native fluency matter more for conversation practice. Many successful tutors don't have formal degrees but excel at helping students improve their speaking skills. Specialized tutoring like exam prep (IELTS, TOEFL) may benefit from relevant credentials, but it's not strictly required.",
      },
      {
        id: "new-tutor-pricing",
        question: "How much should I charge as a new language tutor?",
        answer:
          "Start at $15-25/hour to build your initial reviews and student base. As you gain experience and testimonials, increase to $30-50/hour. Specialized tutoring like IELTS prep, business language, or medical terminology commands premium rates of $50-80+/hour.",
      },
      {
        id: "equipment-needed",
        question: "What equipment do I need to tutor online?",
        answer:
          "Essential equipment: a good webcam (1080p), quality USB microphone, stable internet (25+ Mbps), quiet space with good lighting, and a backup plan for technical issues. Total investment: $100-300. Don't overthink it - many successful tutors started with just a laptop and good WiFi.",
      },
      {
        id: "first-students",
        question: "How do I get my first tutoring students?",
        answer:
          "Start with friends and family for practice and initial reviews. Post on language learning communities and social media. Join language exchange apps to network. Offer 2-3 free trial lessons to get your first reviews - those early testimonials are crucial for building trust with future students.",
      },
      {
        id: "personal-brand",
        question: "How to build a personal brand as a tutor?",
        answer:
          "Choose a niche (exam prep, kids, business, conversation). Create consistent social content sharing teaching tips. Showcase student success stories and wins. Be memorable - develop a teaching style that's uniquely yours. A professional website and booking page help establish credibility.",
      },
      {
        id: "successful-tutor",
        question: "What makes a successful online tutor?",
        answer:
          "Reliability (always show up on time), clear communication, personalized lessons based on student goals, patience with all learning speeds, continuous improvement of your teaching methods, and a professional setup. Success comes from making each student feel supported and seeing their progress.",
      },
      {
        id: "stand-out",
        question: "How to stand out as a language tutor?",
        answer:
          "Specialize in a niche (exam prep, kids, business, accent reduction). Offer unique materials or teaching methods. Have a professional website with clear outcomes you help students achieve. Collect and prominently display student testimonials. Be active in language learning communities.",
      },
      {
        id: "specialize-one-language",
        question: "Should I specialize in one language?",
        answer:
          "Yes, if you're advanced or native in that language. Specialization allows you to charge higher rates and makes your marketing much clearer. Being known as 'the Spanish exam prep expert' is more memorable than being a generic 'language tutor'. Depth beats breadth for building a reputation.",
      },
      {
        id: "professional-profile",
        question: "How to create a professional tutoring profile?",
        answer:
          "Use a professional, friendly photo with good lighting. Write a clear headline stating who you help and how. List specific outcomes you help students achieve. Include a sample lesson structure so students know what to expect. Add student testimonials and highlight your teaching experience.",
      },
    ],
  },
  {
    id: "tutors-growing",
    title: "For Tutors - Growing Your Business",
    description: "Strategies to scale beyond tutoring platforms",
    icon: "TrendingUp",
    items: [
      {
        id: "direct-bookings",
        question: "How to get direct bookings as a language tutor?",
        answer:
          "Build your own booking page and share it with repeat students. Include the link in your social profiles, email signature, and lesson follow-ups. Once students know and trust you, they're often happy to book directly - it's more convenient for them and saves you platform commissions.",
      },
      {
        id: "platform-commissions",
        question: "How much do tutoring platforms typically take?",
        answer:
          "Most platforms take 15-33% commission per lesson. On a $50/hour lesson, you could be losing $8-17 per session. That adds up to $3,000-8,000+ per year for active tutors. Direct booking through your own system lets you keep 100% of what students pay.",
      },
      {
        id: "repeat-students-direct",
        question: "How to get repeat students to book directly?",
        answer:
          "Provide excellent value so they want to continue with you. After a few successful lessons, casually mention your direct booking option. Offer a small discount (10-15%) for direct bookings. Make it easy with a simple booking link. Most students are happy to support their tutor directly.",
      },
      {
        id: "social-media-students",
        question: "How to find students on social media?",
        answer:
          "Post daily teaching tips, language facts, or quick lessons. Use hashtags like #LearnSpanish, #FrenchTutor, or #LanguageLearning. Engage authentically in language learning communities. Share student wins (with permission). Comment helpfully on others' language questions to build visibility.",
      },
      {
        id: "tutoring-referrals",
        question: "How to get tutoring referrals?",
        answer:
          "Ask happy students directly after a breakthrough moment. Offer referral discounts (one free lesson for both parties). Make it easy with a shareable link. Thank students publicly when they refer someone. Most referrals come from simply delivering great lessons consistently.",
      },
      {
        id: "instagram-students",
        question: "How to use Instagram to get tutoring students?",
        answer:
          "Create Reels with quick 30-60 second language tips. Use Stories for behind-the-scenes teaching moments. Post carousel slides teaching useful phrases or grammar. Put your booking link prominently in your bio. Engage with language learners in comments and DMs authentically.",
      },
      {
        id: "tiktok-tutors",
        question: "Should tutors use TikTok?",
        answer:
          "Yes, short teaching clips perform exceptionally well on TikTok. Many tutors report getting 5-10 students from a single viral video. The algorithm favors educational content. Even with just a few hundred followers, your videos can reach thousands of potential students.",
      },
      {
        id: "google-ranking",
        question: "How to rank on Google as a tutor?",
        answer:
          "Create a website with your name + 'language tutor' (e.g., 'Maria Garcia Spanish Tutor'). Blog about teaching tips and language learning advice. Get listed in tutor directories. Encourage students to leave Google reviews. Local SEO works great if you target your city.",
      },
      {
        id: "email-list",
        question: "How to build an email list as a tutor?",
        answer:
          "Offer a free resource (vocabulary list, grammar guide, study checklist) in exchange for email signup. Send weekly tips that provide genuine value. Include a booking CTA naturally. Email converts better than social media - it's direct access to interested learners.",
      },
      {
        id: "followers-to-students",
        question: "How to turn social followers into students?",
        answer:
          "Clear CTA in bio pointing to your booking page. Regular reminders about your services (but not spammy). Free trial lesson offers for followers. Showcase transformation stories showing student progress. Make booking feel like the natural next step for engaged followers.",
      },
    ],
  },
  {
    id: "tutors-operations",
    title: "For Tutors - Operations & Tools",
    description: "Streamline your tutoring business with the right tools",
    icon: "Settings",
    items: [
      {
        id: "video-call-app",
        question: "Best video call app for tutoring?",
        answer:
          "Zoom is the industry standard - most students already have it. Google Meet is free and works well. Microsoft Teams is preferred by business clients. Look for screen sharing, recording capability, and whiteboard features. Reliability matters most - test before lessons.",
      },
      {
        id: "timezone-scheduling",
        question: "How to schedule students in different timezones?",
        answer:
          "Use scheduling software that converts timezones automatically. TutorLingua handles this for you. Always confirm the timezone in writing before the first lesson. Consider displaying times in both timezones on your calendar. Daylight saving changes trip up many tutors - stay aware.",
      },
      {
        id: "paypal-vs-stripe",
        question: "Should I use PayPal or Stripe for payments?",
        answer:
          "Stripe is better for recurring payments and packages - it's more professional. PayPal works well for one-time payments and is trusted internationally. Both charge approximately 3% in fees. Many tutors use both to give students options. Consider what your students prefer in their region.",
      },
      {
        id: "cancellation-policy",
        question: "How to handle student cancellations?",
        answer:
          "Set a clear 24-hour cancellation policy upfront and communicate it before the first lesson. Charge 50-100% for late cancellations (under 24 hours). Be flexible occasionally for good students with genuine emergencies - building goodwill matters for long-term retention.",
      },
      {
        id: "lesson-reminders",
        question: "How to send automatic lesson reminders?",
        answer:
          "Use booking software with built-in reminders - TutorLingua sends them automatically 24 hours before and 1 hour before lessons. Calendly also offers this. Reduces no-shows by 80%+ and saves you time chasing students for confirmations.",
      },
      {
        id: "whiteboard-tool",
        question: "Best whiteboard for online tutoring?",
        answer:
          "Google Jamboard is free and easy to use. Miro is feature-rich for complex lessons. Zoom has a built-in whiteboard. For language tutoring, a shared Google Doc often works just as well for writing and corrections. Choose based on how visual your teaching style is.",
      },
      {
        id: "recording-lessons",
        question: "How to record tutoring sessions legally?",
        answer:
          "Always get written consent before recording - it's legally required in most places. Recording can be valuable for student review and your improvement. Check local laws about recording conversations. Most platforms have built-in recording with consent features.",
      },
      {
        id: "free-booking-system",
        question: "Best free booking system for tutors?",
        answer:
          "Calendly's free tier works for basic scheduling. Google Calendar with Appointlet is another free option. TutorLingua's built-in system is free and designed specifically for tutors with payments, reminders, and student management included. Avoid manual back-and-forth scheduling - it wastes hours weekly.",
      },
      {
        id: "professional-invoice",
        question: "How to create a professional invoice?",
        answer:
          "Use Wave (free accounting software), PayPal invoicing, or tutoring software with built-in invoicing. Include: your name/business name, date, service description, rate, payment terms, and accepted payment methods. Keep records for tax purposes.",
      },
      {
        id: "manage-students",
        question: "How to manage multiple students?",
        answer:
          "Use a simple spreadsheet or CRM to track: name, current level, learning goals, lesson notes, and payment status. As you grow beyond 10-15 students, dedicated tutoring software saves significant time. Review notes before each lesson to personalize your teaching.",
      },
    ],
  },
  {
    id: "tutors-money-legal",
    title: "For Tutors - Money & Legal",
    description: "Navigate pricing, taxes, and business essentials",
    icon: "DollarSign",
    items: [
      {
        id: "hourly-rate",
        question: "How much should language tutors charge per hour?",
        answer:
          "Beginners: $15-30/hour. Experienced tutors: $30-50/hour. Specialized tutoring (exam prep, business, medical): $50-100+/hour. Adjust for your market, credentials, and demand. Don't undercharge - students often associate price with quality.",
      },
      {
        id: "tutoring-packages",
        question: "Should I offer tutoring packages?",
        answer:
          "Yes, packages improve student retention significantly. Offer 10-lesson packages at a 10-15% discount to encourage commitment. Students who buy packages are more likely to show up consistently and make progress. It also provides you with more predictable income.",
      },
      {
        id: "raise-rates",
        question: "How to raise my tutoring rates?",
        answer:
          "Announce 2-4 weeks ahead to give students time to adjust. Grandfather existing students at the old rate briefly (1-2 months). Justify with new skills, certifications, or high demand. Most students accept reasonable increases if you've provided good value.",
      },
      {
        id: "trial-lesson-price",
        question: "What's a good price for trial lessons?",
        answer:
          "$0-15 for a 30-minute trial is standard. Free trials get more bookings but attract less serious students. Paid trials ($5-15) filter for committed learners. Many tutors offer free 15-minute consultations instead of full trial lessons.",
      },
      {
        id: "tax-writeoffs",
        question: "What can tutors write off on taxes?",
        answer:
          "Common deductions: home office space, internet (portion used for work), equipment (webcam, microphone, lighting), software subscriptions, professional development courses, marketing costs, and business-related travel. Keep receipts for everything - it adds up significantly.",
      },
      {
        id: "self-employment-tax",
        question: "Do tutors pay self-employment tax?",
        answer:
          "Yes, in the US you pay approximately 15.3% self-employment tax (Social Security + Medicare) on top of income tax. This applies to net self-employment income over $400/year. Set aside 25-30% of your gross income for taxes to avoid surprises.",
      },
      {
        id: "save-for-taxes",
        question: "How much should tutors save for taxes?",
        answer:
          "Save 25-30% of your gross income for taxes. Pay quarterly estimated taxes to avoid penalties and a large year-end bill. Use a separate savings account for tax money. Consider working with an accountant familiar with self-employment if your income is substantial.",
      },
      {
        id: "business-insurance",
        question: "Do I need business insurance for tutoring?",
        answer:
          "Optional but recommended for peace of mind. Professional liability insurance costs approximately $200-500/year and protects against claims of negligence or errors. Most online-only tutors don't have insurance, but it's worth considering as your business grows.",
      },
      {
        id: "llc-for-tutoring",
        question: "Should tutors form an LLC?",
        answer:
          "An LLC provides liability protection and a more professional image, but isn't required. Helpful if you're earning significant income or want to separate personal and business finances. Costs approximately $100-500 to set up depending on your state. Consult a business attorney for your specific situation.",
      },
      {
        id: "tutoring-contract",
        question: "Do I need a contract for private tutoring?",
        answer:
          "Recommended for clarity and protection. Include: rates, payment terms, cancellation policy, lesson scheduling expectations, and confidentiality. A simple one-page agreement works fine. It sets professional expectations and prevents misunderstandings down the road.",
      },
    ],
  },
  {
    id: "students-finding",
    title: "For Students - Finding a Tutor",
    description: "Tips for choosing the right language tutor",
    icon: "Search",
    items: [
      {
        id: "tutor-cost",
        question: "How much do online language tutors cost?",
        answer:
          "$15-50/hour for general conversation and grammar tutoring. $50-100+/hour for specialized tutoring like exam prep (IELTS, TOEFL, DELE) or business language. Quality varies significantly - higher rates often (but not always) indicate more experienced tutors with proven results.",
      },
      {
        id: "online-vs-inperson",
        question: "Is online tutoring as good as in-person?",
        answer:
          "Research shows equal effectiveness for language learning. Online offers more flexibility, access to tutors worldwide (including native speakers in any country), no commute time, and often lower prices. Most students prefer online once they try it.",
      },
      {
        id: "good-tutor-signs",
        question: "How do I know if a tutor is good?",
        answer:
          "Look for: a clear teaching philosophy, relevant experience with students like you, student reviews mentioning specific progress, professional presentation, and willingness to do a trial lesson. Trust your gut after the trial - good chemistry matters for long-term learning.",
      },
      {
        id: "lessons-per-week",
        question: "How many lessons per week to learn a language?",
        answer:
          "2-3 lessons per week for steady, noticeable progress. 1 lesson per week plus daily self-practice also works well. Consistency beats intensity - regular practice matters more than cramming. Adjust based on your goals, budget, and available time.",
      },
      {
        id: "one-hour-per-week",
        question: "Can I learn a language with just 1 hour per week?",
        answer:
          "Slow but possible if you practice between lessons. Expect basic conversational ability in 6-12 months at this pace. Supplement with apps, podcasts, and self-study for faster progress. One hour of focused tutoring can guide a week of independent practice.",
      },
    ],
  },
  {
    id: "students-expectations",
    title: "For Students - What to Expect",
    description: "Prepare for your language learning journey",
    icon: "BookOpen",
    items: [
      {
        id: "trial-lesson-expectations",
        question: "What should I expect in a trial lesson?",
        answer:
          "Usually 30 minutes covering: introductions, a brief level assessment, a mini-lesson to experience their teaching style, discussion of your goals, and time for questions. Come prepared to speak in the target language if you have any ability. It's a two-way evaluation.",
      },
      {
        id: "first-lesson-prep",
        question: "How to prepare for first language lesson?",
        answer:
          "Know your goals (conversation, exam prep, travel, work), your current level honestly, how much time you can dedicate to practice. Prepare questions about the tutor's approach. Test your tech (camera, mic, internet) beforehand. Arrive a few minutes early.",
      },
      {
        id: "fluency-timeline",
        question: "When will I be fluent?",
        answer:
          "Basic conversation: 3-6 months of consistent practice. Comfortable fluency for most situations: 1-2 years. Native-like proficiency: 3-5+ years. These timelines vary significantly based on: your native language, hours of practice, immersion opportunities, and the target language's difficulty.",
      },
      {
        id: "recurring-lessons",
        question: "How do I book recurring lessons?",
        answer:
          "Ask your tutor for a regular weekly slot - most are happy to reserve consistent times for committed students. Many tutors offer packages for recurring lessons at a discount. Having a fixed schedule improves consistency and learning outcomes.",
      },
      {
        id: "cancel-lesson",
        question: "What if I need to cancel a lesson?",
        answer:
          "Most tutors require 24-hour notice for cancellations. Check the policy before booking. Rescheduling is usually preferred over cancellation. Communicate as early as possible - tutors appreciate the consideration and it maintains a good relationship for your learning journey.",
      },
    ],
  },
];

// Helper function to get all FAQs as a flat array
export function getAllFAQs(): FAQItem[] {
  return FAQ_CATEGORIES.flatMap((category) => category.items);
}

// Helper function to search FAQs
export function searchFAQs(query: string): FAQItem[] {
  const lowercaseQuery = query.toLowerCase().trim();
  if (!lowercaseQuery) return [];

  return getAllFAQs().filter(
    (faq) =>
      faq.question.toLowerCase().includes(lowercaseQuery) ||
      faq.answer.toLowerCase().includes(lowercaseQuery)
  );
}

// Helper function to get FAQs for schema
export function getFAQsForSchema(): Array<{ question: string; answer: string }> {
  return getAllFAQs().map((faq) => ({
    question: faq.question,
    answer: faq.answer,
  }));
}
