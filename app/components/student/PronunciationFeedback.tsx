"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  Target,
  Zap,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PronunciationAssessment } from "./AudioInputButton";

interface PronunciationFeedbackProps {
  assessment: PronunciationAssessment;
  className?: string;
  compact?: boolean;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
};

const getScoreBackground = (score: number) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Work";
  return "Practice More";
};

const getScoreIcon = (score: number) => {
  if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (score >= 60) return <AlertTriangle className="h-4 w-4 text-amber-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
};

export function PronunciationFeedback({
  assessment,
  className,
  compact = false,
}: PronunciationFeedbackProps) {
  const { scores, word_scores, problem_phonemes, transcript, mock } = assessment;

  // Calculate overall score
  const overallScore = Math.round(
    (scores.accuracy + scores.fluency + scores.pronunciation + scores.completeness) / 4
  );

  if (mock) {
    return (
      <Card className={cn("border-amber-200 bg-amber-50/50", className)}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Mic className="h-4 w-4" />
            <span>
              Audio recorded but pronunciation scoring not configured.
              Transcript: &ldquo;{transcript || "(no transcript)"}&rdquo;
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        <div className="flex items-center gap-1.5">
          {getScoreIcon(overallScore)}
          <span className={cn("font-semibold", getScoreColor(overallScore))}>
            {overallScore}%
          </span>
        </div>
        <span className="text-muted-foreground">{getScoreLabel(overallScore)}</span>
        {problem_phonemes && problem_phonemes.length > 0 && (
          <Badge variant="outline" className="text-xs text-amber-700 border-amber-300">
            {problem_phonemes.length} word{problem_phonemes.length > 1 ? "s" : ""} to practice
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Header with overall score */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Pronunciation Assessment</span>
          </div>
          <div className="flex items-center gap-2">
            {getScoreIcon(overallScore)}
            <span className={cn("text-lg font-bold", getScoreColor(overallScore))}>
              {overallScore}%
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                overallScore >= 80
                  ? "border-emerald-300 text-emerald-700"
                  : overallScore >= 60
                  ? "border-amber-300 text-amber-700"
                  : "border-red-300 text-red-700"
              )}
            >
              {getScoreLabel(overallScore)}
            </Badge>
          </div>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="border-b px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">What we heard:</p>
            <p className="text-sm italic">&ldquo;{transcript}&rdquo;</p>
          </div>
        )}

        {/* Score breakdown */}
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          <ScoreItem
            icon={<Target className="h-4 w-4" />}
            label="Accuracy"
            score={scores.accuracy}
          />
          <ScoreItem
            icon={<Zap className="h-4 w-4" />}
            label="Fluency"
            score={scores.fluency}
          />
          <ScoreItem
            icon={<Volume2 className="h-4 w-4" />}
            label="Pronunciation"
            score={scores.pronunciation}
          />
          <ScoreItem
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Completeness"
            score={scores.completeness}
          />
        </div>

        {/* Word-level feedback */}
        {word_scores && word_scores.length > 0 && (
          <div className="border-t px-4 py-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Word-by-word analysis
            </p>
            <div className="flex flex-wrap gap-1.5">
              {word_scores.map((ws, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className={cn(
                    "text-xs",
                    ws.accuracy >= 80
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : ws.accuracy >= 60
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  )}
                >
                  {ws.word}
                  <span className="ml-1 opacity-70">{Math.round(ws.accuracy)}%</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Problem areas */}
        {problem_phonemes && problem_phonemes.length > 0 && (
          <div className="border-t bg-amber-50/50 px-4 py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5" />
              Words to practice
            </p>
            <div className="flex flex-wrap gap-1.5">
              {problem_phonemes.map((word, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="border-amber-300 bg-amber-100 text-xs text-amber-800"
                >
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreItem({
  icon,
  label,
  score,
}: {
  icon: React.ReactNode;
  label: string;
  score: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-center gap-2">
        <Progress
          value={score}
          className="h-1.5 flex-1"
          indicatorClassName={getScoreBackground(score)}
        />
        <span
          className={cn("text-sm font-semibold tabular-nums", getScoreColor(score))}
        >
          {Math.round(score)}
        </span>
      </div>
    </div>
  );
}
