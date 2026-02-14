"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { springGentle } from "@/lib/animations";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AnimateInProps = HTMLMotionProps<"div"> & {
  /** Delay in seconds before animation starts. */
  delay?: number;
  /** Animation direction. */
  direction?: "up" | "down" | "left" | "right" | "none";
  /** Distance of the slide in pixels. */
  distance?: number;
  /** Whether to add hover lift effect. */
  hoverLift?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Lightweight animation wrapper for dashboard cards and elements.
 * Provides fade-in with optional directional slide and hover effects.
 *
 * @example
 * <AnimateIn delay={0.1} hoverLift>
 *   <MetricCard />
 * </AnimateIn>
 *
 * @example
 * <AnimateIn direction="left" distance={16}>
 *   <SessionCard />
 * </AnimateIn>
 */
export function AnimateIn({
  delay = 0,
  direction = "up",
  distance = 8,
  hoverLift = false,
  children,
  ...props
}: AnimateInProps) {
  const directionMap = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ ...springGentle, delay }}
      whileHover={hoverLift ? { y: -2, transition: { type: "spring", stiffness: 300, damping: 20 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered container for animating lists of children.
 *
 * @example
 * <StaggerIn>
 *   <AnimateIn><Card /></AnimateIn>
 *   <AnimateIn><Card /></AnimateIn>
 * </StaggerIn>
 */
export function StaggerIn({
  staggerDelay = 0.06,
  children,
  className,
  ...props
}: HTMLMotionProps<"div"> & { staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
