import {
  getSemanticCacheValue,
  setSemanticCacheValue,
} from "@/lib/ai/semantic-cache";
import { GRAMMAR_CATEGORY_LABELS, GRAMMAR_CATEGORY_SLUGS } from "@/lib/practice/grammar-categories";

const GRAMMAR_CACHE_PREFIX = "practice:grammar:explanation:v1";
const DEFAULT_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days
const MAX_LOCAL_CACHE_ENTRIES = 5000;

const encoder = new TextEncoder();

type LocalCacheEntry = {
  value: GrammarCacheEntry;
  expiresAt: number;
  approxBytes: number;
};

type CacheLookupSource = "local" | "redis" | "generated";

export interface GrammarCacheKey {
  category: string;
  language: string;
  level: string;
}

export interface GrammarCacheEntry extends GrammarCacheKey {
  explanation: string;
  generatedAt: string;
}

export interface GrammarCacheMetrics {
  hitCount: number;
  missCount: number;
  redisHit: number;
  localHit: number;
  generationCount: number;
  localCacheSize: number;
  localCacheMemoryBytes: number;
  hitRatio: number;
}

export interface GrammarCacheLookupResult {
  entry: GrammarCacheEntry;
  source: CacheLookupSource;
}

const localCache = new Map<string, LocalCacheEntry>();
let localCacheMemoryBytes = 0;

const metrics = {
  hitCount: 0,
  missCount: 0,
  redisHit: 0,
  localHit: 0,
  generationCount: 0,
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
};

const LEVEL_HINTS: Record<string, string> = {
  beginner: "Keep it simple and focus on one rule at a time.",
  intermediate: "Include a practical tip and one common exception.",
  advanced: "Mention nuance, register, or edge cases when relevant.",
};

function normalizeCacheKeyPart(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-");
}

function normalizeLookup(input: GrammarCacheKey): GrammarCacheKey {
  const normalizedCategory = normalizeCacheKeyPart(input.category) || "vocabulary";
  return {
    category: normalizedCategory,
    language: normalizeCacheKeyPart(input.language) || "en",
    level: normalizeCacheKeyPart(input.level) || "beginner",
  };
}

function buildCacheKey(input: GrammarCacheKey): string {
  const normalized = normalizeLookup(input);
  return `${GRAMMAR_CACHE_PREFIX}:${normalized.language}:${normalized.level}:${normalized.category}`;
}

function estimateBytes(value: unknown): number {
  try {
    return encoder.encode(JSON.stringify(value)).byteLength;
  } catch {
    return 0;
  }
}

function removeLocalEntry(cacheKey: string): void {
  const existing = localCache.get(cacheKey);
  if (!existing) {
    return;
  }

  localCacheMemoryBytes = Math.max(0, localCacheMemoryBytes - existing.approxBytes);
  localCache.delete(cacheKey);
}

function sweepExpiredLocalEntries(nowMs = Date.now()): void {
  for (const [cacheKey, entry] of localCache.entries()) {
    if (entry.expiresAt <= nowMs) {
      removeLocalEntry(cacheKey);
    }
  }
}

function evictOverflowLocalEntries(): void {
  while (localCache.size > MAX_LOCAL_CACHE_ENTRIES) {
    const oldest = localCache.keys().next().value as string | undefined;
    if (!oldest) {
      return;
    }
    removeLocalEntry(oldest);
  }
}

function readLocalEntry(cacheKey: string): GrammarCacheEntry | null {
  sweepExpiredLocalEntries();
  const cached = localCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  // Refresh insertion order for LRU-ish behavior.
  localCache.delete(cacheKey);
  localCache.set(cacheKey, cached);

  return cached.value;
}

function writeLocalEntry(cacheKey: string, value: GrammarCacheEntry, ttlSeconds: number): void {
  const ttlMs = Math.max(1, ttlSeconds) * 1000;
  const next: LocalCacheEntry = {
    value,
    expiresAt: Date.now() + ttlMs,
    approxBytes: estimateBytes(value) + cacheKey.length,
  };

  removeLocalEntry(cacheKey);
  localCache.set(cacheKey, next);
  localCacheMemoryBytes += next.approxBytes;

  evictOverflowLocalEntries();
}

function toTitleCaseWords(input: string): string {
  return input
    .split("-")
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function getCategoryLabel(category: string): string {
  const normalized = normalizeCacheKeyPart(category);
  const isKnownCategory = GRAMMAR_CATEGORY_SLUGS.includes(
    normalized as (typeof GRAMMAR_CATEGORY_SLUGS)[number]
  );

  if (isKnownCategory) {
    return GRAMMAR_CATEGORY_LABELS[normalized as keyof typeof GRAMMAR_CATEGORY_LABELS];
  }
  return toTitleCaseWords(normalized);
}

export function buildDefaultGrammarExplanation(input: GrammarCacheKey): string {
  const normalized = normalizeLookup(input);
  const language = LANGUAGE_LABELS[normalized.language] || toTitleCaseWords(normalized.language);
  const categoryLabel = getCategoryLabel(normalized.category);
  const levelHint = LEVEL_HINTS[normalized.level] || LEVEL_HINTS.beginner;

  return `${categoryLabel} in ${language} improves sentence clarity and fluency. ${levelHint}`;
}

export async function getCachedGrammarExplanation(input: GrammarCacheKey): Promise<GrammarCacheLookupResult | null> {
  const normalized = normalizeLookup(input);
  const cacheKey = buildCacheKey(normalized);

  const localValue = readLocalEntry(cacheKey);
  if (localValue) {
    metrics.hitCount += 1;
    metrics.localHit += 1;
    return { entry: localValue, source: "local" };
  }

  const redisValue = await getSemanticCacheValue<GrammarCacheEntry>(cacheKey);
  if (redisValue) {
    metrics.hitCount += 1;
    metrics.redisHit += 1;
    writeLocalEntry(cacheKey, redisValue, DEFAULT_CACHE_TTL_SECONDS);
    return { entry: redisValue, source: "redis" };
  }

  metrics.missCount += 1;
  return null;
}

export async function setCachedGrammarExplanation(
  input: GrammarCacheKey,
  explanation: string,
  options: { ttlSeconds?: number; generatedAt?: string } = {}
): Promise<GrammarCacheEntry> {
  const normalized = normalizeLookup(input);
  const cacheKey = buildCacheKey(normalized);
  const entry: GrammarCacheEntry = {
    ...normalized,
    explanation: explanation.trim(),
    generatedAt: options.generatedAt || new Date().toISOString(),
  };
  const ttlSeconds = options.ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS;

  writeLocalEntry(cacheKey, entry, ttlSeconds);
  await setSemanticCacheValue(cacheKey, entry, { ttlSeconds });

  return entry;
}

export async function getOrGenerateGrammarExplanation(
  input: GrammarCacheKey,
  generator: (normalized: GrammarCacheKey) => Promise<string> | string,
  options: { ttlSeconds?: number } = {}
): Promise<GrammarCacheLookupResult> {
  const normalized = normalizeLookup(input);
  const existing = await getCachedGrammarExplanation(normalized);
  if (existing) {
    return existing;
  }

  metrics.generationCount += 1;
  const generatedExplanation = await generator(normalized);
  const entry = await setCachedGrammarExplanation(normalized, generatedExplanation, {
    ttlSeconds: options.ttlSeconds,
  });

  return { entry, source: "generated" };
}

export async function warmGrammarExplanation(
  input: GrammarCacheKey,
  options: { ttlSeconds?: number } = {}
): Promise<GrammarCacheLookupResult> {
  return getOrGenerateGrammarExplanation(
    input,
    (normalized) => buildDefaultGrammarExplanation(normalized),
    options
  );
}

export function getLocalGrammarCacheSize(): number {
  sweepExpiredLocalEntries();
  return localCache.size;
}

export function getLocalGrammarCacheMemoryEstimateBytes(): number {
  sweepExpiredLocalEntries();
  return localCacheMemoryBytes;
}

export function getCacheMetrics(): GrammarCacheMetrics {
  sweepExpiredLocalEntries();
  const total = metrics.hitCount + metrics.missCount;

  return {
    hitCount: metrics.hitCount,
    missCount: metrics.missCount,
    redisHit: metrics.redisHit,
    localHit: metrics.localHit,
    generationCount: metrics.generationCount,
    localCacheSize: localCache.size,
    localCacheMemoryBytes,
    hitRatio: total === 0 ? 0 : Number((metrics.hitCount / total).toFixed(4)),
  };
}
