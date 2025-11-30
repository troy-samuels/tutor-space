"use client";

import { Check, User, ImageIcon, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePageBuilderWizard } from "../wizard-context";
import { Button } from "@/components/ui/button";

type LayoutVariation = {
  id: "minimal" | "portrait" | "banner";
  name: string;
  description: string;
  icon: React.ReactNode;
};

const LAYOUT_VARIATIONS: LayoutVariation[] = [
  {
    id: "minimal",
    name: "Clean & Centered",
    description: "Avatar and text centered, professional look",
    icon: <User className="h-8 w-8" />,
  },
  {
    id: "portrait",
    name: "Photo Focus",
    description: "Your photo takes center stage",
    icon: <ImageIcon className="h-8 w-8" />,
  },
  {
    id: "banner",
    name: "Bold Banner",
    description: "Full-width colored hero section",
    icon: <Layers className="h-8 w-8" />,
  },
];

export function StepLayout() {
  const { state, updateLayout, nextStep, prevStep } = usePageBuilderWizard();
  const { layout, theme } = state;

  const handleLayoutSelect = (layoutId: LayoutVariation["id"]) => {
    updateLayout({ heroStyle: layoutId });
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Page Layout</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how your page header looks
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          {LAYOUT_VARIATIONS.map((variation) => {
            const isSelected = layout.heroStyle === variation.id;

            return (
              <button
                key={variation.id}
                type="button"
                onClick={() => handleLayoutSelect(variation.id)}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-4 text-center transition",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border/60 bg-background/50 hover:border-primary/50"
                )}
              >
                {/* Layout preview thumbnail */}
                <div
                  className="mx-auto flex h-24 w-full items-center justify-center rounded-lg border"
                  style={{
                    backgroundColor: theme.background,
                    borderColor: theme.primary + "30",
                  }}
                >
                  {variation.id === "minimal" && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="h-8 w-8 rounded-full"
                        style={{ backgroundColor: theme.primary + "20" }}
                      />
                      <div className="space-y-0.5">
                        <div
                          className="mx-auto h-1.5 w-12 rounded-full"
                          style={{ backgroundColor: theme.primary + "40" }}
                        />
                        <div
                          className="mx-auto h-1 w-9 rounded-full"
                          style={{ backgroundColor: theme.primary + "20" }}
                        />
                      </div>
                      <div
                        className="h-4 w-10 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                    </div>
                  )}

                  {variation.id === "portrait" && (
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: theme.primary + "20" }}
                      />
                      <div
                        className="h-8 w-14 rounded-md"
                        style={{ backgroundColor: theme.primary + "15" }}
                      />
                      <div className="space-y-0.5">
                        <div
                          className="mx-auto h-1 w-10 rounded-full"
                          style={{ backgroundColor: theme.primary + "40" }}
                        />
                        <div
                          className="mx-auto h-1 w-7 rounded-full"
                          style={{ backgroundColor: theme.primary + "20" }}
                        />
                      </div>
                    </div>
                  )}

                  {variation.id === "banner" && (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
                      {/* Name-first layout: text at top, avatar at bottom */}
                      <div className="space-y-0.5">
                        <div
                          className="mx-auto h-1.5 w-12 rounded-full"
                          style={{ backgroundColor: theme.primary + "40" }}
                        />
                        <div
                          className="mx-auto h-1 w-9 rounded-full"
                          style={{ backgroundColor: theme.primary + "20" }}
                        />
                      </div>
                      <div
                        className="h-4 w-10 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div
                        className="h-6 w-6 rounded-full"
                        style={{ backgroundColor: theme.primary + "20" }}
                      />
                    </div>
                  )}
                </div>

                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                )}

                {/* Label */}
                <div className="mt-auto pt-3">
                  <p className="text-sm font-semibold text-foreground">{variation.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-tight">
                    {variation.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button onClick={prevStep} variant="outline" size="lg" className="rounded-full px-6">
          Back
        </Button>
        <Button onClick={nextStep} size="lg" className="rounded-full px-8">
          Continue
        </Button>
      </div>
    </div>
  );
}
