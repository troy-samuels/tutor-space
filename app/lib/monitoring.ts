import { createServiceRoleClient } from "@/lib/supabase/admin";

type Level = "info" | "warn" | "error";

type MetricInput = {
  metric: string;
  value: number;
  sampleRate?: number;
};

type EventInput = {
  source: string;
  level?: Level;
  message: string;
  meta?: Record<string, unknown>;
  sampleRate?: number;
};

const random = () => Math.random();

export function shouldSample(sampleRate = 1): boolean {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;
  return random() < sampleRate;
}

export async function recordSystemMetric(input: MetricInput) {
  if (!shouldSample(input.sampleRate ?? 1)) return;

  try {
    const supabase = createServiceRoleClient();
    if (!supabase) return;

    await supabase.from("system_metrics").insert({
      metric_type: input.metric,
      value: input.value,
      recorded_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[monitoring] Failed to record metric", input.metric, error);
  }
}

export async function recordSystemEvent(input: EventInput) {
  if (!shouldSample(input.sampleRate ?? 1)) return;

  try {
    const supabase = createServiceRoleClient();
    if (!supabase) return;

    await supabase.from("system_error_log").insert({
      source: input.source,
      level: input.level ?? "error",
      message: input.message,
      context: input.meta ?? {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[monitoring] Failed to record event", input.source, error);
  }
}

export function startDuration(label: string) {
  const start = Date.now();
  return () => {
    const durationMs = Date.now() - start;
    if (durationMs > 0) {
      void recordSystemMetric({ metric: `${label}:duration_ms`, value: durationMs, sampleRate: 0.1 });
    }
    return durationMs;
  };
}
