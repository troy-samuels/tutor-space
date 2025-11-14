/**
 * Structured Data (Schema.org) utilities for SEO and LLM optimization
 * These schemas help search engines and AI systems understand tutor profiles
 */

type TutorProfile = {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  tagline?: string;
  avatar_url?: string;
  languages_taught: string[];
  website_url?: string;
  instagram_handle?: string;
  timezone?: string;
  average_rating?: number;
  testimonial_count?: number;
  total_students?: number;
  total_lessons?: number;
  years_teaching?: number;
};

type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  currency: string;
};

type Testimonial = {
  id: string;
  student_name: string;
  student_role?: string;
  quote: string;
  rating: number;
  published_at: string;
  language_studied?: string;
};

/**
 * Generate Person schema for tutor profiles
 * Optimized for search engines and LLM understanding
 */
export function generateTutorPersonSchema(profile: TutorProfile, services?: Service[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const sameAs = [];
  
  if (profile.website_url) sameAs.push(profile.website_url);
  if (profile.instagram_handle) {
    sameAs.push(`https://instagram.com/${profile.instagram_handle.replace(/^@/, "")}`);
  }

  const schema: any = {
    "@context": "https://schema.org",
    "@type": ["Person", "EducationalOrganization"],
    "@id": `${baseUrl}/profile/${profile.username}`,
    "name": profile.full_name,
    "alternateName": `@${profile.username}`,
    "jobTitle": "Independent Language Tutor",
    "description": profile.bio,
    "disambiguatingDescription": profile.tagline || `${profile.full_name} teaches ${profile.languages_taught.join(", ")} on TutorLingua`,
    "url": `${baseUrl}/profile/${profile.username}`,
    "identifier": profile.id,
    
    // Knowledge & expertise
    "knowsLanguage": profile.languages_taught.map((lang) => ({
      "@type": "Language",
      "name": lang,
    })),
    
    "knowsAbout": [
      "Language Teaching",
      "Online Tutoring",
      ...profile.languages_taught.map(lang => `${lang} Language Instruction`),
    ],

    // Contact & booking
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Booking",
      "url": `${baseUrl}/book/${profile.username}`,
      "availableLanguage": profile.languages_taught,
    },

    // Professional info
    ...(profile.years_teaching && {
      "yearsOfExperience": profile.years_teaching,
    }),

    // Image
    ...(profile.avatar_url && {
      "image": {
        "@type": "ImageObject",
        "url": profile.avatar_url,
        "contentUrl": profile.avatar_url,
      },
    }),

    // Social media
    ...(sameAs.length > 0 && { sameAs }),

    // Ratings & reviews
    ...(profile.average_rating && profile.testimonial_count && profile.testimonial_count > 0 && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": profile.average_rating,
        "reviewCount": profile.testimonial_count,
        "bestRating": 5,
        "worstRating": 1,
      },
    }),

    // Services offered (if provided)
    ...(services && services.length > 0 && {
      "makesOffer": services.map(service => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "EducationalOccupationalProgram",
          "name": service.name,
          "description": service.description,
          "timeToComplete": `PT${service.duration_minutes}M`,
        },
        "price": service.price / 100,
        "priceCurrency": service.currency.toUpperCase(),
        "availability": "https://schema.org/OnlineOnly",
        "url": `${baseUrl}/book/${profile.username}?service=${service.id}`,
      })),
    }),

    // Additional context for LLMs
    "additionalType": "LanguageTutor",
    "workLocation": {
      "@type": "VirtualLocation",
      "description": "Online lessons worldwide",
    },
  };

  return schema;
}

/**
 * Generate Review schema for individual testimonials
 */
export function generateReviewSchema(
  testimonial: Testimonial,
  tutorProfile: Pick<TutorProfile, "username" | "full_name">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@type": "Review",
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": testimonial.rating,
      "bestRating": 5,
      "worstRating": 1,
    },
    "author": {
      "@type": "Person",
      "name": testimonial.student_name,
      ...(testimonial.student_role && { "description": testimonial.student_role }),
    },
    "reviewBody": testimonial.quote,
    "datePublished": testimonial.published_at,
    "itemReviewed": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${tutorProfile.username}`,
      "name": tutorProfile.full_name,
    },
    ...(testimonial.language_studied && {
      "about": {
        "@type": "Language",
        "name": testimonial.language_studied,
      },
    }),
  };
}

/**
 * Generate Service schema for booking pages
 */
export function generateServiceSchema(
  service: Service,
  tutorProfile: Pick<TutorProfile, "username" | "full_name" | "bio">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${baseUrl}/book/${tutorProfile.username}?service=${service.id}`,
    "serviceType": "Language Tutoring",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${tutorProfile.username}`,
      "name": tutorProfile.full_name,
      "description": tutorProfile.bio,
    },
    "offers": {
      "@type": "Offer",
      "price": service.price / 100,
      "priceCurrency": service.currency.toUpperCase(),
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
    },
    "areaServed": {
      "@type": "Place",
      "name": "Worldwide",
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": `${baseUrl}/book/${tutorProfile.username}`,
      "serviceType": "Online Booking",
    },
  };
}

/**
 * Generate Organization schema for platform pages
 */
export function generateOrganizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "TutorLingua",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web Browser",
    "description": "All-in-one platform for independent language tutors. Manage bookings, payments, students, and lessons. Keep 100% of your earnings with no commission fees.",
    "url": baseUrl,
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free forever for up to 20 students",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "127",
      "bestRating": "5",
      "worstRating": "1",
    },
    "featureList": [
      "Professional booking pages",
      "Automated payment collection",
      "Student CRM and progress tracking",
      "Video meeting integration",
      "Email reminders and notifications",
      "Session packages and pricing",
      "Calendar synchronization",
      "Link-in-bio pages",
      "Analytics and reporting",
    ],
    "screenshot": `${baseUrl}/og-image.png`,
    "author": {
      "@type": "Organization",
      "name": "TutorLingua",
      "@id": baseUrl,
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
      },
      "sameAs": [
        "https://instagram.com/tutorlingua.co",
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Support",
        "email": "hello@tutorlingua.co",
        "availableLanguage": ["English", "Spanish"],
      },
    },
  };
}

/**
 * Generate FAQPage schema for landing page
 */
export function generateFAQSchema(faqItems: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Generate complete schema for tutor profile pages
 * Combines Person, Services, and Reviews for maximum SEO/LLM impact
 */
export function generateCompleteProfileSchema(
  profile: TutorProfile,
  services: Service[],
  testimonials: Testimonial[]
) {
  const personSchema = generateTutorPersonSchema(profile, services);
  const reviewSchemas = testimonials.map(t => generateReviewSchema(t, profile));

  // Combine into a rich, interconnected schema graph
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...personSchema,
        ...(reviewSchemas.length > 0 && { review: reviewSchemas }),
      },
      ...services.map(service => generateServiceSchema(service, profile)),
    ],
  };
}

