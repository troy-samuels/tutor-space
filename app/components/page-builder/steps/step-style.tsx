"use client";

import { useState } from "react";
import { Check, Plus, Briefcase, Coffee, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard, ARCHETYPES, FONT_PAIRINGS, type FontOption, type ArchetypeId, type FontPairingId } from "../wizard-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ColorPicker } from "@/components/ui/color-picker";

// Premium Typography Pairings - 8 font options
// Font stacks map FontOption to CSS font-family values
export const FONT_STACKS: Record<FontOption, string> = {
  // Body fonts
  system: 'var(--font-inter), "Inter", system-ui, sans-serif',
  rounded: 'var(--font-manrope), "Manrope", system-ui, sans-serif',
  luxury: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  "source-sans": 'var(--font-source-sans), "Source Sans 3", system-ui, sans-serif',
  // Heading fonts
  grotesk: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
  serif: 'var(--font-playfair-display), "Playfair Display", Georgia, serif',
  "dm-serif": 'var(--font-dm-serif-display), "DM Serif Display", Georgia, serif',
  "plus-jakarta": 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
};

// Human-readable font names for display
const FONT_LABELS: Record<FontOption, string> = {
  system: "Inter",
  rounded: "Manrope",
  luxury: "DM Sans",
  grotesk: "Space Grotesk",
  serif: "Playfair Display",
  "dm-serif": "DM Serif Display",
  "plus-jakarta": "Plus Jakarta Sans",
  "source-sans": "Source Sans 3",
};

// Icons for each archetype
const ARCHETYPE_ICONS: Record<ArchetypeId, React.ReactNode> = {
  professional: <Briefcase className="h-4 w-4" />,
  immersion: <Coffee className="h-4 w-4" />,
  academic: <GraduationCap className="h-4 w-4" />,
  polyglot: <Sparkles className="h-4 w-4" />,
};

// Map archetype IDs to font pairing IDs (defaults)
const ARCHETYPE_TO_FONT_PAIRING: Record<ArchetypeId, FontPairingId> = {
  professional: "minimal",
  immersion: "literary",
  academic: "heritage",
  polyglot: "expressive",
};

export function StepStyle() {
  const { state, updateTheme } = usePageBuilderWizard();
  const { theme } = state;
  const [showCustom, setShowCustom] = useState(false);

  const selectedArchetype = ARCHETYPES.find(
    (a) => a.id === theme.archetypeId
  )?.id || null;

  const isCustom = selectedArchetype === null || showCustom;

  // Handle archetype (color) selection - also sets default font pairing
  const handleArchetypeSelect = (archetype: (typeof ARCHETYPES)[number]) => {
    setShowCustom(false);
    const fontPairingId = ARCHETYPE_TO_FONT_PAIRING[archetype.id as ArchetypeId];
    const fontPairing = FONT_PAIRINGS.find(p => p.id === fontPairingId);

    updateTheme({
      archetypeId: archetype.id as ArchetypeId,
      fontPairingId: fontPairingId,
      background: archetype.background,
      cardBg: archetype.cardBg,
      primary: archetype.primary,
      textPrimary: archetype.textPrimary,
      textSecondary: archetype.textSecondary,
      border: archetype.border,
      font: fontPairing?.bodyFont || archetype.font,
      headingFont: fontPairing?.headingFont || archetype.headingFont,
      borderRadius: archetype.borderRadius,
    });
  };

  // Handle font pairing selection - independent from colors
  const handleFontPairingSelect = (pairing: (typeof FONT_PAIRINGS)[number]) => {
    updateTheme({
      fontPairingId: pairing.id as FontPairingId,
      font: pairing.bodyFont,
      headingFont: pairing.headingFont,
    });
  };

  return (
    <div className="space-y-6">
      {/* Teaching Archetype Selection - Colors */}
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Color Palette</p>
        <p className="text-xs text-muted-foreground mb-4">
          Choose your site&apos;s color scheme
        </p>

        <div className="grid grid-cols-2 gap-3">
          {ARCHETYPES.map((archetype) => {
            const isSelected = selectedArchetype === archetype.id && !showCustom;

            return (
              <button
                key={archetype.id}
                type="button"
                onClick={() => handleArchetypeSelect(archetype)}
                className={cn(
                  "relative flex flex-col rounded-xl border p-3 text-left transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border/50 hover:border-primary/50 hover:shadow-sm"
                )}
              >
                {/* Mini Soft-Premium preview */}
                <div
                  className="relative mb-3 h-20 w-full overflow-hidden"
                  style={{
                    borderRadius: `var(--radius-${archetype.borderRadius}, 0.75rem)`,
                    border: `1px solid ${archetype.border}`,
                  }}
                >
                  {/* Banner section - soft gradient */}
                  <div
                    className="h-8 w-full"
                    style={{
                      background: `linear-gradient(135deg, ${archetype.primary}15, ${archetype.primary}05)`,
                    }}
                  />

                  {/* Content section */}
                  <div
                    className="h-12 px-2 py-1 flex flex-col items-center justify-center gap-0.5"
                    style={{ backgroundColor: archetype.background }}
                  >
                    {/* Avatar overlap mock */}
                    <div
                      className="-mt-4 h-5 w-5 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: archetype.cardBg,
                        boxShadow: `0 0 0 2px ${archetype.background}, 0 2px 8px rgba(0,0,0,0.04)`,
                        border: `1px solid ${archetype.border}`,
                      }}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: archetype.primary + "30" }}
                      />
                    </div>
                    {/* Name mock */}
                    <div
                      className="h-1 w-10 rounded-full"
                      style={{ backgroundColor: archetype.textPrimary }}
                    />
                    {/* Language row mock */}
                    <div className="flex gap-0.5">
                      <div
                        className="h-0.5 w-3 rounded-full"
                        style={{ backgroundColor: archetype.textSecondary }}
                      />
                      <div
                        className="h-0.5 w-3 rounded-full"
                        style={{ backgroundColor: archetype.textSecondary }}
                      />
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                <div className="flex items-center gap-1.5 mb-1">
                  <span style={{ color: isSelected ? undefined : archetype.primary }}>
                    {ARCHETYPE_ICONS[archetype.id as ArchetypeId]}
                  </span>
                  <p className="text-xs font-semibold">{archetype.name}</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {archetype.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom option */}
        <div className="mt-3">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setShowCustom(true)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all text-xs",
                    "border-dashed",
                    isCustom
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/50"
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Custom colors</span>
                  {isCustom && <Check className="h-3 w-3 text-primary ml-auto" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Choose your own colors
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Custom color pickers */}
        {isCustom && (
          <div className="mt-3 p-3 rounded-lg border border-border/50 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={theme.background}
                  onChange={(color) => updateTheme({ background: color })}
                  label="Background"
                />
                <span className="text-xs text-muted-foreground">Background</span>
              </div>
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={theme.primary}
                  onChange={(color) => updateTheme({ primary: color })}
                  label="Accent"
                />
                <span className="text-xs text-muted-foreground">Accent</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* Font Pairing Selection - independent from colors */}
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Typography</p>
        <p className="text-xs text-muted-foreground mb-3">
          Choose your font pairing
        </p>

        <div className="grid grid-cols-2 gap-2">
          {FONT_PAIRINGS.map((pairing) => {
            const isSelected = theme.fontPairingId === pairing.id;
            return (
              <button
                key={pairing.id}
                type="button"
                onClick={() => handleFontPairingSelect(pairing)}
                className={cn(
                  "relative p-3 rounded-xl border text-left transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border/50 hover:border-primary/50 hover:shadow-sm"
                )}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <p className="text-xs font-semibold mb-1.5">{pairing.name}</p>
                <p
                  className="text-sm font-medium leading-tight"
                  style={{ fontFamily: FONT_STACKS[pairing.headingFont] }}
                >
                  {FONT_LABELS[pairing.headingFont]}
                </p>
                <p
                  className="text-[11px] text-muted-foreground mt-0.5"
                  style={{ fontFamily: FONT_STACKS[pairing.bodyFont] }}
                >
                  + {FONT_LABELS[pairing.bodyFont]}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
