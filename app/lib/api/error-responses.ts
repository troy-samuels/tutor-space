import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_request"
  | "rate_limited"
  | "service_unavailable"
  | "conflict"
  | "internal_error"
  | (string & {});

export type ApiErrorResponse = {
  success: false;
  error: string;
  message: string;
  code: ApiErrorCode;
  requestId: string;
  details?: Record<string, unknown>;
};

type ErrorResponseOptions = {
  status?: number;
  code?: ApiErrorCode;
  details?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  requestId?: string;
  headers?: HeadersInit;
};

export function errorResponse(message: string, options: ErrorResponseOptions = {}) {
  const resolvedRequestId =
    options.requestId ??
    (typeof options.extra?.requestId === "string" ? options.extra.requestId : undefined) ??
    randomUUID();

  const payload: ApiErrorResponse & Record<string, unknown> = {
    success: false,
    error: message,
    message,
    code: options.code ?? "internal_error",
    requestId: resolvedRequestId,
  };

  if (options.details) {
    payload.details = options.details;
  }

  if (options.extra) {
    const {
      requestId: _requestId,
      success: _success,
      error: _error,
      message: _message,
      code: _code,
      ...extra
    } = options.extra;
    Object.assign(payload, extra);
  }

  return NextResponse.json(payload, { status: options.status ?? 500, headers: options.headers });
}

export function badRequest(message: string, options?: Omit<ErrorResponseOptions, "code" | "status">) {
  return errorResponse(message, { ...options, code: "invalid_request", status: 400 });
}

export function unauthorized(message = "Unauthorized", options?: Omit<ErrorResponseOptions, "code" | "status">) {
  return errorResponse(message, { ...options, code: "unauthorized", status: 401 });
}

export function forbidden(message = "Forbidden", options?: Omit<ErrorResponseOptions, "code" | "status">) {
  return errorResponse(message, { ...options, code: "forbidden", status: 403 });
}

export function notFound(message = "Not found", options?: Omit<ErrorResponseOptions, "code" | "status">) {
  return errorResponse(message, { ...options, code: "not_found", status: 404 });
}

export function conflict(message = "Conflict", options?: Omit<ErrorResponseOptions, "code" | "status">) {
  return errorResponse(message, { ...options, code: "conflict", status: 409 });
}

export function rateLimited(message = "Too many requests", options?: Omit<ErrorResponseOptions, "code" | "status">) {
  return errorResponse(message, { ...options, code: "rate_limited", status: 429 });
}

export function serviceUnavailable(
  message = "Service unavailable",
  options?: Omit<ErrorResponseOptions, "code" | "status">
) {
  return errorResponse(message, { ...options, code: "service_unavailable", status: 503 });
}

export function internalError(message = "Internal server error", options?: Omit<ErrorResponseOptions, "code">) {
  return errorResponse(message, { ...options, code: "internal_error" });
}
