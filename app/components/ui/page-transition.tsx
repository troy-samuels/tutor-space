"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { springGentle } from "@/lib/animations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageTransitionProps = {
  children: React.ReactNode;
  /** Custom class name for the wrapper. */
  className?: string;
  /** Transition mode. Defaults to "wait" (exit old before entering new). */
  mode?: "wait" | "sync" | "popLayout";
};

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

const fadeVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Page transition wrapper.
 * Wraps children with AnimatePresence for fade transitions between pages.
 *
 * Usage: Wrap the children inside a layout.tsx to get page transitions
 * across all routes in that layout group.
 *
 * @example
 * // In app/(dashboard)/layout.tsx
 * <PageTransition>
 *   {children}
 * </PageTransition>
 */
export function PageTransition({
  children,
  className,
  mode = "wait",
}: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode={mode}>
      <motion.div
        key={pathname}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={springGentle}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
