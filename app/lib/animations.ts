/**
 * Shared animation constants for TutorLingua.
 *
 * Use across dashboard, student portal, and practice mode
 * to maintain a consistent motion language.
 */

// ---------------------------------------------------------------------------
// Spring transitions
// ---------------------------------------------------------------------------

/** Snappy spring for interactive elements (buttons, tiles, toggles). */
export const springSnap = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};

/** Gentle spring for layout shifts and page transitions. */
export const springGentle = {
  type: "spring" as const,
  stiffness: 300,
  damping: 25,
};

/** Bouncy spring for celebratory/reward moments (XP pop, confetti). */
export const springBounce = {
  type: "spring" as const,
  stiffness: 500,
  damping: 15,
};

// ---------------------------------------------------------------------------
// Page transition variants
// ---------------------------------------------------------------------------

/** Standard page transition — fade + subtle slide up. */
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/** Slide-in for practice screens — horizontal movement. */
export const practicePageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/** Fade-only for modals and overlays. */
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Scale-up for cards appearing on screen. */
export const scaleInVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// ---------------------------------------------------------------------------
// Interaction helpers (spread onto motion.* components)
// ---------------------------------------------------------------------------

/** Subtle tap feedback for buttons and interactive cards. */
export const tapFeedback = {
  whileTap: { scale: 0.97 },
};

/** Card hover lift effect — subtle, not distracting. */
export const cardHover = {
  whileHover: {
    y: -2,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
};

/** Stagger children animations (for lists). */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};
