import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route for email verification links.
 *
 * Instead of exposing raw Supabase URLs like:
 *   https://[project].supabase.co/auth/v1/verify?token=...
 *
 * Users see friendly URLs like:
 *   https://tutorlingua.co/api/auth/verify?token=...
 *
 * This route extracts the token and redirects to the actual Supabase
 * verification endpoint, which then redirects back to our app.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const type = searchParams.get("type") || "magiclink";
  const redirectTo = searchParams.get("redirect_to");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url)
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("[Auth Verify] NEXT_PUBLIC_SUPABASE_URL is not configured");
    return NextResponse.redirect(
      new URL("/login?error=configuration_error", request.url)
    );
  }

  // Construct the Supabase verification URL
  const verifyUrl = new URL(`${supabaseUrl}/auth/v1/verify`);
  verifyUrl.searchParams.set("token", token);
  verifyUrl.searchParams.set("type", type);

  if (redirectTo) {
    verifyUrl.searchParams.set("redirect_to", redirectTo);
  }

  // Redirect to Supabase to complete verification
  return NextResponse.redirect(verifyUrl.toString());
}
