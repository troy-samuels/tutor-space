"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard, ARCHETYPES, type ArchetypeId } from "../wizard-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export function StepBrand() {
  const { state, updateTheme } = usePageBuilderWizard();
  const { theme } = state;
  const [showCustomPickers, setShowCustomPickers] = useState(false);

  const selectedArchetype =
    ARCHETYPES.find(
      (a) => a.background === theme.background && a.primary === theme.primary
    )?.id || null;

  const isCustomSelected = selectedArchetype === null || showCustomPickers;

  const handleArchetypeSelect = (archetype: (typeof ARCHETYPES)[number]) => {
    setShowCustomPickers(false);
    updateTheme({
      archetypeId: archetype.id as ArchetypeId,
      background: archetype.background,
      cardBg: archetype.cardBg,
      primary: archetype.primary,
      textPrimary: archetype.textPrimary,
      textSecondary: archetype.textSecondary,
      font: archetype.font,
      headingFont: archetype.headingFont,
      borderRadius: archetype.borderRadius,
    });
  };

  const handleCustomClick = () => {
    setShowCustomPickers(true);
  };

  return (
    <div className="space-y-6">
      {/* Color Palette Section */}
      <section className="py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-6">
          Teaching Style
        </h3>

        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-center gap-5 py-4">
            {ARCHETYPES.map((archetype) => {
              const isSelected = selectedArchetype === archetype.id && !showCustomPickers;

              return (
                <Tooltip key={archetype.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleArchetypeSelect(archetype)}
                      className={cn(
                        "relative h-10 w-10 rounded-full transition-all duration-200",
                        "hover:scale-110 hover:shadow-lg",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        isSelected && "ring-2 ring-primary ring-offset-2 scale-110 shadow-lg"
                      )}
                      style={{ backgroundColor: archetype.background }}
                    >
                      {/* Inner accent color circle */}
                      <span
                        className="absolute inset-2 rounded-full"
                        style={{ backgroundColor: archetype.primary }}
                      />
                      {/* Selected checkmark */}
                      {isSelected && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {archetype.name}
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Custom color dot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleCustomClick}
                  className={cn(
                    "relative h-10 w-10 rounded-full transition-all duration-200",
                    "border-2 border-dashed border-border/50",
                    "hover:border-primary/60 hover:scale-110",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "flex items-center justify-center",
                    isCustomSelected && "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                  )}
                  style={
                    isCustomSelected
                      ? { backgroundColor: theme.background }
                      : undefined
                  }
                >
                  {isCustomSelected ? (
                    <>
                      <span
                        className="absolute inset-2 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
                    </>
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Custom colors
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Custom color pickers - appears when custom is selected */}
        {isCustomSelected && (
          <div className="mt-4 flex items-center justify-center gap-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.background}
                onChange={(e) => updateTheme({ background: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-full border-0 p-0 appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border/20"
              />
              <span className="text-sm text-muted-foreground">Background</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={theme.primary}
                onChange={(e) => updateTheme({ primary: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded-full border-0 p-0 appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-2 [&::-webkit-color-swatch]:border-border/20"
              />
              <span className="text-sm text-muted-foreground">Accent</span>
            </div>
          </div>
        )}
      </section>

      {/* Typography Info - fonts are bundled with archetypes */}
      <section className="py-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
          Typography
        </h3>
        <p className="text-xs text-muted-foreground text-center">
          Premium font pairing included with your selected style
        </p>
      </section>

    </div>
  );
}
