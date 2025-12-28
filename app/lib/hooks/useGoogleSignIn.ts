"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { signInWithGoogleIdToken } from "@/lib/actions/auth";

// Google Identity Services types (subset needed for this hook)
interface GISCredentialResponse {
  /** The ID token as a base64-encoded JWT string */
  credential: string;
  /** How the credential was selected */
  select_by?: string;
}

interface GISPromptMomentNotification {
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
  getMomentType: () => string;
}

type UseGoogleSignInOptions = {
  /** Path to redirect after successful sign-in */
  redirectTo?: string;
  /** Callback when sign-in succeeds */
  onSuccess?: (redirectTo?: string) => void;
  /** Callback when sign-in fails */
  onError?: (error: string) => void;
};

type UseGoogleSignInReturn = {
  /** Trigger the Google sign-in flow */
  signIn: () => void;
  /** Whether the sign-in is in progress */
  isLoading: boolean;
  /** Error message if sign-in failed */
  error: string | null;
  /** Whether Google Identity Services SDK is ready */
  isReady: boolean;
};

/**
 * Generate a cryptographically random nonce
 */
function generateNonce(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Hash a string using SHA-256 and return the base64-encoded result
 */
async function sha256Hash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Convert to base64url (URL-safe base64)
  const base64 = btoa(String.fromCharCode(...hashArray));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Hook for Google Identity Services sign-in.
 * Uses Google's popup/overlay instead of redirect-based OAuth,
 * avoiding the Supabase domain appearing in the URL bar.
 */
export function useGoogleSignIn(
  options: UseGoogleSignInOptions = {}
): UseGoogleSignInReturn {
  const { redirectTo, onSuccess, onError } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Store nonce for the current sign-in flow
  const nonceRef = useRef<string | null>(null);

  // Track if component is mounted
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Check if GIS SDK is loaded
  useEffect(() => {
    const checkGoogleLoaded = () => {
      if (typeof window !== "undefined" && window.google?.accounts?.id) {
        setIsReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleLoaded()) return;

    // Poll for the SDK to load (it's loaded lazily)
    const interval = setInterval(() => {
      if (checkGoogleLoaded()) {
        clearInterval(interval);
      }
    }, 100);

    // Stop polling after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Handle the credential response from Google
  const handleCredentialResponse = useCallback(
    async (response: GISCredentialResponse) => {
      if (!mountedRef.current) return;

      const idToken = response.credential;
      const nonce = nonceRef.current;

      if (!idToken) {
        setError("No credential received from Google.");
        setIsLoading(false);
        onError?.("No credential received from Google.");
        return;
      }

      if (!nonce) {
        setError("Authentication error. Please try again.");
        setIsLoading(false);
        onError?.("Authentication error. Please try again.");
        return;
      }

      try {
        // Call the server action with the ID token and nonce
        const result = await signInWithGoogleIdToken(idToken, nonce, redirectTo);

        if (!mountedRef.current) return;

        if (result.error) {
          setError(result.error);
          setIsLoading(false);
          onError?.(result.error);
          return;
        }

        setError(null);
        setIsLoading(false);
        onSuccess?.(result.redirectTo);
      } catch (err) {
        if (!mountedRef.current) return;

        const message = err instanceof Error ? err.message : "Sign-in failed";
        setError(message);
        setIsLoading(false);
        onError?.(message);
      }
    },
    [redirectTo, onSuccess, onError]
  );

  const signIn = useCallback(async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      const message = "Google sign-in is not configured.";
      setError(message);
      onError?.(message);
      return;
    }

    if (!window.google?.accounts?.id) {
      const message = "Google sign-in is not available. Please try again.";
      setError(message);
      onError?.(message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a new nonce for this sign-in flow
      const nonce = generateNonce();
      nonceRef.current = nonce;

      // Hash the nonce for Google (they require the hashed version)
      const hashedNonce = await sha256Hash(nonce);

      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        nonce: hashedNonce,
        use_fedcm_for_prompt: true, // Support Chrome's third-party cookie phase-out
        cancel_on_tap_outside: true,
      });

      // Show the One Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (!mountedRef.current) return;

        // Handle cases where the prompt couldn't be displayed
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          console.warn("[GoogleSignIn] Prompt not displayed:", reason);

          // Fall back to rendering a button if One Tap isn't available
          if (reason === "opt_out_or_no_session" || reason === "suppressed_by_user") {
            // User has opted out or suppressed One Tap
            // We could show a regular Google button here, but for now just show an error
            setIsLoading(false);
            setError("Please enable popups for Google sign-in, or try again.");
            onError?.("Google sign-in prompt was blocked. Please try again.");
          } else {
            setIsLoading(false);
            setError("Google sign-in is temporarily unavailable. Please try again.");
            onError?.("Google sign-in is temporarily unavailable.");
          }
        } else if (notification.isSkippedMoment()) {
          const reason = notification.getSkippedReason();
          console.warn("[GoogleSignIn] Prompt skipped:", reason);

          if (reason === "user_cancel" || reason === "tap_outside") {
            // User cancelled - not an error, just reset state
            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        }
        // If dismissed with credential_returned, the callback will handle it
      });
    } catch (err) {
      if (!mountedRef.current) return;

      const message = err instanceof Error ? err.message : "Failed to start sign-in";
      setError(message);
      setIsLoading(false);
      onError?.(message);
    }
  }, [handleCredentialResponse, onError]);

  return {
    signIn,
    isLoading,
    error,
    isReady,
  };
}
