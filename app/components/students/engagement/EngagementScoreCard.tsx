"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  MessageSquare,
  BookOpen,
  Mic,
  RefreshCw,
  Edit2,
  Loader2,
  X,
} from "lucide-react";
import { EngagementScoreMeter } from "./EngagementScoreMeter";
import { RiskStatusBadge } from "./RiskStatusBadge";
import { refreshEngagementScore, overrideRiskStatus, clearRiskStatusOverride } from "@/lib/actions/student-engagement";
import type { EngagementScore, RiskStatus } from "@/lib/actions/types";

type EngagementScoreCardProps = {
  studentId: string;
  score: EngagementScore | null;
  onUpdate?: (score: EngagementScore) => void;
};

export function EngagementScoreCard({
  studentId,
  score,
  onUpdate,
}: EngagementScoreCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<RiskStatus>("healthy");
  const [overrideReason, setOverrideReason] = useState("");

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await refreshEngagementScore(studentId);
      if (result && onUpdate) {
        onUpdate(result);
      }
    });
  };

  const handleOverride = () => {
    if (!overrideReason.trim()) return;

    startTransition(async () => {
      const result = await overrideRiskStatus({
        studentId,
        riskStatus: overrideStatus,
        reason: overrideReason,
      });
      if (result.success) {
        setIsOverrideOpen(false);
        setOverrideReason("");
        // Refresh to get updated data
        const updated = await refreshEngagementScore(studentId);
        if (updated && onUpdate) {
          onUpdate(updated);
        }
      }
    });
  };

  const handleClearOverride = () => {
    startTransition(async () => {
      const result = await clearRiskStatusOverride(studentId);
      if (result.success) {
        const updated = await refreshEngagementScore(studentId);
        if (updated && onUpdate) {
          onUpdate(updated);
        }
      }
    });
  };

  const currentScore = score?.score ?? 100;
  const effectiveRiskStatus = (score?.risk_status_override ??
    score?.risk_status ??
    "healthy") as RiskStatus;
  const hasOverride = !!score?.risk_status_override;

  const componentScores = [
    {
      label: "Lesson Frequency",
      value: score?.lesson_frequency_score ?? 100,
      icon: Calendar,
      detail: score?.days_since_last_lesson
        ? `${score.days_since_last_lesson} days ago`
        : "No lessons yet",
    },
    {
      label: "Response Rate",
      value: score?.response_rate_score ?? 100,
      icon: MessageSquare,
      detail: score?.days_since_last_message
        ? `${score.days_since_last_message} days ago`
        : "No messages yet",
    },
    {
      label: "Homework",
      value: score?.homework_completion_score ?? 100,
      icon: BookOpen,
      detail: "Completion rate",
    },
    {
      label: "Practice",
      value: score?.practice_engagement_score ?? 100,
      icon: Mic,
      detail: "Last 30 days",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Engagement Score</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main score display */}
        <div className="flex items-center gap-4">
          <EngagementScoreMeter score={currentScore} size="lg" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <RiskStatusBadge status={effectiveRiskStatus} />
              {hasOverride && (
                <span className="text-xs text-muted-foreground">(Override)</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setIsOverrideOpen(true)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Override
              </Button>
              <Dialog open={isOverrideOpen} onOpenChange={setIsOverrideOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Override Risk Status</DialogTitle>
                    <DialogDescription>
                      Manually set the risk status for this student. The computed
                      score will remain unchanged.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Risk Status</Label>
                      <Select
                        value={overrideStatus}
                        onValueChange={(v) => setOverrideStatus(v as RiskStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="at_risk">At Risk</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="churned">Churned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        placeholder="Why are you overriding the status?"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsOverrideOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleOverride}
                      disabled={isPending || !overrideReason.trim()}
                    >
                      {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Apply Override
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {hasOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleClearOverride}
                  disabled={isPending}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Component breakdown */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Score Breakdown
          </p>
          {componentScores.map((component) => {
            const Icon = component.icon;
            return (
              <div key={component.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{component.label}</span>
                  </div>
                  <span className="font-medium">{component.value}%</span>
                </div>
                <Progress value={component.value} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{component.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Override info */}
        {hasOverride && score?.override_reason && (
          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
            <p className="text-xs font-medium">Override Reason</p>
            <p className="text-sm text-muted-foreground">{score.override_reason}</p>
            {score.override_at && (
              <p className="text-xs text-muted-foreground">
                Set on {new Date(score.override_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
