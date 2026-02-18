/**
 * Standardised spring configurations for all TutorLingua game animations.
 *
 * Three tiers — use the right one for the right moment:
 *   snappy   → tap feedback, button presses, micro-interactions
 *   standard → card entrances, round transitions, reveals
 *   gentle   → result cards, victory screens, large elements
 */
export const SPRINGS = {
  snappy: { type: "spring", stiffness: 400, damping: 30 },
  standard: { type: "spring", stiffness: 300, damping: 25 },
  gentle: { type: "spring", stiffness: 200, damping: 22 },
} as const;

/** Alias for convenience — `SPRING.snappy` reads more naturally than `SPRINGS.snappy` */
export const SPRING = SPRINGS;
