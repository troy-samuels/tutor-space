"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Bot,
  MessageSquare,
  Sparkles,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Mic,
  Gift,
} from "lucide-react";
import {
  FREE_AUDIO_MINUTES,
  FREE_TEXT_TURNS,
} from "@/lib/practice/constants";

interface SubscribeClientProps {
  studentId: string;
  tutorId: string;
  tutorName: string;
}

interface SubscriptionStatus {
  hasAccess: boolean;
  isFreeUser: boolean;
  hasBlockSubscription: boolean;
  hasLegacySubscription?: boolean;
}

export function SubscribeClient({ studentId, tutorId, tutorName }: SubscribeClientProps) {
  const router = useRouter();
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Fetch current subscription status
  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch("/api/practice/subscribe");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch {
        // Ignore errors, treat as no subscription
      } finally {
        setIsLoadingStatus(false);
      }
    }
    fetchStatus();
  }, []);

  // Enable free tier
  const handleEnableFree = async () => {
    setIsEnabling(true);
    setError(null);

    try {
      const response = await fetch("/api/practice/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "TUTOR_NOT_STUDIO") {
          setError(`Your tutor (${tutorName}) needs a Studio subscription to enable AI Practice. Ask them to upgrade!`);
        } else {
          setError(data.error || "Failed to enable free tier");
        }
        return;
      }

      // Success - redirect to practice
      router.push("/student/progress");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsEnabling(false);
    }
  };

  const features = [
    "Real-time grammar corrections",
    "Vocabulary tracking & feedback",
    "Chat topics from your tutor",
    "Session summaries with tips",
  ];

  // Show loading state
  if (isLoadingStatus) {
    return (
      <div className="mx-auto max-w-lg flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already has access - show usage info
  if (status?.hasAccess || status?.isFreeUser) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
        <button
          onClick={() => router.push("/student/progress")}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to progress
        </button>

        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            AI Practice Active
          </h1>
          <p className="mt-2 text-muted-foreground">
            You have access to conversation practice with {tutorName}
          </p>
        </div>

        {/* Current allowance info */}
        <div className="rounded-xl border border-border/50 bg-background p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">
              Monthly allowance
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
              <Mic className="h-5 w-5 mx-auto text-primary" />
              <p className="mt-1.5 text-lg font-bold text-foreground">{FREE_AUDIO_MINUTES}</p>
              <p className="text-xs text-muted-foreground">audio minutes/mo</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
              <MessageSquare className="h-5 w-5 mx-auto text-primary" />
              <p className="mt-1.5 text-lg font-bold text-foreground">{FREE_TEXT_TURNS}</p>
              <p className="text-xs text-muted-foreground">text turns/mo</p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              If you use up your allowance, you&apos;ll see 0 balance remaining. Resets next month.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          onClick={() => router.push("/student/progress")}
          className="w-full"
          variant="outline"
        >
          Go to Practice
        </Button>
      </div>
    );
  }

  // No access yet - show free tier offer
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <button
        onClick={() => router.push("/student/progress")}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to progress
      </button>

      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Conversation Practice
        </h1>
        <p className="mt-2 text-muted-foreground">
          Extra practice between your lessons with {tutorName}
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-background p-5 space-y-5">
        {/* Free tier */}
        <div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold text-foreground">Free</span>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
              No credit card required
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Start practicing for free every month:
          </p>
        </div>

        {/* Included allowances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
            <Mic className="h-5 w-5 mx-auto text-primary" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{FREE_AUDIO_MINUTES}</p>
            <p className="text-xs text-muted-foreground">audio minutes</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
            <MessageSquare className="h-5 w-5 mx-auto text-primary" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{FREE_TEXT_TURNS}</p>
            <p className="text-xs text-muted-foreground">text turns</p>
          </div>
        </div>

        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">
            If you use up your allowance, you&apos;ll see 0 balance remaining. Resets next month.
          </p>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 pt-2 border-t border-border/50">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={handleEnableFree}
        disabled={isEnabling}
        className="w-full py-6 text-base"
        size="lg"
      >
        {isEnabling ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Enabling...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Start Practicing Free
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Free tier resets monthly. No credit card required to start.
      </p>
    </div>
  );
}
