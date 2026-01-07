import { defaultLocale, type Locale } from "@/lib/i18n/config";
import landingCopyPtJson from "./landing-copy.pt.json";
import landingCopyDeJson from "./landing-copy.de.json";
import landingCopyItJson from "./landing-copy.it.json";
import landingCopyNlJson from "./landing-copy.nl.json";
import landingCopyJaJson from "./landing-copy.ja.json";
import landingCopyZhJson from "./landing-copy.zh.json";
import landingCopyKoJson from "./landing-copy.ko.json";

type ReusableLink = {
  label: string;
  href: string;
};

type FeatureCard = {
  icon: string;
  title: string;
  description: string;
};

type StepCard = {
  number: number;
  icon: string;
  title: string;
  description: string;
};

type PricingTier = {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  monthlyPeriod: string;
  annualPeriod: string;
  badge?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

type PricingToggle = {
  label: string;
  monthlyLabel: string;
  annualLabel: string;
  helper: string;
};

type ComparisonColumn = {
  label: string;
  marketplace: string;
  platform: string;
};

type TestimonialCard = {
  quote: string;
  author: string;
  role: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type ValueStackItem = {
  icon: string;
  feature: string;
  replaces: string[];
  competitorPrice: number;
};

type ValueStackSection = {
  headline: string;
  items: ValueStackItem[];
  totalLabel: string;
  platformLabel: string;
  platformPrice: string;
  platformPeriod: string;
  cta: string;
  ctaHref: string;
};

type FooterSection = {
  title: string;
  links: ReusableLink[];
};

type PhoneMockupFeature = {
  icon: string;
  title: string;
  description: string;
};

type PhoneMockupSection = {
  headline: string;
  subheadline: string;
  features: PhoneMockupFeature[];
  cta: string;
};

type StudioTranscript = {
  recordingLabel: string;
  timer: string;
  tutorLabel: string;
  studentLabel: string;
  lines: string[];
  mispronouncedPrefix: string;
  mispronouncedWord: string;
  mispronouncedSuffix: string;
  mispronouncedHint: string;
  correction: string;
  correctedWord: string;
  correctionHint: string;
};

type StudioIntelligenceSection = {
  badge: string;
  headline: string;
  subheadline: string;
  transcript: StudioTranscript;
  connector: string;
  detectedTitle: string;
  detected: Array<{ word: string; description: string }>;
  vocab: { title: string; description: string };
  practiceTitle: string;
  practice: Array<{ title: string; description: string }>;
  saveNote: string;
};

export type LandingCopy = {
  hero: {
    headline: string;
    subheadline: string;
    primaryCTA: string;
    secondaryCTA: string;
    variants: {
      outcomeHeadline: string;
      financialHeadline: string;
      aspirationalHeadline: string;
    };
  };
  socialProof: {
    text: string;
    tutors: { name: string; language: string }[];
  };
  problems: {
    headline: string;
    subtitle: string;
    items: FeatureCard[];
  };
  phoneMockup: PhoneMockupSection;
  solution: {
    headline: string;
    subheadline: string;
    features: FeatureCard[];
  };
  howItWorks: {
    headline: string;
    steps: StepCard[];
    cta: string;
  };
  featuresDeepDive: {
    headline: string;
    categories: { name: string; items: string[] }[];
  };
  pricing: {
    headline: string;
    subheadline: string;
    comparisonNote: string;
    toggle: PricingToggle;
    tiers: PricingTier[];
  };
  comparison: {
    headline: string;
    caption: string;
    tableHeaders?: {
      feature: string;
      marketplace: string;
      platform: string;
    };
    columns: ComparisonColumn[];
  };
  testimonials: {
    headline: string;
    subheadline: string;
    featured: TestimonialCard & { image?: string };
    list: TestimonialCard[];
  };
  studioIntelligence: StudioIntelligenceSection;
  faq: {
    headline: string;
    items: FAQItem[];
  };
  valueStack: ValueStackSection;
  finalCTA: {
    headline: string;
    subheadline: string;
    calculatorLabel: string;
    calculatorUnit: string;
    rangeMinLabel: string;
    rangeMaxLabel: string;
    commissionLabel: string;
    platformCostLabel: string;
    monthlySavingsLabel: string;
    annualSavingsLabel: string;
    button: string;
    finePrint: string;
    trustBadges: string[];
  };
  navigation: {
    links: ReusableLink[];
    cta: string;
  };
  footer: {
    tagline: string;
    sections: FooterSection[];
    copyright: string;
  };
};

const landingCopyEn: LandingCopy = {
  hero: {
    headline: "Built for tutors.",
    subheadline:
      "Direct bookings, payments and assisted learning in one.",
    primaryCTA: "Sign up free",
    secondaryCTA: "See how it works",
    variants: {
      outcomeHeadline: "Less admin. More students.",
      financialHeadline: "Keep 100%—no platform fees.",
      aspirationalHeadline: "The all-in-one platform for language teachers.",
    },
  },

  socialProof: {
    text: "Used by tutors on major platforms to keep their repeat students.",
    tutors: [
      { name: "Alba GB.", language: "Spanish Teacher" },
      { name: "Thomas B.", language: "French Tutor" },
      { name: "Ricardo M.", language: "Portuguese Tutor" },
    ],
  },

  problems: {
    headline: "You built the relationships. Keep them.",
    subtitle:
      "Marketplaces introduce students. You make them loyal. TutorLingua helps you keep the connection.",
    items: [
      {
        icon: "Layers",
        title: "Built for tutors only",
        description:
          "Designed around how language tutors actually work—lessons, notes, student progress.",
      },
      {
        icon: "Users",
        title: "Own your repeat business",
        description:
          "Marketplaces find students. You keep them. No commissions.",
      },
      {
        icon: "Clock",
        title: "Students book instantly",
        description:
          "Share your link. They pick a time. You get paid. Done.",
      },
    ],
  },

  phoneMockup: {
    headline: "Your site, ready to share",
    subheadline: "Professional. Mobile-friendly. Takes 10 minutes.",
    features: [
      {
        icon: "Palette",
        title: "Your brand, your way",
        description: "Pick colors, fonts, and photos that feel like you",
      },
      {
        icon: "Layers",
        title: "All your services in one place",
        description: "Students see what you offer and book instantly",
      },
      {
        icon: "Star",
        title: "Reviews that build trust",
        description: "Showcase what students say about you",
      },
      {
        icon: "Smartphone",
        title: "Works on any phone",
        description: "Share your link anywhere—Instagram, WhatsApp, email",
      },
    ],
    cta: "Sign up free",
  },

  solution: {
    headline: "One place for your students.",
    subheadline: "Built for language tutors. Ready in 10 minutes.",
    features: [
      {
        icon: "Globe",
        title: "Your professional hub",
        description:
          "Website plus link-in-bio. Share on Instagram, TikTok, marketplace profiles. One link to everything.",
      },
      {
        icon: "Calendar",
        title: "Direct bookings",
        description:
          "Students pick a time. Pay upfront. Get Zoom links automatically. No chasing payments. No back-and-forth.",
      },
      {
        icon: "Users",
        title: "Track your students",
        description:
          "Save notes after each lesson. Remember what you taught. Track progress over time. All in one place.",
      },
    ],
  },

  howItWorks: {
    headline: "Set up today. Teach tomorrow.",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Share your link",
        description:
          "Put it on Instagram. Add it to TikTok. Include it in your marketplace bio. Share it everywhere.",
      },
      {
        number: 2,
        icon: "Calendar",
        title: "Students book directly",
        description:
          "They pick a time. Pay upfront. Get their Zoom link instantly. You get a notification.",
      },
      {
        number: 3,
        icon: "Users",
        title: "You track everything",
        description:
          "All your students in one place. Notes, schedules, payments. No more scattered tools.",
      },
    ],
    cta: "Sign up free",
  },

  featuresDeepDive: {
    headline: "Full control. Delighted parents.",
    categories: [
      {
        name: "Professional Presence",
        items: [
          "Custom subdomain",
          "Link-in-bio with analytics",
          "Parent credibility page",
          "Multi-language support",
          "Social media integrations",
        ],
      },
      {
        name: "Booking & Payments",
        items: [
          "Interactive calendar",
          "Recurring packages",
          "Stripe & PayPal checkout",
          "Automatic invoicing",
          "Zoom link generation",
        ],
      },
      {
        name: "Teaching Tools",
        items: [
          "24/7 AI conversation partner",
          "AI lesson plans & homework",
          "Resource library",
          "Structured lesson notes",
          "CEFR-aligned progress tracking",
        ],
      },
      {
        name: "Communication",
        items: [
          "Automated confirmations",
          "Email & WhatsApp sequences",
          "Testimonial capture",
          "Daily tutor digest",
          "One-click parent updates",
        ],
      },
      {
        name: "Business Insights",
        items: [
          "Revenue analytics",
          "Conversion funnels",
          "AI usage controls",
          "Executive dashboard",
          "Full data export",
        ],
      },
      {
        name: "The Classroom That Takes Notes",
        items: [
          "Perfect Recall — Every lesson transcribed automatically. Students search for that word they forgot three weeks later.",
          "Invisible Insights — Speaking time, vocabulary patterns, common mistakes tracked silently in the background.",
          "Homework That Writes Itself — Review exercises generated from the lesson itself. Based on real errors, not templates.",
        ],
      },
    ],
  },

  pricing: {
    headline: "Start your free trial",
    subheadline: "Pick Pro or Studio. Billed after your trial ends.",
    comparisonNote: "All features included. Cancel anytime before billing begins.",
    toggle: {
      label: "Billing",
      monthlyLabel: "Monthly",
      annualLabel: "Annual (save 43%)",
      helper: "Switch anytime.",
    },
    tiers: [
      {
        name: "Pro",
        monthlyPrice: "$29",
        annualPrice: "$199",
        monthlyPeriod: "per month",
        annualPeriod: "per year",
        badge: "Most tutors",
        description: "Free trial included.",
        features: [
          "Site, links, and bookings in one place",
          "Secure Stripe checkout",
          "Notes and tasks for each student",
          "Email and WhatsApp nudges built in",
          "Cancel anytime.",
        ],
        cta: "Sign up free",
        highlighted: true,
      },
      {
        name: "Studio",
        monthlyPrice: "$79",
        annualPrice: "$499",
        monthlyPeriod: "per month",
        annualPeriod: "per year",
        badge: "Video + AI",
        description: "Free trial included.",
        features: [
          "Everything in Pro",
          "Native classroom",
          "Recording + transcription",
          "AI drills from lessons",
          "Cancel anytime.",
        ],
        cta: "Sign up free",
        highlighted: false,
      },
    ],
  },

  comparison: {
    headline: "Built for tutors. Not for everyone.",
    caption:
      "Generic link tools work for anyone. TutorLingua works for language tutors specifically.",
    tableHeaders: {
      feature: "What you get",
      marketplace: "Generic tools",
      platform: "TutorLingua",
    },
    columns: [
      { label: "", marketplace: "", platform: "" },
      { label: "Booking system", marketplace: "Separate tool", platform: "Built in" },
      { label: "Payment collection", marketplace: "Separate tool", platform: "Built in" },
      { label: "Student notes & CRM", marketplace: "Not included", platform: "Built in" },
      { label: "Lesson tracking", marketplace: "Not included", platform: "Built in" },
      { label: "Professional website", marketplace: "Link page only", platform: "Full site + links" },
    ],
  },

  testimonials: {
    headline: "What changed.",
    subheadline: "",
    featured: {
      quote:
        "I still use the marketplaces to meet new students. But repeat lessons? Those go through here now. Last year, that saved me over $7,500 in commissions.",
      author: "Alba G.",
      role: "Spanish Teacher, Madrid",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "I put my link on Instagram. By the end of the week, 12 people had booked—no DMs, no back-and-forth. Just notifications.",
        author: "Thomas B.",
        role: "French Tutor, Montreal",
      },
      {
        quote:
          "Before, I'd start lessons trying to remember what we covered. Now I check my notes, pick up where we left off, and actually track their progress.",
        author: "Ricardo M.",
        role: "Portuguese Tutor, São Paulo",
      },
    ],
  },

  faq: {
    headline: "Common questions",
    items: [
      {
        question: "Do I need to leave the marketplaces?",
        answer:
          "No. Use marketplaces to get discovered. Use TutorLingua for direct bookings from your followers and repeat students.",
      },
      {
        question: "Is this easy to use?",
        answer:
          "If you can use Instagram, you can use TutorLingua. Most tutors are ready in 10 minutes.",
      },
      {
        question: "How do students book?",
        answer:
          "They click your link. Pick a time. Pay. Get their Zoom link instantly. Done.",
      },
      {
        question: "Do I keep all my earnings?",
        answer:
          "Yes. No commissions on direct bookings through TutorLingua. You keep 100%.",
      },
      {
        question: "Can I track my students?",
        answer:
          "Yes. Save notes after each lesson. Track progress. All your students in one organized place.",
      },
      {
        question: "Can I leave anytime?",
        answer:
          "Yes. Export all your data. No lock-in. Cancel anytime.",
      },
    ],
  },

  valueStack: {
    headline: "What you'd pay elsewhere",
    items: [
      {
        icon: "Globe",
        feature: "Professional Website & Link-in-Bio",
        replaces: ["Squarespace", "Linktree"],
        competitorPrice: 16,
      },
      {
        icon: "Calendar",
        feature: "Calendar Invites & Bookings",
        replaces: ["Calendly", "Acuity Scheduling"],
        competitorPrice: 12,
      },
      {
        icon: "GraduationCap",
        feature: "Lesson Packages & Course Builder",
        replaces: ["Kajabi", "Teachable"],
        competitorPrice: 59,
      },
      {
        icon: "Users",
        feature: "Student CRM & Notes",
        replaces: ["HubSpot", "Notion"],
        competitorPrice: 20,
      },
      {
        icon: "Mail",
        feature: "Email List & Sequences",
        replaces: ["ConvertKit", "Mailchimp"],
        competitorPrice: 15,
      },
      {
        icon: "CreditCard",
        feature: "Payment Processing",
        replaces: ["Stripe setup", "PayPal Business"],
        competitorPrice: 0,
      },
      {
        icon: "BarChart3",
        feature: "Analytics Dashboard",
        replaces: ["Google Analytics"],
        competitorPrice: 0,
      },
    ],
    totalLabel: "What you'd spend otherwise",
    platformLabel: "Join TutorLingua",
    platformPrice: "$29",
    platformPeriod: "/mo",
    cta: "Sign up free",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "Your students deserve continuity. So do you.",
    subheadline: "Keep every lesson, every note, every relationship in one place.",
    calculatorLabel: "Monthly revenue:",
    calculatorUnit: "/month",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Marketplace fees (25%):",
    platformCostLabel: "TutorLingua ($29):",
    monthlySavingsLabel: "Monthly savings:",
    annualSavingsLabel: "Annual savings",
    button: "Sign up free",
    finePrint: "Free trial included. Billed after the trial ends; cancel anytime.",
    trustBadges: ["Stripe Verified", "GDPR Compliant", "SOC 2 Ready"],
  },

  navigation: {
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "Testimonials", href: "#testimonials" },
    ],
    cta: "Sign in",
  },

  footer: {
    tagline: "TutorLingua — Own your repeat business. Built for language tutors.",
    sections: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Security", href: "/security" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Help Center", href: "/help" },
          { label: "Community", href: "/community" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Contact", href: "/contact" },
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
          { label: "Admin", href: "/admin/login" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} TutorLingua. All rights reserved.`,
  },

  studioIntelligence: {
    badge: "Studio Intelligence",
    headline: "Your AI Teaching Assistant",
    subheadline:
      "While you teach, TutorLingua listens. It detects pronunciation struggles and creates targeted practice automatically.",
    transcript: {
      recordingLabel: "Recording",
      timer: "4:32",
      tutorLabel: "Tutor",
      studentLabel: "Student",
      lines: ["\"Muy bien. Ahora dime 'muchas gracias'\""],
      mispronouncedPrefix: "\"Muchas ",
      mispronouncedWord: "grassy-as",
      mispronouncedSuffix: "\"",
      mispronouncedHint: "Sounds too English",
      correction: "\"Almost! Try 'grah-see-ahs' — roll it a bit\"",
      correctedWord: "¡Gracias!",
      correctionHint: "Much better!",
    },
    connector: "AI analyzes lesson",
    detectedTitle: "Detected This Lesson",
    detected: [
      { word: "\"gracias\"", description: "Pronunciation sounds too English" },
      { word: "\"por favor\"", description: "Missing soft 'v' sound" },
    ],
    vocab: {
      title: "5 new terms",
      description: "Vocabulary expansion",
    },
    practiceTitle: "Auto-Generated Practice",
    practice: [
      { title: "Greetings Drill", description: "gracias, hola, adiós, buenos días" },
      { title: "Soft Sounds Practice", description: "favor, vamos, nuevo, llave" },
      { title: "Flashcard Deck", description: "5 new words from today's lesson" },
    ],
    saveNote: "Saved to student's profile automatically",
  },
} as const;

const landingCopyEs: LandingCopy = {
  hero: {
    headline: "Creado para tutores.",
    subheadline:
      "Un enlace para reservas, pagos y notas. Prueba gratis.",
    primaryCTA: "Regístrate gratis",
    secondaryCTA: "Ver cómo funciona",
    variants: {
      outcomeHeadline: "Menos admin. Más estudiantes.",
      financialHeadline: "Quédate con el 100%—sin comisiones.",
      aspirationalHeadline: "Tu academia independiente, totalmente automatizada.",
    },
  },

  socialProof: {
    text: "Usado por tutores en las principales plataformas para mantener a sus estudiantes.",
    tutors: [
      { name: "Alba GB.", language: "Profesora de español" },
      { name: "Thomas B.", language: "Tutor de francés" },
      { name: "Ricardo M.", language: "Tutor de portugués" },
    ],
  },

  problems: {
    headline: "Construiste las relaciones. Consérvalas.",
    subtitle:
      "Las plataformas presentan estudiantes. Tú los fidelizas. TutorLingua te ayuda a mantener la conexión.",
    items: [
      {
        icon: "Layers",
        title: "Creado solo para tutores",
        description:
          "Diseñado para cómo trabajan los tutores de idiomas—clases, notas, progreso del estudiante.",
      },
      {
        icon: "Users",
        title: "Dueño de tu negocio repetido",
        description:
          "Marketplaces encuentran estudiantes. Tú los mantienes. Sin comisiones.",
      },
      {
        icon: "Clock",
        title: "Estudiantes reservan al instante",
        description:
          "Comparte tu enlace. Eligen horario. Pagas. Listo.",
      },
    ],
  },

  phoneMockup: {
    headline: "Tu sitio, listo para compartir",
    subheadline: "Profesional. Optimizado para móvil. En 10 minutos.",
    features: [
      {
        icon: "Palette",
        title: "Tu marca, a tu manera",
        description: "Elige colores, fuentes y fotos que te representen",
      },
      {
        icon: "Layers",
        title: "Todos tus servicios en un lugar",
        description: "Los estudiantes ven lo que ofreces y reservan al instante",
      },
      {
        icon: "Star",
        title: "Reseñas que generan confianza",
        description: "Muestra lo que dicen tus estudiantes de ti",
      },
      {
        icon: "Smartphone",
        title: "Funciona en cualquier teléfono",
        description: "Comparte tu enlace donde quieras—Instagram, WhatsApp, email",
      },
    ],
    cta: "Regístrate gratis",
  },

  solution: {
    headline: "Un solo lugar para tus estudiantes.",
    subheadline: "Creado para tutores de idiomas. Listo en 10 minutos.",
    features: [
      {
        icon: "Globe",
        title: "Tu hub profesional",
        description:
          "Sitio web más link-in-bio. Comparte en Instagram, TikTok, perfiles marketplace. Un enlace a todo.",
      },
      {
        icon: "Calendar",
        title: "Reservas directas",
        description:
          "Estudiantes eligen horario. Pagan por adelantado. Reciben enlaces Zoom automáticamente. Sin perseguir pagos. Sin ida y vuelta.",
      },
      {
        icon: "Users",
        title: "Rastrea tus estudiantes",
        description:
          "Guarda notas después de cada lección. Recuerda lo que enseñaste. Sigue el progreso con el tiempo. Todo en un lugar.",
      },
    ],
  },

  howItWorks: {
    headline: "Configúralo hoy. Enseña mañana.",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Comparte tu enlace",
        description:
          "Ponlo en Instagram. Añádelo a TikTok. Inclúyelo en tu bio de la plataforma. Compártelo en todas partes.",
      },
      {
        number: 2,
        icon: "Calendar",
        title: "Estudiantes reservan directamente",
        description:
          "Eligen horario. Pagan por adelantado. Reciben su enlace Zoom al instante. Recibes notificación.",
      },
      {
        number: 3,
        icon: "Users",
        title: "Tú lo rastreas todo",
        description:
          "Todos tus estudiantes en un lugar. Notas, horarios, pagos. No más herramientas dispersas.",
      },
    ],
    cta: "Regístrate gratis",
  },

  featuresDeepDive: {
    headline: "Control total. Padres encantados.",
    categories: [
      {
        name: "Presencia profesional",
        items: [
          "Subdominio personalizado",
          "Link-in-bio con analítica",
          "Página de credibilidad",
          "Soporte multilingüe",
          "Integraciones redes sociales",
        ],
      },
      {
        name: "Reservas y pagos",
        items: [
          "Calendario interactivo",
          "Paquetes recurrentes",
          "Cobro Stripe y PayPal",
          "Facturación automática",
          "Generación enlaces Zoom",
        ],
      },
      {
        name: "Herramientas de enseñanza",
        items: [
          "Compañero conversación IA 24/7",
          "Planes de clase y tareas IA",
          "Biblioteca de recursos",
          "Notas de clase estructuradas",
          "Seguimiento progreso MCER",
        ],
      },
      {
        name: "Comunicación",
        items: [
          "Confirmaciones automatizadas",
          "Secuencias email y WhatsApp",
          "Captura de testimonios",
          "Resumen diario tutor",
          "Actualizaciones padres un clic",
        ],
      },
      {
        name: "Inteligencia de negocio",
        items: [
          "Analítica de ingresos",
          "Embudos de conversión",
          "Control uso IA",
          "Panel ejecutivo",
          "Exportación completa datos",
        ],
      },
      {
        name: "El Aula Que Toma Notas",
        items: [
          "Memoria Perfecta — Cada clase se transcribe automáticamente. Los estudiantes buscan esa palabra que olvidaron hace tres semanas.",
          "Información Invisible — Tiempo de habla, patrones de vocabulario, errores comunes registrados silenciosamente en segundo plano.",
          "Tareas Que Se Escriben Solas — Ejercicios de repaso generados desde la propia clase. Basados en errores reales, no plantillas.",
        ],
      },
    ],
  },

  pricing: {
    headline: "Prueba gratis",
    subheadline: "Luego $29/mes o $199/año. Un precio fijo para cada tutor.",
    comparisonNote: "Acceso completo. Sin cargos hasta el día 14. Cancela antes del cobro.",
    toggle: {
      label: "Facturación",
      monthlyLabel: "Mensual",
      annualLabel: "Anual (ahorra 43%)",
      helper: "Cambia cuando quieras—el plan sigue siendo completo.",
    },
    tiers: [
      {
        name: "Acceso total",
        monthlyPrice: "$29",
        annualPrice: "$199",
        monthlyPeriod: "al mes",
        annualPeriod: "al año",
        badge: "Todo incluido",
        description: "Prueba gratis 14 días. Un plan. Toda la plataforma.",
        features: [
          "Sitio y reservas en un solo lugar",
          "Checkout seguro con Stripe—cobro después de la prueba",
          "Notas y tareas por alumno",
          "Emails y recordatorios listos",
          "Sin extras. Cancela cuando quieras.",
        ],
        cta: "Regístrate gratis",
        highlighted: true,
      },
    ],
  },

  comparison: {
    headline: "Creado para tutores. No para todos.",
    caption:
      "Herramientas genéricas funcionan para cualquiera. TutorLingua funciona específicamente para tutores de idiomas.",
    tableHeaders: {
      feature: "Lo que obtienes",
      marketplace: "Herramientas genéricas",
      platform: "TutorLingua",
    },
    columns: [
      { label: "", marketplace: "", platform: "" },
      { label: "Sistema de reservas", marketplace: "Herramienta separada", platform: "Integrado" },
      { label: "Cobro de pagos", marketplace: "Herramienta separada", platform: "Integrado" },
      { label: "Notas y CRM de estudiantes", marketplace: "No incluido", platform: "Integrado" },
      { label: "Seguimiento de lecciones", marketplace: "No incluido", platform: "Integrado" },
      { label: "Sitio web profesional", marketplace: "Solo página de enlaces", platform: "Sitio completo + enlaces" },
    ],
  },

  testimonials: {
    headline: "Lo que cambió.",
    subheadline: "",
    featured: {
      quote:
        "Sigo usando las plataformas para conocer nuevos estudiantes. Pero las clases repetidas, esas van por aquí. El año pasado, eso me ahorró más de $7.500 en comisiones.",
      author: "Alba G.",
      role: "Profesora de español, Madrid",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "Puse mi enlace en Instagram. Para el fin de semana, 12 personas habían reservado—sin mensajes, sin ir y venir. Solo notificaciones.",
        author: "Thomas B.",
        role: "Tutor de francés, Montreal",
      },
      {
        quote:
          "Antes, empezaba las clases tratando de recordar qué habíamos visto. Ahora reviso mis notas, retomo donde lo dejamos, y realmente sigo su progreso.",
        author: "Ricardo M.",
        role: "Tutor de portugués, São Paulo",
      },
    ],
  },

  faq: {
    headline: "Preguntas comunes",
    items: [
      {
        question: "¿Necesito dejar las plataformas?",
        answer:
          "No. Usa las plataformas para ser descubierto. Usa TutorLingua para reservas directas de tus seguidores y estudiantes repetidos.",
      },
      {
        question: "¿Es fácil de usar?",
        answer:
          "Si usas Instagram, puedes usar TutorLingua. La mayoría está listo en 10 minutos.",
      },
      {
        question: "¿Cómo reservan los estudiantes?",
        answer:
          "Hacen clic en tu enlace. Eligen horario. Pagan. Reciben su enlace Zoom al instante. Listo.",
      },
      {
        question: "¿Me quedo con todas mis ganancias?",
        answer:
          "Sí. Sin comisiones en reservas directas a través de TutorLingua. Te quedas con el 100%.",
      },
      {
        question: "¿Puedo rastrear mis estudiantes?",
        answer:
          "Sí. Guarda notas después de cada lección. Rastrea progreso. Todos tus estudiantes en un lugar organizado.",
      },
      {
        question: "¿Puedo irme en cualquier momento?",
        answer:
          "Sí. Exporta todos tus datos. Sin permanencia. Cancela cuando quieras.",
      },
    ],
  },

  valueStack: {
    headline: "Lo que pagarías en otros lados",
    items: [
      {
        icon: "Globe",
        feature: "Sitio Web Profesional y Link-in-Bio",
        replaces: ["Squarespace", "Linktree"],
        competitorPrice: 16,
      },
      {
        icon: "Calendar",
        feature: "Calendario y Reservas",
        replaces: ["Calendly", "Acuity Scheduling"],
        competitorPrice: 12,
      },
      {
        icon: "GraduationCap",
        feature: "Paquetes de Clases y Cursos",
        replaces: ["Kajabi", "Teachable"],
        competitorPrice: 59,
      },
      {
        icon: "Users",
        feature: "CRM de Estudiantes y Notas",
        replaces: ["HubSpot", "Notion"],
        competitorPrice: 20,
      },
      {
        icon: "Mail",
        feature: "Lista de Email y Secuencias",
        replaces: ["ConvertKit", "Mailchimp"],
        competitorPrice: 15,
      },
      {
        icon: "CreditCard",
        feature: "Procesamiento de Pagos",
        replaces: ["Stripe setup", "PayPal Business"],
        competitorPrice: 0,
      },
      {
        icon: "BarChart3",
        feature: "Panel de Analíticas",
        replaces: ["Google Analytics"],
        competitorPrice: 0,
      },
    ],
    totalLabel: "Lo que gastarías normalmente",
    platformLabel: "Únete a TutorLingua",
    platformPrice: "$29",
    platformPeriod: "/mes",
    cta: "Regístrate gratis",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "Tus estudiantes merecen continuidad. Tú también.",
    subheadline:
      "Guarda cada clase, cada nota, cada relación en un solo lugar.",
    calculatorLabel: "Ingresos mensuales:",
    calculatorUnit: "/mes",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Comisiones marketplace (25%):",
    platformCostLabel: "TutorLingua ($29):",
    monthlySavingsLabel: "Ahorro mensual:",
    annualSavingsLabel: "Ahorro anual",
    button: "Regístrate gratis",
    finePrint: "Prueba gratis de 14 días. Cargo después; cancela antes del día 14.",
    trustBadges: ["Stripe verificado", "Cumplimos con GDPR", "Listo para SOC 2"],
  },

  navigation: {
    links: [
      { label: "Características", href: "#features" },
      { label: "Cómo funciona", href: "#how-it-works" },
      { label: "Precios", href: "#pricing" },
      { label: "Testimonios", href: "#testimonials" },
    ],
    cta: "Iniciar sesión",
  },

  footer: {
    tagline: "TutorLingua — Sé dueño de tu negocio repetido. Creado para tutores de idiomas.",
    sections: [
      {
        title: "Producto",
        links: [
          { label: "Características", href: "#features" },
          { label: "Precios", href: "#pricing" },
          { label: "Seguridad", href: "/security" },
        ],
      },
      {
        title: "Recursos",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Centro de ayuda", href: "/help" },
          { label: "Comunidad", href: "/community" },
        ],
      },
      {
        title: "Compañía",
        links: [
          { label: "Sobre nosotros", href: "/about" },
          { label: "Contacto", href: "/contact" },
          { label: "Privacidad", href: "/privacy" },
          { label: "Términos", href: "/terms" },
          { label: "Admin", href: "/admin/login" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} TutorLingua. Todos los derechos reservados.`,
  },

  studioIntelligence: {
    badge: "Inteligencia del Estudio",
    headline: "Tu asistente de enseñanza IA",
    subheadline:
      "Mientras enseñas, TutorLingua escucha. Detecta problemas de pronunciación y crea práctica dirigida automáticamente.",
    transcript: {
      recordingLabel: "Grabando",
      timer: "4:32",
      tutorLabel: "Tutor",
      studentLabel: "Estudiante",
      lines: ["\"Muy bien. Ahora dime 'muchas gracias'\""],
      mispronouncedPrefix: "\"Muchas ",
      mispronouncedWord: "grassy-as",
      mispronouncedSuffix: "\"",
      mispronouncedHint: "Suena demasiado inglés",
      correction: "\"¡Casi! Prueba 'grah-see-ahs' — enróllalo un poco\"",
      correctedWord: "¡Gracias!",
      correctionHint: "¡Mucho mejor!",
    },
    connector: "La IA analiza la lección",
    detectedTitle: "Detectado en esta lección",
    detected: [
      { word: "\"gracias\"", description: "Pronunciación suena demasiado inglés" },
      { word: "\"por favor\"", description: "Falta el sonido suave de la 'v'" },
    ],
    vocab: {
      title: "5 nuevos términos",
      description: "Expansión de vocabulario",
    },
    practiceTitle: "Práctica generada automáticamente",
    practice: [
      { title: "Ejercicio de saludos", description: "gracias, hola, adiós, buenos días" },
      { title: "Práctica de sonidos suaves", description: "favor, vamos, nuevo, llave" },
      { title: "Baraja de tarjetas", description: "5 palabras nuevas de la clase" },
    ],
    saveNote: "Guardado en el perfil del estudiante automáticamente",
  },
}; 

const landingCopyFr: LandingCopy = {
  hero: {
    headline: "Conçu pour les tuteurs.",
    subheadline:
      "Un lien pour les réservations, paiements et notes. Essai gratuit.",
    primaryCTA: "Inscris-toi gratuitement",
    secondaryCTA: "Voir comment ça fonctionne",
    variants: {
      outcomeHeadline: "Moins d'admin. Plus d'étudiants.",
      financialHeadline: "Gardez 100 % — aucune commission.",
      aspirationalHeadline: "Votre académie indépendante, entièrement automatisée.",
    },
  },

  socialProof: {
    text: "Utilisé par des tuteurs sur les principales plateformes pour garder leurs étudiants.",
    tutors: [
      { name: "Alba GB.", language: "Professeure d'espagnol" },
      { name: "Thomas B.", language: "Tuteur de français" },
      { name: "Ricardo M.", language: "Tuteur de portugais" },
    ],
  },

  problems: {
    headline: "Vous avez construit ces relations. Gardez-les.",
    subtitle:
      "Les plateformes présentent les étudiants. Vous les fidélisez. TutorLingua vous aide à maintenir le lien.",
    items: [
      {
        icon: "Layers",
        title: "Conçu uniquement pour les tuteurs",
        description:
          "Conçu pour la façon dont les tuteurs de langues travaillent—cours, notes, progression des étudiants.",
      },
      {
        icon: "Users",
        title: "Maîtrisez votre activité récurrente",
        description:
          "Les marketplaces trouvent les étudiants. Vous les gardez. Sans commissions.",
      },
      {
        icon: "Clock",
        title: "Les étudiants réservent instantanément",
        description:
          "Partagez votre lien. Ils choisissent un créneau. Vous êtes payé. Terminé.",
      },
    ],
  },

  phoneMockup: {
    headline: "Votre site, prêt à partager",
    subheadline: "Professionnel. Optimisé mobile. En 10 minutes.",
    features: [
      {
        icon: "Palette",
        title: "Votre marque, à votre façon",
        description: "Choisissez les couleurs, polices et photos qui vous ressemblent",
      },
      {
        icon: "Layers",
        title: "Tous vos services au même endroit",
        description: "Les étudiants voient ce que vous proposez et réservent instantanément",
      },
      {
        icon: "Star",
        title: "Des avis qui inspirent confiance",
        description: "Mettez en avant ce que vos étudiants disent de vous",
      },
      {
        icon: "Smartphone",
        title: "Fonctionne sur tous les téléphones",
        description: "Partagez votre lien partout — Instagram, WhatsApp, email",
      },
    ],
    cta: "Inscris-toi gratuitement",
  },

  solution: {
    headline: "Un seul endroit pour vos étudiants.",
    subheadline: "Conçu pour les tuteurs de langues. Prêt en 10 minutes.",
    features: [
      {
        icon: "Globe",
        title: "Votre hub professionnel",
        description:
          "Site web et link-in-bio. Partagez sur Instagram, TikTok, profils marketplace. Un lien vers tout.",
      },
      {
        icon: "Calendar",
        title: "Réservations directes",
        description:
          "Les étudiants choisissent un créneau. Paient à l'avance. Reçoivent le lien Zoom automatiquement. Fini les relances.",
      },
      {
        icon: "Users",
        title: "Suivez vos étudiants",
        description:
          "Notez après chaque leçon. Souvenez-vous de ce que vous avez enseigné. Suivez les progrès. Tout au même endroit.",
      },
    ],
  },

  howItWorks: {
    headline: "Configurez aujourd'hui. Enseignez demain.",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Partagez votre lien",
        description:
          "Mettez-le sur Instagram. Ajoutez-le sur TikTok. Incluez-le dans votre bio de plateforme. Partagez-le partout.",
      },
      {
        number: 2,
        icon: "Calendar",
        title: "Les étudiants réservent directement",
        description:
          "Ils choisissent un créneau. Paient à l'avance. Reçoivent leur lien Zoom instantanément. Vous êtes notifié.",
      },
      {
        number: 3,
        icon: "Users",
        title: "Vous suivez tout",
        description:
          "Tous vos étudiants au même endroit. Notes, horaires, paiements. Fini les outils éparpillés.",
      },
    ],
    cta: "Inscris-toi gratuitement",
  },

  featuresDeepDive: {
    headline: "Contrôle total. Parents ravis.",
    categories: [
      {
        name: "Présence professionnelle",
        items: [
          "Sous-domaine personnalisé",
          "Link-in-bio avec analytics",
          "Page de crédibilité",
          "Support multilingue",
          "Intégrations réseaux sociaux",
        ],
      },
      {
        name: "Réservations et paiements",
        items: [
          "Calendrier interactif",
          "Forfaits récurrents",
          "Paiement Stripe et PayPal",
          "Facturation automatique",
          "Génération liens Zoom",
        ],
      },
      {
        name: "Outils pédagogiques",
        items: [
          "Partenaire de conversation IA 24/7",
          "Plans de cours et devoirs IA",
          "Bibliothèque de ressources",
          "Notes de cours structurées",
          "Suivi progression CECR",
        ],
      },
      {
        name: "Communication",
        items: [
          "Confirmations automatisées",
          "Séquences email et WhatsApp",
          "Collecte de témoignages",
          "Résumé quotidien tuteur",
          "Mises à jour parents en un clic",
        ],
      },
      {
        name: "Intelligence business",
        items: [
          "Analytics revenus",
          "Tunnels de conversion",
          "Contrôle usage IA",
          "Tableau de bord exécutif",
          "Export complet des données",
        ],
      },
      {
        name: "La Salle de Classe Qui Prend des Notes",
        items: [
          "Mémoire Parfaite — Chaque cours est transcrit automatiquement. Les élèves retrouvent ce mot oublié il y a trois semaines.",
          "Analyses Invisibles — Temps de parole, tendances de vocabulaire, erreurs fréquentes suivis silencieusement en arrière-plan.",
          "Devoirs Automatiques — Exercices de révision générés à partir du cours. Basés sur les vraies erreurs, pas des modèles.",
        ],
      },
    ],
  },

  pricing: {
    headline: "Essai gratuit 14 jours",
    subheadline: "Puis 39 $/mois ou 299 $/an. Un prix unique pour chaque tuteur.",
    comparisonNote: "Accès complet. Aucun prélèvement avant le jour 14. Résiliez avant la facturation.",
    toggle: {
      label: "Facturation",
      monthlyLabel: "Mensuel",
      annualLabel: "Annuel (économisez 36 %)",
      helper: "Changez quand vous voulez — le plan reste complet.",
    },
    tiers: [
      {
        name: "Accès complet",
        monthlyPrice: "39 $",
        annualPrice: "299 $",
        monthlyPeriod: "par mois",
        annualPeriod: "par an",
        badge: "Tout inclus",
        description: "Essai gratuit de 14 jours. Un plan. Toute la plateforme.",
        features: [
          "Site et réservations au même endroit",
          "Paiement sécurisé via Stripe — facturé après l'essai",
          "Notes et tâches par élève",
          "Emails et rappels intégrés",
          "Sans supplément. Résiliez quand vous voulez.",
        ],
        cta: "Inscris-toi gratuitement",
        highlighted: true,
      },
    ],
  },

  comparison: {
    headline: "Conçu pour les tuteurs. Pas pour tout le monde.",
    caption:
      "Les outils génériques fonctionnent pour tous. TutorLingua fonctionne spécifiquement pour les tuteurs de langues.",
    tableHeaders: {
      feature: "Ce que vous obtenez",
      marketplace: "Outils génériques",
      platform: "TutorLingua",
    },
    columns: [
      { label: "", marketplace: "", platform: "" },
      { label: "Système de réservation", marketplace: "Outil séparé", platform: "Intégré" },
      { label: "Collecte de paiements", marketplace: "Outil séparé", platform: "Intégré" },
      { label: "Notes et CRM étudiants", marketplace: "Non inclus", platform: "Intégré" },
      { label: "Suivi des leçons", marketplace: "Non inclus", platform: "Intégré" },
      { label: "Site web professionnel", marketplace: "Page de liens uniquement", platform: "Site complet + liens" },
    ],
  },

  testimonials: {
    headline: "Ce qui a changé.",
    subheadline: "",
    featured: {
      quote:
        "J'utilise encore les plateformes pour rencontrer de nouveaux étudiants. Mais les cours récurrents ? Ils passent par ici maintenant. L'année dernière, ça m'a fait économiser plus de 7 500 $ en commissions.",
      author: "Alba G.",
      role: "Professeure d'espagnol, Madrid",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "J'ai mis mon lien sur Instagram. À la fin de la semaine, 12 personnes avaient réservé—pas de DMs, pas d'allers-retours. Juste des notifications.",
        author: "Thomas B.",
        role: "Tuteur de français, Montréal",
      },
      {
        quote:
          "Avant, je commençais les cours en essayant de me souvenir de ce qu'on avait vu. Maintenant je consulte mes notes, je reprends là où on s'était arrêtés, et je suis vraiment leur progression.",
        author: "Ricardo M.",
        role: "Tuteur de portugais, São Paulo",
      },
    ],
  },

  faq: {
    headline: "Questions fréquentes",
    items: [
      {
        question: "Dois-je quitter les plateformes ?",
        answer:
          "Non. Utilisez les plateformes pour être découvert. Utilisez TutorLingua pour les réservations directes de vos abonnés et étudiants récurrents.",
      },
      {
        question: "Est-ce facile à utiliser ?",
        answer:
          "Si vous utilisez Instagram, vous pouvez utiliser TutorLingua. La plupart des tuteurs sont prêts en 10 minutes.",
      },
      {
        question: "Comment les étudiants réservent-ils ?",
        answer:
          "Ils cliquent sur votre lien. Choisissent un créneau. Paient. Reçoivent leur lien Zoom instantanément. Terminé.",
      },
      {
        question: "Je garde tous mes revenus ?",
        answer:
          "Oui. Aucune commission sur les réservations directes via TutorLingua. Vous gardez 100 %.",
      },
      {
        question: "Puis-je suivre mes étudiants ?",
        answer:
          "Oui. Notez après chaque leçon. Suivez les progrès. Tous vos étudiants organisés au même endroit.",
      },
      {
        question: "Puis-je partir quand je veux ?",
        answer:
          "Oui. Exportez toutes vos données. Sans engagement. Résiliez quand vous voulez.",
      },
    ],
  },

  valueStack: {
    headline: "Ce que vous paieriez ailleurs",
    items: [
      {
        icon: "Globe",
        feature: "Site Web Professionnel et Link-in-Bio",
        replaces: ["Squarespace", "Linktree"],
        competitorPrice: 16,
      },
      {
        icon: "Calendar",
        feature: "Calendrier et Réservations",
        replaces: ["Calendly", "Acuity Scheduling"],
        competitorPrice: 12,
      },
      {
        icon: "GraduationCap",
        feature: "Forfaits de Cours",
        replaces: ["Kajabi", "Teachable"],
        competitorPrice: 59,
      },
      {
        icon: "Users",
        feature: "CRM Étudiants et Notes",
        replaces: ["HubSpot", "Notion"],
        competitorPrice: 20,
      },
      {
        icon: "Mail",
        feature: "Liste Email et Séquences",
        replaces: ["ConvertKit", "Mailchimp"],
        competitorPrice: 15,
      },
      {
        icon: "CreditCard",
        feature: "Traitement des Paiements",
        replaces: ["Stripe setup", "PayPal Business"],
        competitorPrice: 0,
      },
      {
        icon: "BarChart3",
        feature: "Tableau de Bord Analytics",
        replaces: ["Google Analytics"],
        competitorPrice: 0,
      },
    ],
    totalLabel: "Ce que vous dépenseriez normalement",
    platformLabel: "Rejoignez TutorLingua",
    platformPrice: "39 $",
    platformPeriod: "/mois",
    cta: "Inscris-toi gratuitement",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "Vos étudiants méritent la continuité. Vous aussi.",
    subheadline:
      "Gardez chaque cours, chaque note, chaque relation au même endroit.",
    calculatorLabel: "Revenus mensuels :",
    calculatorUnit: "/mois",
    rangeMinLabel: "500 $",
    rangeMaxLabel: "10 000 $",
    commissionLabel: "Frais marketplace (25 %) :",
    platformCostLabel: "TutorLingua (39 $) :",
    monthlySavingsLabel: "Économies mensuelles :",
    annualSavingsLabel: "Économies annuelles",
    button: "Inscris-toi gratuitement",
    finePrint: "Essai gratuit de 14 jours. Facturation après l'essai ; annulez avant le jour 14.",
    trustBadges: ["Stripe vérifié", "Conforme RGPD", "Prêt SOC 2"],
  },

  navigation: {
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Comment ça marche", href: "#how-it-works" },
      { label: "Tarifs", href: "#pricing" },
      { label: "Témoignages", href: "#testimonials" },
    ],
    cta: "Se connecter",
  },

  footer: {
    tagline: "TutorLingua — Maîtrisez votre activité récurrente. Conçu pour les tuteurs de langues.",
    sections: [
      {
        title: "Produit",
        links: [
          { label: "Fonctionnalités", href: "#features" },
          { label: "Tarifs", href: "#pricing" },
          { label: "Sécurité", href: "/security" },
        ],
      },
      {
        title: "Ressources",
        links: [
          { label: "Blog", href: "/fr/blog" },
          { label: "Centre d'aide", href: "/help" },
          { label: "Communauté", href: "/community" },
        ],
      },
      {
        title: "Entreprise",
        links: [
          { label: "À propos", href: "/about" },
          { label: "Contact", href: "/contact" },
          { label: "Confidentialité", href: "/privacy" },
          { label: "Conditions", href: "/terms" },
          { label: "Admin", href: "/admin/login" },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} TutorLingua. Tous droits réservés.`,
  },

  studioIntelligence: {
    badge: "Studio Intelligence",
    headline: "Votre assistant pédagogique IA",
    subheadline:
      "Pendant que vous enseignez, TutorLingua écoute. Il détecte les difficultés de prononciation et crée automatiquement des exercices ciblés.",
    transcript: {
      recordingLabel: "Enregistrement",
      timer: "4:32",
      tutorLabel: "Tuteur",
      studentLabel: "Étudiant",
      lines: ["\"Muy bien. Ahora dime 'muchas gracias'\""],
      mispronouncedPrefix: "\"Muchas ",
      mispronouncedWord: "grassy-as",
      mispronouncedSuffix: "\"",
      mispronouncedHint: "Ça sonne trop anglais",
      correction: "\"Presque ! Essaie 'grah-see-ahs' — roule-le un peu\"",
      correctedWord: "¡Gracias!",
      correctionHint: "Bien mieux !",
    },
    connector: "L'IA analyse la leçon",
    detectedTitle: "Détecté pendant la leçon",
    detected: [
      { word: "\"gracias\"", description: "Prononciation trop anglaise" },
      { word: "\"por favor\"", description: "Son doux du 'v' manquant" },
    ],
    vocab: {
      title: "5 nouveaux termes",
      description: "Extension du vocabulaire",
    },
    practiceTitle: "Exercices générés automatiquement",
    practice: [
      { title: "Exercice de salutations", description: "gracias, hola, adiós, buenos días" },
      { title: "Pratique des sons doux", description: "favor, vamos, nuevo, llave" },
      { title: "Jeu de flashcards", description: "5 nouveaux mots de la leçon" },
    ],
    saveNote: "Enregistré automatiquement dans le profil de l'étudiant",
  },
};

const landingCopyPt: LandingCopy = landingCopyPtJson as LandingCopy;
const landingCopyDe: LandingCopy = landingCopyDeJson as LandingCopy;
const landingCopyIt: LandingCopy = landingCopyItJson as LandingCopy;
const landingCopyNl: LandingCopy = landingCopyNlJson as LandingCopy;
const landingCopyJa: LandingCopy = landingCopyJaJson as LandingCopy;
const landingCopyZh: LandingCopy = landingCopyZhJson as LandingCopy;
const landingCopyKo: LandingCopy = landingCopyKoJson as LandingCopy;

const landingCopyByLocale: Record<Locale, LandingCopy> = {
  en: landingCopyEn,
  es: landingCopyEs,
  fr: landingCopyFr,
  pt: landingCopyPt,
  de: landingCopyDe,
  it: landingCopyIt,
  nl: landingCopyNl,
  ja: landingCopyJa,
  zh: landingCopyZh,
  ko: landingCopyKo,
};

export function getLandingCopy(locale: string | Locale): LandingCopy {
  if (locale && locale in landingCopyByLocale) {
    return landingCopyByLocale[locale as Locale];
  }
  return landingCopyByLocale[defaultLocale];
}

export type HeroVariant = keyof LandingCopy["hero"]["variants"];
export type LandingPricingTier = LandingCopy["pricing"]["tiers"][number];
export type Testimonial = LandingCopy["testimonials"]["list"][number];
export type LandingFAQItem = LandingCopy["faq"]["items"][number];
export type LandingValueStack = LandingCopy["valueStack"];
