import type { Difficulty } from "@/lib/games/data/connections/types";

/** Category colours — warm palette aligned with TutorLingua brand */
export const DIFFICULTY_COLOURS: Record<
  Difficulty,
  { bg: string; border: string; text: string; glow: string }
> = {
  yellow: {
    bg: "#E8D5A3",
    border: "#C4A843",
    text: "#2D2A26",
    glow: "rgba(212, 168, 67, 0.15)",
  },
  green: {
    bg: "#7BA882",
    border: "#3E5641",
    text: "#FFFFFF",
    glow: "rgba(62, 86, 65, 0.15)",
  },
  blue: {
    bg: "#93B8D7",
    border: "#5A8AB5",
    text: "#2D2A26",
    glow: "rgba(90, 138, 181, 0.15)",
  },
  purple: {
    bg: "#B89CD4",
    border: "#8B5CB5",
    text: "#FFFFFF",
    glow: "rgba(139, 92, 181, 0.15)",
  },
};
