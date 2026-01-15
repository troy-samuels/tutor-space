import { createServiceRoleClient, type ServiceRoleClient } from "@/lib/supabase/admin";
import { serviceUnavailable } from "@/lib/api/error-responses";

type ServiceRoleResult =
  | { client: ServiceRoleClient }
  | { error: ReturnType<typeof serviceUnavailable> };

type RequireServiceRoleOptions = {
  message?: string;
  extra?: Record<string, unknown>;
};

export function requireServiceRoleClient(
  context: string,
  options: RequireServiceRoleOptions = {}
): ServiceRoleResult {
  const client = createServiceRoleClient();
  if (client) {
    return { client };
  }

  console.error(`[${context}] Service role client unavailable`);
  return {
    error: serviceUnavailable(options.message, { extra: options.extra }),
  };
}

export type { ApiErrorResponse } from "@/lib/api/error-responses";
