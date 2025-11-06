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
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

type Entitlements = {
  plan: "professional" | "growth" | "studio";
  growth: boolean;
  studio: boolean;
};

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

const defaultEntitlements: Entitlements = {
  plan: "professional",
  growth: false,
  studio: false,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextValue>({
    user: null,
    profile: null,
    entitlements: defaultEntitlements,
    loading: true,
  });
  const pathname = usePathname();
  const isMountedRef = useRef(true);

  const loadAuthState = useCallback(
    async (attempt = 0) => {
      if (isMountedRef.current) {
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

        const response = await fetch("/api/auth/me", {
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
        const entitlements =
          (payload.entitlements as Entitlements | undefined) ?? defaultEntitlements;

        if (!user && attempt < MAX_AUTH_RETRIES) {
          if (isDebug) {
            console.debug("[AuthProvider] No user returned, retrying auth fetch", {
              nextAttempt: attempt + 1,
            });
          }
          setTimeout(() => {
            if (isMountedRef.current) {
              loadAuthState(attempt + 1);
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
    loadAuthState();

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
    };
  }, [loadAuthState]);

  const initialPathRef = useRef(pathname);

  useEffect(() => {
    if (initialPathRef.current === pathname) {
      return;
    }

    initialPathRef.current = pathname;
    if (isDebug) {
      console.debug("[AuthProvider] Path change detected, refreshing auth", { pathname });
    }
    loadAuthState();
  }, [pathname, loadAuthState]);

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
