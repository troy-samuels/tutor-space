import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_SESSION_COOKIE = "tl_admin_session";
const ADMIN_PUBLIC_ROUTES = ["/admin/login"];

const AI_ROUTE_ENABLED = process.env.NEXT_PUBLIC_AI_TOOLS_ENABLED === "true";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/availability",
  "/bookings",
  "/students",
  "/services",
  "/pages",
  "/settings",
  "/analytics",
  "/marketing",
  "/onboarding",
];

// Routes that require completed onboarding
const ONBOARDING_REQUIRED_ROUTES = [
  "/dashboard",
  "/availability",
  "/bookings",
  "/students",
  "/services",
  "/pages",
  "/settings",
  "/analytics",
  "/marketing",
];

const GROWTH_ROUTES: string[] = [];
const STUDIO_ROUTES: string[] = [];

function routeMatches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname.startsWith(route));
}

function createSupabaseClient(request: NextRequest, response: NextResponse) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Handle admin routes separately
  if (pathname.startsWith("/admin")) {
    // Allow public admin routes (login page)
    if (ADMIN_PUBLIC_ROUTES.some((route) => pathname === route)) {
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

  // Handle Supabase session
  const response = await updateSession(request);

  if (!routeMatches(pathname, PROTECTED_ROUTES)) {
    return response;
  }

  const supabase = createSupabaseClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectTarget = `${pathname}${request.nextUrl.search}`;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  // Check onboarding status for protected routes (except /onboarding itself)
  const requiresOnboarding = routeMatches(pathname, ONBOARDING_REQUIRED_ROUTES);
  if (requiresOnboarding) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    // Redirect to onboarding if not completed
    // onboarding_completed will be false or null for new users
    if (profile && profile.onboarding_completed !== true) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
  }

  const isGrowthRoute = routeMatches(pathname, GROWTH_ROUTES);
  const isStudioRoute = routeMatches(pathname, STUDIO_ROUTES);

  // Growth/Studio gating disabled: single-tier access for tutors

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
