export const colors = {
  neutral: {
    bg0: "#F7F3EE",
    bg1: "#EFE8DE",
    bg2: "#E2D8CA",
    ink0: "#1E2B36",
    ink1: "#3E4E5C",
    ink2: "#697B89",
  },
  semantic: {
    success: "#2E7D5A",
    warning: "#A0742B",
    error: "#A34C44",
    glowSuccess: "rgba(46, 125, 90, 0.34)",
    dimInactive: "rgba(105, 123, 137, 0.45)",
  },
  game: {
    byteChoice: {
      primary: "#24577A",
      secondary: "#D9A441",
    },
    pixelPairs: {
      primary: "#2F8B7A",
      secondary: "#D46A4E",
    },
    relaySprint: {
      primary: "#304B78",
      secondary: "#88B948",
    },
  },
} as const;

export type GameColorTheme = keyof typeof colors.game;
