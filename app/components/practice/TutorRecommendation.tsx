"use client";

import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { springGentle } from "@/lib/animations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RecommendedTutor = {
  username: string;
  name: string;
  avatar?: string | null;
  language: string;
  rating: number;
  reviewCount: number;
  priceLabel: string;
  tagline?: string;
};

type TutorRecommendationProps = {
  language: string;
  level: string;
  /** Pre-fetched tutor recommendations. If empty, shows a generic CTA. */
  tutors?: RecommendedTutor[];
};

// ---------------------------------------------------------------------------
// Mock data (replace with API call when ready)
// ---------------------------------------------------------------------------

const MOCK_TUTORS: Record<string, RecommendedTutor[]> = {
  es: [
    { username: "sofia-m", name: "Sofia M.", language: "Spanish", rating: 4.9, reviewCount: 127, priceLabel: "£18/lesson", tagline: "Conversational fluency specialist" },
    { username: "carlos-r", name: "Carlos R.", language: "Spanish", rating: 4.8, reviewCount: 84, priceLabel: "£22/lesson", tagline: "DELE exam preparation" },
  ],
  fr: [
    { username: "amelie-d", name: "Amélie D.", language: "French", rating: 4.9, reviewCount: 96, priceLabel: "£20/lesson", tagline: "Business French & DELF prep" },
    { username: "pierre-l", name: "Pierre L.", language: "French", rating: 4.7, reviewCount: 61, priceLabel: "£16/lesson", tagline: "Beginner-friendly conversation" },
  ],
  de: [
    { username: "hannah-k", name: "Hannah K.", language: "German", rating: 4.8, reviewCount: 73, priceLabel: "£19/lesson", tagline: "Grammar made simple" },
  ],
};

function getTutors(languageCode: string): RecommendedTutor[] {
  return MOCK_TUTORS[languageCode] ?? Object.values(MOCK_TUTORS)[0] ?? [];
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 16 },
  show: {
    opacity: 1,
    x: 0,
    transition: springGentle,
  },
};

// ---------------------------------------------------------------------------
// Tutor Card
// ---------------------------------------------------------------------------

function TutorCard({ tutor }: { tutor: RecommendedTutor }) {
  const initials = tutor.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div variants={cardVariants}>
      <Link
        href={`/${tutor.username}`}
        className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
      >
        {/* Avatar */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-white">
          {initials}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{tutor.name}</p>
            <div className="flex items-center gap-0.5 text-xs text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              <span>{tutor.rating}</span>
              <span className="text-muted-foreground">({tutor.reviewCount})</span>
            </div>
          </div>
          {tutor.tagline && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{tutor.tagline}</p>
          )}
        </div>

        {/* Price + Arrow */}
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-semibold text-primary">{tutor.priceLabel}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Tutor recommendation bridge for the results page.
 * Shows relevant tutors to convert anonymous practice users into students.
 */
export function TutorRecommendation({ language, level, tutors }: TutorRecommendationProps) {
  const displayTutors = tutors ?? getTutors(language);

  if (displayTutors.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springGentle}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-center backdrop-blur-xl"
      >
        <p className="text-sm font-semibold text-foreground">Ready to level up?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Students at {level} level book an average of 2 lessons per week.
        </p>
        <Link
          href="/tutors"
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          Book a Free Trial <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {/* Header */}
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended Tutors
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground/70">
          Your level is {level} — students like you improve 3× faster with a tutor
        </p>
      </div>

      {/* Tutor cards */}
      {displayTutors.slice(0, 3).map((tutor) => (
        <TutorCard key={tutor.username} tutor={tutor} />
      ))}

      {/* Book a free trial CTA */}
      <motion.div variants={cardVariants}>
        <Link
          href={`/tutors?lang=${language}`}
          className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          Book a Free Trial <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
