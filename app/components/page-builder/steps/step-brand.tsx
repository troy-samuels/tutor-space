"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard, type FontOption } from "../wizard-context";
import { Button } from "@/components/ui/button";

// Color palettes - Research-backed two-tone combinations
const COLOR_PALETTES = [
  {
    id: "classic-ink",
    name: "Classic Ink",
    description: "Timeless black and white",
    background: "#FFFFFF",
    primary: "#1F2937",
  },
  {
    id: "ocean-trust",
    name: "Ocean Trust",
    description: "Professional and trustworthy",
    background: "#F1F5F9",
    primary: "#1E40AF",
  },
  {
    id: "warm-terracotta",
    name: "Warm Terracotta",
    description: "Inviting and approachable",
    background: "#FAF7F5",
    primary: "#C2410C",
  },
  {
    id: "midnight-gold",
    name: "Midnight Gold",
    description: "Bold dark elegance",
    background: "#0F172A",
    primary: "#F59E0B",
  },
  {
    id: "lavender-luxe",
    name: "Lavender Luxe",
    description: "Creative and sophisticated",
    background: "#FAF5FF",
    primary: "#7C3AED",
  },
  {
    id: "custom",
    name: "Custom",
    description: "Pick your own colors",
    background: null,
    primary: null,
  },
] as const;

// Font options - Modern Google Fonts for 2024-2025
const FONT_OPTIONS: Array<{ value: FontOption; label: string; preview: string }> = [
  { value: "system", label: "Inter", preview: "Aa" },
  { value: "rounded", label: "Manrope", preview: "Aa" },
  { value: "tech", label: "Poppins", preview: "Aa" },
  { value: "serif", label: "Lato", preview: "Aa" },
  { value: "luxury", label: "DM Sans", preview: "Aa" },
];

const FONT_STACKS: Record<FontOption, string> = {
  system: '"Inter", "Segoe UI", system-ui, sans-serif',
  rounded: '"Manrope", "Segoe UI", system-ui, sans-serif',
  tech: '"Poppins", "Segoe UI", system-ui, sans-serif',
  serif: '"Lato", "Segoe UI", system-ui, sans-serif',
  luxury: '"DM Sans", "Segoe UI", system-ui, sans-serif',
};

export function StepBrand() {
  const { state, updateTheme, nextStep } = usePageBuilderWizard();
  const { theme } = state;

  const selectedPalette =
    COLOR_PALETTES.find(
      (p) => p.background === theme.background && p.primary === theme.primary
    )?.id || "custom";

  const handlePaletteSelect = (palette: (typeof COLOR_PALETTES)[number]) => {
    if (palette.id === "custom") {
      // Keep current colors, just mark as custom
      return;
    }
    if (palette.background && palette.primary) {
      updateTheme({
        background: palette.background,
        primary: palette.primary,
      });
    }
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="space-y-8">
      {/* Color Palette Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Color Palette</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a color scheme for your page
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_PALETTES.map((palette) => {
            const isSelected = selectedPalette === palette.id;
            const isCustom = palette.id === "custom";

            return (
              <button
                key={palette.id}
                type="button"
                onClick={() => handlePaletteSelect(palette)}
                className={cn(
                  "relative rounded-2xl border p-4 text-left transition",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border/60 bg-background/50 hover:border-primary/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{palette.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {palette.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                  )}
                </div>

                {/* Color swatches */}
                <div className="mt-3 flex items-center gap-1">
                  {isCustom ? (
                    <>
                      <span
                        className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.background }}
                      />
                      <span
                        className="-ml-1 h-6 w-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.primary }}
                      />
                    </>
                  ) : (
                    <>
                      <span
                        className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: palette.background || "#fff" }}
                      />
                      <span
                        className="-ml-1 h-6 w-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: palette.primary || "#000" }}
                      />
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom color pickers */}
        {selectedPalette === "custom" && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 rounded-2xl border border-border/60 bg-muted/30 p-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Background Color
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={theme.background}
                  onChange={(e) => updateTheme({ background: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                />
                <input
                  type="text"
                  value={theme.background}
                  onChange={(e) => updateTheme({ background: e.target.value })}
                  className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Accent Color
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={theme.primary}
                  onChange={(e) => updateTheme({ primary: e.target.value })}
                  className="h-10 w-10 cursor-pointer rounded-lg border border-border"
                />
                <input
                  type="text"
                  value={theme.primary}
                  onChange={(e) => updateTheme({ primary: e.target.value })}
                  className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                  placeholder="#2563eb"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Font Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Typography</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a font that matches your style
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FONT_OPTIONS.map((font) => {
            const isSelected = theme.font === font.value;

            return (
              <button
                key={font.value}
                type="button"
                onClick={() => updateTheme({ font: font.value })}
                className={cn(
                  "relative rounded-2xl border p-4 text-left transition",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border/60 bg-background/50 hover:border-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{font.label}</p>
                    <p
                      className="mt-2 text-2xl font-medium"
                      style={{ fontFamily: FONT_STACKS[font.value] }}
                    >
                      {font.preview}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} size="lg" className="rounded-full px-8">
          Continue
        </Button>
      </div>
    </div>
  );
}
