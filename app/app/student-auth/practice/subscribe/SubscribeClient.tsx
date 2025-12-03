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
} from "lucide-react";

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
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited AI conversation practice",
    "Real-time grammar corrections",
    "Vocabulary tracking & feedback",
    "Practice scenarios from your tutor",
    "Session summaries with tips",
  ];

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

      <div className="rounded-xl border border-border/50 bg-background p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-bold text-foreground">$6</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <ul className="mt-4 space-y-2.5">
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
            Subscribe for $6/month
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Cancel anytime. Your tutor receives 75% of your subscription.
      </p>
    </div>
  );
}
