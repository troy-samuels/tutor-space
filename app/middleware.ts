import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/availability",
  "/bookings",
  "/students",
  "/services",
  "/settings",
  "/analytics",
  "/marketing",
];

const GROWTH_ROUTES = ["/ai", "/analytics", "/marketing"];
const STUDIO_ROUTES = ["/group-sessions", "/marketplace", "/ceo"];

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
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

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

  const isGrowthRoute = routeMatches(pathname, GROWTH_ROUTES);
  const isStudioRoute = routeMatches(pathname, STUDIO_ROUTES);

  if (isGrowthRoute || isStudioRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    const plan = profile?.plan ?? "professional";
    const hasGrowthAccess = plan === "growth" || plan === "studio";
    const hasStudioAccess = plan === "studio";

    if (isStudioRoute && !hasStudioAccess) {
      return NextResponse.redirect(new URL("/upgrade?plan=studio", request.url));
    }

    if (isGrowthRoute && !hasGrowthAccess) {
      return NextResponse.redirect(new URL("/upgrade?plan=growth", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
