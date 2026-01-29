/**
 * Location data for programmatic SEO landing pages
 * Target: 50+ major cities for language tutor discovery
 */

export interface LocationData {
  slug: string;
  city: string;
  country: string;
  countryCode: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  population?: number; // For prioritization
  timezone: string;
  languages: string[]; // Popular languages in this city
  metaTitle?: string;
  metaDescription?: string;
}

// Major cities grouped by region
export const LOCATIONS: LocationData[] = [
  // NORTH AMERICA
  {
    slug: "new-york",
    city: "New York",
    country: "United States",
    countryCode: "US",
    region: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    population: 8336817,
    timezone: "America/New_York",
    languages: ["Spanish", "French", "Mandarin", "Japanese", "Korean", "Italian", "Portuguese", "German", "Arabic", "Russian"],
  },
  {
    slug: "los-angeles",
    city: "Los Angeles",
    country: "United States",
    countryCode: "US",
    region: "California",
    latitude: 34.0522,
    longitude: -118.2437,
    population: 3979576,
    timezone: "America/Los_Angeles",
    languages: ["Spanish", "Mandarin", "Korean", "Japanese", "Tagalog", "Vietnamese", "Armenian", "Persian"],
  },
  {
    slug: "chicago",
    city: "Chicago",
    country: "United States",
    countryCode: "US",
    region: "Illinois",
    latitude: 41.8781,
    longitude: -87.6298,
    population: 2693976,
    timezone: "America/Chicago",
    languages: ["Spanish", "Polish", "Mandarin", "Arabic", "Tagalog", "Korean"],
  },
  {
    slug: "toronto",
    city: "Toronto",
    country: "Canada",
    countryCode: "CA",
    region: "Ontario",
    latitude: 43.6532,
    longitude: -79.3832,
    population: 2731571,
    timezone: "America/Toronto",
    languages: ["French", "Mandarin", "Cantonese", "Spanish", "Italian", "Portuguese", "Tagalog", "Tamil", "Punjabi"],
  },
  {
    slug: "vancouver",
    city: "Vancouver",
    country: "Canada",
    countryCode: "CA",
    region: "British Columbia",
    latitude: 49.2827,
    longitude: -123.1207,
    population: 631486,
    timezone: "America/Vancouver",
    languages: ["Mandarin", "Cantonese", "French", "Punjabi", "Korean", "Japanese", "Tagalog", "Spanish"],
  },
  {
    slug: "miami",
    city: "Miami",
    country: "United States",
    countryCode: "US",
    region: "Florida",
    latitude: 25.7617,
    longitude: -80.1918,
    population: 467963,
    timezone: "America/New_York",
    languages: ["Spanish", "Portuguese", "French", "Haitian Creole", "Russian"],
  },
  {
    slug: "san-francisco",
    city: "San Francisco",
    country: "United States",
    countryCode: "US",
    region: "California",
    latitude: 37.7749,
    longitude: -122.4194,
    population: 874961,
    timezone: "America/Los_Angeles",
    languages: ["Mandarin", "Spanish", "Cantonese", "Japanese", "Korean", "Vietnamese", "Tagalog"],
  },
  {
    slug: "mexico-city",
    city: "Mexico City",
    country: "Mexico",
    countryCode: "MX",
    latitude: 19.4326,
    longitude: -99.1332,
    population: 9209944,
    timezone: "America/Mexico_City",
    languages: ["English", "French", "German", "Japanese", "Mandarin"],
  },

  // EUROPE
  {
    slug: "london",
    city: "London",
    country: "United Kingdom",
    countryCode: "GB",
    region: "England",
    latitude: 51.5074,
    longitude: -0.1278,
    population: 8982000,
    timezone: "Europe/London",
    languages: ["Spanish", "French", "German", "Italian", "Mandarin", "Arabic", "Portuguese", "Polish", "Japanese", "Korean"],
  },
  {
    slug: "paris",
    city: "Paris",
    country: "France",
    countryCode: "FR",
    latitude: 48.8566,
    longitude: 2.3522,
    population: 2161000,
    timezone: "Europe/Paris",
    languages: ["English", "Spanish", "German", "Italian", "Mandarin", "Arabic", "Portuguese", "Japanese", "Russian"],
  },
  {
    slug: "berlin",
    city: "Berlin",
    country: "Germany",
    countryCode: "DE",
    latitude: 52.5200,
    longitude: 13.4050,
    population: 3748148,
    timezone: "Europe/Berlin",
    languages: ["English", "Spanish", "French", "Turkish", "Arabic", "Russian", "Polish", "Italian"],
  },
  {
    slug: "madrid",
    city: "Madrid",
    country: "Spain",
    countryCode: "ES",
    latitude: 40.4168,
    longitude: -3.7038,
    population: 3223334,
    timezone: "Europe/Madrid",
    languages: ["English", "French", "German", "Italian", "Portuguese", "Mandarin", "Arabic", "Russian"],
  },
  {
    slug: "barcelona",
    city: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    region: "Catalonia",
    latitude: 41.3851,
    longitude: 2.1734,
    population: 1620343,
    timezone: "Europe/Madrid",
    languages: ["English", "French", "German", "Italian", "Mandarin", "Arabic", "Russian", "Catalan"],
  },
  {
    slug: "amsterdam",
    city: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    latitude: 52.3676,
    longitude: 4.9041,
    population: 872680,
    timezone: "Europe/Amsterdam",
    languages: ["English", "German", "French", "Spanish", "Arabic", "Turkish", "Mandarin"],
  },
  {
    slug: "rome",
    city: "Rome",
    country: "Italy",
    countryCode: "IT",
    latitude: 41.9028,
    longitude: 12.4964,
    population: 2872800,
    timezone: "Europe/Rome",
    languages: ["English", "Spanish", "French", "German", "Mandarin", "Arabic", "Russian"],
  },
  {
    slug: "milan",
    city: "Milan",
    country: "Italy",
    countryCode: "IT",
    region: "Lombardy",
    latitude: 45.4642,
    longitude: 9.1900,
    population: 1371498,
    timezone: "Europe/Rome",
    languages: ["English", "Spanish", "French", "German", "Mandarin", "Arabic", "Russian"],
  },
  {
    slug: "munich",
    city: "Munich",
    country: "Germany",
    countryCode: "DE",
    region: "Bavaria",
    latitude: 48.1351,
    longitude: 11.5820,
    population: 1484226,
    timezone: "Europe/Berlin",
    languages: ["English", "Spanish", "French", "Italian", "Russian", "Mandarin", "Arabic"],
  },
  {
    slug: "vienna",
    city: "Vienna",
    country: "Austria",
    countryCode: "AT",
    latitude: 48.2082,
    longitude: 16.3738,
    population: 1911191,
    timezone: "Europe/Vienna",
    languages: ["English", "Spanish", "French", "Italian", "Turkish", "Serbian", "Croatian", "Russian"],
  },
  {
    slug: "zurich",
    city: "Zurich",
    country: "Switzerland",
    countryCode: "CH",
    latitude: 47.3769,
    longitude: 8.5417,
    population: 434335,
    timezone: "Europe/Zurich",
    languages: ["English", "French", "Italian", "Spanish", "Mandarin", "Portuguese"],
  },
  {
    slug: "dublin",
    city: "Dublin",
    country: "Ireland",
    countryCode: "IE",
    latitude: 53.3498,
    longitude: -6.2603,
    population: 554554,
    timezone: "Europe/Dublin",
    languages: ["Spanish", "French", "German", "Mandarin", "Polish", "Portuguese", "Italian"],
  },
  {
    slug: "lisbon",
    city: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    latitude: 38.7223,
    longitude: -9.1393,
    population: 544851,
    timezone: "Europe/Lisbon",
    languages: ["English", "Spanish", "French", "German", "Mandarin", "Arabic"],
  },
  {
    slug: "stockholm",
    city: "Stockholm",
    country: "Sweden",
    countryCode: "SE",
    latitude: 59.3293,
    longitude: 18.0686,
    population: 975904,
    timezone: "Europe/Stockholm",
    languages: ["English", "Spanish", "French", "German", "Arabic", "Mandarin"],
  },
  {
    slug: "copenhagen",
    city: "Copenhagen",
    country: "Denmark",
    countryCode: "DK",
    latitude: 55.6761,
    longitude: 12.5683,
    population: 644431,
    timezone: "Europe/Copenhagen",
    languages: ["English", "German", "Spanish", "French", "Arabic", "Mandarin"],
  },
  {
    slug: "warsaw",
    city: "Warsaw",
    country: "Poland",
    countryCode: "PL",
    latitude: 52.2297,
    longitude: 21.0122,
    population: 1790658,
    timezone: "Europe/Warsaw",
    languages: ["English", "German", "Spanish", "French", "Russian", "Italian"],
  },
  {
    slug: "prague",
    city: "Prague",
    country: "Czech Republic",
    countryCode: "CZ",
    latitude: 50.0755,
    longitude: 14.4378,
    population: 1309000,
    timezone: "Europe/Prague",
    languages: ["English", "German", "Spanish", "French", "Russian", "Italian"],
  },

  // ASIA-PACIFIC
  {
    slug: "tokyo",
    city: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    latitude: 35.6762,
    longitude: 139.6503,
    population: 13960000,
    timezone: "Asia/Tokyo",
    languages: ["English", "Spanish", "French", "German", "Mandarin", "Korean", "Portuguese"],
  },
  {
    slug: "osaka",
    city: "Osaka",
    country: "Japan",
    countryCode: "JP",
    latitude: 34.6937,
    longitude: 135.5023,
    population: 2750000,
    timezone: "Asia/Tokyo",
    languages: ["English", "Spanish", "French", "Mandarin", "Korean", "Portuguese"],
  },
  {
    slug: "seoul",
    city: "Seoul",
    country: "South Korea",
    countryCode: "KR",
    latitude: 37.5665,
    longitude: 126.9780,
    population: 9733509,
    timezone: "Asia/Seoul",
    languages: ["English", "Japanese", "Mandarin", "Spanish", "French", "German"],
  },
  {
    slug: "beijing",
    city: "Beijing",
    country: "China",
    countryCode: "CN",
    latitude: 39.9042,
    longitude: 116.4074,
    population: 21540000,
    timezone: "Asia/Shanghai",
    languages: ["English", "Japanese", "Korean", "French", "German", "Spanish", "Russian"],
  },
  {
    slug: "shanghai",
    city: "Shanghai",
    country: "China",
    countryCode: "CN",
    latitude: 31.2304,
    longitude: 121.4737,
    population: 27058000,
    timezone: "Asia/Shanghai",
    languages: ["English", "Japanese", "Korean", "French", "German", "Spanish"],
  },
  {
    slug: "hong-kong",
    city: "Hong Kong",
    country: "Hong Kong",
    countryCode: "HK",
    latitude: 22.3193,
    longitude: 114.1694,
    population: 7500700,
    timezone: "Asia/Hong_Kong",
    languages: ["English", "Mandarin", "Japanese", "Korean", "French", "Spanish"],
  },
  {
    slug: "singapore",
    city: "Singapore",
    country: "Singapore",
    countryCode: "SG",
    latitude: 1.3521,
    longitude: 103.8198,
    population: 5850342,
    timezone: "Asia/Singapore",
    languages: ["English", "Mandarin", "Malay", "Tamil", "Japanese", "Korean", "French", "German"],
  },
  {
    slug: "taipei",
    city: "Taipei",
    country: "Taiwan",
    countryCode: "TW",
    latitude: 25.0330,
    longitude: 121.5654,
    population: 2646474,
    timezone: "Asia/Taipei",
    languages: ["English", "Japanese", "Korean", "Spanish", "French", "German"],
  },
  {
    slug: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    countryCode: "TH",
    latitude: 13.7563,
    longitude: 100.5018,
    population: 10539000,
    timezone: "Asia/Bangkok",
    languages: ["English", "Mandarin", "Japanese", "Korean", "French", "German"],
  },
  {
    slug: "kuala-lumpur",
    city: "Kuala Lumpur",
    country: "Malaysia",
    countryCode: "MY",
    latitude: 3.1390,
    longitude: 101.6869,
    population: 1808000,
    timezone: "Asia/Kuala_Lumpur",
    languages: ["English", "Mandarin", "Arabic", "Japanese", "Korean", "French"],
  },
  {
    slug: "sydney",
    city: "Sydney",
    country: "Australia",
    countryCode: "AU",
    region: "New South Wales",
    latitude: -33.8688,
    longitude: 151.2093,
    population: 5312000,
    timezone: "Australia/Sydney",
    languages: ["Mandarin", "Spanish", "Japanese", "Korean", "Arabic", "Italian", "Greek", "Vietnamese", "French", "German"],
  },
  {
    slug: "melbourne",
    city: "Melbourne",
    country: "Australia",
    countryCode: "AU",
    region: "Victoria",
    latitude: -37.8136,
    longitude: 144.9631,
    population: 5078000,
    timezone: "Australia/Melbourne",
    languages: ["Mandarin", "Spanish", "Italian", "Greek", "Vietnamese", "Arabic", "Hindi", "Japanese", "Korean"],
  },
  {
    slug: "auckland",
    city: "Auckland",
    country: "New Zealand",
    countryCode: "NZ",
    latitude: -36.8509,
    longitude: 174.7645,
    population: 1657200,
    timezone: "Pacific/Auckland",
    languages: ["Mandarin", "Spanish", "French", "Japanese", "Korean", "Hindi", "Samoan"],
  },
  {
    slug: "mumbai",
    city: "Mumbai",
    country: "India",
    countryCode: "IN",
    region: "Maharashtra",
    latitude: 19.0760,
    longitude: 72.8777,
    population: 12442373,
    timezone: "Asia/Kolkata",
    languages: ["English", "French", "German", "Spanish", "Japanese", "Mandarin"],
  },
  {
    slug: "delhi",
    city: "Delhi",
    country: "India",
    countryCode: "IN",
    latitude: 28.7041,
    longitude: 77.1025,
    population: 16787941,
    timezone: "Asia/Kolkata",
    languages: ["English", "French", "German", "Spanish", "Japanese", "Mandarin", "Arabic"],
  },
  {
    slug: "bangalore",
    city: "Bangalore",
    country: "India",
    countryCode: "IN",
    region: "Karnataka",
    latitude: 12.9716,
    longitude: 77.5946,
    population: 8443675,
    timezone: "Asia/Kolkata",
    languages: ["English", "German", "French", "Japanese", "Mandarin", "Spanish"],
  },

  // MIDDLE EAST & AFRICA
  {
    slug: "dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    latitude: 25.2048,
    longitude: 55.2708,
    population: 3478300,
    timezone: "Asia/Dubai",
    languages: ["English", "Arabic", "French", "Mandarin", "Hindi", "Urdu", "Russian"],
  },
  {
    slug: "abu-dhabi",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    countryCode: "AE",
    latitude: 24.4539,
    longitude: 54.3773,
    population: 1480000,
    timezone: "Asia/Dubai",
    languages: ["English", "Arabic", "French", "Mandarin", "Hindi", "Urdu"],
  },
  {
    slug: "tel-aviv",
    city: "Tel Aviv",
    country: "Israel",
    countryCode: "IL",
    latitude: 32.0853,
    longitude: 34.7818,
    population: 460613,
    timezone: "Asia/Jerusalem",
    languages: ["English", "Arabic", "Russian", "French", "Spanish", "German"],
  },
  {
    slug: "cape-town",
    city: "Cape Town",
    country: "South Africa",
    countryCode: "ZA",
    region: "Western Cape",
    latitude: -33.9249,
    longitude: 18.4241,
    population: 433688,
    timezone: "Africa/Johannesburg",
    languages: ["English", "Afrikaans", "French", "German", "Mandarin", "Portuguese"],
  },
  {
    slug: "johannesburg",
    city: "Johannesburg",
    country: "South Africa",
    countryCode: "ZA",
    region: "Gauteng",
    latitude: -26.2041,
    longitude: 28.0473,
    population: 957441,
    timezone: "Africa/Johannesburg",
    languages: ["English", "Afrikaans", "Zulu", "French", "Portuguese", "Mandarin"],
  },

  // SOUTH AMERICA
  {
    slug: "sao-paulo",
    city: "Sao Paulo",
    country: "Brazil",
    countryCode: "BR",
    latitude: -23.5505,
    longitude: -46.6333,
    population: 12325232,
    timezone: "America/Sao_Paulo",
    languages: ["English", "Spanish", "French", "German", "Italian", "Japanese", "Mandarin"],
  },
  {
    slug: "rio-de-janeiro",
    city: "Rio de Janeiro",
    country: "Brazil",
    countryCode: "BR",
    latitude: -22.9068,
    longitude: -43.1729,
    population: 6747815,
    timezone: "America/Sao_Paulo",
    languages: ["English", "Spanish", "French", "German", "Italian"],
  },
  {
    slug: "buenos-aires",
    city: "Buenos Aires",
    country: "Argentina",
    countryCode: "AR",
    latitude: -34.6037,
    longitude: -58.3816,
    population: 3075646,
    timezone: "America/Argentina/Buenos_Aires",
    languages: ["English", "French", "Italian", "German", "Portuguese", "Mandarin"],
  },
  {
    slug: "bogota",
    city: "Bogota",
    country: "Colombia",
    countryCode: "CO",
    latitude: 4.7110,
    longitude: -74.0721,
    population: 7181469,
    timezone: "America/Bogota",
    languages: ["English", "French", "German", "Portuguese", "Italian", "Mandarin"],
  },
  {
    slug: "lima",
    city: "Lima",
    country: "Peru",
    countryCode: "PE",
    latitude: -12.0464,
    longitude: -77.0428,
    population: 9751717,
    timezone: "America/Lima",
    languages: ["English", "French", "German", "Portuguese", "Italian", "Mandarin"],
  },
  {
    slug: "santiago",
    city: "Santiago",
    country: "Chile",
    countryCode: "CL",
    latitude: -33.4489,
    longitude: -70.6693,
    population: 5614000,
    timezone: "America/Santiago",
    languages: ["English", "French", "German", "Portuguese", "Italian", "Mandarin"],
  },
];

/**
 * Get all location slugs
 */
export function getAllLocationSlugs(): string[] {
  return LOCATIONS.map(l => l.slug);
}

/**
 * Get location data by slug
 */
export function getLocationBySlug(slug: string): LocationData | null {
  return LOCATIONS.find(l => l.slug === slug) || null;
}

/**
 * Get locations by country
 */
export function getLocationsByCountry(countryCode: string): LocationData[] {
  return LOCATIONS.filter(l => l.countryCode === countryCode);
}

/**
 * Get locations where a specific language is popular
 */
export function getLocationsForLanguage(language: string): LocationData[] {
  return LOCATIONS.filter(l =>
    l.languages.some(lang => lang.toLowerCase() === language.toLowerCase())
  );
}

/**
 * Get top locations by population
 */
export function getTopLocations(limit: number = 20): LocationData[] {
  return [...LOCATIONS]
    .sort((a, b) => (b.population || 0) - (a.population || 0))
    .slice(0, limit);
}

/**
 * Generate meta title for location page
 */
export function generateLocationMetaTitle(language: string, location: LocationData): string {
  return `${language} Tutors in ${location.city} | Find Local ${language} Teachers`;
}

/**
 * Generate meta description for location page
 */
export function generateLocationMetaDescription(language: string, location: LocationData): string {
  return `Find professional ${language} language tutors in ${location.city}, ${location.country}. Book online lessons with experienced teachers. 0% commission on direct bookings.`;
}
