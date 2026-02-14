"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Upload,
  Sparkles,
  Target,
  TrendingUp,
  Search,
  MessageSquare,
  DollarSign,
  Star,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SectionScore {
  score: number;
  maxScore: number;
  feedback: string;
}

interface Recommendation {
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
}

interface AnalysisResult {
  platform: string;
  tutorName: string;
  overallScore: number;
  sections: {
    headline: SectionScore;
    bio: SectionScore;
    differentiation: SectionScore;
    pricing: SectionScore;
    keywords: SectionScore;
    reviews: SectionScore;
  };
  topRecommendations: Recommendation[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Score ring component
// ---------------------------------------------------------------------------
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70
      ? "text-green-500 dark:text-green-400"
      : score >= 40
        ? "text-amber-500 dark:text-amber-400"
        : "text-red-500 dark:text-red-400";

  const strokeColor =
    score >= 70
      ? "stroke-green-500 dark:stroke-green-400"
      : score >= 40
        ? "stroke-amber-500 dark:stroke-amber-400"
        : "stroke-red-500 dark:stroke-red-400";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${strokeColor} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-4xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section bar component
// ---------------------------------------------------------------------------
const sectionMeta: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  headline: { label: "Headline", icon: <Target className="w-4 h-4" /> },
  bio: { label: "Bio Quality", icon: <MessageSquare className="w-4 h-4" /> },
  differentiation: {
    label: "Differentiation",
    icon: <Star className="w-4 h-4" />,
  },
  pricing: { label: "Pricing Strategy", icon: <DollarSign className="w-4 h-4" /> },
  keywords: {
    label: "Keywords & SEO",
    icon: <Search className="w-4 h-4" />,
  },
  reviews: {
    label: "Reviews Sentiment",
    icon: <TrendingUp className="w-4 h-4" />,
  },
};

function SectionBar({
  sectionKey,
  data,
}: {
  sectionKey: string;
  data: SectionScore;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = sectionMeta[sectionKey] ?? {
    label: sectionKey,
    icon: null,
  };
  const pct = (data.score / data.maxScore) * 100;

  const barColor =
    pct >= 70
      ? "bg-green-500 dark:bg-green-400"
      : pct >= 40
        ? "bg-amber-500 dark:bg-amber-400"
        : "bg-red-500 dark:bg-red-400";

  return (
    <div className="space-y-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">{meta.icon}</span>
          {meta.label}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {data.score}/{data.maxScore}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>
      <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {expanded && (
        <p className="text-sm text-muted-foreground leading-relaxed pt-2 pb-1 pl-6 border-l-2 border-primary/20">
          {data.feedback}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Impact badge
// ---------------------------------------------------------------------------
function ImpactBadge({ impact }: { impact: string }) {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[impact] ?? styles.medium}`}
    >
      {impact} impact
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading animation
// ---------------------------------------------------------------------------
const loadingSteps = [
  "Fetching your profile…",
  "Extracting content…",
  "Analysing headline & bio…",
  "Evaluating differentiation…",
  "Checking keywords & SEO…",
  "Generating recommendations…",
];

function LoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = Math.min(i + 1, loadingSteps.length - 1);
      setStep(i);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8">
      {/* Animated spinner */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700" />
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground animate-pulse">
          {loadingSteps[step]}
        </p>
        <p className="text-sm text-muted-foreground">
          This usually takes 10-15 seconds
        </p>
      </div>
      {/* Progress dots */}
      <div className="flex gap-2">
        {loadingSteps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i <= step
                ? "bg-primary scale-110"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function ProfileAnalyserClient() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const autoTriggered = useRef(false);

  const reset = useCallback(() => {
    setUrl("");
    setResult(null);
    setError(null);
    setFileName(null);
    setLoading(false);
  }, []);

  // ---------- URL analysis ----------
  const analyseUrl = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/profile-analyser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      setResult(data as AnalysisResult);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Auto-trigger analysis if URL was passed via query param (from hero CTA)
  useEffect(() => {
    if (initialUrl && !autoTriggered.current) {
      autoTriggered.current = true;
      analyseUrl();
    }
  }, [initialUrl, analyseUrl]);

  // ---------- Screenshot analysis ----------
  const analyseScreenshot = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setResult(null);
      setFileName(file.name);

      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await fetch("/api/ai/profile-analyser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ screenshot: base64 }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          return;
        }

        setResult(data as AnalysisResult);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 200);
      } catch {
        setError("Failed to process screenshot. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        analyseScreenshot(file);
      } else {
        setError("Please upload an image file (PNG, JPG, or WebP).");
      }
    },
    [analyseScreenshot],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) analyseScreenshot(file);
    },
    [analyseScreenshot],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Logo href="/" variant="wordmark" className="h-8 sm:h-9" />
          <div className="flex items-center gap-3">
            <Link
              href="/calculator"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Earnings Calculator
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 pb-12 sm:pt-24 sm:pb-16 px-6">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Free AI-Powered Tool
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-[1.1]">
            How Strong Is Your{" "}
            <span className="text-primary">Tutor Profile?</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Paste your Preply or iTalki profile URL and get instant feedback on
            what&apos;s working, what&apos;s not, and exactly how to attract more
            students.
          </p>
        </div>
      </section>

      {/* Input section */}
      {!result && !loading && (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-2xl space-y-6">
            {/* URL input */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://preply.com/en/tutor/95157"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") analyseUrl();
                  }}
                  className="flex-1 h-14 rounded-xl bg-card text-foreground px-5 text-base shadow-md border border-border/50 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all"
                />
                <Button
                  onClick={analyseUrl}
                  disabled={!url.trim()}
                  size="lg"
                  className="h-14 px-6 rounded-xl text-base"
                >
                  Analyse
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Supports <strong>preply.com</strong> and{" "}
                <strong>italki.com</strong> profile URLs
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Screenshot upload */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-primary/40 hover:bg-card/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">
                Upload a screenshot of your profile
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click to browse • PNG, JPG, WebP
              </p>
              {fileName && (
                <p className="text-xs text-primary mt-2 font-medium">
                  {fileName}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 flex gap-3 items-start">
                <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                100% free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                No signup required
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Results in seconds
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <section className="px-6 pb-16">
          <div className="mx-auto max-w-2xl">
            <LoadingState />
          </div>
        </section>
      )}

      {/* Results */}
      {result && !loading && (
        <section ref={resultsRef} className="px-6 pb-20">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Reset button */}
            <div className="flex justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try another profile
              </button>
            </div>

            {/* Score card */}
            <div className="rounded-2xl bg-card shadow-lg border border-border/50 p-8 sm:p-10">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={result.overallScore} />
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                      Overall Profile Score
                    </p>
                    <h2 className="text-2xl font-bold text-foreground mt-1">
                      {result.tutorName}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {result.platform === "preply"
                        ? "Preply"
                        : result.platform === "italki"
                          ? "iTalki"
                          : "Tutor"}{" "}
                      Profile
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Section scores */}
            <div className="rounded-2xl bg-card shadow-lg border border-border/50 p-8">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Detailed Breakdown
              </h3>
              <div className="space-y-5">
                {(
                  Object.entries(result.sections) as [
                    string,
                    SectionScore,
                  ][]
                ).map(([key, section]) => (
                  <SectionBar key={key} sectionKey={key} data={section} />
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground px-1">
                Top Recommendations
              </h3>
              {result.topRecommendations.map((rec, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-card shadow-lg border border-border/50 p-6 sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground">
                          {rec.title}
                        </h4>
                        <ImpactBadge impact={rec.impact} />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/50 p-8 sm:p-10 text-center space-y-4">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                Want to build a profile that scores 90+?
              </h3>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Create your own professional tutor page on TutorLingua — with
                direct bookings, 0% commission, and tools designed to help you
                stand out.
              </p>
              <Link href="/signup">
                <Button size="lg" className="mt-2">
                  Create your free profile
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Try another */}
            <div className="text-center">
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Analyse another profile
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 py-8 px-6">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo href="/" variant="wordmark" className="h-7" />
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
          <p>© {new Date().getFullYear()} TutorLingua</p>
        </div>
      </footer>
    </div>
  );
}
