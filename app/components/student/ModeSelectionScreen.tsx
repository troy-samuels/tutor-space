"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Mic, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PracticeMode } from "./AIPracticeChat";

export type { PracticeMode };

interface ModeSelectionScreenProps {
  assignmentTitle: string;
  percentTextUsed: number;
  percentAudioUsed: number;
  textExhausted: boolean;
  audioExhausted: boolean;
  onSelectMode: (mode: PracticeMode) => void;
  isLoading?: boolean;
}

export function ModeSelectionScreen({
  assignmentTitle,
  percentTextUsed,
  percentAudioUsed,
  textExhausted,
  audioExhausted,
  onSelectMode,
  isLoading = false,
}: ModeSelectionScreenProps) {
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);

  const handleSelect = (mode: PracticeMode) => {
    if (isLoading) return;
    if (mode === "text" && textExhausted) return;
    if (mode === "audio" && audioExhausted) return;

    setSelectedMode(mode);
    onSelectMode(mode);
  };

  // Calculate remaining percentage (inverted for depletion bar)
  const textRemaining = Math.max(0, 100 - percentTextUsed);
  const audioRemaining = Math.max(0, 100 - percentAudioUsed);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {assignmentTitle}
        </h2>
        <p className="text-muted-foreground">
          How do you want to practice?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        {/* Text Mode Card */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            selectedMode === "text" && "border-primary ring-2 ring-primary/20",
            textExhausted && "opacity-50 cursor-not-allowed hover:border-border",
            isLoading && selectedMode === "text" && "border-primary"
          )}
          onClick={() => handleSelect("text")}
        >
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              {isLoading && selectedMode === "text" ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <MessageSquare className="h-10 w-10 text-primary" />
              )}
            </div>
            <h3 className="font-medium text-foreground mb-1">Text</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Type responses
            </p>

            {/* Depletion bar - shows remaining */}
            <Progress
              value={textRemaining}
              className="h-2"
              indicatorClassName={cn(
                textRemaining > 30 ? "bg-emerald-500" :
                textRemaining > 10 ? "bg-amber-500" :
                "bg-red-500"
              )}
            />

            {textExhausted && (
              <p className="text-xs text-red-500 mt-2">Limit reached</p>
            )}
          </CardContent>
        </Card>

        {/* Audio Mode Card */}
        <Card
          className={cn(
            "cursor-pointer transition-all hover:border-primary/50",
            selectedMode === "audio" && "border-primary ring-2 ring-primary/20",
            audioExhausted && "opacity-50 cursor-not-allowed hover:border-border",
            isLoading && selectedMode === "audio" && "border-primary"
          )}
          onClick={() => handleSelect("audio")}
        >
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              {isLoading && selectedMode === "audio" ? (
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              ) : (
                <Mic className="h-10 w-10 text-primary" />
              )}
            </div>
            <h3 className="font-medium text-foreground mb-1">Audio</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Speak responses
            </p>

            {/* Depletion bar - shows remaining */}
            <Progress
              value={audioRemaining}
              className="h-2"
              indicatorClassName={cn(
                audioRemaining > 30 ? "bg-emerald-500" :
                audioRemaining > 10 ? "bg-amber-500" :
                "bg-red-500"
              )}
            />

            {audioExhausted && (
              <p className="text-xs text-red-500 mt-2">Limit reached</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
