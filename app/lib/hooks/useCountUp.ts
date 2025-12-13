"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Custom hook for animating numbers with a count-up effect
 * @param end - The target number to count up to
 * @param duration - Animation duration in milliseconds (default: 1000ms)
 * @returns The current animated value
 */
export function useCountUp(end: number, duration = 1000): number {
  const [value, setValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Keep a ref of the latest value without triggering re-renders
  useEffect(() => {
    startValueRef.current = value;
  }, [value]);

  useEffect(() => {
    startTimeRef.current = null;
    const startingValue = startValueRef.current;

    // Easing function for natural deceleration (ease-out cubic)
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const currentValue =
        startingValue + (end - startingValue) * easedProgress;
      setValue(Math.round(currentValue));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    // Only animate if end is different from current value
    if (end !== startingValue) {
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [end, duration]);

  return value;
}
