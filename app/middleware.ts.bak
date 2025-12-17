import { NextResponse, type NextRequest } from "next/server";
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
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
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

function setLocaleCookie(response: NextResponse, locale: Locale) {
  response.cookies.set("NEXT_LOCALE", locale, { path: "/", sameSite: "lax" });
}

function withLocalePath(pathname: string, locale: Locale) {
  return pathname === "/"
    ? `/${locale}`
    : `/${locale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const pathLocale = getPathLocale(pathname);
    const preferredLocale = pathLocale ?? getPreferredLocale(request);
    const normalizedPathname = pathLocale ? pathname.replace(`/${pathLocale}`, "") || "/" : pathname;
    const localePrefixEnabled = Boolean(pathLocale);

    // Backwards-compatible redirect: `/student-auth/*` → `/student/*`
    if (normalizedPathname === "/student-auth" || normalizedPathname.startsWith("/student-auth/")) {
      const url = request.nextUrl.clone();
      url.pathname = normalizedPathname.replace(/^\/student-auth(?=\/|$)/, "/student");
      return NextResponse.redirect(url);
    }

    // Password gate check - blocks entire site until password is entered
    const gateEnabled = process.env.SITE_GATE_ENABLED === "true";
    if (gateEnabled) {
      const isGateWhitelisted =
        normalizedPathname === "/password-gate" ||
        normalizedPathname.startsWith("/api/password-gate") ||
        normalizedPathname.startsWith("/api") ||
        normalizedPathname.startsWith("/_next") ||
        normalizedPathname.startsWith("/brand");

      if (!isGateWhitelisted) {
        const gateSession = request.cookies.get(GATE_SESSION_COOKIE)?.value;
        if (!gateSession) {
          return NextResponse.redirect(new URL("/password-gate", request.url));
        }
      }
    }

    if (pathname === "/") {
      // Keep "/" canonical; let next-intl use cookie/header to pick the locale.
      const response = NextResponse.next();
      setLocaleCookie(response, preferredLocale);
      return response;
    }

    // Locale-prefixed landing page: redirect to "/" and persist locale in cookie.
    if (pathLocale && (pathname === `/${pathLocale}` || pathname === `/${pathLocale}/`)) {
      const response = NextResponse.redirect(new URL("/", request.url));
      setLocaleCookie(response, pathLocale);
      return response;
    }

    if (pathLocale === defaultLocale && normalizedPathname !== "/") {
      const redirectUrl = new URL(normalizedPathname || "/", request.url);
      const response = NextResponse.redirect(redirectUrl);
      setLocaleCookie(response, pathLocale);
      return response;
    }

    if (
      pathLocale &&
      pathLocale !== defaultLocale &&
      normalizedPathname !== "/" &&
      !LOCALE_SPECIFIC_PATHS.some((prefix) => normalizedPathname.startsWith(prefix))
    ) {
      const redirectUrl = new URL(normalizedPathname || "/", request.url);
      const response = NextResponse.redirect(redirectUrl);
      setLocaleCookie(response, pathLocale);
      return response;
    }

    if (normalizedPathname.startsWith("/api") || normalizedPathname.startsWith("/app/api")) {
      return NextResponse.next();
    }

    // Handle admin routes separately
    if (normalizedPathname.startsWith("/admin")) {
      // Allow public admin routes (login page)
      if (ADMIN_PUBLIC_ROUTES.some((route) => normalizedPathname === route)) {
        return NextResponse.next();
      }

      // Check for admin session cookie
      const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE);
      if (!adminSession?.value) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      // Admin is authenticated, allow access
      return NextResponse.next();
    }

    const response = NextResponse.next();
    setLocaleCookie(response, preferredLocale);
    return response;
  } catch (error) {
    console.error("[middleware] Invocation failed", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
