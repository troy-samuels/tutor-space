import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";

export interface PlatformConfigEntry {
  key: string;
  value: unknown;
  description: string | null;
  category: "general" | "payments" | "features" | "limits" | "notifications";
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

// In-memory cache with TTL
const configCache = new Map<string, { value: unknown; expires: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Get a single config value by key
 */
export async function getConfig<T = unknown>(key: string): Promise<T | null> {
  // Check cache first
  const cached = configCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value as T;
  }

  const supabase = createServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("platform_config")
    .select("value")
    .eq("key", key)
    .single();

  if (error || !data) return null;

  // Parse JSONB value
  const value = data.value as T;

  // Update cache
  configCache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });

  return value;
}

/**
 * Get multiple config values by keys
 */
export async function getConfigs(keys: string[]): Promise<Record<string, unknown>> {
  const supabase = createServiceRoleClient();
  if (!supabase) return {};

  // Check cache for all keys
  const result: Record<string, unknown> = {};
  const uncachedKeys: string[] = [];

  for (const key of keys) {
    const cached = configCache.get(key);
    if (cached && cached.expires > Date.now()) {
      result[key] = cached.value;
    } else {
      uncachedKeys.push(key);
    }
  }

  // Fetch uncached keys from database
  if (uncachedKeys.length > 0) {
    const { data, error } = await supabase
      .from("platform_config")
      .select("key, value")
      .in("key", uncachedKeys);

    if (!error && data) {
      for (const row of data) {
        result[row.key] = row.value;
        configCache.set(row.key, { value: row.value, expires: Date.now() + CACHE_TTL_MS });
      }
    }
  }

  return result;
}

/**
 * Get all config entries (for admin UI)
 */
export async function getAllConfig(): Promise<PlatformConfigEntry[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("platform_config")
    .select("*")
    .order("category")
    .order("key");

  if (error || !data) return [];

  return data as PlatformConfigEntry[];
}

/**
 * Get config entries by category
 */
export async function getConfigByCategory(
  category: PlatformConfigEntry["category"]
): Promise<PlatformConfigEntry[]> {
  const supabase = createServiceRoleClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("platform_config")
    .select("*")
    .eq("category", category)
    .order("key");

  if (error || !data) return [];

  return data as PlatformConfigEntry[];
}

/**
 * Update a single config value (admin only)
 */
export async function updateConfig(
  key: string,
  value: unknown,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  if (!supabase) return { success: false, error: "Database connection failed" };

  const { error } = await supabase
    .from("platform_config")
    .update({
      value: value,
      updated_by: adminUserId,
    })
    .eq("key", key);

  if (error) {
    return { success: false, error: error.message };
  }

  // Invalidate cache
  configCache.delete(key);

  return { success: true };
}

/**
 * Update multiple config values at once
 */
export async function updateConfigs(
  updates: Array<{ key: string; value: unknown }>,
  adminUserId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceRoleClient();
  if (!supabase) return { success: false, error: "Database connection failed" };

  // Update each config one by one (Supabase doesn't support bulk upsert with different values easily)
  for (const update of updates) {
    const { error } = await supabase
      .from("platform_config")
      .update({
        value: update.value,
        updated_by: adminUserId,
      })
      .eq("key", update.key);

    if (error) {
      return { success: false, error: `Failed to update ${update.key}: ${error.message}` };
    }

    // Invalidate cache
    configCache.delete(update.key);
  }

  return { success: true };
}

/**
 * Check if a feature is enabled
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  const value = await getConfig<boolean>(featureKey);
  return value === true;
}

/**
 * Get plan limit
 */
export async function getPlanLimit(limitKey: string): Promise<number> {
  const value = await getConfig<number>(limitKey);
  return typeof value === "number" ? value : 0;
}

/**
 * Clear the config cache (useful after bulk updates)
 */
export function clearConfigCache(): void {
  configCache.clear();
}

// Commonly used config helpers
export const PlatformConfig = {
  async isMaintenanceMode(): Promise<boolean> {
    return (await getConfig<boolean>("maintenance_mode")) ?? false;
  },

  async isSignupEnabled(): Promise<boolean> {
    return (await getConfig<boolean>("signup_enabled")) ?? true;
  },

  async isStudentSignupEnabled(): Promise<boolean> {
    return (await getConfig<boolean>("student_signup_enabled")) ?? true;
  },

  async getPlatformFeePercentage(): Promise<number> {
    const fee = await getConfig<number>("platform_fee_percentage");
    return typeof fee === "number" ? fee : 0;
  },

  async isStripeConnectEnabled(): Promise<boolean> {
    return (await getConfig<boolean>("stripe_connect_enabled")) ?? true;
  },

  async isAIEnabled(): Promise<boolean> {
    return (await getConfig<boolean>("ai_features_enabled")) ?? false;
  },

  async getMaxStudents(plan: "professional" | "growth"): Promise<number> {
    const key = plan === "professional" ? "max_students_professional" : "max_students_growth";
    const limit = await getConfig<number>(key);
    return typeof limit === "number" ? limit : 20;
  },

  async getMaxServices(plan: "professional" | "growth"): Promise<number> {
    const key = plan === "professional" ? "max_services_professional" : "max_services_growth";
    const limit = await getConfig<number>(key);
    return typeof limit === "number" ? limit : 3;
  },

  async getLessonReminderHours(): Promise<number> {
    const hours = await getConfig<number>("lesson_reminder_hours");
    return typeof hours === "number" ? hours : 24;
  },
};
