export const physics = {
  springs: {
    snappy: { stiffness: 400, damping: 30 },
    wobbly: { stiffness: 120, damping: 14 },
  },
  grammarGravity: {
    nounMass: 1.15,
    verbMass: 0.85,
  },
  haptics: {
    success: "success",
    error: "error",
    streakMilestone: "streakMilestone",
  },
} as const;
