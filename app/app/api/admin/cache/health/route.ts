import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getSemanticCacheHealth } from "@/lib/ai/semantic-cache";
import {
  getCacheMetrics,
  getLocalGrammarCacheMemoryEstimateBytes,
  getLocalGrammarCacheSize,
} from "@/lib/practice/grammar-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const redisHealth = await getSemanticCacheHealth();
    const metrics = getCacheMetrics();
    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      redis: {
        configured: redisHealth.configured,
        status: redisHealth.status,
        reconnectScheduled: redisHealth.reconnectScheduled,
        reconnectAt: redisHealth.reconnectAt,
        lastError: redisHealth.lastError,
        lastFailureAt: redisHealth.lastFailureAt,
      },
      localCache: {
        size: getLocalGrammarCacheSize(),
        memoryBytesEstimate: getLocalGrammarCacheMemoryEstimateBytes(),
      },
      metrics: {
        hitCount: metrics.hitCount,
        missCount: metrics.missCount,
        redisHit: metrics.redisHit,
        localHit: metrics.localHit,
        generationCount: metrics.generationCount,
        hitMissRatio: metrics.hitRatio,
      },
      memoryUsageEstimate: {
        processHeapUsedBytes: memoryUsage.heapUsed,
        processRssBytes: memoryUsage.rss,
      },
    });
  } catch (error) {
    console.error("[AdminCacheHealth] Failed to fetch cache health:", error);

    if (
      error instanceof Error
      && (error.message.toLowerCase().includes("authentication")
        || error.message.toLowerCase().includes("admin"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch cache health" },
      { status: 500 }
    );
  }
}
