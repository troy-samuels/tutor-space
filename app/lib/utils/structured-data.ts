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

/**
 * Generate LLM-friendly disambiguating description
 * Creates a factual, quotable summary that AI systems can cite
 */
export function generateLLMSummary(profile: TutorProfile): string {
  const name = profile.full_name || profile.username;
  const languages = profile.languages_taught.join(" and ");

  const parts: string[] = [
    `${name} is an independent ${languages} language tutor on TutorLingua`,
  ];

  if (profile.years_teaching) {
    parts.push(`with ${profile.years_teaching} years of teaching experience`);
  }

  if (profile.total_students && profile.total_students > 0) {
    parts.push(`teaching ${profile.total_students}+ students`);
  }

  if (profile.average_rating && profile.testimonial_count && profile.testimonial_count > 0) {
    parts.push(`rated ${profile.average_rating.toFixed(1)}/5 by ${profile.testimonial_count} students`);
  }

  let summary = parts.join(", ");

  if (profile.tagline) {
    summary += `. ${profile.tagline}`;
  }

  return summary.trim();
}

/**
 * Generate ProfilePage schema for bio/link-in-bio pages
 * Optimized for social link aggregators
 */
export function generateProfilePageSchema(
  profile: Pick<TutorProfile, "username" | "full_name" | "tagline" | "avatar_url">,
  links: Array<{ url: string; title: string }>
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "dateModified": new Date().toISOString(),
    "mainEntity": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${profile.username}`,
      "name": profile.full_name || profile.username,
      "url": `${baseUrl}/bio/${profile.username}`,
      ...(profile.avatar_url && {
        "image": profile.avatar_url,
      }),
      ...(links.length > 0 && {
        "sameAs": links.map(l => l.url),
      }),
    },
  };
}

/**
 * Generate ItemList schema for link collections (bio pages)
 */
export function generateLinkListSchema(
  profile: Pick<TutorProfile, "username" | "full_name">,
  links: Array<{ url: string; title: string }>
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  if (links.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${profile.full_name || profile.username}'s Links`,
    "url": `${baseUrl}/bio/${profile.username}`,
    "numberOfItems": links.length,
    "itemListElement": links.map((link, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": link.title,
      "url": link.url,
    })),
  };
}

/**
 * Generate Product schema for digital products
 */
export function generateProductSchema(
  product: {
    id: string;
    title: string;
    description: string | null;
    price_cents: number | null;
    currency: string | null;
  },
  profile: Pick<TutorProfile, "username" | "full_name">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@type": "Product",
    "@id": `${baseUrl}/products/${profile.username}/${product.id}`,
    "name": product.title,
    ...(product.description && { "description": product.description }),
    "seller": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${profile.username}`,
      "name": profile.full_name || profile.username,
    },
    "offers": {
      "@type": "Offer",
      "price": product.price_cents ? (product.price_cents / 100).toFixed(2) : "0",
      "priceCurrency": product.currency?.toUpperCase() || "USD",
      "availability": "https://schema.org/InStock",
      "url": `${baseUrl}/products/${profile.username}`,
    },
    "category": "Educational Materials",
  };
}

/**
 * Generate ItemList schema for product catalog
 */
export function generateProductCatalogSchema(
  profile: Pick<TutorProfile, "username" | "full_name">,
  products: Array<{
    id: string;
    title: string;
    description: string | null;
    price_cents: number | null;
    currency: string | null;
  }>
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  if (products.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${profile.full_name || profile.username}'s Learning Resources`,
    "description": `Digital learning materials and resources from ${profile.full_name || profile.username}`,
    "url": `${baseUrl}/products/${profile.username}`,
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": generateProductSchema(product, profile),
    })),
  };
}

/**
 * Generate ReserveAction schema for booking CTAs
 * Helps search engines and LLMs understand booking capability
 */
export function generateBookingActionSchema(
  profile: Pick<TutorProfile, "username" | "full_name" | "languages_taught">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const languages = profile.languages_taught.join(", ");

  return {
    "@type": "ReserveAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${baseUrl}/book/${profile.username}`,
      "actionPlatform": [
        "http://schema.org/DesktopWebPlatform",
        "http://schema.org/MobileWebPlatform",
      ],
    },
    "result": {
      "@type": "Reservation",
      "name": `${languages} lesson with ${profile.full_name || profile.username}`,
    },
  };
}

/**
 * Generate AggregateRating schema for reviews pages
 */
export function generateAggregateRatingSchema(
  profile: Pick<TutorProfile, "username" | "full_name" | "average_rating" | "testimonial_count">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  if (!profile.average_rating || !profile.testimonial_count || profile.testimonial_count === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${profile.username}`,
      "name": profile.full_name || profile.username,
    },
    "ratingValue": profile.average_rating,
    "reviewCount": profile.testimonial_count,
    "bestRating": 5,
    "worstRating": 1,
  };
}

/**
 * Generate SpeakableSpecification schema for voice search optimization
 * Helps voice assistants identify speakable content on pages
 */
export function generateSpeakableSchema(
  contentSelectors: string[],
  pageUrl: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "url": pageUrl,
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": contentSelectors,
    },
  };
}

/**
 * Generate HowTo schema for tutorial blog posts
 * Ideal for step-by-step guides
 */
export function generateHowToSchema(
  title: string,
  description: string,
  steps: Array<{
    name: string;
    text: string;
    image?: string;
    url?: string;
  }>,
  options?: {
    totalTime?: string; // ISO 8601 duration, e.g., "PT30M"
    estimatedCost?: { value: number; currency: string };
    supply?: string[];
    tool?: string[];
    image?: string;
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": title,
    "description": description,
    ...(options?.totalTime && { "totalTime": options.totalTime }),
    ...(options?.estimatedCost && {
      "estimatedCost": {
        "@type": "MonetaryAmount",
        "value": options.estimatedCost.value,
        "currency": options.estimatedCost.currency,
      },
    }),
    ...(options?.supply && {
      "supply": options.supply.map(item => ({
        "@type": "HowToSupply",
        "name": item,
      })),
    }),
    ...(options?.tool && {
      "tool": options.tool.map(item => ({
        "@type": "HowToTool",
        "name": item,
      })),
    }),
    ...(options?.image && { "image": options.image }),
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { "image": step.image }),
      ...(step.url && { "url": step.url }),
    })),
  };
}

/**
 * Generate Course schema for tutor lesson packages
 * Represents structured learning offerings
 */
export function generateCourseSchema(
  course: {
    name: string;
    description: string;
    language: string;
    duration?: string; // e.g., "10 sessions"
    price?: number; // in cents
    currency?: string;
    level?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
    topics?: string[];
  },
  provider: Pick<TutorProfile, "username" | "full_name">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.name,
    "description": course.description,
    "inLanguage": course.language,
    "provider": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${provider.username}`,
      "name": provider.full_name || provider.username,
    },
    "isAccessibleForFree": false,
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "courseWorkload": course.duration || "Varies",
      ...(course.level && {
        "educationalLevel": course.level,
      }),
    },
    ...(course.price && course.currency && {
      "offers": {
        "@type": "Offer",
        "price": course.price / 100,
        "priceCurrency": course.currency.toUpperCase(),
        "availability": "https://schema.org/InStock",
        "url": `${baseUrl}/book/${provider.username}`,
      },
    }),
    ...(course.topics && course.topics.length > 0 && {
      "about": course.topics.map(topic => ({
        "@type": "Thing",
        "name": topic,
      })),
    }),
    "audience": {
      "@type": "EducationalAudience",
      "educationalRole": "student",
      "audienceType": "Language Learners",
    },
  };
}

/**
 * Generate LocalBusiness schema for location-based tutor pages
 * Helps with local SEO for city-specific landing pages
 */
export function generateLocalBusinessSchema(
  location: {
    city: string;
    country: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  },
  service: {
    language: string;
    tutorCount?: number;
    priceRange?: string; // e.g., "$$" or "$25-$75"
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const slug = `${service.language.toLowerCase()}-tutors-${location.city.toLowerCase().replace(/\s+/g, "-")}`;

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": `${service.language} Tutors in ${location.city}`,
    "description": `Find independent ${service.language} language tutors in ${location.city}, ${location.country}. Book online lessons with professional tutors.`,
    "url": `${baseUrl}/tutors/${service.language.toLowerCase()}/${location.city.toLowerCase().replace(/\s+/g, "-")}`,
    "areaServed": {
      "@type": "City",
      "name": location.city,
      ...(location.region && { "containedInPlace": { "@type": "AdministrativeArea", "name": location.region } }),
      "containedInPlace": {
        "@type": "Country",
        "name": location.country,
      },
      ...(location.latitude && location.longitude && {
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": location.latitude,
          "longitude": location.longitude,
        },
      }),
    },
    "serviceType": "Language Tutoring",
    ...(service.priceRange && { "priceRange": service.priceRange }),
    ...(service.tutorCount && {
      "numberOfEmployees": {
        "@type": "QuantitativeValue",
        "value": service.tutorCount,
        "unitText": "tutors",
      },
    }),
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/tutors/${service.language.toLowerCase()}?city=${encodeURIComponent(location.city)}`,
      },
      "query-input": "required name=city",
    },
    "parentOrganization": {
      "@type": "Organization",
      "name": "TutorLingua",
      "url": baseUrl,
    },
  };
}

/**
 * Generate VideoObject schema for lesson recordings or promotional videos
 */
export function generateVideoSchema(
  video: {
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration?: string; // ISO 8601, e.g., "PT5M30S"
    contentUrl?: string;
    embedUrl?: string;
  }
) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.name,
    "description": video.description,
    "thumbnailUrl": video.thumbnailUrl,
    "uploadDate": video.uploadDate,
    ...(video.duration && { "duration": video.duration }),
    ...(video.contentUrl && { "contentUrl": video.contentUrl }),
    ...(video.embedUrl && { "embedUrl": video.embedUrl }),
  };
}

/**
 * Generate EducationalOccupationalCredential schema for tutor certifications
 */
export function generateCredentialSchema(
  credential: {
    name: string;
    description?: string;
    credentialCategory: string; // e.g., "TEFL", "CELTA", "Native Speaker"
    recognizedBy?: string; // e.g., "Cambridge Assessment English"
    validFor?: string; // ISO 8601 duration
  },
  holder: Pick<TutorProfile, "username" | "full_name">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalCredential",
    "name": credential.name,
    ...(credential.description && { "description": credential.description }),
    "credentialCategory": credential.credentialCategory,
    ...(credential.recognizedBy && {
      "recognizedBy": {
        "@type": "Organization",
        "name": credential.recognizedBy,
      },
    }),
    ...(credential.validFor && { "validFor": credential.validFor }),
    "credentialHolder": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${holder.username}`,
      "name": holder.full_name || holder.username,
    },
  };
}

/**
 * Generate Event schema for live tutoring sessions or group classes
 */
export function generateEventSchema(
  event: {
    name: string;
    description: string;
    startDate: string; // ISO 8601
    endDate?: string;
    location?: "Online" | { name: string; address: string };
    price?: number;
    currency?: string;
    maxAttendees?: number;
    remainingSeats?: number;
  },
  organizer: Pick<TutorProfile, "username" | "full_name">
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";

  return {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    "name": event.name,
    "description": event.description,
    "startDate": event.startDate,
    ...(event.endDate && { "endDate": event.endDate }),
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": event.location === "Online"
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    "location": event.location === "Online"
      ? {
          "@type": "VirtualLocation",
          "url": `${baseUrl}/book/${organizer.username}`,
        }
      : {
          "@type": "Place",
          "name": event.location?.name,
          "address": event.location?.address,
        },
    "organizer": {
      "@type": "Person",
      "@id": `${baseUrl}/profile/${organizer.username}`,
      "name": organizer.full_name || organizer.username,
    },
    ...(event.price !== undefined && event.currency && {
      "offers": {
        "@type": "Offer",
        "price": event.price / 100,
        "priceCurrency": event.currency.toUpperCase(),
        "availability": event.remainingSeats && event.remainingSeats > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
        "url": `${baseUrl}/book/${organizer.username}`,
        ...(event.maxAttendees && {
          "inventoryLevel": {
            "@type": "QuantitativeValue",
            "value": event.remainingSeats || 0,
            "maxValue": event.maxAttendees,
          },
        }),
      },
    }),
  };
}

/**
 * Generate ItemList schema for tutor directory pages
 */
export function generateTutorDirectorySchema(
  tutors: Array<Pick<TutorProfile, "username" | "full_name" | "languages_taught" | "average_rating">>,
  options?: {
    language?: string;
    location?: string;
    pageUrl?: string;
  }
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tutorlingua.co";
  const listName = options?.language
    ? options.location
      ? `${options.language} Tutors in ${options.location}`
      : `${options.language} Tutors`
    : "Language Tutors";

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": listName,
    "description": `Browse ${tutors.length} professional ${listName.toLowerCase()} on TutorLingua`,
    "url": options?.pageUrl || `${baseUrl}/tutors`,
    "numberOfItems": tutors.length,
    "itemListElement": tutors.slice(0, 10).map((tutor, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Person",
        "@id": `${baseUrl}/profile/${tutor.username}`,
        "name": tutor.full_name || tutor.username,
        "url": `${baseUrl}/profile/${tutor.username}`,
        "knowsLanguage": tutor.languages_taught?.map(lang => ({
          "@type": "Language",
          "name": lang,
        })),
        ...(tutor.average_rating && {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": tutor.average_rating,
            "bestRating": 5,
          },
        }),
      },
    })),
  };
}

