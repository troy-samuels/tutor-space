import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSemanticRedis } from "@/lib/ai/semantic-cache";
import type { InferenceTask } from "@/lib/ai/model-router";

export interface AIUsageTaskStat {
  calls: number;
  cacheHits: number;
  tokensInput: number;
  tokensOutput: number;
  estimatedCostUsd: number;
}

export interface AIUsageStats {
  period: string;
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  estimatedCostUsd: number;
  byTask: Record<InferenceTask, AIUsageTaskStat>;
  exerciseBanks: {
    totalBanks: number;
    totalExercises: number;
    sessionsServedFromBank: number;
    aiCallsAvoided: number;
  };
}

export interface TrackAIUsageParams {
  task: InferenceTask;
  model: string;
  cacheHit: boolean;
  inputTokens?: number;
  outputTokens?: number;
  at?: Date;
}

type UsageCounterSnapshot = {
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  tokensInput: number;
  tokensOutput: number;
  estimatedCostUsd: number;
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

const COUNTER_TTL_SECONDS = 60 * 60 * 24 * 90;

const MODEL_PRICING_USD_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
};

const memoryCounters = new Map<string, UsageCounterSnapshot>();

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getTaskRedisKey(dateKey: string, task: InferenceTask): string {
  return `ai_usage:${dateKey}:task:${task}`;
}

function getTaskMemoryKey(dateKey: string, task: InferenceTask): string {
  return `${dateKey}:task:${task}`;
}

function emptySnapshot(): UsageCounterSnapshot {
  return {
    totalCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    tokensInput: 0,
    tokensOutput: 0,
    estimatedCostUsd: 0,
  };
}

function toNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(numeric) ? numeric : 0;
}

function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function getPriceForModel(model: string): { input: number; output: number } {
  const cleaned = model.trim().toLowerCase();
  return MODEL_PRICING_USD_PER_MILLION[cleaned] ?? MODEL_PRICING_USD_PER_MILLION["gpt-4o-mini"];
}

function listDatesForRange(params: { period: "day" | "week"; anchor: Date }): string[] {
  const anchor = new Date(params.anchor);
  const dates: string[] = [];

  if (params.period === "day") {
    return [getDateKey(anchor)];
  }

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(anchor);
    date.setUTCDate(anchor.getUTCDate() - offset);
    dates.push(getDateKey(date));
  }

  return dates;
}

function getISOWeek(date: Date): number {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const diff = target.getTime() - firstThursday.getTime();
  return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
}

function formatWeekPeriod(anchor: Date): string {
  const year = anchor.getUTCFullYear();
  const month = String(anchor.getUTCMonth() + 1).padStart(2, "0");
  const week = String(getISOWeek(anchor)).padStart(2, "0");
  return `${year}-${month}-W${week}`;
}

async function incrementRedisCounters(
  dateKey: string,
  task: InferenceTask,
  delta: UsageCounterSnapshot
): Promise<void> {
  const redis = getSemanticRedis();
  if (!redis) return;

  const key = getTaskRedisKey(dateKey, task);

  try {
    await redis.hincrby(key, "total_calls", delta.totalCalls);
    await redis.hincrby(key, "cache_hits", delta.cacheHits);
    await redis.hincrby(key, "cache_misses", delta.cacheMisses);
    await redis.hincrby(key, "tokens_input", delta.tokensInput);
    await redis.hincrby(key, "tokens_output", delta.tokensOutput);
    await redis.hincrbyfloat(key, "estimated_cost_usd", delta.estimatedCostUsd);
    await redis.expire(key, COUNTER_TTL_SECONDS);
  } catch (error) {
    console.error("[AIUsage] Redis increment failed:", error);
  }
}

function incrementMemoryCounters(dateKey: string, task: InferenceTask, delta: UsageCounterSnapshot): void {
  const key = getTaskMemoryKey(dateKey, task);
  const previous = memoryCounters.get(key) ?? emptySnapshot();

  memoryCounters.set(key, {
    totalCalls: previous.totalCalls + delta.totalCalls,
    cacheHits: previous.cacheHits + delta.cacheHits,
    cacheMisses: previous.cacheMisses + delta.cacheMisses,
    tokensInput: previous.tokensInput + delta.tokensInput,
    tokensOutput: previous.tokensOutput + delta.tokensOutput,
    estimatedCostUsd: roundCost(previous.estimatedCostUsd + delta.estimatedCostUsd),
  });
}

async function readCounterSnapshot(dateKey: string, task: InferenceTask): Promise<UsageCounterSnapshot> {
  const redis = getSemanticRedis();
  if (redis) {
    try {
      const data = await redis.hgetall<Record<string, string | number>>(getTaskRedisKey(dateKey, task));
      if (data && Object.keys(data).length > 0) {
        return {
          totalCalls: toNumber(data.total_calls),
          cacheHits: toNumber(data.cache_hits),
          cacheMisses: toNumber(data.cache_misses),
          tokensInput: toNumber(data.tokens_input),
          tokensOutput: toNumber(data.tokens_output),
          estimatedCostUsd: roundCost(toNumber(data.estimated_cost_usd)),
        };
      }
    } catch (error) {
      console.error("[AIUsage] Redis read failed:", error);
    }
  }

  return memoryCounters.get(getTaskMemoryKey(dateKey, task)) ?? emptySnapshot();
}

function parseDateInput(value?: string): Date {
  if (!value) return new Date();

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

async function getExerciseBankStats(): Promise<AIUsageStats["exerciseBanks"]> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return {
      totalBanks: 0,
      totalExercises: 0,
      sessionsServedFromBank: 0,
      aiCallsAvoided: 0,
    };
  }

  try {
    const [{ count: bankCount }, { data: bankRows }, { count: historyCount }] = await Promise.all([
      adminClient
        .from("exercise_banks")
        .select("id", { head: true, count: "exact" }),
      adminClient
        .from("exercise_banks")
        .select("exercise_count, served_count"),
      adminClient
        .from("student_exercise_history")
        .select("id", { head: true, count: "exact" }),
    ]);

    const totalExercises = (bankRows ?? []).reduce(
      (sum, row) => sum + toNumber((row as { exercise_count?: unknown }).exercise_count),
      0
    );

    const servedFromBanks = (bankRows ?? []).reduce(
      (sum, row) => sum + toNumber((row as { served_count?: unknown }).served_count),
      0
    );

    const sessionsServedFromBank = Math.max(servedFromBanks, historyCount ?? 0);

    return {
      totalBanks: bankCount ?? 0,
      totalExercises,
      sessionsServedFromBank,
      aiCallsAvoided: Math.round(sessionsServedFromBank * 8),
    };
  } catch (error) {
    console.error("[AIUsage] Failed to fetch exercise bank stats:", error);
    return {
      totalBanks: 0,
      totalExercises: 0,
      sessionsServedFromBank: 0,
      aiCallsAvoided: 0,
    };
  }
}

export function estimateCostUsd(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
}): number {
  const pricing = getPriceForModel(params.model);

  const inputCost = (Math.max(0, params.inputTokens) / 1_000_000) * pricing.input;
  const outputCost = (Math.max(0, params.outputTokens) / 1_000_000) * pricing.output;

  return roundCost(inputCost + outputCost);
}

/**
 * Tracks one AI usage event (call + cache status + token usage).
 */
export async function trackAIUsage(params: TrackAIUsageParams): Promise<void> {
  const dateKey = getDateKey(params.at ?? new Date());
  const inputTokens = Math.max(0, params.inputTokens ?? 0);
  const outputTokens = Math.max(0, params.outputTokens ?? 0);

  const delta: UsageCounterSnapshot = {
    totalCalls: 1,
    cacheHits: params.cacheHit ? 1 : 0,
    cacheMisses: params.cacheHit ? 0 : 1,
    tokensInput: inputTokens,
    tokensOutput: outputTokens,
    estimatedCostUsd: params.cacheHit
      ? 0
      : estimateCostUsd({
          model: params.model,
          inputTokens,
          outputTokens,
        }),
  };

  incrementMemoryCounters(dateKey, params.task, delta);
  await incrementRedisCounters(dateKey, params.task, delta);
}

/**
 * Reads aggregated AI usage for a day or trailing week.
 */
export async function getAIUsageStats(params?: {
  period?: "day" | "week";
  date?: string;
}): Promise<AIUsageStats> {
  const period = params?.period === "week" ? "week" : "day";
  const anchor = parseDateInput(params?.date);
  const dateKeys = listDatesForRange({ period, anchor });

  const byTask = Object.fromEntries(
    INFERENCE_TASKS.map((task) => [
      task,
      {
        calls: 0,
        cacheHits: 0,
        tokensInput: 0,
        tokensOutput: 0,
        estimatedCostUsd: 0,
      },
    ])
  ) as Record<InferenceTask, AIUsageTaskStat>;

  for (const dateKey of dateKeys) {
    for (const task of INFERENCE_TASKS) {
      const snapshot = await readCounterSnapshot(dateKey, task);
      byTask[task].calls += snapshot.totalCalls;
      byTask[task].cacheHits += snapshot.cacheHits;
      byTask[task].tokensInput += snapshot.tokensInput;
      byTask[task].tokensOutput += snapshot.tokensOutput;
      byTask[task].estimatedCostUsd = roundCost(byTask[task].estimatedCostUsd + snapshot.estimatedCostUsd);
    }
  }

  const totalCalls = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].calls, 0);
  const cacheHits = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].cacheHits, 0);
  const totalTokensInput = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].tokensInput, 0);
  const totalTokensOutput = INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].tokensOutput, 0);
  const estimatedCostUsd = roundCost(
    INFERENCE_TASKS.reduce((sum, task) => sum + byTask[task].estimatedCostUsd, 0)
  );

  const cacheMisses = Math.max(0, totalCalls - cacheHits);
  const cacheHitRate = totalCalls > 0 ? cacheHits / totalCalls : 0;
  const exerciseBanks = await getExerciseBankStats();

  return {
    period: period === "day" ? getDateKey(anchor) : formatWeekPeriod(anchor),
    totalCalls,
    cacheHits,
    cacheMisses,
    cacheHitRate,
    totalTokensInput,
    totalTokensOutput,
    estimatedCostUsd,
    byTask,
    exerciseBanks,
  };
}

export const __usageTrackerTesting = {
  resetInMemoryStore() {
    memoryCounters.clear();
  },
};
