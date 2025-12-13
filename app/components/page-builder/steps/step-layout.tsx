"use client";

import { ImageIcon } from "lucide-react";
import { usePageBuilderWizard } from "../wizard-context";

/**
 * StepLayout - Deprecated
 *
 * The Cultural Banner is now the only hero layout.
 * Layout selection has been moved to the Teaching Style step (StepStyle).
 * This component is kept for backwards compatibility but no longer used.
 */
export function StepLayout() {
  const { state } = usePageBuilderWizard();
  const { theme } = state;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Page Layout</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cultural Banner layout is automatically applied based on your teaching style
        </p>

        <div className="mt-6">
          <div
            className="relative flex flex-col rounded-2xl border border-primary bg-primary/5 p-4 text-center"
          >
            {/* Cultural Banner preview */}
            <div
              className="mx-auto flex h-24 w-full flex-col overflow-hidden rounded-lg border"
              style={{
                backgroundColor: theme.background,
                borderColor: theme.primary + "30",
              }}
            >
              {/* Banner section */}
              <div
                className="h-8 w-full"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}05)`,
                }}
              />
              {/* Content with avatar overlap */}
              <div className="flex flex-1 flex-col items-center justify-center gap-1">
                <div
                  className="-mt-3 h-6 w-6 rounded-full"
                  style={{
                    backgroundColor: theme.cardBg,
                    boxShadow: `0 0 0 2px ${theme.background}`,
                  }}
                />
                <div
                  className="h-1 w-10 rounded-full"
                  style={{ backgroundColor: theme.textPrimary + "40" }}
                />
                <div className="flex gap-1">
                  <div
                    className="h-0.5 w-3 rounded-full"
                    style={{ backgroundColor: theme.textSecondary + "30" }}
                  />
                  <div
                    className="h-0.5 w-3 rounded-full"
                    style={{ backgroundColor: theme.textSecondary + "30" }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-primary">
              <ImageIcon className="h-4 w-4" />
              <p className="text-sm font-semibold">Cultural Banner</p>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Banner image + avatar overlap for language tutors
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
