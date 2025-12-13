export type NicheSlug =
  | "esl-tutors"
  | "spanish-tutors"
  | "business-english-coaches"
  | "french-teachers";

export type NicheData = {
  title: string;
  metaTitle: string;
  description: string;
  painPoints: [string, string, string];
  marketplaceComparison: string;
  language: string;
  heroImage: string;
};

export type NicheDataMap = Record<NicheSlug, NicheData>;

export const NICHE_DATA = {
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
  },
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
  },
} satisfies NicheDataMap;
