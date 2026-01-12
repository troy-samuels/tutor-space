import type { NextRequest } from "next/server";
import { defaultLocale, locales, type Locale } from "./lib/i18n/edge-config";

const ADMIN_SESSION_COOKIE = "tl_admin_session";
const GATE_SESSION_COOKIE = "tl_site_gate";
const ADMIN_PUBLIC_ROUTES = ["/admin/login"];
const SUPPORTED_LOCALES = new Set<Locale>(locales);

// Country code to locale mapping for geolocation-based detection
const COUNTRY_TO_LOCALE: Partial<Record<string, Locale>> = {
  // Spanish-speaking countries
  ES: "es", MX: "es", AR: "es", CO: "es", PE: "es", CL: "es", VE: "es", EC: "es",
  GT: "es", CU: "es", BO: "es", DO: "es", HN: "es", PY: "es", SV: "es", NI: "es",
  CR: "es", PA: "es", UY: "es", PR: "es",
  // Portuguese-speaking countries
  BR: "pt", PT: "pt", AO: "pt", MZ: "pt",
  // French-speaking countries
  FR: "fr", BE: "fr", CH: "fr", CA: "fr", SN: "fr", CI: "fr", ML: "fr",
  // German-speaking countries
  DE: "de", AT: "de",
  // Italian
  IT: "it",
  // Dutch
  NL: "nl",
  // Japanese
  JP: "ja",
  // Korean
  KR: "ko",
  // Chinese-speaking countries/regions
  CN: "zh", TW: "zh", HK: "zh", SG: "zh",
};

function getLocaleFromCountry(countryCode: string): Locale | null {
  const locale = COUNTRY_TO_LOCALE[countryCode.toUpperCase()];
  return locale && SUPPORTED_LOCALES.has(locale) ? locale : null;
}

const LOCALE_SPECIFIC_PATHS = ["/blog", "/help"];

function getPathLocale(pathname: string): Locale | null {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return SUPPORTED_LOCALES.has(firstSegment as Locale) ? (firstSegment as Locale) : null;
}

function getPreferredLocale(request: NextRequest): Locale {
  // 0. Internal rewrite header (set by this middleware)
  const forcedLocale = request.headers.get("x-locale");
  if (forcedLocale && SUPPORTED_LOCALES.has(forcedLocale as Locale)) {
    return forcedLocale as Locale;
  }

  // 1. Check stored cookie preference (user's explicit choice)
  const cookieLocale = getCookieValue(request, "NEXT_LOCALE");
  if (cookieLocale && SUPPORTED_LOCALES.has(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Check Vercel geolocation header (country-based detection)
  const country = request.headers.get("x-vercel-ip-country");
  if (country) {
    const geoLocale = getLocaleFromCountry(country);
    if (geoLocale) {
      return geoLocale;
    }
  }

  // 3. Check Accept-Language header (browser preference)
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage
      .split(",")
      .map((entry) => entry.split(";")[0]?.trim().toLowerCase())
      .find((lang) => SUPPORTED_LOCALES.has(lang as Locale) || SUPPORTED_LOCALES.has(lang?.split("-")[0] as Locale));

    if (preferred) {
      const normalized = SUPPORTED_LOCALES.has(preferred as Locale)
        ? (preferred as Locale)
        : (preferred.split("-")[0] as Locale);
      if (SUPPORTED_LOCALES.has(normalized)) {
        return normalized;
      }
    }
  }

  // 4. Fall back to default locale (English)
  return defaultLocale;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCookieValue(request: NextRequest, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapeRegExp(name)}=([^;]*)`));
  if (!match) return null;

  const value = match[1] ?? "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function appendMiddlewareCookie(headers: Headers, cookie: string) {
  const existing = headers.get("x-middleware-set-cookie");
  headers.set("x-middleware-set-cookie", existing ? `${existing},${cookie}` : cookie);
}

function buildLocaleCookie(locale: Locale, requestUrl: string) {
  const encoded = encodeURIComponent(locale);
  const secure = requestUrl.startsWith("https://");
  return `NEXT_LOCALE=${encoded}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function nextResponse(headers?: HeadersInit, pathname?: string) {
  const nextHeaders = new Headers(headers);
  nextHeaders.set("x-middleware-next", "1");
  // Set pathname header so layouts can access the current path
  if (pathname) {
    nextHeaders.set("x-pathname", pathname);
  }
  return new Response(null, { headers: nextHeaders });
}

function redirectResponse(url: URL, headers?: HeadersInit, status = 307) {
  const redirectHeaders = new Headers(headers);
  redirectHeaders.set("Location", url.toString());
  return new Response(null, { status, headers: redirectHeaders });
}

export function proxy(request: NextRequest) {
  try {
    const { pathname } = new URL(request.url);
    const pathLocale = getPathLocale(pathname);
    const preferredLocale = pathLocale ?? getPreferredLocale(request);
    const normalizedPathname = pathLocale ? pathname.replace(`/${pathLocale}`, "") || "/" : pathname;

    // Backwards-compatible redirect: `/student-auth/*` → `/student/*`
    if (normalizedPathname === "/student-auth" || normalizedPathname.startsWith("/student-auth/")) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = normalizedPathname.replace(/^\/student-auth(?=\/|$)/, "/student");
      return redirectResponse(redirectUrl);
    }

    // Password gate check - blocks entire site until password is entered
    const gateEnabled =
      typeof process !== "undefined" &&
      typeof process.env !== "undefined" &&
      process.env.SITE_GATE_ENABLED === "true";
    if (gateEnabled) {
      const isGateWhitelisted =
        normalizedPathname === "/password-gate" ||
        normalizedPathname.startsWith("/api/password-gate") ||
        normalizedPathname.startsWith("/api") ||
        normalizedPathname.startsWith("/_next") ||
        normalizedPathname.startsWith("/brand");

      if (!isGateWhitelisted) {
        const gateSession = getCookieValue(request, GATE_SESSION_COOKIE);
        if (!gateSession) {
          return redirectResponse(new URL("/password-gate", request.url));
        }
      }
    }

    if (pathname === "/") {
      // Keep "/" canonical; let next-intl use cookie/header to pick the locale.
      const headers = new Headers();
      appendMiddlewareCookie(headers, buildLocaleCookie(preferredLocale, request.url));
      return nextResponse(headers, normalizedPathname);
    }

    // Locale-prefixed landing page: redirect to "/" and persist locale in cookie.
    if (pathLocale && (pathname === `/${pathLocale}` || pathname === `/${pathLocale}/`)) {
      const headers = new Headers();
      appendMiddlewareCookie(headers, buildLocaleCookie(pathLocale, request.url));
      return redirectResponse(new URL("/", request.url), headers);
    }

    if (pathLocale === defaultLocale && normalizedPathname !== "/") {
      const redirectUrl = new URL(normalizedPathname || "/", request.url);
      const headers = new Headers();
      appendMiddlewareCookie(headers, buildLocaleCookie(pathLocale, request.url));
      return redirectResponse(redirectUrl, headers);
    }

    if (
      pathLocale &&
      pathLocale !== defaultLocale &&
      normalizedPathname !== "/" &&
      !LOCALE_SPECIFIC_PATHS.some((prefix) => normalizedPathname.startsWith(prefix))
    ) {
      const redirectUrl = new URL(normalizedPathname || "/", request.url);
      const headers = new Headers();
      appendMiddlewareCookie(headers, buildLocaleCookie(pathLocale, request.url));
      return redirectResponse(redirectUrl, headers);
    }

    if (normalizedPathname.startsWith("/api") || normalizedPathname.startsWith("/app/api")) {
      return nextResponse();
    }

    // Handle admin routes separately
    if (normalizedPathname.startsWith("/admin")) {
      // Allow public admin routes (login page)
      if (ADMIN_PUBLIC_ROUTES.some((route) => normalizedPathname === route)) {
        return nextResponse();
      }

      // Check for admin session cookie
      const adminSession = getCookieValue(request, ADMIN_SESSION_COOKIE);
      if (!adminSession) {
        return redirectResponse(new URL("/admin/login", request.url));
      }

      // Admin is authenticated, allow access
      return nextResponse();
    }

    // =====================================================
    // STUDENT/TUTOR ROUTE SEPARATION (Enterprise Grade)
    // Ensures students NEVER get redirected to tutor flows
    // =====================================================

    // STUDENT ROUTES - Allow through immediately
    // Student pages handle their own auth via student_auth_token cookie or user_id
    if (normalizedPathname.startsWith("/student")) {
      const headers = new Headers();
      appendMiddlewareCookie(headers, buildLocaleCookie(preferredLocale, request.url));
      return nextResponse(headers, normalizedPathname);
    }

    // TUTOR-ONLY ROUTES - Protected by dashboard layout
    // These routes should ONLY be accessible to authenticated tutors
    // The dashboard layout.tsx handles the actual role verification
    const TUTOR_PROTECTED_ROUTES = [
      "/dashboard",
      "/bookings",
      "/students",
      "/services",
      "/availability",
      "/pages",
      "/settings",
      "/analytics",
      "/calendar",
      "/digital-products",
      "/messages",
      "/classroom",
      "/practice-scenarios",
      "/marketplace",
      "/ai",
      "/copilot",
      "/notifications",
      "/upgrade",
      "/onboarding",
    ];

    const isTutorRoute = TUTOR_PROTECTED_ROUTES.some(
      (route) => normalizedPathname === route || normalizedPathname.startsWith(route + "/")
    );

    if (isTutorRoute) {
      // Tutor routes proceed to layout.tsx for full auth/role verification
      const headers = new Headers();
      appendMiddlewareCookie(headers, buildLocaleCookie(preferredLocale, request.url));
      return nextResponse(headers, normalizedPathname);
    }

    const headers = new Headers();
    appendMiddlewareCookie(headers, buildLocaleCookie(preferredLocale, request.url));
    return nextResponse(headers, normalizedPathname);
  } catch (error) {
    console.error("[proxy] Invocation failed", error);
    return nextResponse(undefined, "");
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
