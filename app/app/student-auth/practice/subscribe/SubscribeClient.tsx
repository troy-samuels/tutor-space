"use client";

import { useState } from "react";
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
  Zap,
} from "lucide-react";
import {
  AI_PRACTICE_BASE_PRICE_CENTS,
  AI_PRACTICE_BLOCK_PRICE_CENTS,
  BASE_AUDIO_MINUTES,
  BASE_TEXT_TURNS,
  BLOCK_AUDIO_MINUTES,
  BLOCK_TEXT_TURNS,
} from "@/lib/practice/constants";

interface SubscribeClientProps {
  studentId: string;
  tutorId: string;
  tutorName: string;
}

export function SubscribeClient({ studentId, tutorId, tutorName }: SubscribeClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/practice/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, tutorId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start subscription");
        return;
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Real-time grammar corrections",
    "Vocabulary tracking & feedback",
    "Practice scenarios from your tutor",
    "Session summaries with tips",
  ];

  const basePriceDollars = (AI_PRACTICE_BASE_PRICE_CENTS / 100).toFixed(0);
  const blockPriceDollars = (AI_PRACTICE_BLOCK_PRICE_CENTS / 100).toFixed(0);

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <button
        onClick={() => router.push("/student-auth/progress")}
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
          AI Practice Companion
        </h1>
        <p className="mt-2 text-muted-foreground">
          Practice conversations with AI between your lessons with {tutorName}
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-background p-5 space-y-5">
        {/* Base tier */}
        <div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-bold text-foreground">
                ${basePriceDollars}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Base tier includes:</p>
        </div>

        {/* Included allowances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
            <Mic className="h-5 w-5 mx-auto text-primary" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{BASE_AUDIO_MINUTES}</p>
            <p className="text-xs text-muted-foreground">audio minutes</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-center">
            <MessageSquare className="h-5 w-5 mx-auto text-primary" />
            <p className="mt-1.5 text-lg font-bold text-foreground">{BASE_TEXT_TURNS}</p>
            <p className="text-xs text-muted-foreground">text turns</p>
          </div>
        </div>

        {/* Add-on blocks */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Need more?</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Extra blocks auto-add at ${blockPriceDollars} each: +{BLOCK_AUDIO_MINUTES} audio min + {BLOCK_TEXT_TURNS} text turns.
            Only charged when you exceed your allowance.
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
        onClick={handleSubscribe}
        disabled={isLoading}
        className="w-full py-6 text-base"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <MessageSquare className="h-5 w-5 mr-2" />
            Subscribe for ${basePriceDollars}/month
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Cancel anytime. Base price is ${basePriceDollars}/mo. Add-on blocks billed at period end.
      </p>
    </div>
  );
}
