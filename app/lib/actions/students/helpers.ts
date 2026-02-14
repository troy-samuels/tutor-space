"use server";

import { createClient } from "@/lib/supabase/server";

// Authentication helpers — inlined to avoid re-export issues with "use server" modules.

export async function requireTutor(options?: { strict?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (options?.strict) {
      throw new Error("Unauthorized");
    }
    return { supabase, user: null, userId: null };
  }

  return { supabase, user, userId: user.id };
}
