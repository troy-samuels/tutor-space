// Skill level to numeric score
export const LEVEL_SCORES: Record<string, number> = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
  upper_intermediate: 4,
  advanced: 5,
  proficient: 6,
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner (A1)",
  elementary: "Elementary (A2)",
  intermediate: "Intermediate (B1)",
  upper_intermediate: "Upper Intermediate (B2)",
  advanced: "Advanced (C1)",
  proficient: "Proficient (C2)",
};

export const SKILL_LABELS: Record<string, string> = {
  speaking: "Speaking",
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  pronunciation: "Pronunciation",
  overall: "Overall",
};
