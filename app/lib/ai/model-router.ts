import { createHash } from "node:crypto";
import type OpenAI from "openai";
import type { ChatCompletion, ChatCompletionChunk } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import { buildCacheKey, getSemanticRedis, withCache } from "@/lib/ai/semantic-cache";
import { trackAIUsage } from "@/lib/ai/usage-tracker";
import { getPracticeOpenAIClient, withOpenAIRetry } from "@/lib/practice/openai";

export type InferenceTask =
  | "practice_chat"
  | "practice_greeting"
  | "session_feedback"
  | "lesson_analysis"
  | "speech_analysis"
  | "exercise_generation"
  | "grammar_explanation"
  | "copilot_suggestion"
  | "profile_analysis";

export type ModelTier = "fast" | "standard" | "quality";

export interface ModelRouterConfig {
  task: InferenceTask;
  /** Override the default tier for this task */
  tierOverride?: ModelTier;
  /** If true, check semantic cache before calling LLM */
  cacheable?: boolean;
  /** Cache TTL in seconds (default: 86400 = 24h) */
  cacheTtlSeconds?: number;
}

type ChatCompletionParams = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;
type ChatCompletionStreamParams = OpenAI.Chat.ChatCompletionCreateParamsStreaming;

type RoutedModelConfig = {
  model: string;
  tier: ModelTier;
  maxTokens: number;
  temperature: number;
};

const DEFAULT_CACHE_TTL_SECONDS = 60 * 60 * 24;

const MODEL_BY_TIER: Record<ModelTier, string> = {
  fast: "gpt-4o-mini",
  standard: "gpt-4o-mini",
  quality: "gpt-4o",
};

const TASK_MODEL_CONFIG: Record<InferenceTask, RoutedModelConfig> = {
  practice_chat: {
    model: "gpt-4o-mini",
    tier: "fast",
    maxTokens: 200,
    temperature: 0.8,
  },
  practice_greeting: {
    model: "gpt-4o-mini",
    tier: "fast",
    maxTokens: 150,
    temperature: 0.7,
  },
  session_feedback: {
    model: "gpt-4o-mini",
    tier: "standard",
    maxTokens: 300,
    temperature: 0.3,
  },
  lesson_analysis: {
    model: "gpt-4o-mini",
    tier: "standard",
    maxTokens: 1500,
    temperature: 0.3,
  },
  speech_analysis: {
    model: "gpt-4o-mini",
    tier: "standard",
    maxTokens: 2500,
    temperature: 0.3,
  },
  exercise_generation: {
    model: "gpt-4o",
    tier: "quality",
    maxTokens: 2400,
    temperature: 0.5,
  },
  grammar_explanation: {
    model: "gpt-4o-mini",
    tier: "fast",
    maxTokens: 180,
    temperature: 0.2,
  },
  copilot_suggestion: {
    model: "gpt-4o-mini",
    tier: "standard",
    maxTokens: 500,
    temperature: 0.7,
  },
  profile_analysis: {
    model: "gpt-4o-mini",
    tier: "standard",
    maxTokens: 1400,
    temperature: 0.4,
  },
};

function resolveModelConfig(task: InferenceTask, tierOverride?: ModelTier): RoutedModelConfig {
  const base = TASK_MODEL_CONFIG[task];

  if (!tierOverride || tierOverride === base.tier) {
    return base;
  }

  return {
    ...base,
    tier: tierOverride,
    model: MODEL_BY_TIER[tierOverride],
  };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => typeof entryValue !== "undefined")
    .sort(([a], [b]) => a.localeCompare(b));

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

function buildRouterCacheKey(task: InferenceTask, params: ChatCompletionParams): string {
  const payload = stableStringify({
    task,
    messages: params.messages,
    max_tokens: params.max_tokens,
    temperature: params.temperature,
    response_format: params.response_format,
    tools: (params as unknown as Record<string, unknown>).tools,
  });

  const fingerprint = createHash("sha256").update(payload).digest("hex").slice(0, 24);

  return buildCacheKey({
    namespace: `ai:${task}`,
    language: "global",
    extra: { fingerprint },
  });
}

/**
 * Returns the routed model configuration for an inference task.
 */
export function getModelForTask(task: InferenceTask): {
  model: string;
  tier: ModelTier;
  maxTokens: number;
  temperature: number;
} {
  const config = TASK_MODEL_CONFIG[task];
  return {
    model: config.model,
    tier: config.tier,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  };
}

/**
 * Executes a non-streaming chat completion through the routing layer.
 */
export async function routedChatCompletion(
  config: ModelRouterConfig,
  params: Omit<ChatCompletionParams, "model">
): Promise<ChatCompletion> {
  const routed = resolveModelConfig(config.task, config.tierOverride);

  const finalParams: ChatCompletionParams = {
    ...params,
    model: routed.model,
    max_tokens: params.max_tokens ?? routed.maxTokens,
    temperature: params.temperature ?? routed.temperature,
    stream: false,
  };

  const execute = async () =>
    withOpenAIRetry<ChatCompletion>((client) =>
      client.chat.completions.create(finalParams)
    );

  if (config.cacheable) {
    const redis = getSemanticRedis();
    if (redis) {
      const cacheKey = buildRouterCacheKey(config.task, finalParams);
      const { data, cached } = await withCache<ChatCompletion>(
        redis,
        {
          namespace: `ai:${config.task}`,
          ttlSeconds: config.cacheTtlSeconds ?? DEFAULT_CACHE_TTL_SECONDS,
          similarityThreshold: 1,
        },
        cacheKey,
        execute
      );

      if (cached) {
        await trackAIUsage({
          task: config.task,
          model: routed.model,
          cacheHit: true,
          inputTokens: 0,
          outputTokens: 0,
        });
        return data;
      }

      await trackAIUsage({
        task: config.task,
        model: routed.model,
        cacheHit: false,
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      });

      return data;
    }
  }

  const completion = await execute();
  await trackAIUsage({
    task: config.task,
    model: routed.model,
    cacheHit: false,
    inputTokens: completion.usage?.prompt_tokens ?? 0,
    outputTokens: completion.usage?.completion_tokens ?? 0,
  });

  return completion;
}

/**
 * Executes a streaming chat completion through the routing layer.
 */
export async function routedChatStream(
  config: ModelRouterConfig,
  params: Omit<ChatCompletionStreamParams, "model" | "stream">
): Promise<Stream<ChatCompletionChunk>> {
  const routed = resolveModelConfig(config.task, config.tierOverride);
  const client = await getPracticeOpenAIClient();

  return client.chat.completions.create({
    ...params,
    model: routed.model,
    max_tokens: params.max_tokens ?? routed.maxTokens,
    temperature: params.temperature ?? routed.temperature,
    stream: true,
    stream_options: params.stream_options ?? { include_usage: true },
  });
}
