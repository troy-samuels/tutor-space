/**
 * Design tokens for TutorLingua video branding
 * Brand colors from globals.css
 */

export const brandColors = {
  primary: "#D36135",           // Burnt Orange - Primary brand color, CTAs
  secondary: "#A24936",         // Deep Rust - Secondary accent
  accent: "#3E5641",            // Forest Green - Accent highlights
  background: "#2D2A26",        // Dark Brown - Video background
  backgroundLight: "#FDF8F5",   // Warm Cream - Light backgrounds
  backgroundGradientStart: "#3D3832", // Warm dark brown (lighter)
  backgroundGradientEnd: "#2D2A26",   // Dark Brown
  text: "#FDF8F5",              // Warm Cream - Light text on dark bg
  textDark: "#2D2A26",          // Dark Brown - Dark text
  textMuted: "#A39E98",         // Muted text (lighter for dark bg)
  textAccent: "#D36135",        // Burnt Orange accent text
  success: "#3E5641",           // Forest Green
  bulletIcon: "#D36135",        // Burnt Orange
};

export const typography = {
  fontFamily: "Manrope, system-ui, sans-serif",
  headingFont: "Mansalva, cursive",  // Google Font for hooks
  hookSize: 80,        // +16px for better readability
  transitionSize: 40,
  bulletSize: 56,      // +12px for better readability
  bulletIconSize: 48,
  ctaSize: 48,         // +12px for better visibility
  handleSize: 36,      // +8px for better visibility
  logoSize: 200,       // NEW: was hardcoded 120px
  lineHeight: 1.3,
  letterSpacing: "-0.02em",
};

export const spacing = {
  screenPadding: 60,
  bulletGap: 24,
  iconTextGap: 20,
  verticalCenter: 960, // 1920 / 2
};

export const animations = {
  fadeInDuration: 15, // frames (0.5s at 30fps)
  slideDistance: 80,
  typewriterSpeed: 2, // characters per frame
  springConfig: {
    damping: 200,
    mass: 0.5,
    stiffness: 200,
  },
};
