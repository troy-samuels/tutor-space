import { defaultLocale, type Locale } from "@/lib/i18n/config";
import landingCopyPtJson from "./landing-copy.pt.json";

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
    featured: TestimonialCard & { image?: string };
    list: TestimonialCard[];
  };
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
      "14-day free trial. Then $39 a month or $299 a year. All tools. No add-on fees.",
    primaryCTA: "Start for free",
    secondaryCTA: "See how it works",
    variants: {
      outcomeHeadline: "Less admin. More students.",
      financialHeadline: "Keep 100%—no platform fees.",
      aspirationalHeadline: "Your independent academy, fully automated.",
    },
  },

  socialProof: {
    text: "Used by language tutors on Preply, iTalki, and Verbling to own their repeat business",
    tutors: [
      { name: "Sarai A.", language: "Spanish Teacher" },
      { name: "Thomas B.", language: "French Tutor" },
      { name: "Ricardo M.", language: "Portuguese Tutor" },
    ],
  },

  problems: {
    headline: "Your business is scattered. It shouldn't be.",
    subtitle:
      "Students on Preply. Bookings on Calendly. Links on Beacons. TutorLingua brings it all together.",
    items: [
      {
        icon: "Layers",
        title: "Built for tutors only",
        description:
          "Unlike generic tools. Everything you need. Nothing you don't.",
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
    cta: "Start for free",
  },

  solution: {
    headline: "Everything you need. Nothing you don't.",
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
    headline: "Ready in 10 minutes",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Share your link",
        description:
          "Put it on Instagram. Add it to TikTok. Include it in your Preply bio. Share it everywhere.",
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
    cta: "Start for free",
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
    ],
  },

  pricing: {
    headline: "14-day free trial",
    subheadline: "Billed $39/mo or $299/yr after the trial. One flat price for every tutor.",
    comparisonNote: "All features included. No add-on fees. Cancel anytime before billing begins.",
    toggle: {
      label: "Billing",
      monthlyLabel: "Monthly",
      annualLabel: "Annual (save 36%)",
      helper: "Switch anytime—your plan stays all-access.",
    },
    tiers: [
      {
        name: "Full access",
        monthlyPrice: "$39",
        annualPrice: "$299",
        monthlyPeriod: "per month",
        annualPeriod: "per year",
        badge: "All features",
        description: "14-day free trial. One plan. Full platform.",
        features: [
          "Site, links, and bookings in one place",
          "Secure Stripe checkout—billed after the trial",
          "Notes and tasks for each student",
          "Email and WhatsApp nudges built in",
          "No add-on fees. Cancel anytime.",
        ],
        cta: "Start for free",
        highlighted: true,
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
    headline: "Real tutors, real results",
    featured: {
      quote:
        "I stay on Preply for new students. But repeat lessons go through TutorLingua. Saved me $7,500 in commissions this year.",
      author: "Sarai A.",
      role: "Spanish Teacher",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "My Instagram followers can finally book me directly. 12 lessons booked in the first week.",
        author: "Thomas B.",
        role: "French Tutor",
      },
      {
        quote:
          "All my students in one place. Notes, schedules, payments. No more scattered spreadsheets.",
        author: "Ricardo M.",
        role: "Portuguese Tutor",
      },
    ],
  },

  faq: {
    headline: "Common questions",
    items: [
      {
        question: "Do I need to leave Preply or iTalki?",
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
    platformPrice: "$39",
    platformPeriod: "/mo",
    cta: "Start for free",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "Ready to own your business?",
    subheadline: "Start your 14-day free trial. Ready in 10 minutes.",
    calculatorLabel: "Monthly revenue:",
    calculatorUnit: "/month",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Marketplace fees (25%):",
    platformCostLabel: "TutorLingua ($39):",
    monthlySavingsLabel: "Monthly savings:",
    annualSavingsLabel: "Annual savings",
    button: "Start for free",
    finePrint: "14-day free trial. Billed after the trial; cancel anytime before day 14.",
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
} as const;

const landingCopyEs: LandingCopy = {
  hero: {
    headline: "Creado para tutores.",
    subheadline:
      "Prueba gratis 14 días. Luego $39 al mes o $299 al año. Todas las funciones. Sin extras.",
    primaryCTA: "Empieza gratis",
    secondaryCTA: "Ver cómo funciona",
    variants: {
      outcomeHeadline: "Menos admin. Más estudiantes.",
      financialHeadline: "Quédate con el 100%—sin comisiones.",
      aspirationalHeadline: "Tu academia independiente, totalmente automatizada.",
    },
  },

  socialProof: {
    text: "Usado por tutores de idiomas en Preply, iTalki y Verbling para ser dueños de su negocio repetido",
    tutors: [
      { name: "Sarai A.", language: "Profesora de español" },
      { name: "Thomas B.", language: "Tutor de francés" },
      { name: "Ricardo M.", language: "Tutor de portugués" },
    ],
  },

  problems: {
    headline: "Tu negocio está disperso. No debería estarlo.",
    subtitle:
      "Estudiantes en Preply. Reservas en Calendly. Enlaces en Beacons. TutorLingua lo une todo.",
    items: [
      {
        icon: "Layers",
        title: "Creado solo para tutores",
        description:
          "A diferencia de herramientas genéricas. Todo lo que necesitas. Nada que no.",
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
    cta: "Empieza gratis",
  },

  solution: {
    headline: "Todo lo que necesitas. Nada que no.",
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
    headline: "Listo en 10 minutos",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Comparte tu enlace",
        description:
          "Ponlo en Instagram. Añádelo a TikTok. Inclúyelo en tu bio de Preply. Compártelo en todas partes.",
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
    cta: "Empieza gratis",
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
    ],
  },

  pricing: {
    headline: "Prueba gratis 14 días",
    subheadline: "Luego $39/mes o $299/año. Un precio fijo para cada tutor.",
    comparisonNote: "Acceso completo. Sin cargos hasta el día 14. Cancela antes del cobro.",
    toggle: {
      label: "Facturación",
      monthlyLabel: "Mensual",
      annualLabel: "Anual (ahorra 36%)",
      helper: "Cambia cuando quieras—el plan sigue siendo completo.",
    },
    tiers: [
      {
        name: "Acceso total",
        monthlyPrice: "$39",
        annualPrice: "$299",
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
        cta: "Empieza gratis",
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
    headline: "Tutores reales, resultados reales",
    featured: {
      quote:
        "Me quedo en Preply para nuevos estudiantes. Pero lecciones repetidas van por TutorLingua. Me ahorró $7.500 en comisiones este año.",
      author: "Sarai A.",
      role: "Tutora de español",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "Mis seguidores de Instagram finalmente pueden reservarme directamente. 12 lecciones reservadas en la primera semana.",
        author: "Thomas B.",
        role: "Tutor de francés",
      },
      {
        quote:
          "Todos mis estudiantes en un lugar. Notas, horarios, pagos. No más hojas de cálculo dispersas.",
        author: "Ricardo M.",
        role: "Tutor de portugués",
      },
    ],
  },

  faq: {
    headline: "Preguntas comunes",
    items: [
      {
        question: "¿Necesito dejar Preply o iTalki?",
        answer:
          "No. Usa marketplaces para ser descubierto. Usa TutorLingua para reservas directas de tus seguidores y estudiantes repetidos.",
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
    platformPrice: "$39",
    platformPeriod: "/mes",
    cta: "Empieza gratis",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "¿Listo para ser dueño de tu negocio?",
    subheadline:
      "Prueba gratis 14 días. Listo en 10 minutos.",
    calculatorLabel: "Ingresos mensuales:",
    calculatorUnit: "/mes",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Comisiones marketplace (25%):",
    platformCostLabel: "TutorLingua ($39):",
    monthlySavingsLabel: "Ahorro mensual:",
    annualSavingsLabel: "Ahorro anual",
    button: "Empieza gratis",
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
};

const landingCopyFr: LandingCopy = {
  hero: {
    headline: "Conçu pour les tuteurs.",
    subheadline:
      "Essai gratuit de 14 jours. Puis 39 $/mois ou 299 $/an. Toutes les fonctionnalités. Aucun frais supplémentaire.",
    primaryCTA: "Commencer gratuitement",
    secondaryCTA: "Voir comment ça fonctionne",
    variants: {
      outcomeHeadline: "Moins d'admin. Plus d'étudiants.",
      financialHeadline: "Gardez 100 % — aucune commission.",
      aspirationalHeadline: "Votre académie indépendante, entièrement automatisée.",
    },
  },

  socialProof: {
    text: "Utilisé par des tuteurs de langues sur Preply, iTalki et Verbling pour maîtriser leur activité récurrente",
    tutors: [
      { name: "Sarai A.", language: "Professeure d'espagnol" },
      { name: "Thomas B.", language: "Tuteur de français" },
      { name: "Ricardo M.", language: "Tuteur de portugais" },
    ],
  },

  problems: {
    headline: "Votre activité est éparpillée. Elle ne devrait pas l'être.",
    subtitle:
      "Étudiants sur Preply. Réservations sur Calendly. Liens sur Beacons. TutorLingua réunit tout.",
    items: [
      {
        icon: "Layers",
        title: "Conçu uniquement pour les tuteurs",
        description:
          "Contrairement aux outils génériques. Tout ce dont vous avez besoin. Rien de superflu.",
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
    cta: "Commencer gratuitement",
  },

  solution: {
    headline: "Tout ce dont vous avez besoin. Rien de superflu.",
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
    headline: "Prêt en 10 minutes",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Partagez votre lien",
        description:
          "Mettez-le sur Instagram. Ajoutez-le sur TikTok. Incluez-le dans votre bio Preply. Partagez-le partout.",
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
    cta: "Commencer gratuitement",
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
        cta: "Commencer gratuitement",
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
    headline: "Vrais tuteurs, vrais résultats",
    featured: {
      quote:
        "Je reste sur Preply pour les nouveaux étudiants. Mais les leçons récurrentes passent par TutorLingua. J'ai économisé 7 500 $ en commissions cette année.",
      author: "Sarai A.",
      role: "Professeure d'espagnol",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "Mes abonnés Instagram peuvent enfin me réserver directement. 12 leçons réservées la première semaine.",
        author: "Thomas B.",
        role: "Tuteur de français",
      },
      {
        quote:
          "Tous mes étudiants au même endroit. Notes, horaires, paiements. Fini les tableurs éparpillés.",
        author: "Ricardo M.",
        role: "Tuteur de portugais",
      },
    ],
  },

  faq: {
    headline: "Questions fréquentes",
    items: [
      {
        question: "Dois-je quitter Preply ou iTalki ?",
        answer:
          "Non. Utilisez les marketplaces pour être découvert. Utilisez TutorLingua pour les réservations directes de vos abonnés et étudiants récurrents.",
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
    cta: "Commencer gratuitement",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "Prêt à maîtriser votre activité ?",
    subheadline:
      "Essai gratuit de 14 jours. Prêt en 10 minutes.",
    calculatorLabel: "Revenus mensuels :",
    calculatorUnit: "/mois",
    rangeMinLabel: "500 $",
    rangeMaxLabel: "10 000 $",
    commissionLabel: "Frais marketplace (25 %) :",
    platformCostLabel: "TutorLingua (39 $) :",
    monthlySavingsLabel: "Économies mensuelles :",
    annualSavingsLabel: "Économies annuelles",
    button: "Commencer gratuitement",
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
};

const landingCopyPt: LandingCopy = landingCopyPtJson as LandingCopy;

const landingCopyByLocale: Record<Locale, LandingCopy> = {
  en: landingCopyEn,
  es: landingCopyEs,
  fr: landingCopyFr,
  pt: landingCopyPt,
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
