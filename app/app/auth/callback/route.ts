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

      // Auto-create trial subscription for new tutors on professional (free) plan
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("role, plan")
        .eq("id", user.id)
        .single();

      if (profile?.role === "tutor" && profile.plan === "professional") {
        const { createAutoTrial } = await import("@/lib/actions/trial");
        const result = await createAutoTrial(
          user.id,
          user.email ?? "",
          user.user_metadata?.full_name as string | undefined
        );

        if (result.success) {
          if ("skipped" in result) {
            console.log(`[Auth Callback] Auto-trial skipped for ${user.id}: ${result.reason}`);
          } else {
            console.log(`[Auth Callback] Auto-trial started for ${user.id}: ${result.subscriptionId}`);
          }
        } else {
          console.error(`[Auth Callback] Auto-trial failed for ${user.id}:`, result.error);
          // Don't block the callback - user can still start trial manually from billing page
        }
      }
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

