"use client";

import { useEffect, useRef, useState } from "react";
import Lottie, { LottieRefCurrentProps } from "lottie-react";

interface AnimatedIconProps {
  animationPath: string;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export function AnimatedIcon({
  animationPath,
  size = 120,
  loop = true,
  autoplay = false,
  className = "",
}: AnimatedIconProps) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animationData, setAnimationData] =
    useState<Record<string, unknown> | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Load animation data
  useEffect(() => {
    fetch(animationPath)
      .then((res) => res.json())
      .then((data) => setAnimationData(data as Record<string, unknown>))
      .catch((err) => console.error("Failed to load animation:", err));
  }, [animationPath]);

  // Intersection Observer to trigger animation when in viewport
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayed) {
            setHasPlayed(true);
            lottieRef.current?.play();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [hasPlayed, prefersReducedMotion]);

  // Handle mouse enter to replay animation
  const handleMouseEnter = () => {
    if (!prefersReducedMotion && lottieRef.current) {
      lottieRef.current.goToAndPlay(0);
    }
  };

  // If reduced motion is preferred, show static first frame
  if (prefersReducedMotion && animationData) {
    return (
      <div
        ref={containerRef}
        className={`flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label="Decorative icon"
      >
        <Lottie
          lottieRef={lottieRef}
          animationData={animationData}
          loop={false}
          autoplay={false}
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  if (!animationData) {
    // Loading state - show placeholder
    return (
      <div
        className={`flex items-center justify-center bg-brand-cream rounded-full animate-pulse ${className}`}
        style={{ width: size, height: size }}
        aria-label="Loading animation"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      onMouseEnter={handleMouseEnter}
      aria-label="Animated icon"
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay && !prefersReducedMotion}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
