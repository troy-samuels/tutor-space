/**
 * Font loading for TutorLingua videos
 * Uses @remotion/google-fonts for consistent font loading
 */

import { loadFont as loadMansalva } from "@remotion/google-fonts/Mansalva";

// Load Mansalva for headings (handwritten/playful style for hooks)
// Mansalva only has regular (400) weight
const { fontFamily: mansalvaFamily } = loadMansalva();

// Body font uses Inter (system default)
const bodyFamily = "Inter, system-ui, sans-serif";

export const fonts = {
  heading: mansalvaFamily,
  body: bodyFamily,
};

export { mansalvaFamily, bodyFamily };
