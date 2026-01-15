"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

export type AvailabilityCheckResult<T> = {
  status: AvailabilityStatus;
  message?: string;
  data?: T | null;
};

type UseAvailabilityCheckOptions<T> = {
  initialValue?: string;
  debounceMs?: number;
  normalize?: (value: string) => string;
  prepareValue?: (value: string) => string;
  shouldCheck?: (value: string) => boolean;
  validate?: (value: string) => AvailabilityCheckResult<T> | null;
  check: (value: string) => Promise<AvailabilityCheckResult<T>>;
  checkingMessage?: string;
  errorMessage?: string;
};

type SetValueOptions = {
  normalize?: boolean;
  reset?: boolean;
};

export function useAvailabilityCheck<T = undefined>({
  initialValue = "",
  debounceMs,
  normalize,
  prepareValue,
  shouldCheck,
  validate,
  check,
  checkingMessage = "Checking...",
  errorMessage = "Unable to verify. Please try again.",
}: UseAvailabilityCheckOptions<T>) {
  const [value, setValueState] = useState(initialValue);
  const [status, setStatus] = useState<AvailabilityStatus>("idle");
  const [message, setMessage] = useState("");
  const [data, setData] = useState<T | null>(null);
  const statusRef = useRef<AvailabilityStatus>("idle");
  const requestIdRef = useRef(0);
  const lastCheckedValueRef = useRef<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    statusRef.current = "idle";
    setStatus("idle");
    setMessage("");
    setData(null);
    lastCheckedValueRef.current = null;
  }, []);

  const applyResult = useCallback((result: AvailabilityCheckResult<T>, valueKey: string) => {
    statusRef.current = result.status;
    setStatus(result.status);
    setMessage(result.message ?? "");
    setData((result.data ?? null) as T | null);
    lastCheckedValueRef.current = valueKey;
  }, []);

  const setValue = useCallback(
    (nextValue: string, options?: SetValueOptions) => {
      const shouldNormalize = options?.normalize !== false;
      const normalizedValue = normalize && shouldNormalize ? normalize(nextValue) : nextValue;
      if (normalizedValue !== value && options?.reset !== false) {
        reset();
        lastCheckedValueRef.current = null;
      }
      setValueState(normalizedValue);
    },
    [normalize, reset, value]
  );

  const runCheck = useCallback(
    async (valueOverride?: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const rawValue = valueOverride ?? value;
      const preparedValue = prepareValue ? prepareValue(rawValue) : rawValue.trim();
      const shouldCheckValue = shouldCheck ?? ((candidate: string) => candidate.length > 0);

      if (!preparedValue || !shouldCheckValue(preparedValue)) {
        reset();
        return;
      }

      if (preparedValue === lastCheckedValueRef.current && statusRef.current !== "error") {
        return;
      }

      if (validate) {
        const validationResult = validate(preparedValue);
        if (validationResult) {
          applyResult(validationResult, preparedValue);
          return;
        }
      }

      const requestId = Date.now();
      requestIdRef.current = requestId;
      lastCheckedValueRef.current = preparedValue;
      statusRef.current = "checking";
      setStatus("checking");
      setMessage(checkingMessage);

      try {
        const result = await check(preparedValue);
        if (requestIdRef.current !== requestId) return;
        applyResult(result, preparedValue);
      } catch {
        if (requestIdRef.current !== requestId) return;
      applyResult({ status: "error", message: errorMessage, data: null }, preparedValue);
      }
    },
    [
      applyResult,
      check,
      checkingMessage,
      errorMessage,
      prepareValue,
      reset,
      shouldCheck,
      validate,
      value,
    ]
  );

  useEffect(() => {
    if (!debounceMs) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void runCheck();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [debounceMs, runCheck, value]);

  return {
    value,
    setValue,
    status,
    message,
    data,
    reset,
    runCheck,
  };
}
