/**
 * ProfileImporter — Full import flow orchestrator
 *
 * Three-step flow:
 * 1. URL Input  → paste platform URL
 * 2. Progress   → scraping + mapping with live status
 * 3. Review     → edit + confirm → apply to page builder
 *
 * Drop this component anywhere: onboarding, page builder, settings.
 */

"use client";

import { useState, useCallback } from "react";
import { ImportUrlInput } from "./ImportUrlInput";
import { ImportProgress } from "./ImportProgress";
import { ImportReview } from "./ImportReview";
import type { Platform, MappedPageBuilderData } from "@/lib/import/types";

type Step = "input" | "progress" | "review";

type ImportState = {
  step: Step;
  importId: string | null;
  platform: Platform | null;
  mappedData: MappedPageBuilderData | null;
};

type ProfileImporterProps = {
  /** Called when import is fully applied and user should be redirected */
  onComplete?: () => void;
  /** Compact mode for embedding in smaller spaces (e.g. page builder header) */
  compact?: boolean;
  className?: string;
};

export function ProfileImporter({
  onComplete,
  compact = false,
  className,
}: ProfileImporterProps) {
  const [state, setState] = useState<ImportState>({
    step: "input",
    importId: null,
    platform: null,
    mappedData: null,
  });

  // Step 1 → Step 2: URL submitted, scrape started
  const handleImportStart = useCallback(
    (importId: string, platform: Platform) => {
      setState({
        step: "progress",
        importId,
        platform,
        mappedData: null,
      });
    },
    []
  );

  // Step 2 → Step 3: Scrape complete, data mapped
  const handleScrapeComplete = useCallback(
    (mappedData: MappedPageBuilderData, importId: string) => {
      setState((prev) => ({
        ...prev,
        step: "review",
        importId,
        mappedData,
      }));
    },
    []
  );

  // Error handler — stay on progress screen (error is shown inline)
  const handleError = useCallback(() => {
    // Error is displayed inside ImportProgress
  }, []);

  // Retry — go back to input
  const handleRetry = useCallback(() => {
    setState({
      step: "input",
      importId: null,
      platform: null,
      mappedData: null,
    });
  }, []);

  // Back from review → input
  const handleBack = useCallback(() => {
    setState({
      step: "input",
      importId: null,
      platform: null,
      mappedData: null,
    });
  }, []);

  return (
    <div className={className}>
      {state.step === "input" && (
        <ImportUrlInput
          onImportStart={handleImportStart}
          compact={compact}
        />
      )}

      {state.step === "progress" && state.importId && state.platform && (
        <ImportProgress
          importId={state.importId}
          platform={state.platform}
          onComplete={handleScrapeComplete}
          onError={handleError}
          onRetry={handleRetry}
        />
      )}

      {state.step === "review" &&
        state.importId &&
        state.platform &&
        state.mappedData && (
          <ImportReview
            importId={state.importId}
            platform={state.platform}
            mappedData={state.mappedData}
            onBack={handleBack}
          />
        )}
    </div>
  );
}
