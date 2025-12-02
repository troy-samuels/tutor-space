import { defaultLocale, type Locale } from "@/lib/i18n/config";

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
  price: string;
  period: string;
  badge?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
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
      "$29 a month. All tools. No add-on fees.",
    primaryCTA: "Start now",
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
    cta: "Start free",
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
    headline: "$29 a month",
    subheadline: "One flat price for every tutor.",
    comparisonNote: "All features included. No add-on fees. Cancel anytime.",
    tiers: [
      {
        name: "Full access",
        price: "$29",
        period: "per month",
        badge: "All features",
        description: "One plan. Full platform.",
        features: [
          "Site, links, and bookings in one place",
          "Pay upfront with Stripe or PayPal",
          "Notes and tasks for each student",
          "Email and WhatsApp nudges built in",
          "No add-on fees. Stop when you want.",
        ],
        cta: "Start now",
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
    platformPrice: "$29",
    platformPeriod: "/mo",
    cta: "Start now",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "Ready to own your business?",
    subheadline:
      "Free to start. Ready in 10 minutes. No credit card needed.",
    calculatorLabel: "Monthly revenue:",
    calculatorUnit: "/month",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Marketplace fees (25%):",
    platformCostLabel: "TutorLingua ($29):",
    monthlySavingsLabel: "Monthly savings:",
    annualSavingsLabel: "Annual savings",
    button: "Start now",
    finePrint: "Free forever. Upgrade anytime.",
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
          { label: "Roadmap", href: "/roadmap" },
          { label: "Security", href: "/security" },
        ],
      },
      {
        title: "Resources",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Help Center", href: "/help" },
          { label: "Templates", href: "/templates" },
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
      "$29 al mes. Todas las funciones. Sin extras.",
    primaryCTA: "Empieza ahora",
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
    headline: "$29 al mes",
    subheadline: "Un solo precio para tutores.",
    comparisonNote: "Acceso completo. Sin extras. Cancela cuando quieras.",
    tiers: [
      {
        name: "Acceso total",
        price: "$29",
        period: "al mes",
        badge: "Todo incluido",
        description: "Un plan. Toda la plataforma.",
        features: [
          "Sitio y reservas en un solo lugar",
          "Cobros por Stripe o PayPal",
          "Notas y tareas por alumno",
          "Emails y recordatorios listos",
          "Sin extras. Cancela cuando quieras.",
        ],
        cta: "Empieza ahora",
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
    platformPrice: "$29",
    platformPeriod: "/mes",
    cta: "Empieza ahora",
    ctaHref: "/signup",
  },

  finalCTA: {
    headline: "¿Listo para ser dueño de tu negocio?",
    subheadline:
      "Gratis para empezar. Listo en 10 minutos. Sin tarjeta necesaria.",
    calculatorLabel: "Ingresos mensuales:",
    calculatorUnit: "/mes",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Comisiones marketplace (25%):",
    platformCostLabel: "TutorLingua ($29):",
    monthlySavingsLabel: "Ahorro mensual:",
    annualSavingsLabel: "Ahorro anual",
    button: "Empieza gratis",
    finePrint: "Gratis para siempre. Actualiza cuando quieras.",
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
          { label: "Hoja de ruta", href: "/roadmap" },
          { label: "Seguridad", href: "/security" },
        ],
      },
      {
        title: "Recursos",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Centro de ayuda", href: "/help" },
          { label: "Plantillas", href: "/templates" },
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

const landingCopyByLocale: Record<Locale, LandingCopy> = {
  en: landingCopyEn,
  es: landingCopyEs,
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
