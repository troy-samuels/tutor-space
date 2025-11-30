import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_CALENDAR_PROVIDERS, getProviderConfig } from "@/lib/calendar/config";
import { encrypt } from "@/lib/utils/crypto";
import { RateLimiters } from "@/lib/middleware/rate-limit";

type TokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  // SECURITY: Rate limit OAuth callbacks to prevent abuse
  const rateLimitResult = await RateLimiters.api(request);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: rateLimitResult.error },
      { status: 429 }
    );
  }

  const { provider } = await params;
  const typedProvider = provider as (typeof SUPPORTED_CALENDAR_PROVIDERS)[number];

  if (!SUPPORTED_CALENDAR_PROVIDERS.includes(typedProvider)) {
    return redirectWithMessage(request, {
      error: "unsupported_provider",
    });
  }

  const config = getProviderConfig(typedProvider);
  if (!config) {
    return redirectWithMessage(request, {
      error: "provider_not_configured",
    });
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieName = `calendar_oauth_state_${typedProvider}`;
  const cookieStore = await cookies();
  const storedState = cookieStore.get(cookieName)?.value;

  // Parse state to check for popup mode
  let stateId: string | null = null;
  let isPopup = false;

  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      stateId = stateData.id;
      isPopup = stateData.popup === true;
    } catch {
      // Fallback for old state format (plain UUID)
      stateId = state;
    }
  }

  if (oauthError) {
    return redirectWithMessage(request, {
      error: oauthError,
    }, isPopup);
  }

  if (!code || !state || !storedState || stateId !== storedState) {
    return redirectWithMessage(request, {
      error: "invalid_state",
    }, isPopup);
  }

  cookieStore.delete(cookieName);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithMessage(request, {
      error: "unauthenticated",
    }, isPopup);
  }

  const tokenPayload = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });

  let tokenResponse: TokenResponse | null = null;

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenPayload.toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed with status ${response.status}`);
    }

    tokenResponse = (await response.json()) as TokenResponse;
  } catch (error) {
    console.error("[Calendar OAuth] token exchange failed", error);
    return redirectWithMessage(request, {
      error: "token_exchange_failed",
    }, isPopup);
  }

  if (!tokenResponse?.access_token) {
    return redirectWithMessage(request, {
      error: "missing_access_token",
    }, isPopup);
  }

  let accountEmail: string | null = null;
  let accountName: string | null = null;
  let providerAccountId: string | null = null;

  try {
    const profileResponse = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error(`Profile request failed with status ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    if (typedProvider === "google") {
      providerAccountId = profileData.id ?? profileData.sub ?? null;
      accountEmail = profileData.email ?? null;
      accountName = profileData.name ?? null;
    } else {
      providerAccountId = profileData.id ?? null;
      accountEmail = profileData.mail ?? profileData.userPrincipalName ?? null;
      accountName = profileData.displayName ?? null;
    }
  } catch (error) {
    console.error("[Calendar OAuth] profile fetch failed", error);
    // Continue even if profile fetch fails; fallback to user id
    providerAccountId = providerAccountId ?? randomUUID();
  }

  if (!providerAccountId) {
    providerAccountId = randomUUID();
  }

  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
    : null;

  let accessTokenEncrypted: string;
  let refreshTokenEncrypted: string | null = null;

  try {
    accessTokenEncrypted = encrypt(tokenResponse.access_token);
    if (tokenResponse.refresh_token) {
      refreshTokenEncrypted = encrypt(tokenResponse.refresh_token);
    }
  } catch (error) {
    console.error("[Calendar OAuth] encryption failed", error);
    return redirectWithMessage(request, {
      error: "encryption_failed",
    }, isPopup);
  }

  const { error: upsertError } = await supabase.from("calendar_connections").upsert(
    {
      tutor_id: user.id,
      provider: typedProvider,
      provider_account_id: providerAccountId,
      account_email: accountEmail,
      account_name: accountName,
      access_token_encrypted: accessTokenEncrypted,
      refresh_token_encrypted: refreshTokenEncrypted,
      access_token_expires_at: expiresAt,
      scope: tokenResponse.scope ?? config.scopes.join(" "),
      sync_status: "healthy",
      last_synced_at: new Date().toISOString(),
      error_message: null,
    },
    {
      onConflict: "tutor_id,provider",
    }
  );

  if (upsertError) {
    console.error("[Calendar OAuth] saving connection failed", upsertError);
    return redirectWithMessage(request, {
      error: "persist_failed",
    }, isPopup);
  }

  return redirectWithMessage(request, {
    success: typedProvider,
  }, isPopup);
}

function redirectWithMessage(
  request: NextRequest,
  params: { success?: string; error?: string },
  isPopup: boolean = false
) {
  const origin = request.nextUrl.origin;
  // Redirect popups to callback page that auto-closes, regular flows to settings
  const targetPath = isPopup ? "/calendar-callback" : "/settings/calendar";
  const target = new URL(targetPath, origin);
  if (params.success) {
    target.searchParams.set("connected", params.success);
  }
  if (params.error) {
    target.searchParams.set("calendar_error", params.error);
  }
  return NextResponse.redirect(target);
}
