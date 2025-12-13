import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const BASE_URL = process.env.CRAWL_BASE_URL ?? "http://localhost:3000";
const FETCH_TIMEOUT_MS = Number(process.env.CRAWL_TIMEOUT_MS ?? "8000");

async function fetchWithTimeout(url: URL, init: RequestInit = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

const DYNAMIC_SEGMENT_DEFAULTS: Record<string, { env: string; fallback: string }> = {
  username: { env: "CRAWL_USERNAME", fallback: "demo-tutor" },
  bookingId: { env: "CRAWL_BOOKING_ID", fallback: "demo-booking-id" },
  slug: { env: "CRAWL_BLOG_SLUG", fallback: "welcome" },
  assignmentId: { env: "CRAWL_ASSIGNMENT_ID", fallback: "demo-assignment-id" },
};

const WILDCARD_FALLBACKS: Record<string, string> = {
  "/settings/*": "/settings/profile",
  "/admin/*": "/admin/dashboard",
};

async function extractApplicationMapRoutes(): Promise<string[]> {
  const readmePath = fileURLToPath(new URL("../../README.md", import.meta.url));
  const content = await readFile(readmePath, "utf8");
  const sectionStart = content.indexOf("## Application Map");

  assert.notEqual(sectionStart, -1, "README is missing the Application Map section");

  const afterHeading = content.slice(sectionStart);
  const nextHeadingIndex = afterHeading.indexOf("## ", 5);
  const section = nextHeadingIndex === -1 ? afterHeading : afterHeading.slice(0, nextHeadingIndex);

  const routeMatches = section.matchAll(/\/[A-Za-z0-9[\]\-/*]+/g);
  const routes = Array.from(routeMatches, (match) => match[0]);

  return Array.from(new Set(routes));
}

function resolveRoute(route: string): { original: string; resolved: string } {
  const wildcardResolved = WILDCARD_FALLBACKS[route] ?? route.replace("/*", "");

  const resolved = wildcardResolved.replace(/\[([^\]]+)\]/g, (_, key: string) => {
    const config = DYNAMIC_SEGMENT_DEFAULTS[key];
    if (!config) {
      throw new Error(`No placeholder configured for dynamic segment [${key}] in route ${route}`);
    }
    return process.env[config.env] ?? config.fallback;
  }).replace(/\*/g, "overview");

  return { original: route, resolved };
}

test("Application Map routes respond without 4xx/5xx errors", async (t) => {
  if (!process.env.CRAWL_BASE_URL) {
    t.skip(
      "Set CRAWL_BASE_URL to run the route crawl against a running server " +
        "(e.g. CRAWL_BASE_URL=http://localhost:3000)."
    );
    return;
  }

  try {
    await fetchWithTimeout(new URL("/robots.txt", BASE_URL), { redirect: "follow" });
  } catch (error) {
    assert.fail(
      `Unable to reach CRAWL_BASE_URL (${BASE_URL}). Start the app or point ` +
        `CRAWL_BASE_URL at a deployed preview. Error: ${(error as Error).message}`
    );
  }

  const routes = await extractApplicationMapRoutes();
  assert.ok(routes.length > 0, "No routes were found in the Application Map section");

  for (const route of routes) {
    await t.test(`GET ${route}`, async () => {
      const { resolved } = resolveRoute(route);
      const response = await fetchWithTimeout(new URL(resolved, BASE_URL), { redirect: "follow" });

      assert.ok(
        response.status < 400,
        `Expected <400 but received ${response.status} for ${route} (resolved to ${resolved}). ` +
          `If this route requires real data, set the matching CRAWL_* env variable before running.`
      );
    });
  }
});
