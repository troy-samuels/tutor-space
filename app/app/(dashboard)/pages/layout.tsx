import type { CSSProperties } from "react";

const OFFLINE_FONT_VARS: CSSProperties = {
  "--font-inter": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "--font-plus-jakarta": "'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "--font-dm-serif-display": "'DM Serif Display', Georgia, Cambria, 'Times New Roman', serif",
  "--font-dm-sans": "'DM Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "--font-source-sans": "'Source Sans 3', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "--font-space-grotesk": "'Space Grotesk', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "--font-merriweather": "Merriweather, Georgia, Cambria, 'Times New Roman', serif",
} as CSSProperties;

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep CSS variable contracts stable without build-time Google font fetches.
  return <div style={OFFLINE_FONT_VARS}>{children}</div>;
}
