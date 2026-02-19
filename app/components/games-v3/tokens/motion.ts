export const motion = {
  duration: {
    quick: 120,
    normal: 180,
    state: 260,
  },
  easing: {
    out: "cubic-bezier(0.16, 1, 0.3, 1)",
    inOut: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
  pulse: {
    idleScale: 1,
    activeScale: 1.04,
  },
} as const;
