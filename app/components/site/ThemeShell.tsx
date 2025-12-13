"use client";

import type { CSSProperties, ReactNode } from "react";
import { SITE_THEMES, type SiteThemeId } from "@/lib/themes";

type ThemeShellProps = {
  themeId: SiteThemeId;
  children: ReactNode;
};

export function ThemeShell({ themeId, children }: ThemeShellProps) {
  const theme = SITE_THEMES[themeId] ?? SITE_THEMES.immersion;

  const style = {
    "--font-heading": theme.fontHeading,
    "--font-body": theme.fontBody,
    "--bg-page": theme.bgPage,
    "--radius-card": theme.radiusCard,
    "--accent-color": theme.accentColor,
  } as CSSProperties;

  return (
    <div
      style={style}
      className="min-h-screen bg-[var(--bg-page)] font-[family-name:var(--font-body)] text-foreground"
    >
      {children}
    </div>
  );
}

export default ThemeShell;
