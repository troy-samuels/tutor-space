import test from "node:test";
import assert from "node:assert/strict";

/**
 * Middleware Redirect Tests
 *
 * Verifies that:
 * 1. /calendar is in PROTECTED_ROUTES
 * 2. Unpaid users (plan='professional') are redirected to /settings/billing
 * 3. Paid users (Pro/Studio/Lifetime) can access protected routes
 * 4. Studio routes require Studio tier (upgrade redirect)
 * 5. Certain routes are allowed for unpaid users (billing, profile, payments, onboarding)
 *
 * Reference: middleware.ts:9-21, 124-139
 */

// Constants copied from middleware.ts for verification (simplified; no locale/admin logic)
const PRO_ROUTES = [
  "/dashboard",
  "/calendar",
  "/availability",
  "/bookings",
  "/students",
  "/services",
  "/pages",
  "/settings",
  "/analytics",
  "/marketing",
];

const STUDIO_ROUTES = ["/studio", "/lesson", "/classroom"];

const PROTECTED_ROUTES = [...PRO_ROUTES, ...STUDIO_ROUTES, "/onboarding"];

const SUBSCRIPTION_ALLOWED_ROUTES = ["/settings/billing", "/settings/profile", "/settings/payments", "/onboarding"];

const PRO_PLANS = [
  "pro_monthly",
  "pro_annual",
  "tutor_life",
  // legacy
  "all_access",
  "founder_lifetime",
];

const STUDIO_PLANS = [
  "studio_monthly",
  "studio_annual",
  "studio_life",
];

// Helper function matching middleware logic
function routeMatches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname.startsWith(route));
}

function hasProAccess(plan: string | null): boolean {
  if (!plan) return false;
  return PRO_PLANS.includes(plan) || STUDIO_PLANS.includes(plan);
}

function hasStudioAccess(plan: string | null): boolean {
  if (!plan) return false;
  return STUDIO_PLANS.includes(plan);
}

function getRedirectTarget(pathname: string, plan: string | null): string | null {
  const isAllowedForUnpaid = routeMatches(pathname, SUBSCRIPTION_ALLOWED_ROUTES);
  const requiresStudio = routeMatches(pathname, STUDIO_ROUTES);
  const requiresPro = routeMatches(pathname, PRO_ROUTES);

  // Studio routes require Studio tier subscription
  if (requiresStudio && !hasStudioAccess(plan)) {
    const url = new URL("http://localhost/settings/billing");
    url.searchParams.set("upgrade", "studio");
    return `${url.pathname}?${url.searchParams.toString()}`;
  }

  // Pro routes require any paid subscription (Pro or Studio tier)
  if (!isAllowedForUnpaid && requiresPro && !hasProAccess(plan)) {
    const url = new URL("http://localhost/settings/billing");
    url.searchParams.set("subscribe", "1");
    return `${url.pathname}?${url.searchParams.toString()}`;
  }

  return null;
}

// Tests for PROTECTED_ROUTES configuration
test("/calendar is in PROTECTED_ROUTES", () => {
  assert.ok(
    PROTECTED_ROUTES.includes("/calendar"),
    "/calendar should be a protected route"
  );
});

test("/dashboard is in PROTECTED_ROUTES", () => {
  assert.ok(
    PROTECTED_ROUTES.includes("/dashboard"),
    "/dashboard should be a protected route"
  );
});

test("/bookings is in PROTECTED_ROUTES", () => {
  assert.ok(
    PROTECTED_ROUTES.includes("/bookings"),
    "/bookings should be a protected route"
  );
});

test("/availability is in PROTECTED_ROUTES", () => {
  assert.ok(
    PROTECTED_ROUTES.includes("/availability"),
    "/availability should be a protected route"
  );
});

test("/classroom is in PROTECTED_ROUTES (Studio tier)", () => {
  assert.ok(
    PROTECTED_ROUTES.includes("/classroom"),
    "/classroom should be a protected route"
  );
});

// Tests for SUBSCRIPTION_ALLOWED_ROUTES
test("/settings/billing is allowed for unpaid users", () => {
  assert.ok(
    routeMatches("/settings/billing", SUBSCRIPTION_ALLOWED_ROUTES),
    "/settings/billing should be allowed for unpaid users"
  );
});

test("/settings/profile is allowed for unpaid users", () => {
  assert.ok(
    routeMatches("/settings/profile", SUBSCRIPTION_ALLOWED_ROUTES),
    "/settings/profile should be allowed for unpaid users"
  );
});

test("/onboarding is allowed for unpaid users", () => {
  assert.ok(
    routeMatches("/onboarding", SUBSCRIPTION_ALLOWED_ROUTES),
    "/onboarding should be allowed for unpaid users"
  );
});

test("/settings/payments is allowed for unpaid users", () => {
  assert.ok(
    routeMatches("/settings/payments", SUBSCRIPTION_ALLOWED_ROUTES),
    "/settings/payments should be allowed for unpaid users"
  );
});

// Tests for redirect logic with unpaid users
test("unpaid user (plan=professional) accessing /calendar should redirect to billing", () => {
  const redirectTarget = getRedirectTarget("/calendar", "professional");
  assert.equal(
    redirectTarget,
    "/settings/billing?subscribe=1",
    "Unpaid user should be redirected from /calendar"
  );
});

test("unpaid user (plan=professional) accessing /dashboard should redirect to billing", () => {
  const redirectTarget = getRedirectTarget("/dashboard", "professional");
  assert.equal(
    redirectTarget,
    "/settings/billing?subscribe=1",
    "Unpaid user should be redirected from /dashboard"
  );
});

test("unpaid user (plan=null) accessing /calendar should redirect to billing", () => {
  const redirectTarget = getRedirectTarget("/calendar", null);
  assert.equal(
    redirectTarget,
    "/settings/billing?subscribe=1",
    "User with null plan should be redirected from /calendar"
  );
});

test("unpaid user accessing /settings/billing should NOT redirect", () => {
  const redirectTarget = getRedirectTarget("/settings/billing", "professional");
  assert.equal(
    redirectTarget,
    null,
    "Unpaid user should NOT be redirected from /settings/billing"
  );
});

test("unpaid user accessing /settings/profile should NOT redirect", () => {
  const redirectTarget = getRedirectTarget("/settings/profile", "professional");
  assert.equal(
    redirectTarget,
    null,
    "Unpaid user should NOT be redirected from /settings/profile"
  );
});

test("unpaid user accessing /onboarding should NOT redirect", () => {
  const redirectTarget = getRedirectTarget("/onboarding", "professional");
  assert.equal(
    redirectTarget,
    null,
    "Unpaid user should NOT be redirected from /onboarding"
  );
});

// Tests for paid users accessing protected routes
test("paid user (plan=pro_monthly) accessing /calendar should NOT redirect", () => {
  const redirectTarget = getRedirectTarget("/calendar", "pro_monthly");
  assert.equal(
    redirectTarget,
    null,
    "User with pro_monthly plan should access /calendar"
  );
});

test("paid user (plan=tutor_life) accessing /calendar should NOT redirect", () => {
  const redirectTarget = getRedirectTarget("/calendar", "tutor_life");
  assert.equal(
    redirectTarget,
    null,
    "User with tutor_life plan should access /calendar"
  );
});

test("paid user (plan=studio_monthly) accessing /dashboard should NOT redirect", () => {
  const redirectTarget = getRedirectTarget("/dashboard", "studio_monthly");
  assert.equal(
    redirectTarget,
    null,
    "User with studio_monthly plan should access /dashboard"
  );
});

test("Pro user accessing /classroom should redirect to Studio upgrade", () => {
  const redirectTarget = getRedirectTarget("/classroom/123", "pro_monthly");
  assert.equal(
    redirectTarget,
    "/settings/billing?upgrade=studio",
    "Pro user should be redirected from /classroom to Studio upgrade"
  );
});

test("Studio user accessing /classroom should NOT redirect", () => {
  const redirectTarget = getRedirectTarget("/classroom/123", "studio_monthly");
  assert.equal(
    redirectTarget,
    null,
    "Studio user should access /classroom"
  );
});

// Test for the specific redirect URL format
test("redirect URL should include subscribe=1 query param", () => {
  // This documents the expected redirect behavior from middleware.ts:136-138
  const expectedRedirectPath = "/settings/billing";
  const expectedQueryParam = "subscribe=1";

  // Simulating: billingUrl.searchParams.set("subscribe", "1")
  const billingUrl = new URL(`http://localhost${expectedRedirectPath}`);
  billingUrl.searchParams.set("subscribe", "1");

  assert.equal(billingUrl.pathname, expectedRedirectPath);
  assert.equal(billingUrl.searchParams.get("subscribe"), "1");
  assert.ok(
    billingUrl.toString().includes(expectedQueryParam),
    `Redirect URL should include ${expectedQueryParam}`
  );
});

// Verify paid plans list matches middleware
test("PAID_PLANS should include Pro and Studio plans", () => {
  assert.ok(PRO_PLANS.includes("pro_monthly"), "pro_monthly should be a paid plan");
  assert.ok(STUDIO_PLANS.includes("studio_monthly"), "studio_monthly should be a paid plan");
  assert.ok(PRO_PLANS.includes("tutor_life"), "tutor_life should be a paid plan");
});

// Edge case: nested routes
test("/settings/billing/something should NOT redirect (startsWith match)", () => {
  const redirectTarget = getRedirectTarget("/settings/billing/something", "professional");
  assert.equal(redirectTarget, null, "Nested billing routes should also be allowed");
});

test("/calendar/week should redirect for unpaid users (startsWith match)", () => {
  // Note: /calendar is protected, so /calendar/week would need auth first
  // This test verifies the billing redirect would apply if route matches
  const isProtected = routeMatches("/calendar/week", PROTECTED_ROUTES);
  assert.ok(isProtected, "/calendar/week should match protected routes via startsWith");
});
