import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import type { InferenceTask } from "@/lib/ai/model-router";
import {
  getAIUsageStats,
  type AIUsageStats,
  type AIUsageTaskStat,
} from "@/lib/ai/usage-tracker";
import { createServiceRoleClient, type ServiceRoleClient } from "@/lib/supabase/admin";

type AIUsageDailyRow = {
  task: string | null;
  total_calls: number | null;
  cache_hits: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  estimated_cost_usd: number | null;
};

const INFERENCE_TASKS: InferenceTask[] = [
  "practice_chat",
  "practice_greeting",
  "session_feedback",
  "lesson_analysis",
  "speech_analysis",
  "exercise_generation",
  "grammar_explanation",
  "copilot_suggestion",
  "profile_analysis",
];

function toNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function parseDateInput(value?: string): Date {
  if (!value) return new Date();

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isInferenceTask(value: string | null): value is InferenceTask {
  if (!value) return false;
  return INFERENCE_TASKS.includes(value as InferenceTask);
}

function emptyTaskStats(): AIUsageTaskStat {
  return {
    calls: 0,
    cacheHits: 0,
    tokensInput: 0,
    tokensOutput: 0,
    estimatedCostUsd: 0,
  };
}

function createTaskMap(): Record<InferenceTask, AIUsageTaskStat> {
  return Object.fromEntries(INFERENCE_TASKS.map((task) => [task, emptyTaskStats()])) as Record<
    InferenceTask,
    AIUsageTaskStat
  >;
}

async function readPersistedUsageByTask(
  supabase: ServiceRoleClient,
  params: { period: "day" | "week"; date?: string }
): Promise<Record<InferenceTask, AIUsageTaskStat>> {
  const byTask = createTaskMap();
  const anchor = parseDateInput(params.date);
  const end = getDateKey(anchor);

  let query = supabase
    .from("ai_usage_daily")
    .select("task, total_calls, cache_hits, tokens_input, tokens_output, estimated_cost_usd");

  if (params.period === "day") {
    query = query.eq("date", end);
  } else {
    const startDate = new Date(anchor);
    startDate.setUTCDate(startDate.getUTCDate() - 6);
    const start = getDateKey(startDate);
    query = query.gte("date", start).lte("date", end);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[AI Usage API] Failed to read ai_usage_daily:", error);
    return byTask;
  }

  for (const rowRaw of (data ?? []) as AIUsageDailyRow[]) {
    if (!isInferenceTask(rowRaw.task)) {
      continue;
    }

    byTask[rowRaw.task].calls += toNumber(rowRaw.total_calls);
    byTask[rowRaw.task].cacheHits += toNumber(rowRaw.cache_hits);
    byTask[rowRaw.task].tokensInput += toNumber(rowRaw.tokens_input);
    byTask[rowRaw.task].tokensOutput += toNumber(rowRaw.tokens_output);
    byTask[rowRaw.task].estimatedCostUsd = roundCost(
      byTask[rowRaw.task].estimatedCostUsd + toNumber(rowRaw.estimated_cost_usd)
    );
  }

  return byTask;
}

/**
 * GET /api/ai/usage
 * Admin-only endpoint for Sprint 3 AI usage stats.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const supabase = createServiceRoleClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const periodParam = request.nextUrl.searchParams.get("period");
    const period: "day" | "week" = periodParam === "week" ? "week" : "day";
    const date = request.nextUrl.searchParams.get("date") ?? undefined;

    const [runtimeStats, persistedByTask] = await Promise.all([
      getAIUsageStats({ period, date }),
      readPersistedUsageByTask(supabase, { period, date }),
    ]);

    const byTask = createTaskMap();

    for (const task of INFERENCE_TASKS) {
      byTask[task] = {
        calls: runtimeStats.byTask[task].calls + persistedByTask[task].calls,
        cacheHits: runtimeStats.byTask[task].cacheHits + persistedByTask[task].cacheHits,
        tokensInput: runtimeStats.byTask[task].tokensInput + persistedByTask[task].tokensInput,
        tokensOutput: runtimeStats.byTask[task].tokensOutput + persistedByTask[task].tokensOutput,
        estimatedCostUsd: roundCost(
          runtimeStats.byTask[task].estimatedCostUsd + persistedByTask[task].estimatedCostUsd
        ),
      };
    }

    const totalCalls = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].calls, 0);
    const cacheHits = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].cacheHits, 0);
    const totalTokensInput = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].tokensInput, 0);
    const totalTokensOutput = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].tokensOutput, 0);
    const estimatedCostUsd = roundCost(
      INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].estimatedCostUsd, 0)
    );
    const cacheMisses = Math.max(0, totalCalls - cacheHits);

    const response: AIUsageStats = {
      period: runtimeStats.period,
      totalCalls,
      cacheHits,
      cacheMisses,
      cacheHitRate: totalCalls > 0 ? cacheHits / totalCalls : 0,
      totalTokensInput,
      totalTokensOutput,
      estimatedCostUsd,
      byTask,
      exerciseBanks: runtimeStats.exerciseBanks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in AI usage API:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch AI usage stats" },
      { status: error instanceof Error && error.message.includes("authentication") ? 401 : 500 }
    );
  }
}
