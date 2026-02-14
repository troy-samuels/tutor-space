import { Redis } from "@upstash/redis";

export type SemanticCacheStatus = "connected" | "disconnected" | "unconfigured";

export interface SemanticCacheHealth {
  configured: boolean;
  status: SemanticCacheStatus;
  reconnectScheduled: boolean;
  reconnectAt: string | null;
  lastError: string | null;
  lastFailureAt: string | null;
}

const REDIS_RECONNECT_DELAY_MS = 60_000;

let redisClient: Redis | null = null;
let redisStatus: SemanticCacheStatus = "unconfigured";
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAtMs: number | null = null;
let lastFailureAtMs: number | null = null;
let lastErrorMessage: string | null = null;
let outageLogEmitted = false;
let probeInFlight: Promise<boolean> | null = null;

function getRedisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    redisStatus = "unconfigured";
    return null;
  }

  return { url, token };
}

function getRedisClient(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const config = getRedisConfig();
  if (!config) {
    return null;
  }

  redisClient = new Redis({
    url: config.url,
    token: config.token,
  });
  redisStatus = "connected";
  return redisClient;
}

function scheduleReconnectProbe(): void {
  if (redisStatus === "unconfigured") {
    return;
  }

  if (reconnectTimer) {
    return;
  }

  reconnectAtMs = Date.now() + REDIS_RECONNECT_DELAY_MS;
  const timer = setTimeout(() => {
    reconnectTimer = null;
    void ensureRedisReady({ forceProbe: true });
  }, REDIS_RECONNECT_DELAY_MS);

  reconnectTimer = timer;
  const maybeUnref = (timer as { unref?: () => void }).unref;
  if (typeof maybeUnref === "function") {
    maybeUnref.call(timer);
  }
}

function markRedisUnavailable(error: unknown): void {
  redisStatus = "disconnected";
  lastFailureAtMs = Date.now();
  lastErrorMessage = error instanceof Error ? error.message : String(error);

  if (!outageLogEmitted) {
    console.warn("[SemanticCache] Redis unavailable; falling back to local cache for 60 seconds.", {
      error: lastErrorMessage,
    });
    outageLogEmitted = true;
  }

  scheduleReconnectProbe();
}

function markRedisRecovered(): void {
  const wasDisconnected = redisStatus === "disconnected";
  redisStatus = "connected";
  reconnectAtMs = null;
  lastFailureAtMs = null;
  lastErrorMessage = null;
  outageLogEmitted = false;

  if (wasDisconnected) {
    console.info("[SemanticCache] Redis connectivity restored.");
  }
}

async function probeRedisConnection(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.ping();
    markRedisRecovered();
    return true;
  } catch (error) {
    markRedisUnavailable(error);
    return false;
  }
}

async function ensureRedisReady(options: { forceProbe?: boolean } = {}): Promise<Redis | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  if (redisStatus === "connected" && !options.forceProbe) {
    return client;
  }

  const now = Date.now();
  if (!options.forceProbe && reconnectAtMs !== null && now < reconnectAtMs) {
    return null;
  }

  if (!probeInFlight) {
    probeInFlight = probeRedisConnection().finally(() => {
      probeInFlight = null;
    });
  }

  const isReady = await probeInFlight;
  return isReady ? client : null;
}

export async function getSemanticCacheValue<T>(key: string): Promise<T | null> {
  const client = await ensureRedisReady();
  if (!client) {
    return null;
  }

  try {
    const value = await client.get<T>(key);
    return value ?? null;
  } catch (error) {
    markRedisUnavailable(error);
    return null;
  }
}

export async function setSemanticCacheValue(
  key: string,
  value: unknown,
  options: { ttlSeconds?: number } = {}
): Promise<boolean> {
  const client = await ensureRedisReady();
  if (!client) {
    return false;
  }

  try {
    if (typeof options.ttlSeconds === "number" && options.ttlSeconds > 0) {
      await client.set(key, value, { ex: Math.floor(options.ttlSeconds) });
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    markRedisUnavailable(error);
    return false;
  }
}

export async function deleteSemanticCacheValue(key: string): Promise<boolean> {
  const client = await ensureRedisReady();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    markRedisUnavailable(error);
    return false;
  }
}

export async function pingSemanticCache(): Promise<boolean> {
  const client = await ensureRedisReady({ forceProbe: true });
  return client !== null;
}

// ---------------------------------------------------------------------------
// Exports consumed by model-router.ts
// ---------------------------------------------------------------------------

/**
 * Returns the underlying Redis client (or null if unconfigured/disconnected).
 * Used by model-router for cache-aware inference.
 * Synchronous — returns the cached client if connected, null otherwise.
 */
export function getSemanticRedis(): Redis | null {
  return getRedisClient();
}

/**
 * Build a deterministic cache key from arbitrary inputs.
 */
export function buildCacheKey(...parts: unknown[]): string {
  const raw = JSON.stringify(parts);
  // Simple hash for cache key
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `sc:${Math.abs(hash).toString(36)}`;
}

type WithCacheOptions = {
  namespace: string;
  ttlSeconds: number;
  similarityThreshold?: number;
};

/**
 * Cache-through wrapper: checks cache first, falls back to executor, stores result.
 */
export async function withCache<T>(
  redis: Redis,
  options: WithCacheOptions,
  key: string,
  executor: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const fullKey = `${options.namespace}:${key}`;

  try {
    const cached = await redis.get<T>(fullKey);
    if (cached !== null && cached !== undefined) {
      return { data: cached, cached: true };
    }
  } catch {
    // Cache miss or error — proceed to execute
  }

  const data = await executor();

  try {
    if (options.ttlSeconds > 0) {
      await redis.set(fullKey, data, { ex: Math.floor(options.ttlSeconds) });
    } else {
      await redis.set(fullKey, data);
    }
  } catch {
    // Cache write failure is non-fatal
  }

  return { data, cached: false };
}

export async function getSemanticCacheHealth(): Promise<SemanticCacheHealth> {
  if (redisStatus === "disconnected" && reconnectAtMs !== null && Date.now() >= reconnectAtMs) {
    await ensureRedisReady({ forceProbe: true });
  }

  return {
    configured: redisStatus !== "unconfigured",
    status: redisStatus,
    reconnectScheduled: reconnectTimer !== null,
    reconnectAt: reconnectAtMs ? new Date(reconnectAtMs).toISOString() : null,
    lastError: lastErrorMessage,
    lastFailureAt: lastFailureAtMs ? new Date(lastFailureAtMs).toISOString() : null,
  };
}
