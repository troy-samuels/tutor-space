import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/calendar";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[Supabase] OAuth exchange failed:", error);
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // Update last_login_at for tutors (for churn tracking)
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) {
    const serviceClient = createServiceRoleClient();
    if (serviceClient) {
      await serviceClient
        .from("profiles")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id)
        .eq("role", "tutor");
    }
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isLocal = process.env.NODE_ENV === "development";

  if (isLocal) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (forwardedHost && forwardedProto) {
    return NextResponse.redirect(`${forwardedProto}://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

