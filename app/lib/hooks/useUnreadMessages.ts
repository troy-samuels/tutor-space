"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  countUnreadThreadsForStudentIds,
  countUnreadThreadsForTutor,
  getStudentMessagingContext,
} from "@/lib/repositories/messaging";

type Mode = "tutor" | "student";

type Options = {
  pollIntervalMs?: number;
};

export function useUnreadMessages(mode: Mode, options?: Options) {
  const [count, setCount] = useState(0);
  const pollIntervalMs = options?.pollIntervalMs ?? 20000;

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    async function loadUnreadCount() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (isActive) setCount(0);
          return;
        }

        if (mode === "tutor") {
          const { count } = await countUnreadThreadsForTutor(supabase, user.id);

          if (isActive) setCount(count ?? 0);
          return;
        }

        // Use context-aware query that considers both students table and connections
        const { data: messagingContext, error: contextError } = await getStudentMessagingContext(
          supabase,
          user.id
        );

        if (contextError) {
          throw contextError;
        }

        const { connections, studentRecords } = messagingContext ?? { connections: [], studentRecords: [] };

        // Only count unread for approved connections
        const approvedTutorIds = new Set(
          connections.filter((c) => c.status === "approved").map((c) => c.tutor_id)
        );

        // Get student IDs for approved connections + legacy approved students
        const studentIds = studentRecords
          .filter((s) => approvedTutorIds.has(s.tutor_id) || s.connection_status === "approved")
          .map((s) => s.id);

        if (studentIds.length === 0) {
          if (isActive) setCount(0);
          return;
        }

        const { count } = await countUnreadThreadsForStudentIds(supabase, studentIds);

        if (isActive) setCount(count ?? 0);
      } catch (error) {
        console.error("[useUnreadMessages] Failed to fetch unread count", error);
        if (isActive) setCount(0);
      }
    }

    loadUnreadCount();

    const intervalId = pollIntervalMs ? setInterval(loadUnreadCount, pollIntervalMs) : null;

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [mode, pollIntervalMs]);

  return count;
}
