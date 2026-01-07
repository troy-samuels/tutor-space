"use server";

import { createClient } from "@/lib/supabase/server";

// ============================================================================
// Authentication Helper
// ============================================================================

/**
 * Require authenticated tutor for student operations.
 * Returns null user if not authenticated.
 */
export async function requireTutor() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error || !user) {
		return { supabase, user: null as null };
	}

	return { supabase, user };
}
