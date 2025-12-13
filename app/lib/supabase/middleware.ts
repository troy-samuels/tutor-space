import { createServerClient } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type UpdateSessionResult = {
  response: NextResponse;
  supabase: SupabaseClient;
  session: Awaited<ReturnType<SupabaseClient["auth"]["getSession"]>>["data"]["session"];
};

export async function updateSession(
  request: NextRequest,
  response?: NextResponse
): Promise<UpdateSessionResult | NextResponse> {
  let supabaseResponse = response || NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error(
      "[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set({ name, value, ...options });
        });
        const nextResponse = supabaseResponse || NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          nextResponse.cookies.set(name, value, options)
        );
        supabaseResponse = nextResponse;
      },
    },
  });

  // Refresh cookies if needed. `getSession()` avoids an auth network call in the
  // common case (valid access token), but will still refresh via the auth API
  // when the access token has expired.
  const { data } = await supabase.auth.getSession();

  return { response: supabaseResponse, supabase, session: data.session };
}
