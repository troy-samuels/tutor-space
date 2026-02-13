import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { GRAMMAR_CATEGORY_SLUGS } from "@/lib/practice/grammar-categories";
import {
  getCacheMetrics,
  warmGrammarExplanation,
  type GrammarCacheKey,
} from "@/lib/practice/grammar-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TARGET_LANGUAGES = ["es", "fr", "de", "it", "pt", "en"] as const;
const TARGET_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const EXTRA_WARM_CATEGORIES = [
  "adjective-agreement",
  "adverb-placement",
  "negation",
  "question-formation",
  "sentence-structure",
  "modal-verbs",
  "conditional",
  "reflexive-verbs",
  "punctuation",
] as const;

const WARM_CATEGORIES = [...GRAMMAR_CATEGORY_SLUGS, ...EXTRA_WARM_CATEGORIES].slice(0, 20);
const WARM_CONCURRENCY = 12;

type WarmResult = {
  key: string;
  source: "local" | "redis" | "generated";
  error: string | null;
};

async function authorizeWarmRequest(request: NextRequest): Promise<"admin" | "cron"> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return "cron";
  }

  await requireAdmin(request);
  return "admin";
}

function buildWarmupEntries(): GrammarCacheKey[] {
  const entries: GrammarCacheKey[] = [];

  for (const category of WARM_CATEGORIES) {
    for (const language of TARGET_LANGUAGES) {
      for (const level of TARGET_LEVELS) {
        entries.push({ category, language, level });
      }
    }
  }

  return entries;
}

function formatWarmKey(entry: GrammarCacheKey): string {
  return `${entry.language}:${entry.level}:${entry.category}`;
}

async function runWarmup(entries: GrammarCacheKey[]): Promise<WarmResult[]> {
  const results: WarmResult[] = new Array(entries.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const current = cursor;
      cursor += 1;

      if (current >= entries.length) {
        return;
      }

      const entry = entries[current];
      const key = formatWarmKey(entry);

      try {
        const result = await warmGrammarExplanation(entry);
        results[current] = {
          key,
          source: result.source,
          error: null,
        };
      } catch (error) {
        results[current] = {
          key,
          source: "generated",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  const workerCount = Math.min(WARM_CONCURRENCY, entries.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const source = await authorizeWarmRequest(request);
    const entries = buildWarmupEntries();
    const results = await runWarmup(entries);

    let generated = 0;
    let alreadyWarm = 0;
    let failed = 0;
    const failures: Array<{ key: string; error: string }> = [];

    for (const result of results) {
      if (result.error) {
        failed += 1;
        failures.push({ key: result.key, error: result.error });
        continue;
      }

      if (result.source === "generated") {
        generated += 1;
      } else {
        alreadyWarm += 1;
      }
    }

    return NextResponse.json({
      success: failed === 0,
      source,
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      combinations: entries.length,
      categories: WARM_CATEGORIES.length,
      languages: TARGET_LANGUAGES.length,
      levels: TARGET_LEVELS.length,
      generated,
      alreadyWarm,
      failed,
      failures: failures.slice(0, 20),
      metrics: getCacheMetrics(),
    });
  } catch (error) {
    console.error("[AdminCacheWarm] Failed to warm grammar cache:", error);

    if (
      error instanceof Error
      && (error.message.toLowerCase().includes("authentication")
        || error.message.toLowerCase().includes("admin"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to warm grammar cache" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
