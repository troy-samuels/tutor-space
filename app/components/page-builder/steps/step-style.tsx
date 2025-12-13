"use client";

import { useState, type ReactNode } from "react";
import { Check, Plus, Briefcase, Coffee, GraduationCap, Sparkles, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard, ARCHETYPES, FONT_PAIRINGS, type FontOption, type ArchetypeId, type FontPairingId } from "../wizard-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ColorPicker } from "@/components/ui/color-picker";

// Premium Typography Pairings - 11 font options
// Font stacks map FontOption to CSS font-family values
export const FONT_STACKS: Record<FontOption, string> = {
  // Body fonts
  system: 'var(--font-inter), "Inter", system-ui, sans-serif',
  rounded: 'var(--font-manrope), "Manrope", system-ui, sans-serif',
  luxury: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  "source-sans": 'var(--font-source-sans), "Source Sans 3", system-ui, sans-serif',
  andika: 'var(--font-andika), "Andika", system-ui, sans-serif',
  // Heading fonts
  grotesk: 'var(--font-space-grotesk), "Space Grotesk", system-ui, sans-serif',
  serif: 'var(--font-playfair-display), "Playfair Display", Georgia, serif',
  "dm-serif": 'var(--font-dm-serif-display), "DM Serif Display", Georgia, serif',
  "plus-jakarta": 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
  "spline-sans": 'var(--font-spline-sans), "Spline Sans", system-ui, sans-serif',
  "amatic-sc": 'var(--font-amatic-sc), "Amatic SC", cursive, sans-serif',
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
  "spline-sans": "Spline Sans",
  "amatic-sc": "Amatic SC",
  andika: "Andika",
};

// Icons for each archetype
const ARCHETYPE_ICONS: Record<ArchetypeId, ReactNode> = {
  professional: <Briefcase className="h-4 w-4" />,
  immersion: <Coffee className="h-4 w-4" />,
  academic: <GraduationCap className="h-4 w-4" />,
  polyglot: <Sparkles className="h-4 w-4" />,
  artisan: <Palette className="h-4 w-4" />,
};

// Map archetype IDs to font pairing IDs (defaults)
const ARCHETYPE_TO_FONT_PAIRING: Record<ArchetypeId, FontPairingId> = {
  professional: "minimal",
  immersion: "literary",
  academic: "heritage",
  polyglot: "expressive",
  artisan: "creative",
};

function ArchetypePreviewCard({
  archetype,
  selected,
  onSelect,
  keepColorsActive,
}: {
  archetype: (typeof ARCHETYPES)[number];
  selected: boolean;
  onSelect: () => void;
  keepColorsActive: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col gap-2 rounded-xl border p-3 text-left transition-all hover:shadow-sm",
        selected
          ? "border-primary ring-2 ring-primary ring-offset-2"
          : "border-border/60 hover:border-primary/50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span style={{ color: selected ? undefined : archetype.primary }}>
            {ARCHETYPE_ICONS[archetype.id as ArchetypeId]}
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">{archetype.name}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {archetype.vibe}
            </p>
          </div>
        </div>
        {selected && (
          <span className="rounded-full bg-primary p-1 text-primary-foreground">
            <Check className="h-3 w-3" />
          </span>
        )}
      </div>

      <div
        className="overflow-hidden rounded-lg border"
        style={{
          backgroundColor: archetype.background,
          borderColor: archetype.border,
        }}
      >
        <div
          className="h-16 w-full"
          style={{
            background: `linear-gradient(135deg, ${archetype.primary} 0%, ${archetype.primary}33 100%)`,
          }}
        />
        <div className="space-y-3 p-3">
          <div className="space-y-1">
            <p
              className="text-sm font-semibold"
              style={{ color: archetype.textPrimary, fontFamily: FONT_STACKS[archetype.headingFont] }}
            >
              Your hero headline
            </p>
            <p
              className="text-[11px]"
              style={{ color: archetype.textSecondary, fontFamily: FONT_STACKS[archetype.font] }}
            >
              A short promise about your lessons and outcomes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            <span
              className="rounded-full px-3 py-1 font-semibold text-white shadow-sm"
              style={{ backgroundColor: archetype.primary }}
            >
              Book now
            </span>
            <span
              className="rounded-full px-2 py-1"
              style={{
                color: archetype.textSecondary,
                border: `1px solid ${archetype.border}`,
                backgroundColor: archetype.cardBg,
              }}
            >
              1:1 · 50 min
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className="rounded-lg border p-2"
              style={{
                borderColor: archetype.border,
                backgroundColor: archetype.cardBg,
              }}
            >
              <div
                className="h-2 w-12 rounded-full"
                style={{ backgroundColor: archetype.textPrimary, opacity: 0.2 }}
              />
              <div
                className="mt-1 h-2 w-10 rounded-full"
                style={{ backgroundColor: archetype.textSecondary, opacity: 0.3 }}
              />
            </div>
            <div
              className="rounded-lg border p-2"
              style={{
                borderColor: archetype.border,
                backgroundColor: archetype.cardBg,
              }}
            >
              <div
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: archetype.textPrimary, opacity: 0.2 }}
              />
              <div
                className="mt-1 h-2 w-14 rounded-full"
                style={{ backgroundColor: archetype.textSecondary, opacity: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-tight">{archetype.description}</p>

      {keepColorsActive && (
        <p className="text-[10px] font-semibold text-emerald-700">
          Colors locked – only typography/layout will change
        </p>
      )}
    </button>
  );
}

export function StepStyle() {
  const { state, updateTheme } = usePageBuilderWizard();
  const { theme } = state;
  const [showCustom, setShowCustom] = useState(false);
  const [keepColors, setKeepColors] = useState(false);

  const selectedArchetype = ARCHETYPES.find(
    (a) => a.id === theme.archetypeId
  )?.id || null;

  const isCustom = selectedArchetype === null || showCustom;

  // Handle archetype (color) selection - also sets default font pairing
  const handleArchetypeSelect = (archetype: (typeof ARCHETYPES)[number]) => {
    setShowCustom(false);
    const fontPairingId = ARCHETYPE_TO_FONT_PAIRING[archetype.id as ArchetypeId];
    const fontPairing = FONT_PAIRINGS.find((p) => p.id === fontPairingId);

    updateTheme({
      archetypeId: archetype.id as ArchetypeId,
      fontPairingId,
      background: keepColors ? theme.background : archetype.background,
      cardBg: keepColors ? theme.cardBg : archetype.cardBg,
      primary: keepColors ? theme.primary : archetype.primary,
      textPrimary: keepColors ? theme.textPrimary : archetype.textPrimary,
      textSecondary: keepColors ? theme.textSecondary : archetype.textSecondary,
      border: keepColors ? theme.border : archetype.border,
      font: fontPairing?.bodyFont || archetype.font,
      headingFont: fontPairing?.headingFont || archetype.headingFont,
      borderRadius: keepColors ? theme.borderRadius : archetype.borderRadius,
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

  const handleIndependentFontSelect = (bodyFont: FontOption, headingFont: FontOption) => {
    updateTheme({
      fontPairingId: null,
      font: bodyFont,
      headingFont,
    });
  };

  return (
    <div className="space-y-6">
      {/* Teaching Archetype Selection - Colors */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Color Palette</p>
            <p className="text-xs text-muted-foreground">
              Choose your site&apos;s color scheme and archetype
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input
              type="checkbox"
              checked={keepColors}
              onChange={(e) => setKeepColors(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            Keep my colors when switching
          </label>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Preview each archetype before applying it. If “Keep my colors” is on, your current palette stays.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {ARCHETYPES.map((archetype) => (
            <ArchetypePreviewCard
              key={archetype.id}
              archetype={archetype}
              selected={selectedArchetype === archetype.id && !showCustom}
              onSelect={() => handleArchetypeSelect(archetype)}
              keepColorsActive={keepColors}
            />
          ))}
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

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Heading font</p>
            <select
              value={theme.headingFont}
              onChange={(e) => handleIndependentFontSelect(theme.font, e.target.value as FontOption)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.keys(FONT_LABELS).map((font) => (
                <option key={font} value={font}>
                  {FONT_LABELS[font as FontOption]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Body font</p>
            <select
              value={theme.font}
              onChange={(e) => handleIndependentFontSelect(e.target.value as FontOption, theme.headingFont)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.keys(FONT_LABELS).map((font) => (
                <option key={font} value={font}>
                  {FONT_LABELS[font as FontOption]}
                </option>
              ))}
            </select>
          </div>
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            Pick separate heading/body fonts if you want to mix styles. Choosing a pairing above will override these picks.
          </p>
        </div>
      </div>
    </div>
  );
}
