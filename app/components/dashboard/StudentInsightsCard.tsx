"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";

// =============================================================================
// TYPES
// =============================================================================

interface WeakSpotItem {
  concept: string;
  correctRate: number;
  totalAttempts: number;
  lastAttempt: string;
  masteryStatus: string;
}

interface WeakSpotCategory {
  category: string;
  items: WeakSpotItem[];
  averageCorrectRate: number;
}

interface StrongItem {
  concept: string;
  correctRate: number;
  totalAttempts: number;
}

interface StudentInsightsData {
  student: {
    fingerprint: string;
    totalItems: number;
    totalReviews: number;
    overallCorrectRate: number;
  };
  weakSpots: WeakSpotCategory[];
  strongItems: StrongItem[];
}

interface StudentInsightsCardProps {
  studentName: string;
  studentFingerprint: string;
  language: string;
  level: string | null;
  recapCount: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function StudentInsightsCard({
  studentName,
  studentFingerprint,
  language,
  level,
  recapCount,
}: StudentInsightsCardProps) {
  const [data, setData] = useState<StudentInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch(
          `/api/tutor/students/${encodeURIComponent(studentFingerprint)}/weak-spots`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError("Could not load insights");
        console.error("[StudentInsightsCard]", err);
      } finally {
        setLoading(false);
      }
    }

    if (studentFingerprint) {
      fetchInsights();
    } else {
      setLoading(false);
    }
  }, [studentFingerprint]);

  // Don't render if no fingerprint or no data after loading
  if (!studentFingerprint) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            {studentName}
            {level && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {level}
              </Badge>
            )}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {language} · {recapCount} recap{recapCount !== 1 ? "s" : ""}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading insights…
          </div>
        )}

        {error && (
          <p className="text-sm text-muted-foreground">{error}</p>
        )}

        {data && !loading && (
          <>
            {/* Overall stats */}
            {data.student.totalReviews > 0 && (
              <div className="flex items-center gap-4 text-sm">
                <span>
                  {data.student.totalItems} exercises ·{" "}
                  <span
                    className={
                      data.student.overallCorrectRate >= 0.7
                        ? "text-green-600 dark:text-green-400"
                        : data.student.overallCorrectRate >= 0.5
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    }
                  >
                    {Math.round(data.student.overallCorrectRate * 100)}%
                    correct
                  </span>
                </span>
              </div>
            )}

            {/* Weak spots */}
            {data.weakSpots.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Struggling with:
                </div>
                <ul className="space-y-1 pl-5">
                  {data.weakSpots.flatMap((cat) =>
                    cat.items.slice(0, 3).map((item) => (
                      <li
                        key={item.concept}
                        className="text-sm text-muted-foreground"
                      >
                        {item.concept}{" "}
                        <span className="text-xs">
                          ({Math.round(item.correctRate * 100)}% ·{" "}
                          {item.totalAttempts} attempts)
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            {/* Strong items */}
            {data.strongItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Strong on:
                </div>
                <ul className="space-y-1 pl-5">
                  {data.strongItems.slice(0, 3).map((item) => (
                    <li
                      key={item.concept}
                      className="text-sm text-muted-foreground"
                    >
                      {item.concept}{" "}
                      <span className="text-xs">
                        ({Math.round(item.correctRate * 100)}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No data yet */}
            {data.student.totalReviews === 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Insights will appear after the student completes exercises
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
