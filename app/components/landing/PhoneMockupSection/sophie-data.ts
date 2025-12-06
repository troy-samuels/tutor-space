// Mock data for Sophie Laurent's French tutor site preview

export type SophieMockData = {
  profile: {
    name: string;
    tagline: string;
    avatarUrl: string;
    location: string;
  };
  about: {
    title: string;
    body: string;
    yearsExperience: number;
    languages: Array<{ name: string; level: string }>;
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    currency: string;
  }>;
  reviews: Array<{
    id: string;
    author: string;
    quote: string;
    rating: number;
  }>;
  booking: {
    headline: string;
    subcopy: string;
    ctaLabel: string;
  };
  social: Array<{
    platform: string;
    icon: string;
  }>;
  theme: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
};

export const SOPHIE_DATA: SophieMockData = {
  profile: {
    name: "Sophie Laurent",
    tagline: "French Teacher | Conversation & Culture",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=200&h=200&q=65",
    location: "Paris, France",
  },
  about: {
    title: "Bonjour! I'm Sophie",
    body: "Native Parisian with 8 years of teaching experience. I specialize in conversational French and helping students discover the beauty of French culture. Whether you're preparing for a trip to Paris or aiming for fluency, I create personalized lessons that make learning enjoyable.",
    yearsExperience: 8,
    languages: [
      { name: "French", level: "Native" },
      { name: "English", level: "C2" },
      { name: "Spanish", level: "B2" },
    ],
  },
  services: [
    {
      id: "1",
      name: "Conversation Practice",
      description: "Build fluency through natural dialogue",
      durationMinutes: 60,
      price: 4500,
      currency: "USD",
    },
    {
      id: "2",
      name: "Grammar Foundations",
      description: "Master French grammar with clarity",
      durationMinutes: 45,
      price: 3500,
      currency: "USD",
    },
    {
      id: "3",
      name: "DELF/DALF Prep",
      description: "Exam preparation with practice tests",
      durationMinutes: 60,
      price: 5500,
      currency: "USD",
    },
  ],
  reviews: [
    {
      id: "1",
      author: "Emily R.",
      quote:
        "Sophie made me fall in love with French! Her lessons are engaging and she explains things so clearly.",
      rating: 5,
    },
    {
      id: "2",
      author: "James T.",
      quote:
        "After 3 months with Sophie, I finally feel confident speaking French. Her patience made all the difference.",
      rating: 5,
    },
    {
      id: "3",
      author: "Maria S.",
      quote:
        "Best French tutor I've had! Sophie's cultural insights make every lesson special.",
      rating: 5,
    },
  ],
  booking: {
    headline: "Ready to start your French journey?",
    subcopy: "Book a trial lesson and let's discuss your goals",
    ctaLabel: "Book a Trial",
  },
  social: [
    { platform: "Instagram", icon: "Instagram" },
    { platform: "YouTube", icon: "Youtube" },
    { platform: "Email", icon: "Mail" },
  ],
  theme: {
    primary: "#1e3a5f", // Navy blue
    secondary: "#c9a227", // Gold accent
    background: "#faf9f7", // Warm off-white
    text: "#2d2a26", // Dark brown/black
  },
};

// Helper to format currency
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `$${(amount / 100).toFixed(0)}`;
  }
}
