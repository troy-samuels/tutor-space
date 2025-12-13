"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { PlatformBillingPlan, PlanTier } from "@/lib/types/payments";

type Entitlements = {
  plan: PlatformBillingPlan;
  tier: PlanTier;
  isPaid: boolean;
  hasProAccess: boolean;
  hasStudioAccess: boolean;
};

// Tier helper constants (inline to avoid import issues)
const PRO_PLANS: PlatformBillingPlan[] = [
  "pro_monthly",
  "pro_annual",
  "tutor_life",
  "founder_lifetime",
  "all_access",
];

const STUDIO_PLANS: PlatformBillingPlan[] = [
  "studio_monthly",
  "studio_annual",
  "studio_life",
];

function getPlanTier(plan: PlatformBillingPlan): PlanTier {
  if (STUDIO_PLANS.includes(plan)) return "studio";
  if (PRO_PLANS.includes(plan)) return "pro";
  return "free";
}

function checkProAccess(plan: PlatformBillingPlan): boolean {
  return PRO_PLANS.includes(plan) || STUDIO_PLANS.includes(plan);
}

function checkStudioAccess(plan: PlatformBillingPlan): boolean {
  return STUDIO_PLANS.includes(plan);
}

type Profile = {
  id: string;
  full_name: string | null;
  email?: string | null;
  role: string;
  subscription_status?: string | null;
  avatar_url?: string | null;
  plan?: string | null;
  username?: string | null;
};

export type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  entitlements: Entitlements;
  loading: boolean;
};

type AuthProviderProps = {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialEntitlements?: Entitlements;
};

const defaultEntitlements: Entitlements = {
  plan: "professional",
  tier: "free",
  isPaid: false,
  hasProAccess: false,
  hasStudioAccess: false,
};

const MAX_AUTH_RETRIES = 2;
const RETRY_DELAY_MS = 200;

const isDebug = process.env.NODE_ENV !== "production";

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  entitlements: defaultEntitlements,
  loading: true,
});

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
  initialEntitlements,
}: AuthProviderProps) {
  const initialPlan = (initialEntitlements?.plan ??
    (initialProfile?.plan as PlatformBillingPlan | undefined) ??
    "professional") as PlatformBillingPlan;
  const initialTier = getPlanTier(initialPlan);
  const derivedInitialEntitlements: Entitlements =
    initialEntitlements ??
    ({
      plan: initialPlan,
      tier: initialTier,
      isPaid: checkProAccess(initialPlan),
      hasProAccess: checkProAccess(initialPlan),
      hasStudioAccess: checkStudioAccess(initialPlan),
    } as const);

  const shouldHydrateFromServer = initialUser !== undefined || initialProfile !== undefined;

  const [state, setState] = useState<AuthContextValue>({
    user: initialUser ?? null,
    profile: initialProfile ?? null,
    entitlements: derivedInitialEntitlements,
    loading: !shouldHydrateFromServer,
  });
  const isMountedRef = useRef(true);

  const loadAuthState = useCallback(
    async (options: { attempt?: number; soft?: boolean } = {}) => {
      const { attempt = 0, soft = false } = options;

      // For background refreshes (soft=true), avoid flipping the UI into a loading state
      if (isMountedRef.current && !soft) {
        setState((previous) =>
          previous.loading
            ? previous
            : {
                ...previous,
                loading: true,
              }
        );
      }

      try {
        if (isDebug) {
          console.debug("[AuthProvider] Fetching auth state", { attempt });
        }

        const resolvedEndpoint = (() => {
          if (typeof window !== "undefined") {
            const origin = window.location?.origin;
            if (origin && origin.startsWith("http")) {
              return `${origin}/api/auth/me`;
            }
          }
          const fallback = process.env.NEXT_PUBLIC_APP_URL;
          return fallback ? `${fallback.replace(/\/$/, "")}/api/auth/me` : "/api/auth/me";
        })();

        const response = await fetch(resolvedEndpoint, {
          credentials: "include",
          cache: "no-store",
          headers: {
            "cache-control": "no-cache",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch auth state");
        }

        const payload = await response.json();

        if (!isMountedRef.current) return;

        const user = (payload.user as User) ?? null;
        const profile = (payload.profile as Profile | null) ?? null;
        const entitlementsRaw =
          (payload.entitlements as Entitlements | undefined) ?? defaultEntitlements;
        const resolvedPlan = (entitlementsRaw.plan as PlatformBillingPlan) ?? "professional";
        const tier = getPlanTier(resolvedPlan);
        const entitlements: Entitlements = {
          plan: resolvedPlan,
          tier,
          isPaid: checkProAccess(resolvedPlan),
          hasProAccess: checkProAccess(resolvedPlan),
          hasStudioAccess: checkStudioAccess(resolvedPlan),
        };

        if (!user && attempt < MAX_AUTH_RETRIES) {
          if (isDebug) {
            console.debug("[AuthProvider] No user returned, retrying auth fetch", {
              nextAttempt: attempt + 1,
            });
          }
          setTimeout(() => {
            if (isMountedRef.current) {
              loadAuthState({ attempt: attempt + 1, soft });
            }
          }, RETRY_DELAY_MS);
          return;
        }

        setState({
          user,
          profile,
          entitlements,
          loading: false,
        });

        if (isDebug) {
          console.debug("[AuthProvider] Auth state updated", {
            hasUser: Boolean(user),
            attempt,
          });
        }
      } catch (error) {
        console.error("[AuthProvider] Failed to load session", error);
        if (isMountedRef.current) {
          setState({
            user: null,
            profile: null,
            entitlements: defaultEntitlements,
            loading: false,
          });
        }
      }
    },
    []
  );

  useEffect(() => {
    isMountedRef.current = true;
    const schedule = (callback: () => void) => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback;
      if (ric) return ric(callback, { timeout: 2500 });
      return window.setTimeout(callback, 2000);
    };

    const cancel = (id: number) => {
      const cancelRic = (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback;
      if (cancelRic) cancelRic(id);
      else window.clearTimeout(id);
    };

    // When we hydrate from server-provided auth, defer a background refresh so
    // we can keep cookies/session fresh without delaying first paint.
    const refreshId = shouldHydrateFromServer
      ? schedule(() => loadAuthState({ soft: true }))
      : schedule(() => loadAuthState());

    const channel = new BroadcastChannel("auth");
    channel.onmessage = (event) => {
      if (event.data === "auth:update") {
        if (isDebug) {
          console.debug("[AuthProvider] Received auth:update message");
        }
        loadAuthState();
      }
    };

    return () => {
      isMountedRef.current = false;
      channel.close();
      cancel(refreshId);
    };
  }, [loadAuthState, shouldHydrateFromServer]);

  // Removed: pathname-based refresh was calling /api/auth/me on every navigation
  // Auth state is already refreshed on: initial mount, tab visibility change, BroadcastChannel events

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (isDebug) {
          console.debug("[AuthProvider] Tab visible, refreshing auth");
        }
        loadAuthState();
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadAuthState]);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
