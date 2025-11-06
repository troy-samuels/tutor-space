"use client";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signUp, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = { error: undefined, success: undefined };

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    signUp,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

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
            type="text"
            required
            minLength={3}
            maxLength={32}
            className="block w-full border-0 bg-transparent pl-6 pr-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            placeholder="username"
            pattern="^[a-z0-9\-]+$"
            title="Use 3-32 lowercase letters, numbers, or dashes."
          />
        </div>
        <p className="text-xs text-muted-foreground">
          This becomes your public profile link: <span className="font-semibold">tutorlingua.com/@username</span>
        </p>
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
