export type NicheSlug =
  // Language-specific
  | "esl-tutors"
  | "spanish-tutors"
  | "french-teachers"
  | "german-tutors"
  | "italian-tutors"
  | "portuguese-tutors"
  | "japanese-tutors"
  | "korean-tutors"
  | "chinese-tutors"
  | "arabic-tutors"
  | "russian-tutors"
  | "dutch-tutors"
  // Specialization-specific
  | "business-english-coaches"
  | "ielts-prep-tutors"
  | "toefl-prep-tutors"
  | "dele-exam-tutors"
  | "delf-dalf-tutors"
  | "jlpt-tutors"
  | "conversation-practice"
  | "accent-reduction"
  | "kids-language-tutoring"
  | "medical-english-tutors"
  // Combined niches
  | "business-japanese"
  | "spanish-conversation-practice"
  | "french-for-hospitality"
  | "english-for-tech"
  | "travel-language-lessons";

export type NicheData = {
  title: string;
  metaTitle: string;
  description: string;
  painPoints: [string, string, string];
  marketplaceComparison: string;
  language: string;
  heroImage: string;
  features?: string[];
  targetAudience?: string;
  cta?: string;
};

export type NicheDataMap = Record<NicheSlug, NicheData>;

export const NICHE_DATA: NicheDataMap = {
  // ==========================================
  // LANGUAGE-SPECIFIC NICHES
  // ==========================================

  "esl-tutors": {
    title: "The OS for Independent ESL Teachers",
    metaTitle: "Independent ESL Teacher Platform | Keep 100% of Repeat Students",
    description: "Run IELTS prep, scheduling, and payments without marketplace fees.",
    painPoints: [
      "Losing 33% on long-term students",
      "Managing IELTS prep materials in scattered folders",
      "Timezone burnout from rigid scheduling",
    ],
    marketplaceComparison: "Preply",
    language: "English",
    heroImage: "/images/marketing/esl-hero.png",
    features: ["IELTS/TOEFL prep tools", "Student progress tracking", "Resource library"],
    targetAudience: "ESL teachers serving international students",
    cta: "Start Teaching Directly",
  },

  "spanish-tutors": {
    title: "Stop paying commissions on your Spanish lessons",
    metaTitle: "Spanish Tutor Platform Without Commissions | Grow Direct Bookings",
    description: "Convert DELE prep students to direct billing and keep every euro.",
    painPoints: [
      "DELE exam prep organization",
      "Low rates on iTalki due to competition",
      "Managing homework corrections via WhatsApp",
    ],
    marketplaceComparison: "iTalki",
    language: "Spanish",
    heroImage: "/images/marketing/spanish-hero.png",
    features: ["DELE prep resources", "Homework submission system", "Latin American timezone support"],
    targetAudience: "Spanish tutors teaching globally",
    cta: "Grow Your Spanish Teaching Business",
  },

  "french-teachers": {
    title: "Keep 100% of your French Tuition Fees",
    metaTitle: "French Teacher Platform | Own Bookings and Tuition Fees",
    description: "Share DELF/DALF resources, automate bookings, and escape marketplace price wars.",
    painPoints: [
      "DELF/DALF resource sharing",
      "Student retention after basics",
      "Marketplace price wars",
    ],
    marketplaceComparison: "iTalki",
    language: "French",
    heroImage: "/images/marketing/french-hero.png",
    features: ["DELF/DALF prep tracking", "Cultural content library", "European timezone optimization"],
    targetAudience: "French teachers and Alliance Française instructors",
    cta: "Start Your French Teaching Platform",
  },

  "german-tutors": {
    title: "Build Your German Teaching Business Without Marketplace Fees",
    metaTitle: "German Tutor Platform | Direct Booking & Zero Commission",
    description: "Teach Goethe exam prep and business German while keeping 100% of your rates.",
    painPoints: [
      "Goethe-Institut exam prep tracking",
      "Business German client management",
      "Complex grammar explanation tools",
    ],
    marketplaceComparison: "Preply",
    language: "German",
    heroImage: "/images/marketing/german-hero.png",
    features: ["Goethe exam tracking", "Grammar exercise library", "A1-C2 level progression"],
    targetAudience: "German tutors and Goethe-Institut certified teachers",
    cta: "Launch Your German Teaching Platform",
  },

  "italian-tutors": {
    title: "Teach Italian Without Sharing Your Earnings",
    metaTitle: "Italian Tutor Platform | Zero Commission on Direct Bookings",
    description: "From conversation practice to CILS prep - keep every euro you earn.",
    painPoints: [
      "CILS/CELI exam prep organization",
      "Cultural immersion content management",
      "Students dropping after holiday trips",
    ],
    marketplaceComparison: "iTalki",
    language: "Italian",
    heroImage: "/images/marketing/italian-hero.png",
    features: ["CILS prep resources", "Italian culture library", "Dolce vita themed content"],
    targetAudience: "Italian language teachers worldwide",
    cta: "Start Your Italian Teaching Journey",
  },

  "portuguese-tutors": {
    title: "Brazilian & European Portuguese Teaching Platform",
    metaTitle: "Portuguese Tutor Platform | Direct Student Bookings",
    description: "Teach Brazilian or European Portuguese and manage both dialects seamlessly.",
    painPoints: [
      "Managing BR vs PT-PT dialect preferences",
      "CELPE-Bras exam preparation",
      "Samba vs Fado cultural content",
    ],
    marketplaceComparison: "iTalki",
    language: "Portuguese",
    heroImage: "/images/marketing/portuguese-hero.png",
    features: ["Dialect preference tracking", "CELPE-Bras prep", "Brazilian timezone support"],
    targetAudience: "Portuguese tutors teaching globally",
    cta: "Build Your Portuguese Teaching Business",
  },

  "japanese-tutors": {
    title: "Teach Japanese Without Marketplace Fees",
    metaTitle: "Japanese Tutor Platform | JLPT Prep & Direct Bookings",
    description: "From hiragana to N1 prep - manage your Japanese teaching business your way.",
    painPoints: [
      "JLPT level tracking across students",
      "Kanji progression management",
      "Time zone challenges with Western students",
    ],
    marketplaceComparison: "iTalki",
    language: "Japanese",
    heroImage: "/images/marketing/japanese-hero.png",
    features: ["JLPT N5-N1 tracking", "Kanji progress system", "Anime/manga content integration"],
    targetAudience: "Japanese language teachers and native speakers",
    cta: "Launch Your Japanese Teaching Platform",
  },

  "korean-tutors": {
    title: "K-Pop Era Korean Teaching Platform",
    metaTitle: "Korean Tutor Platform | TOPIK Prep & Zero Commission",
    description: "Ride the Hallyu wave - teach Korean directly without marketplace cuts.",
    painPoints: [
      "TOPIK exam preparation tracking",
      "Hangul to advanced grammar progression",
      "K-drama/K-pop content organization",
    ],
    marketplaceComparison: "iTalki",
    language: "Korean",
    heroImage: "/images/marketing/korean-hero.png",
    features: ["TOPIK I/II prep", "Hangul mastery tracking", "K-culture content library"],
    targetAudience: "Korean tutors and native speakers",
    cta: "Start Your Korean Teaching Business",
  },

  "chinese-tutors": {
    title: "Mandarin Teaching Platform for the Modern Era",
    metaTitle: "Chinese Tutor Platform | HSK Prep & Direct Bookings",
    description: "Teach Mandarin from pinyin to business Chinese - keep 100% of your earnings.",
    painPoints: [
      "HSK level tracking across students",
      "Character writing practice management",
      "Simplified vs Traditional Chinese materials",
    ],
    marketplaceComparison: "iTalki",
    language: "Chinese (Mandarin)",
    heroImage: "/images/marketing/chinese-hero.png",
    features: ["HSK 1-6 tracking", "Character stroke order tools", "Tone practice resources"],
    targetAudience: "Mandarin teachers and certified instructors",
    cta: "Build Your Chinese Teaching Empire",
  },

  "arabic-tutors": {
    title: "Arabic Teaching Platform for Serious Students",
    metaTitle: "Arabic Tutor Platform | MSA & Dialect Teaching",
    description: "Teach Modern Standard Arabic or regional dialects with professional tools.",
    painPoints: [
      "MSA vs dialect curriculum management",
      "Arabic script progression tracking",
      "Islamic/secular content organization",
    ],
    marketplaceComparison: "Preply",
    language: "Arabic",
    heroImage: "/images/marketing/arabic-hero.png",
    features: ["MSA/dialect tracking", "Arabic script progression", "Cultural sensitivity tools"],
    targetAudience: "Arabic teachers serving learners worldwide",
    cta: "Launch Your Arabic Teaching Platform",
  },

  "russian-tutors": {
    title: "Russian Teaching Platform Without Borders",
    metaTitle: "Russian Tutor Platform | Cyrillic to Fluency",
    description: "Teach Russian literature, business Russian, or travel basics - your way.",
    painPoints: [
      "Cyrillic alphabet progression",
      "Case system explanation tools",
      "Literature and culture content",
    ],
    marketplaceComparison: "Preply",
    language: "Russian",
    heroImage: "/images/marketing/russian-hero.png",
    features: ["Cyrillic mastery tracking", "Grammar case tools", "Russian culture library"],
    targetAudience: "Russian language teachers and heritage speakers",
    cta: "Start Teaching Russian Directly",
  },

  "dutch-tutors": {
    title: "Dutch Teaching Platform for Expats & Learners",
    metaTitle: "Dutch Tutor Platform | NT2 Prep & Integration",
    description: "Help students pass NT2 exams and integrate in the Netherlands or Belgium.",
    painPoints: [
      "NT2/Staatsexamen prep tracking",
      "Integration course curriculum",
      "Dutch vs Flemish dialect handling",
    ],
    marketplaceComparison: "iTalki",
    language: "Dutch",
    heroImage: "/images/marketing/dutch-hero.png",
    features: ["NT2 exam prep", "Integration course tools", "Dutch/Flemish dialect support"],
    targetAudience: "Dutch teachers helping expats and integration students",
    cta: "Build Your Dutch Teaching Business",
  },

  // ==========================================
  // SPECIALIZATION NICHES
  // ==========================================

  "business-english-coaches": {
    title: "Professional Platform for Business English Coaches",
    metaTitle: "Business English Coaching Platform | Automate Corporate Invoicing",
    description: "Invoice corporate clients automatically and keep high-ticket students engaged.",
    painPoints: [
      "Chasing corporate invoices manually",
      "High-ticket client retention",
      "Corporate scheduling conflicts",
    ],
    marketplaceComparison: "Preply",
    language: "Business English",
    heroImage: "/images/marketing/business-english-hero.png",
    features: ["Corporate invoicing", "Meeting prep tools", "Professional vocabulary tracking"],
    targetAudience: "Business English coaches serving corporate clients",
    cta: "Professionalize Your Coaching Practice",
  },

  "ielts-prep-tutors": {
    title: "IELTS Preparation Tutoring Platform",
    metaTitle: "IELTS Prep Tutor Platform | Band Score Tracking & Materials",
    description: "Help students achieve their target band scores with organized prep materials.",
    painPoints: [
      "Tracking band score progress across skills",
      "Speaking test simulation scheduling",
      "Writing task feedback organization",
    ],
    marketplaceComparison: "Preply",
    language: "English (IELTS)",
    heroImage: "/images/marketing/ielts-hero.png",
    features: ["Band score tracking", "Practice test library", "Writing feedback system"],
    targetAudience: "IELTS preparation specialists",
    cta: "Launch Your IELTS Prep Business",
  },

  "toefl-prep-tutors": {
    title: "TOEFL Preparation Teaching Platform",
    metaTitle: "TOEFL Prep Tutor Platform | Score Tracking & Test Simulation",
    description: "Prepare students for TOEFL iBT with structured lessons and mock tests.",
    painPoints: [
      "Integrated skill practice management",
      "Speaking task recording and feedback",
      "Reading/Listening score optimization",
    ],
    marketplaceComparison: "Preply",
    language: "English (TOEFL)",
    heroImage: "/images/marketing/toefl-hero.png",
    features: ["Score tracking", "Integrated task practice", "Mock test scheduling"],
    targetAudience: "TOEFL preparation specialists",
    cta: "Build Your TOEFL Prep Practice",
  },

  "dele-exam-tutors": {
    title: "DELE Exam Preparation Platform",
    metaTitle: "DELE Prep Tutor Platform | A1-C2 Level Tracking",
    description: "Help students pass DELE exams from A1 to C2 with professional tools.",
    painPoints: [
      "Multi-level student management",
      "Oral exam preparation scheduling",
      "Written expression feedback tracking",
    ],
    marketplaceComparison: "iTalki",
    language: "Spanish (DELE)",
    heroImage: "/images/marketing/dele-hero.png",
    features: ["A1-C2 level tracking", "Oral exam prep", "Instituto Cervantes alignment"],
    targetAudience: "DELE examination preparation specialists",
    cta: "Launch Your DELE Prep Business",
  },

  "delf-dalf-tutors": {
    title: "DELF/DALF Preparation Teaching Platform",
    metaTitle: "DELF/DALF Prep Platform | French Exam Specialists",
    description: "Guide students through DELF Junior to DALF C2 with structured preparation.",
    painPoints: [
      "DELF Junior vs Adult distinction",
      "Production orale preparation",
      "DALF C1/C2 advanced prep materials",
    ],
    marketplaceComparison: "iTalki",
    language: "French (DELF/DALF)",
    heroImage: "/images/marketing/delf-hero.png",
    features: ["DELF/DALF level tracking", "Oral production prep", "Alliance Française alignment"],
    targetAudience: "French exam preparation specialists",
    cta: "Start Your DELF/DALF Prep Practice",
  },

  "jlpt-tutors": {
    title: "JLPT Preparation Tutoring Platform",
    metaTitle: "JLPT Prep Tutor Platform | N5-N1 Level Tracking",
    description: "Help students pass JLPT from N5 to N1 with kanji and grammar mastery tools.",
    painPoints: [
      "Kanji memorization tracking by level",
      "Grammar point progression",
      "Listening comprehension practice",
    ],
    marketplaceComparison: "iTalki",
    language: "Japanese (JLPT)",
    heroImage: "/images/marketing/jlpt-hero.png",
    features: ["N5-N1 tracking", "Kanji by JLPT level", "Grammar point library"],
    targetAudience: "JLPT examination preparation specialists",
    cta: "Build Your JLPT Prep Business",
  },

  "conversation-practice": {
    title: "Conversation Practice Platform for Language Tutors",
    metaTitle: "Language Conversation Practice Platform | Fluency-Focused Teaching",
    description: "Help students build speaking confidence with structured conversation lessons.",
    painPoints: [
      "Running out of conversation topics",
      "Tracking vocabulary from conversations",
      "Recording and reviewing sessions",
    ],
    marketplaceComparison: "iTalki",
    language: "Multiple Languages",
    heroImage: "/images/marketing/conversation-hero.png",
    features: ["Topic library", "Vocabulary capture", "Session recording"],
    targetAudience: "Conversation-focused language tutors",
    cta: "Launch Your Conversation Practice Service",
  },

  "accent-reduction": {
    title: "Accent Reduction Coaching Platform",
    metaTitle: "Accent Reduction Tutor Platform | Pronunciation Coaching Tools",
    description: "Help professionals refine their pronunciation with specialized coaching tools.",
    painPoints: [
      "Tracking pronunciation improvements",
      "Recording and comparing speech samples",
      "IPA chart and phonetic exercises",
    ],
    marketplaceComparison: "Preply",
    language: "English (Pronunciation)",
    heroImage: "/images/marketing/accent-hero.png",
    features: ["Pronunciation tracking", "Audio comparison tools", "IPA resources"],
    targetAudience: "Accent coaches and pronunciation specialists",
    cta: "Start Your Accent Coaching Practice",
  },

  "kids-language-tutoring": {
    title: "Kids Language Tutoring Platform",
    metaTitle: "Kids Language Tutor Platform | Child-Friendly Teaching Tools",
    description: "Teach children with engaging, age-appropriate lessons and parent communication.",
    painPoints: [
      "Keeping young learners engaged",
      "Parent communication and progress reports",
      "Age-appropriate material organization",
    ],
    marketplaceComparison: "Preply",
    language: "Multiple Languages (Kids)",
    heroImage: "/images/marketing/kids-hero.png",
    features: ["Gamified progress", "Parent portal", "Age-appropriate content"],
    targetAudience: "Language tutors specializing in children",
    cta: "Build Your Kids Tutoring Business",
  },

  "medical-english-tutors": {
    title: "Medical English Teaching Platform",
    metaTitle: "Medical English Tutor Platform | Healthcare Professional Training",
    description: "Teach medical professionals the English they need for patient care and research.",
    painPoints: [
      "Medical terminology organization",
      "OET exam preparation",
      "Patient communication scenarios",
    ],
    marketplaceComparison: "Preply",
    language: "Medical English",
    heroImage: "/images/marketing/medical-hero.png",
    features: ["OET prep tools", "Medical vocabulary library", "Clinical scenario practice"],
    targetAudience: "Medical English specialists and OET prep tutors",
    cta: "Launch Your Medical English Practice",
  },

  // ==========================================
  // COMBINED NICHES
  // ==========================================

  "business-japanese": {
    title: "Business Japanese Teaching Platform",
    metaTitle: "Business Japanese Tutor Platform | Keigo & Corporate Japanese",
    description: "Teach keigo, business etiquette, and corporate Japanese to professionals.",
    painPoints: [
      "Keigo level progression tracking",
      "Business email and meeting preparation",
      "Japanese corporate culture content",
    ],
    marketplaceComparison: "iTalki",
    language: "Japanese (Business)",
    heroImage: "/images/marketing/business-japanese-hero.png",
    features: ["Keigo mastery tracking", "Business scenario library", "JLPT+BJT alignment"],
    targetAudience: "Business Japanese specialists",
    cta: "Build Your Business Japanese Practice",
  },

  "spanish-conversation-practice": {
    title: "Spanish Conversation Practice Platform",
    metaTitle: "Spanish Conversation Tutor Platform | Fluency-Focused Teaching",
    description: "Help students become confident Spanish speakers with immersive conversation lessons.",
    painPoints: [
      "Latin American vs Castilian conversation styles",
      "Slang and colloquial expression teaching",
      "Cultural context for conversations",
    ],
    marketplaceComparison: "iTalki",
    language: "Spanish (Conversation)",
    heroImage: "/images/marketing/spanish-conversation-hero.png",
    features: ["Dialect-specific content", "Slang library", "Cultural immersion topics"],
    targetAudience: "Spanish conversation specialists",
    cta: "Launch Your Spanish Conversation Service",
  },

  "french-for-hospitality": {
    title: "French for Hospitality Industry",
    metaTitle: "Hospitality French Tutor Platform | Restaurant & Hotel Training",
    description: "Train hospitality professionals in French for restaurants, hotels, and tourism.",
    painPoints: [
      "Industry-specific vocabulary management",
      "Service scenario role-plays",
      "Menu and wine terminology",
    ],
    marketplaceComparison: "Preply",
    language: "French (Hospitality)",
    heroImage: "/images/marketing/hospitality-french-hero.png",
    features: ["Hospitality vocabulary", "Service scenarios", "Cultural etiquette"],
    targetAudience: "French tutors serving hospitality professionals",
    cta: "Start Your Hospitality French Practice",
  },

  "english-for-tech": {
    title: "English for Tech Professionals Platform",
    metaTitle: "Tech English Tutor Platform | Developer & Startup Communication",
    description: "Help developers, PMs, and startup founders communicate in English.",
    painPoints: [
      "Technical vocabulary progression",
      "Code review and documentation English",
      "Startup pitch and presentation prep",
    ],
    marketplaceComparison: "Preply",
    language: "English (Tech)",
    heroImage: "/images/marketing/tech-english-hero.png",
    features: ["Tech vocabulary library", "Presentation prep", "Documentation writing"],
    targetAudience: "English tutors serving tech professionals",
    cta: "Launch Your Tech English Practice",
  },

  "travel-language-lessons": {
    title: "Travel Language Lesson Platform",
    metaTitle: "Travel Language Tutor Platform | Vacation-Ready Language Skills",
    description: "Help travelers learn essential phrases and cultural tips before their trips.",
    painPoints: [
      "Short-term intensive scheduling",
      "Destination-specific content",
      "Survival vocabulary prioritization",
    ],
    marketplaceComparison: "iTalki",
    language: "Multiple Languages (Travel)",
    heroImage: "/images/marketing/travel-hero.png",
    features: ["Destination packs", "Survival vocabulary", "Cultural tips library"],
    targetAudience: "Tutors helping travelers prepare for trips",
    cta: "Build Your Travel Language Business",
  },
};

/**
 * Get all niche slugs
 */
export function getAllNicheSlugs(): NicheSlug[] {
  return Object.keys(NICHE_DATA) as NicheSlug[];
}

/**
 * Get niche data by slug
 */
export function getNicheData(slug: string): NicheData | null {
  return NICHE_DATA[slug as NicheSlug] || null;
}

/**
 * Get niches by language
 */
export function getNichesByLanguage(language: string): NicheSlug[] {
  return getAllNicheSlugs().filter(
    slug => NICHE_DATA[slug].language.toLowerCase().includes(language.toLowerCase())
  );
}

/**
 * Get specialization niches (exam prep, business, etc.)
 */
export function getSpecializationNiches(): NicheSlug[] {
  const specializations: NicheSlug[] = [
    "business-english-coaches",
    "ielts-prep-tutors",
    "toefl-prep-tutors",
    "dele-exam-tutors",
    "delf-dalf-tutors",
    "jlpt-tutors",
    "conversation-practice",
    "accent-reduction",
    "kids-language-tutoring",
    "medical-english-tutors",
  ];
  return specializations;
}

/**
 * Get language-specific niches
 */
export function getLanguageNiches(): NicheSlug[] {
  const languages: NicheSlug[] = [
    "esl-tutors",
    "spanish-tutors",
    "french-teachers",
    "german-tutors",
    "italian-tutors",
    "portuguese-tutors",
    "japanese-tutors",
    "korean-tutors",
    "chinese-tutors",
    "arabic-tutors",
    "russian-tutors",
    "dutch-tutors",
  ];
  return languages;
}
