"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/lib/actions/auth";

type AuthFormAction = (
  prevState: AuthActionState,
  formData: FormData
) => AuthActionState | Promise<AuthActionState>;

const DEFAULT_AUTH_STATE: AuthActionState = {
  error: undefined,
  success: undefined,
  redirectTo: undefined,
};

export function useAuthForm(
  action: AuthFormAction,
  initialState: AuthActionState = DEFAULT_AUTH_STATE
) {
  return useActionState<AuthActionState, FormData>(action, initialState);
}
