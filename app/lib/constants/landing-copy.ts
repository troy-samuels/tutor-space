import { defaultLocale, type Locale } from "@/lib/i18n/config";

const landingCopyEn = {
  hero: {
    headline: "Keep 100% of what you earn. Teach on your terms. Get your time back.",
    subheadline:
      "TutorLingua gives you everything to run your independent tutoring business—beautiful site, effortless bookings, smart payments, student CRM, and AI teaching tools. All in one place.",
    primaryCTA: "Start free",
    secondaryCTA: "See how it works",
    variants: {
      outcomeHeadline: "Cut admin work and stay fully booked.",
      financialHeadline: "Keep 100% of every lesson—no more platform cuts.",
      aspirationalHeadline: "Your independent language academy, powered by TutorLingua.",
    },
  },

  socialProof: {
    text: "Trusted by thousands of language tutors building independent businesses",
    tutors: [
      { name: "Sara M.", language: "Spanish" },
      { name: "Kei H.", language: "Japanese" },
      { name: "Luca R.", language: "Italian" },
    ],
  },

  problems: {
    headline: "You deserve tools that work as hard as you do.",
    subtitle:
      "Whether you're just starting out or ready to level up from marketplace teaching, there's a better way to run your tutoring business.",
    items: [
      {
        icon: "TrendingDown",
        title: "Build your business without the platform tax",
        description:
          "Marketplaces are great for discovery, but once you have regular students, keeping 100% of your earnings changes everything. Imagine what you could do with an extra $300-$600 every month.",
      },
      {
        icon: "Layers",
        title: "Everything you need in one simple platform",
        description:
          "No more juggling Calendly, Stripe, Google Docs, WhatsApp, and six other tools. Manage your entire tutoring business from a single, beautifully designed dashboard.",
      },
      {
        icon: "Clock",
        title: "Spend your time teaching, not managing",
        description:
          "Automated bookings, instant Zoom links, smart reminders, and AI-powered lesson prep mean you can focus on what you love—helping students grow.",
      },
    ],
  },

  solution: {
    headline: "Everything you need to run your independent business.",
    subheadline: "Built with tutors, for tutors. Simple to start, powerful as you grow.",
    features: [
      {
        icon: "Globe",
        title: "Your professional home on the web",
        description:
          "Launch a stunning tutor website with your bio, services, testimonials, and booking calendar in minutes. Look professional, build trust with parents, and own your online presence.",
      },
      {
        icon: "Calendar",
        title: "Bookings that run on autopilot",
        description:
          "Set your availability once and let students book instantly. Time zones, Zoom links, calendar sync, and reminders all happen automatically—so you can focus on teaching.",
      },
      {
        icon: "Wallet",
        title: "Get paid upfront, keep every dollar",
        description:
          "Accept payments through Stripe or PayPal with zero commission. Create session packages, send invoices, and handle refunds—all built in. Your earnings stay yours.",
      },
      {
        icon: "Users",
        title: "Turn followers into students",
        description:
          "Capture leads from Instagram, TikTok, and WhatsApp, then nurture them with smart follow-ups. Track every conversation, lesson, and milestone in one organized CRM.",
      },
      {
        icon: "Sparkles",
        title: "AI tools that save you hours",
        description:
          "Generate lesson plans, homework assignments, and vocabulary exercises in seconds. Give students a 24/7 AI conversation partner so they can practice between sessions.",
      },
      {
        icon: "CheckCircle",
        title: "Stay connected without the effort",
        description:
          "Automatically send lesson summaries to parents, request reviews from happy students, and keep everyone informed with smart reminders and updates.",
      },
    ],
  },

  howItWorks: {
    headline: "From blank slate to booked lessons in less than 15 minutes",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Create your TutorLingua site",
        description:
          "Add your bio, languages, pricing, testimonials, and parent proof. TutorLingua gives you a stunning public site instantly.",
      },
      {
        number: 2,
        icon: "Settings",
        title: "Configure services & availability",
        description:
          "List 1:1 lessons, packages, group sessions, and set availability once. Billing, Zoom links, and reminders all run on autopilot.",
      },
      {
        number: 3,
        icon: "Share2",
        title: "Share your link & convert leads",
        description:
          "Drop your TutorLingua link on Instagram, TikTok, WhatsApp, email, or your newsletter. Leads book instantly and land in your CRM.",
      },
    ],
    cta: "Create your TutorLingua site",
  },

  featuresDeepDive: {
    headline: "Built for tutors who want full control and delighted parents",
    categories: [
      {
        name: "Professional Presence",
        items: [
          "Custom subdomain (yourname.tutorlingua.com)",
          "Link-in-bio with lead magnet download & click analytics",
          "Parent credibility page with testimonials and progress charts",
          "Multi-language support & SEO-friendly copy blocks",
          "Social integrations for Instagram, TikTok, WhatsApp, and YouTube",
        ],
      },
      {
        name: "Booking & Payments",
        items: [
          "Interactive availability calendar with buffers",
          "Recurring lesson packages and promos",
          "Stripe & PayPal checkout + automatic invoicing",
          "Payment reminders, refunds, and accounting exports",
          "Zoom link generation and calendar sync",
        ],
      },
      {
        name: "Teaching Tools",
        items: [
          "AI conversation partner students can use 24/7",
          "AI-generated lesson plans, homework, and vocab decks",
          "Resource library with files, links, and interactive exercises",
          "Structured lesson notes feeding CRM and parent updates",
          "Progress dashboards aligned to CEFR levels and goals",
        ],
      },
      {
        name: "Communication",
        items: [
          "Automated booking confirmations and reminders",
          "Lead nurture sequences (email + WhatsApp)",
          "Parent feedback & testimonial capture",
          "Daily tutor digest with tasks, invoices, and at-risk students",
          "Parent update scripts generated in one click",
        ],
      },
      {
        name: "Business Insights",
        items: [
          "Revenue analytics, cohort retention, and churn alerts",
          "Booking conversion funnels and marketing attribution",
          "AI usage analytics and cost controls",
          "Executive dashboard for studio teams",
          "Export everything anytime—your data stays yours",
        ],
      },
    ],
  },

  pricing: {
    headline: "Simple pricing that makes sense",
    subheadline:
      "Start free on Professional. Upgrade to Growth when you're ready to scale. Move to Studio when you're building a team.",
    comparisonNote:
      "With TutorLingua, you pay a small flat fee and keep 100% of your earnings. No commissions, no surprises—just straightforward pricing that helps your business thrive.",
    tiers: [
      {
        name: "Professional",
        price: "$29",
        period: "/month",
        description: "Perfect for independent tutors getting started",
        features: [
          "Beautiful tutor site & credibility page",
          "Unlimited bookings & session packages",
          "Stripe/PayPal payments + invoicing",
          "Student CRM with lesson notes",
          "Automated reminders & Zoom integration",
        ],
        cta: "Start free",
        highlighted: false,
      },
      {
        name: "Growth",
        price: "$59",
        period: "/month",
        badge: "Most popular",
        description: "For tutors ready to scale beyond word-of-mouth",
        features: [
          "Everything in Professional",
          "Lead capture, pipelines & smart follow-ups",
          "AI marketing tools and content ideas",
          "Advanced analytics & booking insights",
          "WhatsApp + email campaign automation",
        ],
        cta: "Upgrade to Growth",
        highlighted: true,
      },
      {
        name: "Studio",
        price: "$129",
        period: "/month",
        description: "Build a language school, not just a side hustle",
        features: [
          "Everything in Growth",
          "Group sessions & workshops",
          "Shared resource library access",
          "Executive dashboard with forecasting",
          "Team seats with role-based permissions",
        ],
        cta: "Talk to sales",
        highlighted: false,
      },
    ],
  },

  comparison: {
    headline: "The natural next step in your tutoring journey",
    caption:
      "Marketplaces are a great place to find your first students. TutorLingua is where you build a thriving independent business. Many tutors use both—marketplaces for discovery, TutorLingua for everything else.",
    tableHeaders: {
      feature: "Feature",
      marketplace: "Marketplaces",
      platform: "Our Platform",
    },
    columns: [
      { label: "", marketplace: "", platform: "" },
      { label: "Commission on earnings", marketplace: "15-30%", platform: "0%" },
      { label: "Your own branded website", marketplace: "Limited profile", platform: "✅ Full site" },
      { label: "Student relationships", marketplace: "Shared with platform", platform: "All yours" },
      { label: "Automation & AI tools", marketplace: "Basic features", platform: "Comprehensive" },
      { label: "Parent communication", marketplace: "Manual", platform: "Automated" },
      { label: "Monthly investment", marketplace: "\"Free\" + ongoing fees", platform: "$29-129 flat" },
    ],
  },

  testimonials: {
    headline: "Real tutors, real results",
    featured: {
      quote:
        "I was paying Preply $700+ every month in commissions. Now I pay TutorLingua $59 and keep the rest—that's over $7,500 saved this year. Plus, parents love the automatic progress updates and my business feels so much more professional.",
      author: "Sara Martínez",
      role: "Spanish Tutor, 38 students",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "The lead tools brought my Instagram followers to life. I booked 12 trial lessons in one week using the automated follow-ups—all without a single spreadsheet.",
        author: "Chen Wei",
        role: "Mandarin Tutor",
      },
      {
        quote:
          "The AI lesson planner and conversation partner save me at least 5 hours every week. I finally have time to actually grow my business instead of just running it.",
        author: "Amélie Dubois",
        role: "French Tutor",
      },
      {
        quote:
          "My credibility page has been a game-changer for parent trust. Payments come in before every class, and lesson summaries go out automatically. I look like I have a full team behind me.",
        author: "Marcus Johnson",
        role: "English Tutor",
      },
    ],
  },

  faq: {
    headline: "Everything you're wondering about",
    items: [
      {
        question: "Can I use TutorLingua alongside marketplaces like Preply?",
        answer:
          "Absolutely! Many tutors keep their marketplace profiles for finding new students, then use TutorLingua to manage regular students, handle bookings, and save on commissions. It's the best of both worlds.",
      },
      {
        question: "What if I'm not technical? Is this easy to use?",
        answer:
          "If you can use Instagram and Google Docs, you can use TutorLingua. Most tutors have their site live in under 15 minutes using our templates. And if you get stuck, our support team is here to help.",
      },
      {
        question: "How quickly can I get started?",
        answer:
          "Really quickly! Most tutors publish their site, add their services, and start accepting bookings in under 15 minutes. We provide templates, helpful guides, and everything you need to get up and running.",
      },
      {
        question: "Will my students find it easy to book lessons?",
        answer:
          "Yes. If your students can shop online, they can book with you. They pick a time, pay securely, and get their Zoom link instantly. Automatic reminders help them show up on time, too.",
      },
      {
        question: "How does the AI actually help with teaching?",
        answer:
          "Our AI tools help you create lesson plans, generate homework, build vocabulary exercises, write parent updates, and even provide 24/7 conversation practice for your students. You're always in control and can customize everything.",
      },
      {
        question: "What if I want to leave? Is my data stuck here?",
        answer:
          "Not at all. Your data always belongs to you. You can export all your student information, lesson notes, and invoices anytime. No lock-in, no questions asked.",
      },
    ],
  },

  finalCTA: {
    headline: "Ready to build your independent tutoring business?",
    subheadline:
      "Join thousands of tutors who've made the move. Set up your TutorLingua site in under 15 minutes and start keeping more of what you earn.",
    calculatorLabel: "Your current monthly revenue:",
    calculatorUnit: "/month",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Marketplace Commission (avg 25%):",
    platformCostLabel: "Our Platform Cost:",
    monthlySavingsLabel: "Monthly Savings:",
    annualSavingsLabel: "Annual Savings",
    button: "Start free—no credit card needed",
    finePrint: "14 days free. No credit card required. Cancel anytime.",
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
};

export type LandingCopy = typeof landingCopyEn;

const landingCopyEs: LandingCopy = {
  hero: {
    headline: "Quédate con el 100% de lo que ganas. Enseña a tu manera. Recupera tu tiempo.",
    subheadline:
      "TutorLingua te ofrece todo lo necesario para gestionar tu negocio de tutorías independiente: sitio web profesional, reservas automáticas, pagos inteligentes, CRM de estudiantes y herramientas de enseñanza con IA en un solo lugar.",
    primaryCTA: "Empieza gratis",
    secondaryCTA: "Descubre cómo funciona",
    variants: {
      outcomeHeadline: "Reduce la carga administrativa y mantén tu agenda llena.",
      financialHeadline: "Quédate con el 100% de cada clase, sin comisiones de plataformas.",
      aspirationalHeadline: "Tu academia de idiomas independiente, impulsada por TutorLingua.",
    },
  },

  socialProof: {
    text: "Miles de tutores de idiomas confían en TutorLingua para construir negocios independientes",
    tutors: [
      { name: "Sara M.", language: "Español" },
      { name: "Kei H.", language: "Japonés" },
      { name: "Luca R.", language: "Italiano" },
    ],
  },

  problems: {
    headline: "Mereces herramientas que trabajen tan duro como tú.",
    subtitle:
      "Tanto si acabas de empezar como si quieres dar el salto desde los marketplaces, existe una forma mejor de gestionar tu negocio de tutorías.",
    items: [
      {
        icon: "TrendingDown",
        title: "Haz crecer tu negocio sin el impuesto de las plataformas",
        description:
          "Los marketplaces son ideales para darte a conocer, pero cuando tienes estudiantes habituales, conservar el 100% de tus ingresos lo cambia todo. Imagina qué podrías hacer con 300-600 dólares extra cada mes.",
      },
      {
        icon: "Layers",
        title: "Todo lo que necesitas en una sola plataforma",
        description:
          "Olvídate de combinar Calendly, Stripe, Google Docs, WhatsApp y media docena de herramientas más. Gestiona todo tu negocio de tutorías desde un único panel de control diseñado con mimo.",
      },
      {
        icon: "Clock",
        title: "Pasa más tiempo enseñando y menos gestionando",
        description:
          "Reservas automatizadas, enlaces de Zoom instantáneos, recordatorios inteligentes y preparación de clases con IA para que puedas centrarte en lo que te apasiona: ayudar a tus estudiantes a progresar.",
      },
    ],
  },

  solution: {
    headline: "Todo lo que necesitas para dirigir tu negocio independiente.",
    subheadline: "Creado con tutores y para tutores. Fácil de comenzar, potente a medida que creces.",
    features: [
      {
        icon: "Globe",
        title: "Tu hogar profesional en internet",
        description:
          "Lanza un sitio web impresionante con tu biografía, servicios, testimonios y calendario de reservas en minutos. Proyecta profesionalidad, genera confianza en las familias y controla tu presencia en línea.",
      },
      {
        icon: "Calendar",
        title: "Reservas que funcionan en piloto automático",
        description:
          "Configura tu disponibilidad una vez y permite que tus estudiantes reserven al instante. Las zonas horarias, los enlaces de Zoom, la sincronización con el calendario y los recordatorios se gestionan automáticamente.",
      },
      {
        icon: "Wallet",
        title: "Cobra por adelantado y conserva cada dólar",
        description:
          "Acepta pagos mediante Stripe o PayPal sin comisiones. Crea paquetes de sesiones, envía facturas y gestiona reembolsos: todo integrado. Tus ingresos permanecen contigo.",
      },
      {
        icon: "Users",
        title: "Convierte seguidores en estudiantes",
        description:
          "Captura leads desde Instagram, TikTok y WhatsApp, y aliméntalos con seguimientos inteligentes. Sigue cada conversación, clase y hito dentro de un CRM organizado.",
      },
      {
        icon: "Sparkles",
        title: "Herramientas de IA que te ahorran horas",
        description:
          "Genera planes de clase, tareas y actividades de vocabulario en segundos. Ofrece a tus estudiantes un compañero de conversación con IA 24/7 para que practiquen entre sesiones.",
      },
      {
        icon: "CheckCircle",
        title: "Mantén a todos informados sin esfuerzo",
        description:
          "Envía resúmenes de clase a los padres, solicita reseñas a estudiantes satisfechos y mantén a todos al día con recordatorios y actualizaciones automáticas.",
      },
    ],
  },

  howItWorks: {
    headline: "De cero a clases reservadas en menos de 15 minutos",
    steps: [
      {
        number: 1,
        icon: "UserPlus",
        title: "Crea tu sitio en TutorLingua",
        description:
          "Añade tu biografía, idiomas, precios, testimonios y pruebas sociales. TutorLingua publica al instante un sitio público y listo para compartir.",
      },
      {
        number: 2,
        icon: "Settings",
        title: "Configura servicios y disponibilidad",
        description:
          "Ofrece clases individuales, paquetes y sesiones grupales, y establece tu disponibilidad una sola vez. Facturación, enlaces de Zoom y recordatorios funcionan en automático.",
      },
      {
        number: 3,
        icon: "Share2",
        title: "Comparte tu enlace y convierte leads",
        description:
          "Comparte tu enlace de TutorLingua en Instagram, TikTok, WhatsApp, email o newsletter. Los leads reservan al instante y quedan registrados en tu CRM.",
      },
    ],
    cta: "Crea tu sitio en TutorLingua",
  },

  featuresDeepDive: {
    headline: "Pensado para tutores que quieren control total y padres encantados",
    categories: [
      {
        name: "Presencia profesional",
        items: [
          "Subdominio personalizado (tunombre.tutorlingua.com)",
          "Link-in-bio con lead magnet y analítica de clics",
          "Página de credibilidad para padres con testimonios y gráficos de progreso",
          "Soporte multilingüe y bloques de texto listos para SEO",
          "Integraciones con Instagram, TikTok, WhatsApp y YouTube",
        ],
      },
      {
        name: "Reservas y pagos",
        items: [
          "Calendario interactivo con buffers configurables",
          "Paquetes recurrentes y promociones de clases",
          "Cobro con Stripe o PayPal más facturación automática",
          "Recordatorios de pago, reembolsos y exportaciones contables",
          "Generación de enlaces de Zoom y sincronización con tu agenda",
        ],
      },
      {
        name: "Herramientas de enseñanza",
        items: [
          "Compañero de conversación con IA disponible 24/7 para tus estudiantes",
          "Planes de clase, tareas y fichas de vocabulario generados con IA",
          "Biblioteca de recursos con archivos, enlaces y actividades interactivas",
          "Notas de clase estructuradas que alimentan el CRM y las actualizaciones a padres",
          "Paneles de progreso alineados con niveles MCER y objetivos individuales",
        ],
      },
      {
        name: "Comunicación",
        items: [
          "Confirmaciones y recordatorios de reservas automatizados",
          "Secuencias de nutrición de leads por email y WhatsApp",
          "Captura de feedback y testimonios de padres",
          "Resumen diario con tareas, facturas y estudiantes en riesgo",
          "Guiones para actualizaciones a padres generados en un clic",
        ],
      },
      {
        name: "Inteligencia de negocio",
        items: [
          "Analítica de ingresos, retención por cohortes y alertas de cancelaciones",
          "Embudos de conversión de reservas y atribución de marketing",
          "Analítica de uso de IA y control de costes",
          "Panel ejecutivo para equipos y estudios",
          "Exporta todo cuando quieras: tus datos siempre son tuyos",
        ],
      },
    ],
  },

  pricing: {
    headline: "Precios sencillos que sí tienen sentido",
    subheadline:
      "Empieza gratis con Professional. Pasa a Growth cuando quieras escalar. Da el salto a Studio cuando construyas un equipo.",
    comparisonNote:
      "Con TutorLingua pagas una tarifa plana pequeña y te quedas con el 100% de tus ingresos. Sin comisiones ni sorpresas: una estructura clara que impulsa tu negocio.",
    tiers: [
      {
        name: "Professional",
        price: "$29",
        period: "/mes",
        description: "Ideal para tutores independientes que están comenzando",
        features: [
          "Sitio web profesional y página de credibilidad",
          "Reservas ilimitadas y paquetes de sesiones",
          "Pagos con Stripe/PayPal y facturación integrada",
          "CRM de estudiantes con notas de clase",
          "Recordatorios automáticos e integración con Zoom",
        ],
        cta: "Empieza gratis",
        highlighted: false,
      },
      {
        name: "Growth",
        price: "$59",
        period: "/mes",
        badge: "Más popular",
        description: "Para tutores listos para escalar más allá del boca a boca",
        features: [
          "Todo lo incluido en Professional",
          "Captura de leads, embudos y seguimientos inteligentes",
          "Herramientas de marketing con IA e ideas de contenido",
          "Analítica avanzada y visión profunda de reservas",
          "Automatización de campañas por WhatsApp y email",
        ],
        cta: "Sube a Growth",
        highlighted: true,
      },
      {
        name: "Studio",
        price: "$129",
        period: "/mes",
        description: "Convierte tu proyecto en una escuela de idiomas real",
        features: [
          "Todo lo incluido en Growth",
          "Sesiones grupales y talleres",
          "Acceso compartido a la biblioteca de recursos",
          "Panel ejecutivo con previsiones",
          "Plazas de equipo con permisos por rol",
        ],
        cta: "Habla con ventas",
        highlighted: false,
      },
    ],
  },

  comparison: {
    headline: "El siguiente paso natural en tu camino como tutor",
    caption:
      "Los marketplaces son útiles para conseguir a tus primeros estudiantes. TutorLingua es donde construyes un negocio independiente sólido. Muchos tutores usan ambos: marketplaces para descubrir, TutorLingua para todo lo demás.",
    tableHeaders: {
      feature: "Característica",
      marketplace: "Marketplaces",
      platform: "Nuestra plataforma",
    },
    columns: [
      { label: "", marketplace: "", platform: "" },
      { label: "Comisión sobre tus ingresos", marketplace: "15-30%", platform: "0%" },
      { label: "Sitio web con tu marca", marketplace: "Perfil limitado", platform: "✅ Sitio completo" },
      { label: "Relación con tus estudiantes", marketplace: "Compartida con la plataforma", platform: "100% tuya" },
      { label: "Automatización y herramientas IA", marketplace: "Funciones básicas", platform: "Cobertura total" },
      { label: "Comunicación con padres", marketplace: "Manual", platform: "Automática" },
      { label: "Inversión mensual", marketplace: "\"Gratis\" + comisiones constantes", platform: "$29-129 tarifa plana" },
    ],
  },

  testimonials: {
    headline: "Tutores reales, resultados reales",
    featured: {
      quote:
        "Pagaba más de 700 dólares al mes en comisiones a Preply. Ahora pago 59 dólares a TutorLingua y me quedo con el resto: he ahorrado más de 7.500 dólares este año. Además, a los padres les encantan las actualizaciones automáticas de progreso y mi negocio se ve mucho más profesional.",
      author: "Sara Martínez",
      role: "Tutora de español, 38 estudiantes",
      image: "/testimonials/sara.jpg",
    },
    list: [
      {
        quote:
          "Las herramientas de leads dieron vida a mis seguidores en Instagram. Reservé 12 clases de prueba en una semana con los seguimientos automáticos, sin tocar una sola hoja de cálculo.",
        author: "Chen Wei",
        role: "Tutor de mandarín",
      },
      {
        quote:
          "El planificador de clases y el compañero de conversación con IA me ahorran al menos 5 horas cada semana. Por fin tengo tiempo para hacer crecer mi negocio en lugar de solo mantenerlo.",
        author: "Amélie Dubois",
        role: "Tutora de francés",
      },
      {
        quote:
          "Mi página de credibilidad ha cambiado las reglas del juego para ganarme la confianza de los padres. Los pagos llegan antes de cada clase y los resúmenes se envían solos. Parece que tengo todo un equipo detrás.",
        author: "Marcus Johnson",
        role: "Tutor de inglés",
      },
    ],
  },

  faq: {
    headline: "Respuestas a todo lo que te preguntas",
    items: [
      {
        question: "¿Puedo usar TutorLingua junto con marketplaces como Preply?",
        answer:
          "¡Claro! Muchos tutores mantienen sus perfiles en marketplaces para encontrar estudiantes nuevos y usan TutorLingua para gestionar a los regulares, manejar reservas y evitar comisiones. Es la combinación perfecta.",
      },
      {
        question: "¿Y si no soy técnico? ¿Es fácil de usar?",
        answer:
          "Si sabes usar Instagram y Google Docs, puedes usar TutorLingua. La mayoría de los tutores publican su sitio en menos de 15 minutos con nuestras plantillas. Y si necesitas ayuda, nuestro equipo de soporte está contigo.",
      },
      {
        question: "¿Cuánto tardo en empezar?",
        answer:
          "Muy poco. La mayoría de los tutores publican su sitio, agregan servicios y empiezan a recibir reservas en menos de 15 minutos. Te damos plantillas, guías y todo lo necesario para arrancar.",
      },
      {
        question: "¿Les resultará fácil reservar clases a mis estudiantes?",
        answer:
          "Sí. Si tus estudiantes pueden comprar en línea, pueden reservar contigo. Eligen horario, pagan de forma segura y reciben el enlace de Zoom al instante. Los recordatorios automáticos aseguran que asistan.",
      },
      {
        question: "¿Cómo ayuda la IA realmente en la enseñanza?",
        answer:
          "Nuestras herramientas de IA te ayudan a crear planes de clase, generar tareas, diseñar actividades de vocabulario, redactar actualizaciones para padres e incluso ofrecer práctica de conversación 24/7 a tus estudiantes. Tú siempre controlas y personalizas todo.",
      },
      {
        question: "Si decido irme, ¿mis datos quedan atrapados?",
        answer:
          "En absoluto. Tus datos siempre te pertenecen. Puedes exportar información de estudiantes, notas de clase y facturas cuando quieras. Sin permanencias ni preguntas.",
      },
    ],
  },

  finalCTA: {
    headline: "¿Listo para construir tu negocio de tutorías independiente?",
    subheadline:
      "Únete a miles de tutores que ya dieron el paso. Configura tu sitio en TutorLingua en menos de 15 minutos y empieza a quedarte con más de lo que ganas.",
    calculatorLabel: "Tus ingresos mensuales actuales:",
    calculatorUnit: "/mes",
    rangeMinLabel: "$500",
    rangeMaxLabel: "$10,000",
    commissionLabel: "Comisión del marketplace (25% aprox.):",
    platformCostLabel: "Coste de TutorLingua:",
    monthlySavingsLabel: "Ahorro mensual:",
    annualSavingsLabel: "Ahorro anual",
    button: "Empieza gratis (sin tarjeta)",
    finePrint: "14 días gratis. Sin tarjeta de crédito. Cancela cuando quieras.",
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
