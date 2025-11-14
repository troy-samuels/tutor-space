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
    headline: "Teaching languages has never been so simple. Tutoring just got easier",
    subheadline:
      "More students. Higher income. Less admin. Keep 100% of your earnings.",
    primaryCTA: "Start free",
    secondaryCTA: "See how it works",
    variants: {
      outcomeHeadline: "Less admin. More students.",
      financialHeadline: "Keep 100%—no platform fees.",
      aspirationalHeadline: "Your independent academy, fully automated.",
    },
  },

  socialProof: {
    text: "Trusted by thousands of language tutors building independent businesses",
    tutors: [
      { name: "Sarai A.", language: "Spanish Teacher" },
      { name: "Thomas B.", language: "French Tutor" },
      { name: "Ricardo M.", language: "Portuguese Tutor" },
    ],
  },

  problems: {
    headline: "An all-in-one platform built to deliver your language lessons.",
    subtitle:
      "Move beyond marketplaces. Run your tutoring business the professional way.",
    items: [
      {
        icon: "Layers",
        title: "One platform, not ten",
        description:
          "Booking, payments, CRM, and video—all included.",
      },
      {
        icon: "Users",
        title: "Students book you directly",
        description:
          "No marketplace. No commissions. All yours.",
      },
      {
        icon: "Clock",
        title: "Teach more, admin less",
        description:
          "Automated reminders, zoom links, and lesson prep.",
      },
    ],
  },

  solution: {
    headline: "Everything you need to run your independent business.",
    subheadline: "Simple to start, powerful as you grow.",
    features: [
      {
        icon: "Globe",
        title: "Professional website in minutes",
        description:
          "Launch your tutor site with bio, services, testimonials, and booking calendar. Own your presence.",
      },
      {
        icon: "Calendar",
        title: "Bookings on autopilot",
        description:
          "Set availability once. Students book instantly. Zoom links, reminders, and calendar sync happen automatically.",
      },
      {
        icon: "Wallet",
        title: "Get paid upfront. Zero commission.",
        description:
          "Stripe and PayPal payments built in. Create packages, send invoices, handle refunds. Keep every dollar.",
      },
      {
        icon: "Users",
        title: "Turn followers into students",
        description:
          "Capture leads from Instagram, TikTok, WhatsApp. Smart follow-ups and organized CRM included.",
      },
      {
        icon: "Sparkles",
        title: "AI tools save hours weekly",
        description:
          "Generate lesson plans, homework, and vocab exercises instantly. 24/7 AI conversation partner for students.",
      },
      {
        icon: "CheckCircle",
        title: "Automated parent communication",
        description:
          "Lesson summaries, review requests, and updates sent automatically. Keep everyone informed effortlessly.",
      },
    ],
  },

  howItWorks: {
    headline: "Launch in 15 minutes",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Build your site",
        description:
          "Add bio, languages, pricing, testimonials. Your professional site goes live instantly.",
      },
      {
        number: 2,
        icon: "Settings",
        title: "Set services and availability",
        description:
          "List lessons and packages. Set availability once. Billing and Zoom links run automatically.",
      },
      {
        number: 3,
        icon: "Share2",
        title: "Share and book students",
        description:
          "Share your link on Instagram, TikTok, WhatsApp, email. Students book instantly.",
      },
    ],
    cta: "Create your TutorLingua site",
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
    headline: "Simple pricing",
    subheadline:
      "Start free forever. Upgrade when you're ready to scale.",
    comparisonNote:
      "Keep 100% of your earnings. No commissions.",
    tiers: [
      {
        name: "Professional",
        price: "Free",
        period: "forever",
        description: "For getting started",
        features: [
          "Up to 20 students",
          "1 active service",
          "Basic bookings",
          "Payment collection",
          "Video meeting links",
          "Email reminders",
        ],
        cta: "Start free",
        highlighted: false,
      },
      {
        name: "Growth",
        price: "$29",
        period: "/month",
        badge: "Most popular",
        description: "For growing your business",
        features: [
          "Everything in Professional",
          "Unlimited students & services",
          "Session packages",
          "Link-in-bio with analytics",
          "Advanced scheduling",
          "Priority support",
        ],
        cta: "Upgrade to Growth",
        highlighted: true,
      },
      {
        name: "Studio",
        price: "$99",
        period: "/month",
        description: "Coming Q2 2025",
        features: [
          "Everything in Growth",
          "Group sessions (coming soon)",
          "Team accounts (coming soon)",
          "Marketplace access (Q3 2025)",
          "Advanced AI tools (Q3 2025)",
        ],
        cta: "Join waitlist",
        highlighted: false,
      },
    ],
  },

  comparison: {
    headline: "Take full control of your business",
    caption:
      "Run your tutoring business your way. Set your prices. Own your students. Build your brand.",
    tableHeaders: {
      feature: "What you control",
      marketplace: "Marketplaces",
      platform: "TutorLingua",
    },
    columns: [
      { label: "", marketplace: "", platform: "" },
      { label: "Your earnings", marketplace: "70-85%", platform: "100%" },
      { label: "Your pricing", marketplace: "Platform sets rates", platform: "You decide" },
      { label: "Your students", marketplace: "Shared pool", platform: "Your private list" },
      { label: "Your schedule", marketplace: "Limited flexibility", platform: "Full control" },
      { label: "Your branding", marketplace: "Generic profile", platform: "Custom site & links" },
      { label: "Your data", marketplace: "Platform owns it", platform: "You own & export it" },
    ],
  },

  testimonials: {
    headline: "Real tutors, real results",
    featured: {
      quote:
        "Saved $7,500 this year switching from Preply. Parents love the automated updates and my business looks professional.",
      author: "Sarai A.",
      role: "Spanish Teacher",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "Booked 12 trial lessons in one week using automated follow-ups. No spreadsheets needed.",
        author: "Thomas B.",
        role: "French Tutor",
      },
      {
        quote:
          "Credibility page changed everything for parent trust. Automated payments and summaries make me look like a full team.",
        author: "Ricardo M.",
        role: "Portuguese Tutor",
      },
    ],
  },

  faq: {
    headline: "Common questions",
    items: [
      {
        question: "Can I use TutorLingua with marketplaces?",
        answer:
          "Yes. Keep marketplace profiles for discovery. Use TutorLingua to manage students and avoid commissions.",
      },
      {
        question: "Is this easy to use if I'm not technical?",
        answer:
          "If you can use Instagram, you can use TutorLingua. Most tutors launch in 15 minutes with our templates.",
      },
      {
        question: "How quickly can I start?",
        answer:
          "Under 15 minutes. Publish your site, add services, and accept bookings immediately.",
      },
      {
        question: "Will students find booking easy?",
        answer:
          "Yes. They pick a time, pay securely, and get their Zoom link instantly. Automatic reminders included.",
      },
      {
        question: "How does AI help with teaching?",
        answer:
          "Creates lesson plans, homework, vocab exercises, and parent updates. Provides 24/7 conversation practice for students.",
      },
      {
        question: "Can I export my data if I leave?",
        answer:
          "Yes. Your data is yours. Export all student info, notes, and invoices anytime. No lock-in.",
      },
    ],
  },

  finalCTA: {
    headline: "Ready to build your business?",
    subheadline:
      "Launch in 15 minutes. Keep more of what you earn.",
    calculatorLabel: "Monthly revenue:",
    calculatorUnit: "/month",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Marketplace fees (25%):",
    platformCostLabel: "TutorLingua:",
    monthlySavingsLabel: "Monthly savings:",
    annualSavingsLabel: "Annual savings",
    button: "Start free—no credit card",
    finePrint: "14 days free. Cancel anytime.",
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
    tagline: "TutorLingua — the operating system for independent language tutors",
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
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} TutorLingua. All rights reserved.`,
  },
} as const;

const landingCopyEs: LandingCopy = {
  hero: {
    headline: "Enseñar idiomas nunca fue tan simple. Ser tutor ahora es más fácil",
    subheadline:
      "Más estudiantes. Mayores ingresos. Menos admin. Quédate con el 100% de tus ganancias.",
    primaryCTA: "Empieza gratis",
    secondaryCTA: "Descubre cómo funciona",
    variants: {
      outcomeHeadline: "Menos admin. Más estudiantes.",
      financialHeadline: "Quédate con el 100%—sin comisiones.",
      aspirationalHeadline: "Tu academia independiente, totalmente automatizada.",
    },
  },

  socialProof: {
    text: "Miles de tutores de idiomas confían en TutorLingua para construir negocios independientes",
    tutors: [
      { name: "Sarai A.", language: "Profesora de español" },
      { name: "Thomas B.", language: "Tutor de francés" },
      { name: "Ricardo M.", language: "Tutor de portugués" },
    ],
  },

  problems: {
    headline: "Herramientas que trabajan tan duro como tú.",
    subtitle:
      "Supera los marketplaces. Gestiona tu negocio profesionalmente.",
    items: [
      {
        icon: "Layers",
        title: "Una plataforma, no diez",
        description:
          "Reservas, pagos, CRM y video—todo incluido.",
      },
      {
        icon: "Users",
        title: "Estudiantes reservan directamente contigo",
        description:
          "Sin marketplace. Sin comisiones. Todo tuyo.",
      },
      {
        icon: "Clock",
        title: "Enseña más, administra menos",
        description:
          "Recordatorios automáticos, enlaces zoom y preparación de clases.",
      },
    ],
  },

  solution: {
    headline: "Todo lo que necesitas para dirigir tu negocio independiente.",
    subheadline: "Fácil de comenzar, potente a medida que creces.",
    features: [
      {
        icon: "Globe",
        title: "Sitio web profesional en minutos",
        description:
          "Lanza tu sitio con biografía, servicios, testimonios y calendario. Controla tu presencia online.",
      },
      {
        icon: "Calendar",
        title: "Reservas en piloto automático",
        description:
          "Configura disponibilidad una vez. Estudiantes reservan al instante. Enlaces Zoom, recordatorios y sincronización automáticos.",
      },
      {
        icon: "Wallet",
        title: "Cobra por adelantado. Sin comisiones.",
        description:
          "Pagos Stripe y PayPal integrados. Crea paquetes, envía facturas, gestiona reembolsos. Quédate con todo.",
      },
      {
        icon: "Users",
        title: "Convierte seguidores en estudiantes",
        description:
          "Captura leads de Instagram, TikTok, WhatsApp. Seguimientos inteligentes y CRM organizado incluidos.",
      },
      {
        icon: "Sparkles",
        title: "Herramientas IA ahorran horas semanales",
        description:
          "Genera planes de clase, tareas y vocabulario al instante. Compañero de conversación IA 24/7 para estudiantes.",
      },
      {
        icon: "CheckCircle",
        title: "Comunicación automatizada con padres",
        description:
          "Resúmenes de clase, solicitudes de reseñas y actualizaciones enviadas automáticamente. Mantén a todos informados sin esfuerzo.",
      },
    ],
  },

  howItWorks: {
    headline: "Lanza en 15 minutos",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Construye tu sitio",
        description:
          "Añade biografía, idiomas, precios, testimonios. Tu sitio profesional se publica al instante.",
      },
      {
        number: 2,
        icon: "Settings",
        title: "Define servicios y disponibilidad",
        description:
          "Lista clases y paquetes. Establece disponibilidad una vez. Facturación y enlaces Zoom funcionan automáticamente.",
      },
      {
        number: 3,
        icon: "Share2",
        title: "Comparte y reserva estudiantes",
        description:
          "Comparte tu enlace en Instagram, TikTok, WhatsApp, email. Estudiantes reservan al instante.",
      },
    ],
    cta: "Crea tu sitio en TutorLingua",
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
    headline: "Precios sencillos",
    subheadline:
      "Empieza gratis para siempre. Actualiza cuando estés listo para escalar.",
    comparisonNote:
      "Quédate con el 100% de tus ingresos. Sin comisiones.",
    tiers: [
      {
        name: "Professional",
        price: "Gratis",
        period: "para siempre",
        description: "Para empezar",
        features: [
          "Hasta 20 estudiantes",
          "1 servicio activo",
          "Reservas básicas",
          "Cobro de pagos",
          "Enlaces de videollamada",
          "Recordatorios por email",
        ],
        cta: "Empieza gratis",
        highlighted: false,
      },
      {
        name: "Growth",
        price: "$29",
        period: "/mes",
        badge: "Más popular",
        description: "Para hacer crecer tu negocio",
        features: [
          "Todo en Professional",
          "Estudiantes y servicios ilimitados",
          "Paquetes de sesiones",
          "Link-in-bio con analítica",
          "Programación avanzada",
          "Soporte prioritario",
        ],
        cta: "Sube a Growth",
        highlighted: true,
      },
      {
        name: "Studio",
        price: "$99",
        period: "/mes",
        description: "Próximamente Q2 2025",
        features: [
          "Todo en Growth",
          "Sesiones grupales (próximamente)",
          "Cuentas de equipo (próximamente)",
          "Acceso marketplace (Q3 2025)",
          "Herramientas IA avanzadas (Q3 2025)",
        ],
        cta: "Únete a lista de espera",
        highlighted: false,
      },
    ],
  },

  comparison: {
    headline: "Toma control total de tu negocio",
    caption:
      "Dirige tu negocio de tutoría a tu manera. Define tus precios. Posee tus estudiantes. Construye tu marca.",
    tableHeaders: {
      feature: "Lo que controlas",
      marketplace: "Marketplaces",
      platform: "TutorLingua",
    },
    columns: [
      { label: "", marketplace: "", platform: "" },
      { label: "Tus ganancias", marketplace: "70-85%", platform: "100%" },
      { label: "Tus precios", marketplace: "Plataforma decide", platform: "Tú decides" },
      { label: "Tus estudiantes", marketplace: "Base compartida", platform: "Tu lista privada" },
      { label: "Tu horario", marketplace: "Flexibilidad limitada", platform: "Control total" },
      { label: "Tu marca", marketplace: "Perfil genérico", platform: "Sitio y enlaces personalizados" },
      { label: "Tus datos", marketplace: "Plataforma los posee", platform: "Tú los posees y exportas" },
    ],
  },

  testimonials: {
    headline: "Tutores reales, resultados reales",
    featured: {
      quote:
        "Ahorré $7.500 este año al cambiar de Preply. A los padres les encantan las actualizaciones automáticas y mi negocio se ve profesional.",
      author: "Sara Martínez",
      role: "Tutora de español, 38 estudiantes",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "Reservé 12 clases de prueba en una semana con seguimientos automáticos. Sin hojas de cálculo.",
        author: "Chen Wei",
        role: "Tutor de mandarín",
      },
      {
        quote:
          "Página de credibilidad cambió todo para confianza de padres. Pagos y resúmenes automáticos me hacen parecer un equipo completo.",
        author: "Marcus Johnson",
        role: "Tutor de inglés",
      },
    ],
  },

  faq: {
    headline: "Preguntas comunes",
    items: [
      {
        question: "¿Puedo usar TutorLingua con marketplaces?",
        answer:
          "Sí. Mantén perfiles en marketplaces para descubrimiento. Usa TutorLingua para gestionar estudiantes y evitar comisiones.",
      },
      {
        question: "¿Es fácil de usar si no soy técnico?",
        answer:
          "Si usas Instagram, puedes usar TutorLingua. La mayoría lanza en 15 minutos con nuestras plantillas.",
      },
      {
        question: "¿Cuánto tardo en empezar?",
        answer:
          "Menos de 15 minutos. Publica tu sitio, añade servicios y acepta reservas inmediatamente.",
      },
      {
        question: "¿Les será fácil reservar a mis estudiantes?",
        answer:
          "Sí. Eligen horario, pagan seguro y reciben enlace Zoom al instante. Recordatorios automáticos incluidos.",
      },
      {
        question: "¿Cómo ayuda la IA en la enseñanza?",
        answer:
          "Crea planes de clase, tareas, vocabulario y actualizaciones para padres. Ofrece práctica conversación 24/7 para estudiantes.",
      },
      {
        question: "¿Puedo exportar mis datos si me voy?",
        answer:
          "Sí. Tus datos son tuyos. Exporta info de estudiantes, notas y facturas cuando quieras. Sin permanencia.",
      },
    ],
  },

  finalCTA: {
    headline: "¿Listo para construir tu negocio?",
    subheadline:
      "Lanza en 15 minutos. Quédate con más de lo que ganas.",
    calculatorLabel: "Ingresos mensuales:",
    calculatorUnit: "/mes",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Comisiones marketplace (25%):",
    platformCostLabel: "TutorLingua:",
    monthlySavingsLabel: "Ahorro mensual:",
    annualSavingsLabel: "Ahorro anual",
    button: "Empieza gratis—sin tarjeta",
    finePrint: "14 días gratis. Cancela cuando quieras.",
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
    tagline: "TutorLingua: el sistema operativo para tutores de idiomas independientes",
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
export type PricingTier = LandingCopy["pricing"]["tiers"][number];
export type Testimonial = LandingCopy["testimonials"]["list"][number];
export type FAQItem = LandingCopy["faq"]["items"][number];
