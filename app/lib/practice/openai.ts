"use server";

import type OpenAI from "openai";
import type { ChatCompletion, ChatCompletionChunk } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import { assertGoogleDataIsolation } from "@/lib/ai/google-compliance";

/**
 * @google-compliance
 * AI Practice uses user-provided practice messages only.
 * External calendar data (calendar_events, calendar_connections) is NEVER included.
 */
type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

type ChatCompletionParams = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;
type ChatCompletionStreamParams = OpenAI.Chat.ChatCompletionCreateParamsStreaming;

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 500;
const DEFAULT_MAX_DELAY_MS = 5000;

const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function getOpenAIKey(): string | null {
  const value = process.env.OPENAI_API_KEY?.trim();
  return value && value.length > 0 ? value : null;
}

export async function isPracticeOpenAIConfigured(): Promise<boolean> {
  return !!getOpenAIKey();
}

export async function getPracticeOpenAIClient(): Promise<OpenAI> {
  const OpenAI = (await import("openai")).default;

  const apiKey = getOpenAIKey();
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  return new OpenAI({
    apiKey,
  });
}

function isRetryableError(error: unknown): boolean {
  const status = (error as { status?: number; response?: { status?: number } } | undefined)?.status
    ?? (error as { response?: { status?: number } } | undefined)?.response?.status;

  if (typeof status === "number" && (RETRYABLE_STATUSES.has(status) || (status >= 500 && status < 600))) {
    return true;
  }

  const code = (error as { code?: string } | undefined)?.code;
  if (code && ["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) {
    return true;
  }

  // TypeError commonly wraps fetch/network errors in the OpenAI SDK
  if (error instanceof TypeError) {
    return true;
  }

  return false;
}

export async function withOpenAIRetry<T>(
  operation: (client: OpenAI) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

  const client = await getPracticeOpenAIClient();
  let attempt = 0;

  while (true) {
    try {
      return await operation(client);
    } catch (error) {
      const shouldRetry = isRetryableError(error) && attempt < maxRetries;
      if (!shouldRetry) {
        throw error;
      }

      const backoff = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitter = Math.random() * 100;
      await sleep(backoff + jitter);
      attempt += 1;
    }
  }
}

export async function createPracticeChatCompletion(
  params: ChatCompletionParams,
  retryOptions?: RetryOptions
) {
  assertGoogleDataIsolation({
    provider: "openai",
    context: "practice.createChatCompletion",
    data: params,
    sources: ["student_practice_sessions", "student_practice_messages"],
  });
  return await withOpenAIRetry<ChatCompletion>(
    (client) => client.chat.completions.create({ ...params, stream: false }),
    retryOptions
  );
}

/**
 * Creates a streaming chat completion for AI Practice.
 * Returns an async iterator that yields content chunks.
 */
export async function createPracticeChatStream(
  params: Omit<ChatCompletionStreamParams, "stream">
): Promise<Stream<ChatCompletionChunk>> {
  assertGoogleDataIsolation({
    provider: "openai",
    context: "practice.createChatStream",
    data: params,
    sources: ["student_practice_sessions", "student_practice_messages"],
  });
  const client = await getPracticeOpenAIClient();
  return client.chat.completions.create({
    ...params,
    stream: true,
  });
}
