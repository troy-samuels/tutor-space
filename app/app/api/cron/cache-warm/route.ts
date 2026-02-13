import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function validateCronRequest(request: NextRequest): { ok: true; secret: string } | { ok: false; response: NextResponse } {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[CronCacheWarm] CRON_SECRET is not configured");
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true, secret: cronSecret };
}

async function triggerWarmEndpoint(request: NextRequest, secret: string): Promise<Response> {
  const warmUrl = new URL("/api/admin/cache/warm", request.url);
  return fetch(warmUrl.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      "X-Cache-Warm-Trigger": "cron",
    },
    cache: "no-store",
  });
}

async function handleCronWarm(request: NextRequest) {
  const validation = validateCronRequest(request);
  if (!validation.ok) {
    return validation.response;
  }

  const startedAt = Date.now();

  try {
    const warmResponse = await triggerWarmEndpoint(request, validation.secret);
    const payload = await warmResponse.json().catch(() => null);

    if (!warmResponse.ok) {
      return NextResponse.json(
        {
          error: "Warm endpoint failed",
          status: warmResponse.status,
          payload,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      triggeredAt: new Date(startedAt).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      warm: payload,
    });
  } catch (error) {
    console.error("[CronCacheWarm] Failed to trigger cache warm endpoint:", error);
    return NextResponse.json(
      { error: "Failed to trigger cache warm endpoint" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleCronWarm(request);
}

export async function POST(request: NextRequest) {
  return handleCronWarm(request);
}
