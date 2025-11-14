"use client";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signUp, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: undefined, success: undefined };
const USERNAME_PATTERN = /^[a-z0-9-]{3,32}$/;
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    signUp,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);
  const [usernameValue, setUsernameValue] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState("");
  const lastRequestId = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetUsernameFeedback = useCallback(() => {
    setUsernameStatus("idle");
    setUsernameMessage("");
  }, []);

  const performAvailabilityRequest = useCallback(
    async (value: string, requestId: number) => {
      try {
        const response = await fetch(
          `/api/username/check?username=${encodeURIComponent(value)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const payload: {
          available?: boolean;
          status?: UsernameStatus | "invalid" | "error";
          message?: string;
        } | null = await response.json().catch(() => null);

        if (lastRequestId.current !== requestId) {
          return;
        }

        if (!response.ok) {
          const status = payload?.status === "invalid" ? "invalid" : "error";
          setUsernameStatus(status);
          setUsernameMessage(
            payload?.message ??
              (status === "invalid"
                ? "Usernames must be 3-32 characters using lowercase letters, numbers, or dashes."
                : "We couldn't verify that username. Please try again.")
          );
          return;
        }

        setUsernameStatus(payload?.available ? "available" : "taken");
        setUsernameMessage(
          payload?.available
            ? `Great choice! @${value} is available.`
            : "That username is already taken. Try another."
        );
      } catch (error) {
        if (lastRequestId.current !== requestId) {
          return;
        }
        setUsernameStatus("error");
        setUsernameMessage("We couldn't verify that username. Please try again.");
      }
    },
    []
  );

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const sanitizedValue = rawValue.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsernameValue(sanitizedValue);
    if (usernameStatus !== "idle") {
      resetUsernameFeedback();
    }
  };

  const handleUsernameBlur = async () => {
    const value = usernameValue.trim();

    if (!value) {
      resetUsernameFeedback();
      return;
    }

    if (value.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!USERNAME_PATTERN.test(value)) {
      setUsernameStatus("invalid");
      setUsernameMessage(
        "Usernames must be 3-32 characters and can only include lowercase letters, numbers, or dashes."
      );
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const requestId = Date.now();
    lastRequestId.current = requestId;
    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");
    void performAvailabilityRequest(value, requestId);
  };

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!usernameValue) {
      resetUsernameFeedback();
      return;
    }

    if (usernameValue.length < 3) {
      setUsernameStatus("idle");
      setUsernameMessage("");
      return;
    }

    if (!USERNAME_PATTERN.test(usernameValue)) {
      setUsernameStatus("invalid");
      setUsernameMessage(
        "Usernames must be 3-32 characters and can only include lowercase letters, numbers, or dashes."
      );
      return;
    }

    const requestId = Date.now();
    lastRequestId.current = requestId;
    setUsernameStatus("checking");
    setUsernameMessage("Checking availability...");

    debounceRef.current = window.setTimeout(() => {
      void performAvailabilityRequest(usernameValue, requestId);
    }, 350);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [usernameValue, performAvailabilityRequest, resetUsernameFeedback]);

  const usernameStatusClass =
    usernameStatus === "available"
      ? "text-emerald-600"
      : usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "error"
        ? "text-destructive"
        : "text-muted-foreground";
  const usernameDescriptionIds = usernameMessage
    ? "signup-username-helper signup-username-status"
    : "signup-username-helper";

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="full_name" className="block text-sm font-medium text-foreground">
          Full name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Jane Doe"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-foreground">
          Username
        </label>
        <div className="relative rounded-md border border-input bg-background px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
            @
          </div>
          <input
            id="username"
            name="username"
            value={usernameValue}
            onChange={handleUsernameChange}
            onBlur={handleUsernameBlur}
            type="text"
            required
            minLength={3}
            maxLength={32}
            className="block w-full border-0 bg-transparent pl-6 pr-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="username"
            pattern="^[a-z0-9\-]+$"
            title="Use 3-32 lowercase letters, numbers, or dashes."
            autoComplete="username"
            aria-describedby={usernameDescriptionIds}
          />
        </div>
        <p className="text-xs text-muted-foreground" id="signup-username-helper">
          This becomes your public profile link: <span className="font-semibold">tutorlingua.com/@username</span>
        </p>
        {usernameMessage && (
          <p
            className={`text-xs ${usernameStatusClass}`}
            id="signup-username-status"
            aria-live="polite"
          >
            {usernameMessage}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Terms and Privacy Acceptance */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="terms"
          name="terms"
          required
          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
        />
        <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            Privacy Policy
          </Link>
        </label>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state?.success && (
        <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={Boolean(state?.success) || isPending}
      >
        {isPending ? "Creating..." : "Create account"}
      </button>

    </form>
  );
}
